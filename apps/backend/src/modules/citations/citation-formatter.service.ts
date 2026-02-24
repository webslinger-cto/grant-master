import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ConfigService } from '@nestjs/config';

interface Citation {
  title: string;
  authors: string; // JSON array
  journal?: string;
  publisher?: string;
  year?: number;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  pmid?: string;
  url?: string;
  citationType: string;
}

@Injectable()
export class CitationFormatterService {
  private readonly logger = new Logger(CitationFormatterService.name);
  private readonly anthropic: Anthropic;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Format citation in NIH style
   * NIH uses a numbered reference list with specific formatting
   */
  formatNIH(citation: Citation): string {
    const authors = this.parseAuthors(citation.authors);
    const authorStr = this.formatAuthorsNIH(authors);
    const year = citation.year || 'n.d.';
    const title = citation.title.replace(/\.$/, ''); // Remove trailing period

    // Basic NIH format
    let formatted = `${authorStr}. ${title}. `;

    if (citation.journal) {
      formatted += `${citation.journal}. ${year}`;
      if (citation.volume) formatted += `;${citation.volume}`;
      if (citation.issue) formatted += `(${citation.issue})`;
      if (citation.pages) formatted += `:${citation.pages}`;
      formatted += '.';
    } else if (citation.publisher) {
      formatted += `${citation.publisher}; ${year}.`;
    } else {
      formatted += `${year}.`;
    }

    if (citation.doi) {
      formatted += ` doi:${citation.doi}`;
    } else if (citation.pmid) {
      formatted += ` PMID: ${citation.pmid}`;
    }

    return formatted;
  }

  /**
   * Format citation in APA style (7th edition)
   */
  formatAPA(citation: Citation): string {
    const authors = this.parseAuthors(citation.authors);
    const authorStr = this.formatAuthorsAPA(authors);
    const year = citation.year || 'n.d.';
    const title = citation.title;

    let formatted = `${authorStr} (${year}). ${title}`;

    if (citation.journal) {
      formatted += `. ${citation.journal}`;
      if (citation.volume) formatted += `, ${citation.volume}`;
      if (citation.issue) formatted += `(${citation.issue})`;
      if (citation.pages) formatted += `, ${citation.pages}`;
      formatted += '.';
    } else if (citation.publisher) {
      formatted += `. ${citation.publisher}.`;
    } else {
      formatted += '.';
    }

    if (citation.doi) {
      formatted += ` https://doi.org/${citation.doi}`;
    } else if (citation.url) {
      formatted += ` ${citation.url}`;
    }

    return formatted;
  }

  /**
   * Format citation in MLA style (9th edition)
   */
  formatMLA(citation: Citation): string {
    const authors = this.parseAuthors(citation.authors);
    const authorStr = this.formatAuthorsMLA(authors);
    const title = `"${citation.title}"`;

    let formatted = `${authorStr}. ${title}`;

    if (citation.journal) {
      formatted += `. ${citation.journal}`;
      if (citation.volume) formatted += `, vol. ${citation.volume}`;
      if (citation.issue) formatted += `, no. ${citation.issue}`;
      if (citation.year) formatted += `, ${citation.year}`;
      if (citation.pages) formatted += `, pp. ${citation.pages}`;
      formatted += '.';
    } else if (citation.publisher && citation.year) {
      formatted += `. ${citation.publisher}, ${citation.year}.`;
    }

    if (citation.doi) {
      formatted += ` doi:${citation.doi}.`;
    }

    return formatted;
  }

  /**
   * Format citation in Chicago style (17th edition - Author-Date)
   */
  formatChicago(citation: Citation): string {
    const authors = this.parseAuthors(citation.authors);
    const authorStr = this.formatAuthorsChicago(authors);
    const year = citation.year || 'n.d.';
    const title = citation.title;

    let formatted = `${authorStr}. ${year}. "${title}."`;

    if (citation.journal) {
      formatted += ` ${citation.journal}`;
      if (citation.volume) formatted += ` ${citation.volume}`;
      if (citation.issue) formatted += ` (${citation.issue})`;
      if (citation.pages) formatted += `: ${citation.pages}`;
      formatted += '.';
    } else if (citation.publisher) {
      formatted += ` ${citation.publisher}.`;
    }

    if (citation.doi) {
      formatted += ` https://doi.org/${citation.doi}.`;
    }

    return formatted;
  }

