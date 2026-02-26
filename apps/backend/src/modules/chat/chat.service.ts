import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@/database/database.service';
import Anthropic from '@anthropic-ai/sdk';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { GenerateSectionDto } from './dto/generate-section.dto';
import { PubMedService, PubMedArticle } from './pubmed.service';

interface ResolvedRef {
  number: number;
  original: string;
  article: PubMedArticle | null;
}

export interface PreviewRef {
  number: number;
  nlmFormatted: string;
  pmid: string | null;
  pubmedUrl: string | null;
  unverified: boolean;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly anthropic: Anthropic;
  private readonly maxMessagesPerDay: number;
  private readonly maxTokensPerRequest: number;
  private readonly defaultModel: string;
  private readonly defaultTemperature: number;

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
    private readonly pubMedService: PubMedService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    this.anthropic = new Anthropic({ apiKey });
    this.maxMessagesPerDay = parseInt(this.configService.get<string>('AI_MAX_MESSAGES_PER_USER_PER_DAY', '100'));
    this.maxTokensPerRequest = parseInt(this.configService.get<string>('AI_MAX_TOKENS_PER_REQUEST', '4000'));
    this.defaultModel = this.configService.get<string>('AI_DEFAULT_MODEL', 'claude-3-5-sonnet-20241022');
    this.defaultTemperature = parseFloat(this.configService.get<string>('AI_DEFAULT_TEMPERATURE', '0.7'));
  }

  /**
   * Check if user has exceeded rate limits
   */
  async checkRateLimit(userId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await this.db.db('ai_usage_tracking')
      .where('user_id', userId)
      .where('created_at', '>=', today)
      .count('* as count')
      .first();

    const messageCount = parseInt(usage?.count as string || '0');

    if (messageCount >= this.maxMessagesPerDay) {
      throw new UnauthorizedException(`Daily message limit (${this.maxMessagesPerDay}) exceeded`);
    }
  }

  /**
   * Track AI usage for rate limiting and cost tracking
   */
  async trackUsage(
    userId: string,
    applicationId: string,
    actionType: string,
    tokensUsed: number,
    model: string,
  ): Promise<void> {
    // Approximate cost calculation (Claude 3.5 Sonnet pricing)
    // Input: $3/M tokens, Output: $15/M tokens
    // Simplified: average ~$9/M tokens
    const costUsd = (tokensUsed / 1_000_000) * 9;

    await this.db.db('ai_usage_tracking').insert({
      user_id: userId,
      application_id: applicationId,
      action_type: actionType,
      tokens_used: tokensUsed,
      cost_usd: costUsd,
      model,
    });
  }

  /**
   * Get application context for AI prompts
   */
  async getApplicationContext(applicationId: string): Promise<string> {
    const application = await this.db.db('applications')
      .select(
        'applications.*',
        'projects.name as project_name',
        'projects.description as project_description',
        'projects.clinical_area',
        'projects.context as project_context',
        'opportunities.title as opportunity_title',
        'opportunities.description as opportunity_description',
        'funding_sources.name as funding_source_name',
        'programs.name as program_name',
      )
      .leftJoin('projects', 'applications.project_id', 'projects.id')
      .leftJoin('opportunities', 'applications.opportunity_id', 'opportunities.id')
      .leftJoin('programs', 'opportunities.program_id', 'programs.id')
      .leftJoin('funding_sources', 'programs.funding_source_id', 'funding_sources.id')
      .where('applications.id', applicationId)
      .first();

    if (!application) {
      throw new BadRequestException('Application not found');
    }

    let context = `Application: ${application.internal_name}
Project: ${application.project_name || 'N/A'}
Project Description: ${application.project_description || 'N/A'}
Clinical Area: ${application.clinical_area || 'N/A'}
Funding Opportunity: ${application.opportunity_title || 'N/A'}
Funding Source: ${application.funding_source_name || 'N/A'}
Program: ${application.program_name || 'N/A'}
Amount Requested: ${application.amount_requested ? `$${application.amount_requested.toLocaleString()}` : 'N/A'}
Submission Deadline: ${application.submission_deadline || 'N/A'}
Current Stage: ${application.current_stage}`.trim();

    // Project-level context takes priority over per-grant intake metadata
    const intake = (application.project_context && Object.keys(application.project_context).length > 0)
      ? application.project_context
      : application.metadata?.intake;

    if (intake && typeof intake === 'object') {
      context += `

--- PROJECT-SPECIFIC CONTEXT (from project intake) ---
Product Name: ${intake.projectName || 'N/A'}
One-Liner: ${intake.oneLiner || 'N/A'}
Clinical Problem: ${intake.clinicalProblem || 'N/A'}
Target Users & Setting: ${intake.targetUsers || 'N/A'}
Core Technology / Mechanism: ${intake.coreTechnology || 'N/A'}
Competitive Differentiation: ${intake.differentiation || 'N/A'}
Funding Mechanism Targeted: ${intake.fundingMechanism || 'N/A'}
Development Stage: ${intake.developmentStage || 'N/A'}`;
    }

    return context;
  }

  /**
   * Get chat history for context
   */
  async getChatHistory(applicationId: string, limit: number = 10): Promise<any[]> {
    return this.db.db('chat_messages')
      .select('*')
      .where('application_id', applicationId)
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  // ── Citation helpers ────────────────────────────────────────────────

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Extract and resolve the ---REFERENCES--- block from AI-generated content.
   * Returns the clean content (block stripped) plus an array of resolved references.
   */
  async resolveCitations(content: string): Promise<{
    cleanContent: string;
    refs: ResolvedRef[];
  }> {
    const blockMatch = content.match(/---REFERENCES---\n([\s\S]*?)---END REFERENCES---/);
    if (!blockMatch) return { cleanContent: content, refs: [] };

    const cleanContent = content
      .replace(/\n*---REFERENCES---[\s\S]*?---END REFERENCES---/, '')
      .trim();

    const lines = blockMatch[1]
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /^\[\d+\]/.test(l));

    const refs: ResolvedRef[] = [];
    for (const line of lines) {
      const numMatch = line.match(/^\[(\d+)\]/);
      if (!numMatch) continue;
      const number = parseInt(numMatch[1], 10);
      const refText = line.replace(/^\[\d+\]\s*/, '').trim();

      // Rate-limit: NCBI allows ~3 req/s without an API key
      if (refs.length > 0) await this.sleep(400);

      const article = await this.pubMedService.resolveReference(refText);
      refs.push({ number, original: refText, article });
    }

    return { cleanContent, refs };
  }

  /**
   * Resolve citations for frontend preview — no DB writes, returns a
   * frontend-friendly shape with NLM-formatted strings and PubMed links.
   */
  async resolveForPreview(content: string): Promise<{
    cleanContent: string;
    refs: PreviewRef[];
  }> {
    const { cleanContent, refs } = await this.resolveCitations(content);
    const previewRefs: PreviewRef[] = refs.map(({ number, original, article }) => {
      if (article) {
        return {
          number,
          nlmFormatted: article.nlmFormatted,
          pmid: article.pmid,
          pubmedUrl: article.pubmedUrl,
          unverified: false,
        };
      }
      return {
        number,
        nlmFormatted: original,
        pmid: null,
        pubmedUrl: null,
        unverified: true,
      };
    });
    return { cleanContent, refs: previewRefs };
  }

  /**
   * Save / merge resolved references into the application's References section.
   * Deduplicates by PMID; re-numbers the entire list.
   */
  private async saveOrMergeReferences(
    applicationId: string,
    userId: string,
    refs: ResolvedRef[],
  ): Promise<void> {
    if (!refs.length) return;

    const existing = await this.db.db('generated_sections')
      .where('application_id', applicationId)
      .where('section_name', 'References')
      .where('is_current_version', true)
      .first();

    const existingPmids = new Set<string>(existing?.generation_metadata?.pmids ?? []);

    // Parse existing numbered lines
    const existingLines: string[] = existing
      ? existing.content
          .split('\n\n')
          .map((l: string) => l.trim())
          .filter(Boolean)
          .map((l: string) => l.replace(/^\[\d+\]\s*/, '').trim())
      : [];

    const newLines: string[] = [];
    const newPmids: string[] = [];

    for (const { original, article } of refs) {
      if (article) {
        if (existingPmids.has(article.pmid)) continue; // already present
        newLines.push(article.nlmFormatted);
        newPmids.push(article.pmid);
        existingPmids.add(article.pmid);
      } else {
        newLines.push(`[UNVERIFIED] ${original} — could not find a matching paper on PubMed. Please verify manually.`);
      }
    }

    if (!newLines.length) return;

    // Merge and re-number
    const allLines = [...existingLines, ...newLines];
    const numbered = allLines.map((line, i) => `[${i + 1}] ${line}`).join('\n\n');
    const allPmids = [...Array.from(existingPmids), ...newPmids];

    let versionNumber = 1;
    if (existing) {
      await this.db.db('generated_sections')
        .where('id', existing.id)
        .update({ is_current_version: false });
      versionNumber = existing.version_number + 1;
    }

    const template = await this.db.db('section_templates')
      .where('section_key', 'references')
      .first();

    await this.db.db('generated_sections').insert({
      application_id: applicationId,
      section_template_id: template?.id ?? null,
      section_name: 'References',
      version_number: versionNumber,
      content: numbered,
      prompt_used: 'Auto-populated from PubMed citation resolution',
      generation_metadata: { source: 'citation_resolution', pmids: allPmids },
      status: 'draft',
      generated_by: userId,
      is_current_version: true,
    });

    this.logger.log(
      `References section updated: +${newLines.length} entries (total ${allLines.length})`,
    );
  }

  /**
   * Send a chat message and get AI response
   */
  async sendMessage(
    userId: string,
    dto: CreateChatMessageDto,
  ): Promise<{ userMessage: any; assistantMessage: any; response: string }> {
    // Check rate limits
    await this.checkRateLimit(userId);

    // Save user message
    const [userMessage] = await this.db.db('chat_messages')
      .insert({
        application_id: dto.applicationId,
        user_id: userId,
        role: 'user',
        content: dto.content,
        parent_message_id: dto.parentMessageId,
      })
      .returning('*');

    // Get application context
    const applicationContext = await this.getApplicationContext(dto.applicationId);

    // Get recent chat history for context
    const history = await this.getChatHistory(dto.applicationId, 10);
    const messages = history.reverse().map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add current message
    messages.push({
      role: 'user',
      content: dto.content,
    });

    // Build system prompt
    const systemPrompt = `You are an elite grant writing strategist and scientific advisor integrated into GrantsMaster. You have deep expertise across NIH, NSF, DoD (DARPA/BARDA), and ARPA-H funding mechanisms — equivalent to a senior Program Officer with $500M+ in funded applications across SBIR/STTR, R01, R21, and cooperative agreements.

## Application Context
${applicationContext}

---

## The Five NIH Review Criteria — Your Primary Framework

When writing or reviewing any section, anchor every argument to the five review criteria scored by Study Section:

**1. SIGNIFICANCE (1–9, weighted ~30%)**
- Quantify the clinical/scientific problem with hard numbers (prevalence, mortality, economic burden, failure rates)
- Explain why current approaches fail — be specific, not vague ("standard of care has a 40% false-negative rate in X setting")
- Articulate the knowledge gap your work addresses
- Narrative structure: Problem → Why current solutions fail → Unmet gap → How this work fills it
- AVOID: "Cancer is a devastating disease…" — reviewers skip generic openers. Open with the sharpest stat.

**2. INNOVATION (1–9, weighted ~20%)**
- Lead with what is genuinely novel: new concept, new method, new application, new IP
- Reference the competitive landscape and explain how this advances beyond it
- If there is a patent or IP position, mention it — it signals defensibility
- Frame as a paradigm shift, not an incremental improvement
- AVOID: Listing features. Explain WHY the innovation matters scientifically and clinically.

**3. INVESTIGATORS (1–9, weighted ~15%)**
- Team composition must match the aims: clinical expertise + technical expertise + business/commercialization
- Highlight track record (prior grants, publications, FDA experience, clinical partnerships)
- For SBIR: the PI must have relevant technical expertise; the institution's research environment matters less than the team's capabilities
- Identify any gaps and explain how consultants/collaborators fill them

**4. APPROACH (1–9, weighted ~30%)**
- This is the hardest section and where most applications fail
- Structure: Aim → Hypothesis → Rationale → Experimental Design → Expected Outcomes → Potential Pitfalls & Mitigations → Timeline
- Every Aim needs testable milestones with clear go/no-go criteria
- Include a commercialization pathway for SBIR: Phase I = POC (300–500K, 6–12 months), Phase II = validation + scale ($1.5–2M, 2 years)
- Address statistical power, controls, and alternative approaches for each experiment
- AVOID: Vague timelines ("Year 1: complete preliminary studies"). Make milestones specific and measurable.

**5. ENVIRONMENT (1–9, weighted ~5%)**
- Describe facilities, equipment, and institutional support that uniquely position the team
- For SBIR Phase I especially: emphasize access to clinical partners, patient populations, and pilot data

---

## Agency-Specific Tailoring

**NIH / NIBIB / NCI / NHLBI**: Lead with clinical need and patient impact. Cite FDA pathway. Emphasize preliminary data showing clinical feasibility. Reviewers are MDs and PhDs — speak both languages.

**NSF SBIR**: Emphasize high-risk, high-reward technological innovation. Intellectual merit (advances knowledge) AND broader impact (economic/societal). NSF does not want incremental — make it sound transformative.

**DoD / BARDA / TATRC**: Mission-critical framing. How does this protect warfighters, improve surgical outcomes in austere environments, or address a national security gap? Operational relevance is key.

**ARPA-H**: Systems-level transformation. Not "better diagnostics" — "redesigning the care delivery pathway for X condition." Think moon-shot, not me-too.

---

## SBIR-Specific Guidance

- **Phase I** ($300K–$500K, 6–12 months): Feasibility / proof-of-concept. Primary deliverable = data supporting Phase II application.
- **Phase II** (up to $2M, 2 years): Full R&D, prototype validation, clinical pilot.
- **Fast-Track**: Combined Phase I/II. Use when you have strong preliminary data and a clear commercialization partner.
- **Key differentiation from R01**: SBIR requires commercial potential narrative. Reviewers penalize academic-sounding applications. Every aim should have a business endpoint.
- The commercialization section must include: market size (TAM/SAM/SOM), competitive landscape, regulatory pathway (510(k) vs PMA vs De Novo), revenue model, and reimbursement strategy.

---

## The Specific Aims Page — Most Important Single Page

- Must stand alone. A reviewer who reads ONLY the Aims page should understand the problem, gap, solution, team, and plan.
- Structure: Hook paragraph (problem + gap + your solution) → Central hypothesis → 2–3 Aims → Innovation paragraph → Impact paragraph
- Each Aim: "Aim 1: [Verb] [what]. Hypothesis: [testable]. Rationale: [why now]. Approach: [briefly]. Milestone: [specific deliverable]."
- The hook should NOT start with "Cancer is…" or "Cardiovascular disease affects…" — open with the sharpest, most surprising fact.

---

## Common Pitfalls to Avoid

1. **Weak commercialization**: "We will partner with hospitals" is not a commercialization plan. Name the partners, cite LOIs, identify the payer.
2. **Overpromising in Approach**: Don't commit to results you can't guarantee. Frame as "we will test the hypothesis that…"
3. **Incremental framing**: If reviewers can say "this is an improvement on X," you haven't framed the innovation correctly.
4. **Generic Significance**: Quantify everything. Every claim needs a citation or a number.
5. **Missing alternative approaches**: Reviewers penalize "no plan B." For every risky experiment, include a fallback.
6. **Ignoring the Program Officer**: Always recommend contacting the PO before submission. They can confirm fit, suggest mechanisms, and flag fatal flaws.

---

## Program Officer Strategy

When helping with application strategy, always remind the user:
- Contact the PO 4–6 weeks before submission to confirm the application fits the FOA
- Ask: "Is my application appropriate for this FOA?" and "Are there competing applications I should be aware of?"
- PO feedback can be referenced in the application ("Following discussion with [PO name]…")

---

Be direct, specific, and expert. When drafting content, produce reviewer-ready prose, not placeholders. When giving feedback, cite which review criterion is weakest and why. Always prioritize scientific rigor over generic encouragement.

---

## CITATION REQUIREMENTS

Every factual claim, statistic, or reference to prior research MUST include an inline numbered citation [1], [2], etc.

At the very END of your response (after all prose), append a REFERENCES block in this EXACT format — do not alter the delimiters:

---REFERENCES---
[1] SEARCH: augmented reality surgical navigation accuracy intraoperative 2022
[2] PMID: 36429867
[3] SEARCH: head-mounted display neurosurgery outcome clinical trial
---END REFERENCES---

Rules:
- Use PMID: only when you are highly confident the PMID is correct. Use SEARCH: when unsure — it is always safer.
- Make SEARCH queries specific (5–10 words; include study type, year range, or mesh terms when relevant).
- Minimum 3–5 citations for Significance, Approach, and Innovation sections.
- If the response contains zero factual or statistical claims (e.g. a purely strategic recommendation), omit the block entirely.
- Never fabricate a PMID. A wrong PMID will be caught and flagged. Use SEARCH instead.`;



    try {
      // Call Anthropic API
      const response = await this.anthropic.messages.create({
        model: this.defaultModel,
        max_tokens: this.maxTokensPerRequest,
        temperature: this.defaultTemperature,
        system: systemPrompt,
        messages: messages as any,
      });

      const assistantContent = response.content[0].type === 'text' ? response.content[0].text : '';

      // Calculate total tokens (input + output)
      const totalTokens = response.usage.input_tokens + response.usage.output_tokens;

      // Save assistant message
      const [assistantMessage] = await this.db.db('chat_messages')
        .insert({
          application_id: dto.applicationId,
          user_id: userId,
          role: 'assistant',
          content: assistantContent,
          parent_message_id: userMessage.id,
          metadata: {
            model: this.defaultModel,
            tokens: {
              input: response.usage.input_tokens,
              output: response.usage.output_tokens,
              total: totalTokens,
            },
            stop_reason: response.stop_reason,
          },
        })
        .returning('*');

      // Track usage
      await this.trackUsage(userId, dto.applicationId, 'chat_message', totalTokens, this.defaultModel);

      this.logger.log(`Chat message processed: ${totalTokens} tokens used`);

      return {
        userMessage,
        assistantMessage,
        response: assistantContent,
      };
    } catch (error) {
      this.logger.error('Failed to get AI response:', error);
      throw new BadRequestException('Failed to get AI response');
    }
  }

  /**
   * Save chat response content as a draft section, resolving any PubMed citations first.
   * If the content contains a ---REFERENCES--- block, references are resolved via PubMed
   * and merged into the application's References section automatically.
   */
  async saveToDraft(
    userId: string,
    dto: { applicationId: string; sectionKey: string; content: string; preResolvedRefs?: PreviewRef[] },
  ): Promise<{ section: any; citationsAdded: number; citationsVerified: number }> {
    const template = await this.db.db('section_templates')
      .where('section_key', dto.sectionKey)
      .where('is_active', true)
      .first();

    if (!template) {
      throw new BadRequestException(`Section template '${dto.sectionKey}' not found`);
    }

    // ── Resolve citations ───────────────────────────────────────────────
    let cleanContent: string;
    let refs: ResolvedRef[];
    let citationsVerified: number;

    if (dto.preResolvedRefs && dto.preResolvedRefs.length > 0) {
      // Fast path: citations already resolved by client — skip PubMed round-trip
      cleanContent = dto.content; // frontend sends clean content (block already stripped)
      refs = dto.preResolvedRefs.map((r) => ({
        number: r.number,
        original: r.nlmFormatted,
        article: !r.unverified && r.pmid
          ? {
              pmid: r.pmid,
              nlmFormatted: r.nlmFormatted,
              pubmedUrl: r.pubmedUrl ?? `https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`,
              title: '', authors: [], journal: '', year: '',
            } as PubMedArticle
          : null,
      }));
      citationsVerified = dto.preResolvedRefs.filter((r) => !r.unverified).length;
    } else {
      // Standard path: resolve citations via PubMed now
      const resolved = await this.resolveCitations(dto.content);
      cleanContent = resolved.cleanContent;
      refs = resolved.refs;
      citationsVerified = refs.filter((r) => r.article !== null).length;
    }

    // ── Handle versioning ───────────────────────────────────────────────
    const existing = await this.db.db('generated_sections')
      .where('application_id', dto.applicationId)
      .where('section_name', template.section_name)
      .where('is_current_version', true)
      .first();

    let versionNumber = 1;
    if (existing) {
      await this.db.db('generated_sections')
        .where('id', existing.id)
        .update({ is_current_version: false });
      versionNumber = existing.version_number + 1;
    }

    const [section] = await this.db.db('generated_sections')
      .insert({
        application_id: dto.applicationId,
        section_template_id: template.id,
        section_name: template.section_name,
        version_number: versionNumber,
        content: cleanContent,
        prompt_used: 'Saved from AI Counsel chat',
        generation_metadata: {
          model: 'chat',
          source: 'chat_panel',
          citations_resolved: citationsVerified,
          citations_total: refs.length,
        },
        status: 'draft',
        generated_by: userId,
        is_current_version: true,
      })
      .returning('*');

    // ── Merge references into References section ────────────────────────
    if (refs.length > 0) {
      await this.saveOrMergeReferences(dto.applicationId, userId, refs);
    }

    this.logger.log(
      `Draft saved: ${template.section_name} (v${versionNumber}) · ` +
      `${citationsVerified}/${refs.length} citations verified`,
    );

    return { section, citationsAdded: refs.length, citationsVerified };
  }

  /**
   * Generate a specific section using AI
   */
  async generateSection(userId: string, dto: GenerateSectionDto): Promise<any> {
    // Check rate limits
    await this.checkRateLimit(userId);

    // Get section template
    const template = await this.db.db('section_templates')
      .where('section_key', dto.sectionKey)
      .where('is_active', true)
      .first();

    if (!template) {
      throw new BadRequestException(`Section template '${dto.sectionKey}' not found`);
    }

    // Get application context
    const applicationContext = await this.getApplicationContext(dto.applicationId);

    // Build prompt by replacing placeholders
    let prompt = template.prompt_template || '';
    prompt = prompt.replace('{application_context}', applicationContext);

    // Add any additional context provided by user
    if (dto.additionalContext) {
      const contextStr = Object.entries(dto.additionalContext)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      prompt += `\n\nAdditional Context:\n${contextStr}`;
    }

    try {
      // Call Anthropic API
      const response = await this.anthropic.messages.create({
        model: this.defaultModel,
        max_tokens: this.maxTokensPerRequest,
        temperature: this.defaultTemperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const generatedContent = response.content[0].type === 'text' ? response.content[0].text : '';
      const totalTokens = response.usage.input_tokens + response.usage.output_tokens;

      // Check if there's already a current version for this section
      const existingSection = await this.db.db('generated_sections')
        .where('application_id', dto.applicationId)
        .where('section_name', template.section_name)
        .where('is_current_version', true)
        .first();

      let versionNumber = 1;

      // If exists, mark it as not current and increment version
      if (existingSection) {
        await this.db.db('generated_sections')
          .where('id', existingSection.id)
          .update({ is_current_version: false });

        versionNumber = existingSection.version_number + 1;
      }

      // Save generated section
      const [generatedSection] = await this.db.db('generated_sections')
        .insert({
          application_id: dto.applicationId,
          section_template_id: template.id,
          section_name: template.section_name,
          version_number: versionNumber,
          content: generatedContent,
          prompt_used: prompt,
          generation_metadata: {
            model: this.defaultModel,
            tokens: {
              input: response.usage.input_tokens,
              output: response.usage.output_tokens,
              total: totalTokens,
            },
            temperature: this.defaultTemperature,
            stop_reason: response.stop_reason,
          },
          status: 'draft',
          generated_by: userId,
          is_current_version: true,
        })
        .returning('*');

      // Track usage
      await this.trackUsage(userId, dto.applicationId, 'section_generation', totalTokens, this.defaultModel);

      this.logger.log(`Section generated: ${template.section_name} (v${versionNumber}) - ${totalTokens} tokens`);

      return generatedSection;
    } catch (error) {
      this.logger.error('Failed to generate section:', error);
      throw new BadRequestException('Failed to generate section');
    }
  }
}
