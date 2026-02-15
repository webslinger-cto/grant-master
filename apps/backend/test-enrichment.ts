import { EnrichmentService } from './src/enrichment/enrichment.service';

async function testEnrichment() {
  const service = new EnrichmentService();

  console.log('='.repeat(60));
  console.log('Testing AHRQ Digital Health Enrichment');
  console.log('='.repeat(60));

  // Test with known AHRQ URL
  const result = await service.enrichFromUrl(
    'https://digital.ahrq.gov/ahrq-digital-healthcare-research-funding-opportunities'
  );

  console.log('\n📊 Results:\n');
  console.log(JSON.stringify(result, null, 2));

  console.log('\n' + '='.repeat(60));
}

testEnrichment();
