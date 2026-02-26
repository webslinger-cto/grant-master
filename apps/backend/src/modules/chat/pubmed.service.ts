import { Injectable, Logger } from '@nestjs/common';

export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  nlmFormatted: string;  // Ready-to-use NLM/Vancouver citation string
  pubmedUrl: string;
}

@Injectable()
export class PubMedService {
  private readonly logger = new Logger(PubMedService.name);
  private readonly baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

  /**
   * Lightweight fetch using native Node.js 18+ fetch
   */
  private async apiFetch(url: string): Promise<any> {
    const res = await (fetch as any)(url, {
      headers: { 'User-Agent': 'GrantsMaster/1.0 (grant writing platform)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`PubMed HTTP ${res.status}`);
    return res.json();
  }

  /**
   * Search PubMed for the most relevant paper matching `query`.
   * Returns the top result or null if nothing found.
   */
  async searchPubMed(query: string): Promise<PubMedArticle | null> {
    try {
      const searchUrl =
        `${this.baseUrl}/esearch.fcgi?db=pubmed` +
        `&term=${encodeURIComponent(query)}` +
        `&retmax=1&retmode=json&sort=relevance`;

      const searchResult = await this.apiFetch(searchUrl);
      const ids: string[] = searchResult?.esearchresult?.idlist ?? [];
      if (!ids.length) {
        this.logger.debug(`PubMed: no results for query "${query}"`);
        return null;
      }
      return this.fetchByPmid(ids[0]);
    } catch (e) {
      this.logger.warn(`PubMed search failed for "${query}": ${e.message}`);
      return null;
    }
  }

  /**
   * Fetch full citation details for a known PMID.
   */
  async fetchByPmid(pmid: string): Promise<PubMedArticle | null> {
    try {
      const url = `${this.baseUrl}/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`;
      const result = await this.apiFetch(url);
      const doc = result?.result?.[pmid];
      if (!doc) return null;
      return this.formatArticle(pmid, doc);
    } catch (e) {
      this.logger.warn(`PubMed fetch failed for PMID ${pmid}: ${e.message}`);
      return null;
    }
  }

  /**
   * Resolve a reference string which is either:
   *   "PMID: 12345678"    — direct PMID lookup
   *   "SEARCH: query text" — keyword search
   */
  async resolveReference(ref: string): Promise<PubMedArticle | null> {
    const pmidMatch = ref.match(/^PMID:\s*(\d+)/i);
    if (pmidMatch) return this.fetchByPmid(pmidMatch[1]);

    const searchMatch = ref.match(/^SEARCH:\s*(.+)/i);
    if (searchMatch) return this.searchPubMed(searchMatch[1].trim());

    // Fallback: treat the whole string as a search query
    return this.searchPubMed(ref.trim());
  }

  /**
   * Format a raw esummary document into a PubMedArticle with NLM citation.
   *
   * NLM (Vancouver) format:
   *   Author AA, Author BB, et al. Title. J Abbrev. Year;Vol(Issue):Pages. doi: X. PMID: N.
   */
  private formatArticle(pmid: string, doc: any): PubMedArticle {
    // Authors — max 6, then "et al."
    const rawAuthors: any[] = doc.authors ?? [];
    const authorNames: string[] = rawAuthors.slice(0, 6).map((a: any) => a.name ?? '');
    const authorStr = authorNames.length
      ? authorNames.join(', ') + (rawAuthors.length > 6 ? ', et al.' : '')
      : '';

    const journal: string = doc.source ?? doc.fulljournalname ?? '';
    const year: string = (doc.pubdate ?? '').split(' ')[0] ?? '';
    const volume: string = doc.volume ?? '';
    const issue: string = doc.issue ?? '';
    const pages: string = doc.pages ?? '';
    const title: string = (doc.title ?? 'Untitled').replace(/\.$/, '');

    // Extract DOI from articleids array
    const doiEntry = (doc.articleids ?? []).find((a: any) => a.idtype === 'doi');
    const doi: string = doiEntry?.value ?? '';

    // Build NLM string
    let nlm = authorStr ? `${authorStr}. ` : '';
    nlm += `${title}. ${journal}. ${year}`;
    if (volume) nlm += `;${volume}`;
    if (issue) nlm += `(${issue})`;
    if (pages) nlm += `:${pages}`;
    nlm += '.';
    if (doi) nlm += ` doi: ${doi}.`;
    nlm += ` PMID: ${pmid}.`;

    return {
      pmid,
      title,
      authors: authorNames,
      journal,
      year,
      volume,
      issue,
      pages,
      doi,
      nlmFormatted: nlm,
      pubmedUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    };
  }
}
