import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

interface FetchedCitation {
  title: string;
  authors: Array<{ firstName: string; lastName: string; middleName?: string }>;
  journal?: string;
  publisher?: string;
  year?: number;
  volume?: string;
  issue?: string;
  pages?: string;
  publicationDate?: string;
  doi?: string;
  pmid?: string;
  abstract?: string;
  url?: string;
  citationType: string;
}

@Injectable()
export class CitationFetcherService {
  private readonly logger = new Logger(CitationFetcherService.name);

  /**
   * Fetch citation data by DOI using Crossref API
   */
  async fetchByDOI(doi: string): Promise<FetchedCitation> {
    try {
      this.logger.log(`Fetching citation by DOI: ${doi}`);

      // Crossref API - Free, no key required
      const response = await axios.get(`https://api.crossref.org/works/${doi}`, {
        headers: {
          'User-Agent': 'GrantsMaster/1.0 (mailto:support@webslinger.ai)', // Polite API usage
        },
        timeout: 10000,
      });

      const data = response.data.message;

      return {
        title: data.title?.[0] || 'Untitled',
        authors: this.parseAuthors(data.author || []),
        journal: data['container-title']?.[0] || data.publisher,
        publisher: data.publisher,
        year: data.published?.['date-parts']?.[0]?.[0],
        volume: data.volume,
        issue: data.issue,
        pages: data.page,
        publicationDate: this.formatDate(data.published?.['date-parts']?.[0]),
        doi: data.DOI,
        abstract: data.abstract,
        url: data.URL || `https://doi.org/${doi}`,
        citationType: this.mapCrossrefType(data.type),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch DOI ${doi}: ${error.message}`);
      throw new HttpException(
        `Could not fetch citation data for DOI: ${doi}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Fetch citation data by PMID using PubMed API
   */
  async fetchByPMID(pmid: string): Promise<FetchedCitation> {
    try {
      this.logger.log(`Fetching citation by PMID: ${pmid}`);

      // PubMed E-utilities API - Free, no key required (rate limited to 3 requests/sec)
      const response = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi', {
        params: {
          db: 'pubmed',
          id: pmid,
          retmode: 'json',
        },
        timeout: 10000,
      });

      const article = response.data.result[pmid];
      if (!article) {
        throw new Error('Article not found');
      }

      // Fetch full details including abstract
      const detailsResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi', {
        params: {
          db: 'pubmed',
          id: pmid,
          retmode: 'xml',
        },
        timeout: 10000,
      });

      // Parse basic info from summary
      const authors = this.parsePubMedAuthors(article.authors || []);
      const year = parseInt(article.pubdate?.split(' ')[0]) || undefined;

      return {
        title: article.title || 'Untitled',
        authors,
        journal: article.fulljournalname || article.source,
        year,
        volume: article.volume,
        issue: article.issue,
        pages: article.pages,
        publicationDate: article.pubdate,
        pmid: article.uid,
        doi: article.elocationid?.replace('doi: ', ''),
        abstract: this.extractAbstractFromXML(detailsResponse.data),
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        citationType: 'journal_article',
      };
    } catch (error) {
      this.logger.error(`Failed to fetch PMID ${pmid}: ${error.message}`);
      throw new HttpException(
        `Could not fetch citation data for PMID: ${pmid}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Try to resolve DOI from URL or DOI string
   */
  normalizeDOI(input: string): string {
    // Handle various DOI formats:
    // - 10.1234/example
    // - https://doi.org/10.1234/example
    // - doi:10.1234/example
    const doiPattern = /(?:https?:\/\/)?(?:dx\.)?doi\.org\/|doi:\s*/gi;
    return input.replace(doiPattern, '').trim();
  }

  /**
   * Try to resolve PMID from URL or PMID string
   */
  normalizePMID(input: string): string {
    // Handle various PMID formats:
    // - 12345678
    // - PMID: 12345678
    // - https://pubmed.ncbi.nlm.nih.gov/12345678/
    const pmidPattern = /.*?(\d{7,8}).*/;
    const match = input.match(pmidPattern);
    return match ? match[1] : input;
  }

  /**
   * Parse Crossref authors format
   */
  private parseAuthors(authors: any[]): Array<{ firstName: string; lastName: string; middleName?: string }> {
    return authors.map((author) => ({
      firstName: author.given || '',
      lastName: author.family || '',
      middleName: undefined,
    }));
  }

  /**
   * Parse PubMed authors format
   */
  private parsePubMedAuthors(authors: any[]): Array<{ firstName: string; lastName: string; middleName?: string }> {
    return authors.map((author) => {
      const name = author.name || '';
      const parts = name.split(' ');
      return {
        firstName: parts[1] || '',
        lastName: parts[0] || '',
        middleName: parts.length > 2 ? parts[2] : undefined,
      };
    });
  }

  /**
   * Map Crossref type to our citation types
   */
  private mapCrossrefType(type: string): string {
    const typeMap: Record<string, string> = {
      'journal-article': 'journal_article',
      'book': 'book',
      'book-chapter': 'book_chapter',
      'proceedings-article': 'conference',
      'posted-content': 'preprint',
      'dissertation': 'thesis',
    };
    return typeMap[type] || 'other';
  }

  /**
   * Format date parts to ISO string
   */
  private formatDate(dateParts?: number[]): string | undefined {
    if (!dateParts || dateParts.length === 0) return undefined;
    const [year, month, day] = dateParts;
    return `${year}-${String(month || 1).padStart(2, '0')}-${String(day || 1).padStart(2, '0')}`;
  }

  /**
   * Extract abstract from PubMed XML response
   */
  private extractAbstractFromXML(xml: string): string | undefined {
    try {
      // Simple regex extraction (in production, use proper XML parser)
      const abstractMatch = xml.match(/<AbstractText[^>]*>(.*?)<\/AbstractText>/s);
      if (abstractMatch) {
        // Remove HTML tags
        return abstractMatch[1].replace(/<[^>]*>/g, '').trim();
      }
    } catch (error) {
      this.logger.warn('Failed to extract abstract from XML');
    }
    return undefined;
  }
}
