import { api } from '../api';

export interface NihOpportunity {
  opportunityId: string;
  opportunityNumber: string;
  title: string;
  agency: string;
  agencyCode?: string;
  closeDate: string | null;   // YYYY-MM-DD
  openDate: string | null;
  status: string;
  description: string | null;
  url: string | null;
  // Rich fields (available when sourced from simpler.grants.gov)
  awardCeiling?: number | null;
  awardFloor?: number | null;
  estimatedTotalProgramFunding?: number | null;
  expectedNumberOfAwards?: number | null;
  eligibilitySummary?: string | null;
  fundingCategories?: string[];
  fundingInstruments?: string[];
  isCostSharing?: boolean | null;
}

export interface NihProject {
  projectNumber: string;
  title: string;
  activityCode: string;
  fiscalYear: number;
  awardAmount: number | null;
  startDate: string | null;
  endDate: string | null;
  organization: string | null;
  piName: string | null;
  abstract: string | null;
}

class NihService {
  /**
   * Search Grants.gov for open opportunities — returns real close dates (deadlines)
   */
  async searchOpportunities(q: string, agency?: string): Promise<NihOpportunity[]> {
    const params = new URLSearchParams({ q });
    if (agency) params.set('agency', agency);
    const res = await api.get<any>(`/nih/opportunities?${params}`);
    return res?.data ?? res ?? [];
  }

  /**
   * Fetch rich detail for one opportunity (award ceiling, eligibility, etc.)
   * by opportunity number via simpler.grants.gov. Returns null if not found.
   */
  async enrichOpportunity(opportunityNumber: string): Promise<NihOpportunity | null> {
    if (!opportunityNumber) return null;
    try {
      const res = await api.get<any>(`/nih/opportunities/enrich?number=${encodeURIComponent(opportunityNumber)}`);
      return res?.data ?? res ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Search NIH REPORTER for funded projects
   */
  async searchProjects(q: string, codes?: string): Promise<NihProject[]> {
    const params = new URLSearchParams({ q });
    if (codes) params.set('codes', codes);
    const res = await api.get<any>(`/nih/projects?${params}`);
    return res?.data ?? res ?? [];
  }

  /**
   * Extract NIH activity code from a grant name string
   * e.g. "NIH R01 — CardioAI" → "R01"
   */
  extractActivityCode(grantName: string): string | null {
    const match = grantName.match(/\b(R\d{2}|K\d{2}|P\d{2}|U\d{2}|T\d{2}|F\d{2}|SBIR|STTR)\b/i);
    return match ? match[1].toUpperCase() : null;
  }

  /**
   * Build a search query from a grant name
   * e.g. "NIH SBIR — Remote Monitoring Spring 2026" → "SBIR NIH"
   */
  buildSearchQuery(grantName: string): string {
    const code = this.extractActivityCode(grantName);
    const isNih = /nih/i.test(grantName);
    if (code && isNih) return `${code} NIH`;
    if (code) return code;
    // Strip year + stage words and use what's left
    return grantName
      .replace(/\b(spring|summer|fall|winter|20\d\d)\b/gi, '')
      .replace(/[—\-–]/g, ' ')
      .trim()
      .split(/\s+/)
      .slice(0, 4)
      .join(' ');
  }
}

export const nihService = new NihService();
