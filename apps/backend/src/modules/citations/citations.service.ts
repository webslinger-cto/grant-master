import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateCitationDto } from './dto/create-citation.dto';
import { UpdateCitationDto } from './dto/update-citation.dto';
import { BatchImportDto } from './dto/batch-import.dto';
import { CitationFetcherService } from './citation-fetcher.service';
import { CitationFormatterService } from './citation-formatter.service';

@Injectable()
export class CitationsService {
  private readonly logger = new Logger(CitationsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly fetcher: CitationFetcherService,
    private readonly formatter: CitationFormatterService,
  ) {}

  /**
   * Create a new citation
   * Auto-fetches data if DOI or PMID provided
   */
  async create(userId: string, dto: CreateCitationDto) {
    try {
      let citationData: any = {};

      // Option 1: Fetch from DOI
      if (dto.doi) {
        this.logger.log(`Creating citation from DOI: ${dto.doi}`);
        const normalizedDoi = this.fetcher.normalizeDOI(dto.doi);
        const fetched = await this.fetcher.fetchByDOI(normalizedDoi);
        citationData = { ...fetched, ...dto }; // Allow DTO to override
      }
      // Option 2: Fetch from PMID
      else if (dto.pmid) {
        this.logger.log(`Creating citation from PMID: ${dto.pmid}`);
        const normalizedPmid = this.fetcher.normalizePMID(dto.pmid);
        const fetched = await this.fetcher.fetchByPMID(normalizedPmid);
        citationData = { ...fetched, ...dto }; // Allow DTO to override
      }
      // Option 3: Manual entry
      else if (dto.title && dto.authors) {
        this.logger.log('Creating citation from manual entry');
        citationData = dto;
      } else {
        throw new BadRequestException('Must provide either DOI, PMID, or title+authors');
      }

      // Format authors as JSON
      const authorsJson = JSON.stringify(citationData.authors || []);

      // Generate all formatted versions
      const citation = {
        doi: citationData.doi,
        pmid: citationData.pmid,
        pmcid: citationData.pmcid,
        title: citationData.title,
        authors: authorsJson,
        journal: citationData.journal,
        publisher: citationData.publisher,
        year: citationData.year,
        volume: citationData.volume,
        issue: citationData.issue,
        pages: citationData.pages,
        publication_date: citationData.publicationDate,
        citation_type: citationData.citationType || 'journal_article',
        abstract: citationData.abstract,
        url: citationData.url,
        metadata: citationData.metadata,
      };

      const formatted_nih = this.formatter.formatNIH(citation as any);
      const formatted_apa = this.formatter.formatAPA(citation as any);
      const formatted_mla = this.formatter.formatMLA(citation as any);
      const formatted_chicago = this.formatter.formatChicago(citation as any);

      // Insert into database
      const [created] = await this.db
        .db('citations')
        .insert({
          ...citation,
          application_id: dto.applicationId,
          created_by: userId,
          formatted_nih,
          formatted_apa,
          formatted_mla,
          formatted_chicago,
          usage_count: 0,
        })
        .returning('*');

      return this.formatCitationResponse(created);
    } catch (error) {
      this.logger.error(`Failed to create citation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all citations for an application
   */
  async getByApplicationId(applicationId: string) {
    const citations = await this.db
      .db('citations')
      .where({ application_id: applicationId })
      .orderBy('created_at', 'desc');

    return citations.map((c) => this.formatCitationResponse(c));
  }

  /**
   * Get a single citation by ID
   */
  async getById(id: string) {
    const citation = await this.db.db('citations').where({ id }).first();

    if (!citation) {
      throw new NotFoundException(`Citation with ID ${id} not found`);
    }

    return this.formatCitationResponse(citation);
  }

  /**
   * Update a citation
   */
  async update(id: string, userId: string, dto: UpdateCitationDto) {
    const existing = await this.db.db('citations').where({ id }).first();

    if (!existing) {
      throw new NotFoundException(`Citation with ID ${id} not found`);
    }

    // If updating core data, regenerate formatted versions
    const updates: any = {};

    if (dto.title) updates.title = dto.title;
    if (dto.authors) updates.authors = JSON.stringify(dto.authors);
    if (dto.journal) updates.journal = dto.journal;
    if (dto.publisher) updates.publisher = dto.publisher;
    if (dto.year) updates.year = dto.year;
    if (dto.volume) updates.volume = dto.volume;
    if (dto.issue) updates.issue = dto.issue;
    if (dto.pages) updates.pages = dto.pages;
    if (dto.doi) updates.doi = dto.doi;
    if (dto.pmid) updates.pmid = dto.pmid;
    if (dto.abstract) updates.abstract = dto.abstract;
    if (dto.url) updates.url = dto.url;
    if (dto.citationType) updates.citation_type = dto.citationType;
    if (dto.metadata) updates.metadata = dto.metadata;

    // Regenerate formatted versions if core data changed
    if (Object.keys(updates).length > 0) {
      const merged = { ...existing, ...updates };
      updates.formatted_nih = this.formatter.formatNIH(merged);
      updates.formatted_apa = this.formatter.formatAPA(merged);
      updates.formatted_mla = this.formatter.formatMLA(merged);
      updates.formatted_chicago = this.formatter.formatChicago(merged);
    }

    const [updated] = await this.db
      .db('citations')
      .where({ id })
      .update({ ...updates, updated_at: this.db.db.fn.now() })
      .returning('*');

    return this.formatCitationResponse(updated);
  }

  /**
   * Delete a citation
   */
  async delete(id: string) {
    const deleted = await this.db.db('citations').where({ id }).delete();

    if (deleted === 0) {
      throw new NotFoundException(`Citation with ID ${id} not found`);
    }

    return { message: 'Citation deleted successfully' };
  }

  /**
   * Batch import citations from DOIs or PMIDs
   */
  async batchImport(userId: string, dto: BatchImportDto) {
    const jobId = await this.createImportJob(userId, dto);

    const results = {
      jobId,
      total: dto.identifiers.length,
      success: 0,
      failed: 0,
      citations: [] as any[],
      errors: [] as any[],
    };

    for (const identifier of dto.identifiers) {
      try {
        let citation;

        if (dto.source === 'doi') {
          citation = await this.create(userId, {
            applicationId: dto.applicationId,
            doi: identifier,
          });
        } else if (dto.source === 'pmid') {
          citation = await this.create(userId, {
            applicationId: dto.applicationId,
            pmid: identifier,
          });
        }

        results.citations.push(citation);
        results.success++;
      } catch (error) {
        this.logger.error(`Failed to import ${identifier}: ${error.message}`);
        results.errors.push({
          identifier,
          error: error.message,
        });
        results.failed++;
      }
    }

    // Update job status
    await this.updateImportJob(jobId, results);

    return results;
  }

  /**
   * Generate formatted bibliography section
   */
  async generateBibliography(applicationId: string, format: 'nih' | 'apa' | 'mla' | 'chicago' = 'nih') {
    const citations = await this.db
      .db('citations')
      .where({ application_id: applicationId })
      .orderBy('created_at', 'asc');

    if (citations.length === 0) {
      return {
        format,
        count: 0,
        bibliography: 'No citations found.',
      };
    }

    const formatField = `formatted_${format}`;
    const formattedCitations = citations.map((c, index) => {
      return `${index + 1}. ${c[formatField]}`;
    });

    const bibliography = formattedCitations.join('\n\n');

    return {
      format,
      count: citations.length,
      bibliography,
    };
  }

  /**
   * Search citations by title or author
   */
  async search(applicationId: string, query: string) {
    const citations = await this.db
      .db('citations')
      .where({ application_id: applicationId })
      .where((builder) => {
        builder
          .where('title', 'ilike', `%${query}%`)
          .orWhere('authors', 'ilike', `%${query}%`)
          .orWhere('journal', 'ilike', `%${query}%`);
      })
      .orderBy('created_at', 'desc');

    return citations.map((c) => this.formatCitationResponse(c));
  }

  /**
   * Track citation usage
   */
  async trackUsage(citationId: string) {
    await this.db
      .db('citations')
      .where({ id: citationId })
      .increment('usage_count', 1)
      .update({ last_used_at: this.db.db.fn.now() });
  }

  /**
   * Create import job
   */
  private async createImportJob(userId: string, dto: BatchImportDto) {
    const [job] = await this.db
      .db('citation_import_jobs')
      .insert({
        application_id: dto.applicationId,
        created_by: userId,
        source: dto.source,
        input_data: JSON.stringify(dto.identifiers),
        status: 'processing',
        total_count: dto.identifiers.length,
      })
      .returning('id');

    return job.id;
  }

  /**
   * Update import job status
   */
  private async updateImportJob(jobId: string, results: any) {
    await this.db
      .db('citation_import_jobs')
      .where({ id: jobId })
      .update({
        status: 'completed',
        success_count: results.success,
        failed_count: results.failed,
        errors: JSON.stringify(results.errors),
      });
  }

  /**
   * Format citation response
   */
  private formatCitationResponse(citation: any) {
    return {
      id: citation.id,
      applicationId: citation.application_id,
      doi: citation.doi,
      pmid: citation.pmid,
      pmcid: citation.pmcid,
      title: citation.title,
      authors: JSON.parse(citation.authors || '[]'),
      journal: citation.journal,
      publisher: citation.publisher,
      year: citation.year,
      volume: citation.volume,
      issue: citation.issue,
      pages: citation.pages,
      publicationDate: citation.publication_date,
      citationType: citation.citation_type,
      abstract: citation.abstract,
      url: citation.url,
      metadata: citation.metadata,
      formatted: {
        nih: citation.formatted_nih,
        apa: citation.formatted_apa,
        mla: citation.formatted_mla,
        chicago: citation.formatted_chicago,
      },
      usageCount: citation.usage_count,
      lastUsedAt: citation.last_used_at,
      createdAt: citation.created_at,
      updatedAt: citation.updated_at,
    };
  }
}
