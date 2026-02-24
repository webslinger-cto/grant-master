import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface RichOpportunity {
  opportunityId: string;
  opportunityNumber: string;
  title: string;
  agency: string;
  agencyCode: string;
  closeDate: string | null;
  openDate: string | null;
  status: string;
  description: string | null;
  url: string | null;
  // Rich fields from simpler.grants.gov
  awardCeiling: number | null;
  awardFloor: number | null;
  estimatedTotalProgramFunding: number | null;
  expectedNumberOfAwards: number | null;
  eligibilitySummary: string | null;
  fundingCategories: string[];
  fundingInstruments: string[];
  isCostSharing: boolean | null;
}

function toIsoDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.substring(0, 10);
  // MM/DD/YYYY
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, m, d, y] = slash;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return raw;
}

function stripHtml(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return raw
    .replace(/<[^>]+>/g, ' ')   // remove all tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim() || null;
}

function toInt(val: any): number | null {
  if (val === null || val === undefined) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

@Injectable()
export class SimplerGrantsGovService {
  private readonly logger = new Logger(SimplerGrantsGovService.name);
  private readonly baseUrl = 'https://api.simpler.grants.gov/v1';

  constructor(private readonly config: ConfigService) {}

  async searchOpportunities(
    query: string,
    agencyCode = '',
    limit = 10,
  ): Promise<RichOpportunity[]> {
    const apiKey = this.config.get<string>('SIMPLER_GRANTS_API_KEY');
    if (!apiKey) {
      this.logger.warn('SIMPLER_GRANTS_API_KEY not set — skipping');
      return [];
    }

    try {
      const body: Record<string, any> = {
        query: query.trim() || undefined,
        filters: {
          opportunity_status: { one_of: ['posted'] },
        },
        pagination: {
          page_offset: 1,
          page_size: Math.min(limit, 25),
          sort_order: [{ order_by: 'close_date', sort_direction: 'ascending' }],
        },
      };

      if (agencyCode) {
        body.filters.agency = { one_of: [agencyCode] };
      }

      const response = await axios.post(
        `${this.baseUrl}/opportunities/search`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-API-Key': apiKey,
          },
          timeout: 15000,
        },
      );

      // Response shape: { data: [...], pagination_info: {...}, ... }
      const raw: any[] =
        response.data?.data ??
        response.data?.opportunities ??
        response.data?.items ??
        [];

      return raw.map((o): RichOpportunity => {
        // simpler.grants.gov: top-level has opportunity_id, opportunity_title,
        // agency_name, agency_code, opportunity_status, legacy_opportunity_id.
        // Funding, dates, eligibility, description are nested under summary.{}
        const id = String(o.opportunity_id ?? o.id ?? '');
        const legacyId = o.legacy_opportunity_id ?? null;
        const s = o.summary ?? {};

        return {
          opportunityId: id,
          opportunityNumber: o.opportunity_number ?? '',
          title: o.opportunity_title ?? o.title ?? '',
          agency: o.agency_name ?? o.agency?.agency_name ?? '',
          agencyCode: o.agency_code ?? o.agency?.agency_code ?? '',
          closeDate: toIsoDate(s.close_date ?? s.forecasted_close_date ?? null),
          openDate: toIsoDate(s.post_date ?? s.forecasted_post_date ?? null),
          status: o.opportunity_status ?? '',
          description: s.summary_description ?? s.description ?? null,
          url: legacyId
            ? `https://www.grants.gov/search-results-detail/${legacyId}`
            : `https://simpler.grants.gov/opportunity/${id}`,
          // Funding (all live in summary.*)
          awardCeiling: toInt(s.award_ceiling),
          awardFloor: toInt(s.award_floor),
          estimatedTotalProgramFunding: toInt(s.estimated_total_program_funding),
          expectedNumberOfAwards: toInt(s.expected_number_of_awards),
          eligibilitySummary: stripHtml(s.applicant_eligibility_description),
          fundingCategories: Array.isArray(s.funding_categories)
            ? s.funding_categories.map((c: any) =>
                typeof c === 'string' ? c : (c?.value ?? String(c)),
              )
            : [],
          fundingInstruments: Array.isArray(s.funding_instruments)
            ? s.funding_instruments.map((i: any) =>
                typeof i === 'string' ? i : (i?.value ?? String(i)),
              )
            : [],
          isCostSharing: s.is_cost_sharing ?? null,
        };
      });
    } catch (error: any) {
      this.logger.error(
        `simpler.grants.gov search failed: ${error.message}`,
        error.response?.data ?? '',
      );
      return [];
    }
  }
}