  /**
   * Use AI to format citation in any style with high accuracy
   * This is a fallback for complex citations or custom formats
   */
  async formatWithAI(citation: Citation, format: string): Promise<string> {
    try {
      this.logger.log(`Using AI to format citation in ${format} style`);

      const prompt = `Format the following citation in ${format.toUpperCase()} style. Return ONLY the formatted citation, no explanations.

Citation data:
- Title: ${citation.title}
- Authors: ${citation.authors}
- Journal: ${citation.journal || 'N/A'}
- Publisher: ${citation.publisher || 'N/A'}
- Year: ${citation.year || 'N/A'}
- Volume: ${citation.volume || 'N/A'}
- Issue: ${citation.issue || 'N/A'}
- Pages: ${citation.pages || 'N/A'}
- DOI: ${citation.doi || 'N/A'}
- PMID: ${citation.pmid || 'N/A'}
- Type: ${citation.citationType}

Format this citation exactly according to ${format.toUpperCase()} guidelines. Be precise with punctuation, capitalization, and ordering.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307', // Use Haiku for cost efficiency
        max_tokens: 500,
        temperature: 0.1, // Low temperature for consistent formatting
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const formatted = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
      return formatted;
    } catch (error) {
      this.logger.error(`AI formatting failed: ${error.message}`);
      // Fallback to basic formatting
      return this.formatNIH(citation);
    }
  }

  /**
   * Parse authors JSON string to array
   */
  private parseAuthors(authorsJson: string): Array<{ firstName: string; lastName: string; middleName?: string }> {
    try {
      return JSON.parse(authorsJson);
    } catch {
      return [];
    }
  }

  /**
   * Format authors for NIH style: LastName Initial(s)
   * Example: Smith AB, Jones CD, Williams EF
   */
  private formatAuthorsNIH(authors: any[]): string {
    if (authors.length === 0) return 'Unknown';

    const formatted = authors.map((author) => {
      const lastName = author.lastName || '';
      const firstInitial = author.firstName?.charAt(0) || '';
      const middleInitial = author.middleName?.charAt(0) || '';
      return `${lastName} ${firstInitial}${middleInitial}`.trim();
    });

    if (formatted.length > 6) {
      return `${formatted.slice(0, 3).join(', ')}, et al.`;
    }

    return formatted.join(', ');
  }

  /**
   * Format authors for APA style: LastName, Initials
   * Example: Smith, A. B., Jones, C. D., & Williams, E. F.
   */
  private formatAuthorsAPA(authors: any[]): string {
    if (authors.length === 0) return 'Unknown';

    const formatted = authors.map((author) => {
      const lastName = author.lastName || '';
      const firstInitial = author.firstName?.charAt(0) || '';
      const middleInitial = author.middleName?.charAt(0) || '';
      const initials = middleInitial ? `${firstInitial}. ${middleInitial}.` : `${firstInitial}.`;
      return `${lastName}, ${initials}`;
    });

    if (formatted.length === 1) return formatted[0];
    if (formatted.length === 2) return `${formatted[0]}, & ${formatted[1]}`;

    const allButLast = formatted.slice(0, -1).join(', ');
    const last = formatted[formatted.length - 1];
    return `${allButLast}, & ${last}`;
  }

  /**
   * Format authors for MLA style: LastName, FirstName
   * Example: Smith, Adam B., et al.
   */
  private formatAuthorsMLA(authors: any[]): string {
    if (authors.length === 0) return 'Unknown';

    const first = authors[0];
    const firstName = first.firstName || '';
    const middleName = first.middleName ? ` ${first.middleName}` : '';
    const lastName = first.lastName || '';

    let formatted = `${lastName}, ${firstName}${middleName}`;

    if (authors.length > 1) {
      formatted += ', et al.';
    }

    return formatted;
  }

  /**
   * Format authors for Chicago style: LastName, FirstName
   * Example: Smith, Adam, and Carol Jones.
   */
  private formatAuthorsChicago(authors: any[]): string {
    if (authors.length === 0) return 'Unknown';

    const formatted = authors.map((author) => {
      const firstName = author.firstName || '';
      const lastName = author.lastName || '';
      return `${lastName}, ${firstName}`;
    });

    if (formatted.length === 1) return formatted[0];
    if (formatted.length === 2) return `${formatted[0]}, and ${formatted[1]}`;

    const allButLast = formatted.slice(0, -1).join(', ');
    const last = formatted[formatted.length - 1];
    return `${allButLast}, and ${last}`;
  }
}
