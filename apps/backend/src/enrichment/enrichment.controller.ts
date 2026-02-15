import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { EnrichmentService } from './enrichment.service';

@Controller('enrichment')
export class EnrichmentController {
  private enrichmentService: EnrichmentService;

  constructor() {
    this.enrichmentService = new EnrichmentService();
  }

  @Post('enrich-opportunity')
  @HttpCode(HttpStatus.OK)
  async enrichOpportunity(@Body() body: { grantName: string; url?: string }) {
    const { grantName, url } = body;

    if (url) {
      // Enrich from specific URL
      return await this.enrichmentService.enrichFromUrl(url);
    } else {
      // Auto-find and enrich
      return await this.enrichmentService.enrichOpportunity(grantName);
    }
  }
}
