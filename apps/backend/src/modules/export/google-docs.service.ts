import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@/database/database.service';
import { google, docs_v1 } from 'googleapis';

const SECTION_ORDER: Record<string, number> = {
  'Project Summary':        1,
  'Specific Aims':          2,
  'Significance':           3,
  'Innovation':             4,
  'Approach':               5,
  'Project Narrative':      6,
  'Budget Justification':   7,
  'Biographical Sketch':    8,
  'Facilities & Resources': 9,
  'Data Management Plan':   10,
  'References':             11,
};

export interface ExportResult {
  docUrl: string;
  docId: string;
  title: string;
  sharedWith: number;
  sectionCount: number;
}

@Injectable()
export class GoogleDocsService {
  private readonly logger = new Logger(GoogleDocsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  private createOAuth2Client() {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackUrl = this.configService.get<string>('BACKEND_URL', 'http://localhost:3001');

    if (!clientId || !clientSecret) {
      throw new BadRequestException(
        'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env.',
      );
    }

    return new google.auth.OAuth2(
      clientId,
      clientSecret,
      `${callbackUrl}/api/v1/export/oauth-callback`,
    );
  }

  /** Returns the Google OAuth URL the user should visit to grant Drive access */
  getAuthUrl(userId: string): string {
    const oauth2Client = this.createOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/drive.file'],
      state: userId,
    });
  }

  /** Exchanges the OAuth code for tokens and stores them against the user */
  async handleOAuthCallback(code: string, userId: string): Promise<void> {
    const oauth2Client = this.createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    const update: Record<string, any> = {};
    if (tokens.access_token) update.google_access_token = tokens.access_token;
    if (tokens.refresh_token) update.google_refresh_token = tokens.refresh_token;

    if (Object.keys(update).length) {
      await this.db.db('users').where({ id: userId }).update(update);
      this.logger.log(`Google Drive tokens stored for user ${userId}`);
    }
  }

  /** Returns whether the user has a Google Drive token stored */
  async getDriveStatus(userId: string): Promise<{ connected: boolean }> {
    const user = await this.db.db('users')
      .select('google_access_token')
      .where({ id: userId })
      .first();
    return { connected: !!user?.google_access_token };
  }

  private getOAuthClient(accessToken: string, refreshToken?: string) {
    const oauth2Client = this.createOAuth2Client();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken ?? null,
    });
    return oauth2Client;
  }

  async exportToGoogleDocs(
    applicationId: string,
    userId: string,
    shareEmails: string[],
    emailMessage?: string,
  ): Promise<ExportResult> {
    // ── 1. Fetch user's Google OAuth tokens ──────────────────────────────
    const user = await this.db.db('users')
      .select('google_access_token', 'google_refresh_token', 'email')
      .where({ id: userId })
      .first();

    if (!user?.google_access_token) {
      throw new BadRequestException(
        'Google Drive access not authorised. Please sign out and sign back in with your Google account to grant Drive access.',
      );
    }

    // ── 2. Fetch application info ────────────────────────────────────────
    const application = await this.db.db('applications')
      .leftJoin('opportunities', 'applications.opportunity_id', 'opportunities.id')
      .leftJoin('programs', 'opportunities.program_id', 'programs.id')
      .leftJoin('funding_sources', 'programs.funding_source_id', 'funding_sources.id')
      .select(
        'applications.internal_name',
        'applications.amount_requested',
        'applications.submission_deadline',
        'applications.current_stage',
        'opportunities.title as opportunity_title',
        'funding_sources.name as funding_source_name',
      )
      .where('applications.id', applicationId)
      .first();

    if (!application) throw new BadRequestException('Application not found');

    // ── 3. Fetch current sections sorted by canonical order ──────────────
    const rawSections = await this.db.db('generated_sections')
      .where('application_id', applicationId)
      .where('is_current_version', true)
      .select('section_name', 'content', 'status', 'version_number', 'updated_at');

    const sections = [...rawSections].sort((a, b) => {
      const oa = SECTION_ORDER[a.section_name] ?? 99;
      const ob = SECTION_ORDER[b.section_name] ?? 99;
      return oa !== ob ? oa - ob : a.section_name.localeCompare(b.section_name);
    });

    // ── 4. Build OAuth clients using the user's own Google token ─────────
    const auth = this.getOAuthClient(user.google_access_token, user.google_refresh_token);
    const docsClient = google.docs({ version: 'v1', auth });
    const driveClient = google.drive({ version: 'v3', auth });

    // ── 5. Create the document via Drive API ─────────────────────────────
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    const docTitle = `${application.internal_name} — Grant Draft`;

    const driveFile = await driveClient.files.create({
      requestBody: {
        name: docTitle,
        mimeType: 'application/vnd.google-apps.document',
      },
      fields: 'id',
    }).catch((e: any) => {
      throw new BadRequestException(`Failed to create Google Doc: ${e?.message ?? e}`);
    });
    const docId = driveFile.data.id!;

    // ── 6. Populate content ──────────────────────────────────────────────
    const requests = this.buildRequests(application, sections, dateStr);
    if (requests.length > 0) {
      await docsClient.documents.batchUpdate({
        documentId: docId,
        requestBody: { requests },
      });
    }

    // ── 7. Share with provided emails ────────────────────────────────────
    const validEmails = shareEmails.map((e) => e.trim().toLowerCase()).filter(Boolean);
    for (const email of validEmails) {
      try {
        await driveClient.permissions.create({
          fileId: docId,
          sendNotificationEmail: true,
          emailMessage: emailMessage ||
            `${application.internal_name} grant draft (${sections.length} sections) is ready for your review via GrantsMaster.`,
          requestBody: {
            type: 'user',
            role: 'commenter',
            emailAddress: email,
          },
        });
        this.logger.log(`Shared doc ${docId} with ${email}`);
      } catch (e: any) {
        this.logger.warn(`Failed to share with ${email}: ${e?.message ?? e}`);
      }
    }

    // ── 8. Make viewable to anyone with the link ─────────────────────────
    try {
      await driveClient.permissions.create({
        fileId: docId,
        requestBody: { type: 'anyone', role: 'reader' },
      });
    } catch (e: any) {
      this.logger.warn(`Could not set anyone/reader permission: ${e?.message ?? e}`);
    }

    const docUrl = `https://docs.google.com/document/d/${docId}/edit`;
    this.logger.log(
      `Google Doc created: ${docId} — ${sections.length} sections, ${validEmails.length} recipients`,
    );

    return { docUrl, docId, title: docTitle, sharedWith: validEmails.length, sectionCount: sections.length };
  }

  /**
   * Build the batchUpdate requests to populate the document.
   * Inserts sequentially, tracking the running character index.
   */
  private buildRequests(
    application: any,
    sections: any[],
    dateStr: string,
  ): docs_v1.Schema$Request[] {
    const requests: docs_v1.Schema$Request[] = [];
    let cursor = 1;

    const insert = (text: string, namedStyle: string) => {
      if (!text) return;
      const start = cursor;
      cursor += text.length;
      requests.push({
        insertText: { location: { index: start }, text },
      });
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: start, endIndex: cursor },
          paragraphStyle: { namedStyleType: namedStyle as any },
          fields: 'namedStyleType',
        },
      });
    };

    insert(`${application.internal_name}\n`, 'TITLE');
    insert(
      `Grant Application Draft  ·  ${dateStr}` +
      (application.funding_source_name ? `  ·  ${application.funding_source_name}` : '') +
      '\n\n',
      'SUBTITLE',
    );

    if (sections.length === 0) {
      insert(
        'No sections have been generated yet. Use AI Counsel to draft and add sections to this grant.\n',
        'NORMAL_TEXT',
      );
    }

    for (const section of sections) {
      insert(`${section.section_name}\n`, 'HEADING_1');
      const cleanContent = section.section_name !== 'References'
        ? section.content.replace(/\n*---REFERENCES---[\s\S]*?---END REFERENCES---/, '').trim()
        : section.content;
      insert(`${cleanContent}\n\n`, 'NORMAL_TEXT');
    }

    insert(`\n\nGenerated by GrantsMaster  ·  ${dateStr}\n`, 'NORMAL_TEXT');

    return requests;
  }
}
