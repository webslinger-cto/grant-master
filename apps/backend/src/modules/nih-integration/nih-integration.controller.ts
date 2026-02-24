import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { NihReporterService } from './nih-reporter.service';
import { GrantsGovService } from './grants-gov.service';
import { SimplerGrantsGovService } from './simpler-grants-gov.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('nih')
@UseGuards(JwtAuthGuard)
export class NihIntegrationController {
  constructor(
    private readonly nihReporter: NihReporterService,
    private readonly grantsGov: GrantsGovService,
    private readonly simplerGrantsGov: SimplerGrantsGovService,
  ) {}

  /**
   * GET /nih/opportunities?q=R01&agency=HHS-NIH11&limit=10
   * Search simpler.grants.gov for rich opportunity data (award ceiling, funding, eligibility).
   * Falls back to legacy Grants.gov API if simpler.grants.gov returns no results.
   */
  @Public()
  @Get('opportunities')
  async searchOpportunities(
    @Query('q') query = '',
    @Query('agency') agency?: string,
    @Query('limit') limit?: string,
  ) {
    const n = limit ? parseInt(limit, 10) : 10;

    // Try simpler.grants.gov first (richer data)
    const rich = await this.simplerGrantsGov.searchOpportunities(
      query,
      agency ?? '',
      n,
    );
    if (rich.length > 0) return rich;

    // Fall back to legacy Grants.gov
    return this.grantsGov.searchOpportunities(query, agency ?? '', n);
  }

  /**
   * GET /nih/opportunities/enrich?number=PAR-25-043
   * Fetch rich detail for a single opportunity by number via simpler.grants.gov.
   * Returns null if not found.
   */
  @Public()
  @Get('opportunities/enrich')
  async enrichOpportunity(@Query('number') opportunityNumber: string) {
    if (!opportunityNumber) return null;
    const results = await this.simplerGrantsGov.searchOpportunities(
      opportunityNumber,
      '',
      5,
    );
    const match = results.find(
      (r) =>
        r.opportunityNumber.toLowerCase() === opportunityNumber.toLowerCase(),
    );
    return match ?? null;
  }

  /**
   * GET /nih/projects?q=cardiac+imaging&codes=R01,R21&limit=10
   * Search NIH REPORTER for funded projects
   */
  @Public()
  @Get('projects')
  async searchProjects(
    @Query('q') query = '',
    @Query('codes') codes?: string,
    @Query('limit') limit?: string,
  ) {
    const activityCodes = codes ? codes.split(',').map((c) => c.trim()) : [];
    return this.nihReporter.searchProjects(
      query,
      activityCodes,
      limit ? parseInt(limit, 10) : 10,
    );
  }
}
