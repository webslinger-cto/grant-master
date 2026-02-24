import { api } from '../api';

export interface Author {
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  affiliation?: string;
}

export interface Citation {
  id: string;
  applicationId: string;
  doi?: string;
  pmid?: string;
  pmcid?: string;
  title: string;
  authors: Author[];
  journal?: string;
  publisher?: string;
  year?: number;
  volume?: string;
  issue?: string;
  pages?: string;
  publicationDate?: string;
  citationType: string;
  abstract?: string;
  url?: string;
  metadata?: Record<string, any>;
  formatted: {
    nih: string;
    apa: string;
    mla: string;
    chicago: string;
  };
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCitationRequest {
  applicationId: string;
  doi?: string;
  pmid?: string;
  pmcid?: string;
  title?: string;
  authors?: Author[];
  journal?: string;
  publisher?: string;
  year?: number;
  volume?: string;
  issue?: string;
  pages?: string;
  publicationDate?: string;
  citationType?: string;
  abstract?: string;
  url?: string;
  metadata?: Record<string, any>;
}

export interface BatchImportRequest {
  applicationId: string;
  source: 'doi' | 'pmid' | 'bibtex';
  identifiers: string[];
}

export interface BibliographyResponse {
  format: 'nih' | 'apa' | 'mla' | 'chicago';
  count: number;
  bibliography: string;
}

class CitationsService {
  /**
   * Get all citations for an application
   */
  async getCitations(applicationId: string): Promise<Citation[]> {
    const response: any = await api.get(`/citations?applicationId=${applicationId}`);
    return response.data || response; // Handle wrapped or unwrapped response
  }

  /**
   * Get a single citation by ID
   */
  async getCitation(id: string): Promise<Citation> {
    const response: any = await api.get(`/citations/${id}`);
    return response.data || response;
  }

  /**
   * Create a new citation
   * Can provide DOI/PMID for auto-fetch or manual data
   */
  async createCitation(data: CreateCitationRequest): Promise<Citation> {
    const response: any = await api.post('/citations', data);
    return response.data || response;
  }

  /**
   * Update a citation
   */
  async updateCitation(id: string, data: Partial<CreateCitationRequest>): Promise<Citation> {
    const response: any = await api.put(`/citations/${id}`, data);
    return response.data || response;
  }

  /**
   * Delete a citation
   */
  async deleteCitation(id: string): Promise<void> {
    const response: any = await api.delete(`/citations/${id}`);
    return response.data || response;
  }

  /**
   * Search citations by title, author, or journal
   */
  async searchCitations(applicationId: string, query: string): Promise<Citation[]> {
    const response: any = await api.get(`/citations/search?applicationId=${applicationId}&q=${encodeURIComponent(query)}`);
    return response.data || response;
  }

  /**
   * Generate formatted bibliography
   */
  async generateBibliography(
    applicationId: string,
    format: 'nih' | 'apa' | 'mla' | 'chicago' = 'nih'
  ): Promise<BibliographyResponse> {
    const response: any = await api.get(`/citations/bibliography?applicationId=${applicationId}&format=${format}`);
    return response.data || response;
  }

  /**
   * Batch import citations from DOIs or PMIDs
   */
  async batchImport(data: BatchImportRequest): Promise<{
    jobId: string;
    total: number;
    success: number;
    failed: number;
    citations: Citation[];
    errors: Array<{ identifier: string; error: string }>;
  }> {
    const response: any = await api.post('/citations/batch-import', data);
    return response.data || response;
  }

  /**
   * Track citation usage (for analytics)
   */
  async trackUsage(citationId: string): Promise<void> {
    const response: any = await api.post(`/citations/${citationId}/track-usage`);
    return response.data || response;
  }
}

export const citationsService = new CitationsService();
