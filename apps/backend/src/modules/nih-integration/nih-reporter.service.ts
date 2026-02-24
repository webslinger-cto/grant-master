import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

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

@Injectable()
export class NihReporterService {
  private readonly logger = new Logger(NihReporterService.name);
  private readonly baseUrl = 'https://api.reporter.nih.gov/v2';

  async searchProjects(
    query: string,
    activityCodes: string[] = [],
    limit = 10,
  ): Promise<NihProject[]> {
    try {
      const criteria: Record<string, any> = {
        include_active_projects: true,
      };

      if (query.trim()) {
        criteria.advanced_text_search = {
          operator: 'and',
          search_text: query.trim(),
          search_field: 'all',
        };
      }

      if (activityCodes.length) {
        criteria.activity_codes = activityCodes;
      }

      const response = await axios.post(
        `${this.baseUrl}/projects/search`,
        {
          criteria,
          offset: 0,
          limit: Math.min(limit, 50),
          sort_field: 'project_start_date',
          sort_order: 'desc',
        },
        {
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          timeout: 12000,
        },
      );

      const results: any[] = response.data?.results ?? [];

      return results.map((p) => ({
        projectNumber: p.project_num ?? '',
        title: p.project_title ?? '',
        activityCode: p.activity_code ?? '',
        fiscalYear: p.fiscal_year ?? null,
        awardAmount: p.award_amount ?? null,
        startDate: p.project_start_date ?? null,
        endDate: p.project_end_date ?? null,
        organization: p.organization?.org_name ?? null,
        piName:
          p.principal_investigators?.length
            ? `${p.principal_investigators[0].first_name ?? ''} ${p.principal_investigators[0].last_name ?? ''}`.trim()
            : null,
        abstract: p.abstract_text ? p.abstract_text.substring(0, 400) : null,
      }));
    } catch (error: any) {
      this.logger.error(`NIH REPORTER search failed: ${error.message}`);
      return [];
    }
  }
}
