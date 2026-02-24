import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface GrantsGovOpportunity {
  opportunityId: string;
  opportunityNumber: string;
  title: string;
  agency: string;
  closeDate: string | null;       // ISO date string YYYY-MM-DD
  openDate: string | null;
  status: string;
  description: string | null;
  url: string | null;
}

function normalizeDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // Handle MM/DD/YYYY → YYYY-MM-DD
  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, m, d, y] = slashMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Already ISO or close to it
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.substring(0, 10);
  return raw;
}

@Injectable()
export class GrantsGovService {
  private readonly logger = new Logger(GrantsGovService.name);
  private readonly baseUrl = 'https://api.grants.gov/v1/api';

  async searchOpportunities(
    query: string,
    agencyCode = '',   // single string code e.g. "HHS-NIH11" — array format returns 0 results
    limit = 10,
  ): Promise<GrantsGovOpportunity[]> {
    try {
      const body: Record<string, any> = {
        keyword: query.trim(),
        oppStatuses: 'posted',
        rows: Math.min(limit, 25),
        offset: 0,
      };

      if (agencyCode) {
        body.agencies = agencyCode;   // must be a plain string, not an array
      }

      const response = await axios.post(`${this.baseUrl}/search2`, body, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        timeout: 12000,
      });

      // Actual response: { errorcode, msg, data: { hitCount, oppHits: [...] } }
      const raw: any[] =
        response.data?.data?.oppHits ??
        response.data?.oppHits ??
        response.data?.opportunities ??
        [];

      return raw.map((o) => {
        // Field names from actual API: id, number, title, agency, agencyCode, openDate, closeDate, oppStatus
        const id = o.id ?? o.opportunityID ?? o.opportunityId ?? '';
        return {
          opportunityId: String(id),
          opportunityNumber: o.number ?? o.opportunityNumber ?? o.oppNumber ?? '',
          title: o.title ?? o.opportunityTitle ?? '',
          agency: o.agency ?? o.agencyName ?? o.agencyCode ?? '',
          closeDate: normalizeDate(o.closeDate ?? o.close_date),
          openDate: normalizeDate(o.openDate ?? o.open_date),
          status: o.oppStatus ?? o.opportunityStatus ?? o.status ?? '',
          description: o.synopsis?.synopsisDesc ?? o.description ?? null,
          url: id ? `https://www.grants.gov/search-results-detail/${id}` : null,
        };
      });
    } catch (error: any) {
      this.logger.error(`Grants.gov search failed: ${error.message}`);
      return [];
    }
  }
}
