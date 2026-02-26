import { Controller, Post, Get, Body, HttpCode, HttpStatus, Query, Res } from '@nestjs/common';
import { IsString, IsNotEmpty, IsArray, IsOptional, MaxLength } from 'class-validator';
import { Response } from 'express';
import { Public } from '@/common/decorators/public.decorator';
import { GoogleDocsService } from './google-docs.service';

// The seeded "founder" user — used when the app runs without full Google OAuth login
const DEFAULT_USER_ID = '20000001-0000-0000-0000-000000000001';

class ExportToDocsDto {
  @IsString()
  @IsNotEmpty()
  applicationId: string;

  @IsOptional()
  @IsArray()
  shareEmails?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  emailMessage?: string;
}

@Controller('export')
export class ExportController {
  constructor(private readonly googleDocsService: GoogleDocsService) {}

  /** POST /api/v1/export/google-docs — export grant to Google Docs */
  @Public()
  @Post('google-docs')
  @HttpCode(HttpStatus.OK)
  exportToGoogleDocs(@Body() dto: ExportToDocsDto) {
    return this.googleDocsService.exportToGoogleDocs(
      dto.applicationId,
      DEFAULT_USER_ID,
      dto.shareEmails ?? [],
      dto.emailMessage,
    );
  }

  /** GET /api/v1/export/drive-status — check if Google Drive is connected */
  @Public()
  @Get('drive-status')
  driveStatus() {
    return this.googleDocsService.getDriveStatus(DEFAULT_USER_ID);
  }

  /** GET /api/v1/export/connect-drive — start Google OAuth for Drive access */
  @Public()
  @Get('connect-drive')
  connectDrive(@Res() res: Response) {
    const url = this.googleDocsService.getAuthUrl(DEFAULT_USER_ID);
    res.redirect(url);
  }

  /** GET /api/v1/export/oauth-callback — Google OAuth callback, stores token */
  @Public()
  @Get('oauth-callback')
  async oauthCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    try {
      await this.googleDocsService.handleOAuthCallback(code, state);
      // Close the popup and signal success to the opener
      res.send(`
        <html><body>
          <p style="font-family:sans-serif;text-align:center;margin-top:40px">
            ✅ Google Drive connected! You can close this window.
          </p>
          <script>
            if (window.opener) {
              window.opener.postMessage('drive-connected', '*');
              setTimeout(() => window.close(), 1500);
            }
          </script>
        </body></html>
      `);
    } catch (e: any) {
      res.send(`
        <html><body>
          <p style="font-family:sans-serif;text-align:center;margin-top:40px;color:red">
            ❌ Failed to connect: ${e?.message ?? 'Unknown error'}
          </p>
        </body></html>
      `);
    }
  }
}
