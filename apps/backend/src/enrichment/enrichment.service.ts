import axios from 'axios';
import * as cheerio from 'cheerio';

export interface EnrichmentResult {
  success: boolean;
  data?: {
    description?: string;
    eligibility?: string;
    award_amount?: string;
    deadline?: string;
    website_url?: string;
    additional_info?: string;
  };
  error?: string;
  source_url?: string;
}

export class EnrichmentService {
  private readonly searchEngineUrl = 'https://www.google.com/search';

  /**
   * Enrich grant opportunity data by searching and scraping official sources
   */
  async enrichOpportunity(grantName: string): Promise<EnrichmentResult> {
    try {
      console.log(`🔍 Starting enrichment for: ${grantName}`);

      // Step 1: Search for the grant's official page
      const officialUrl = await this.findOfficialUrl(grantName);

      if (!officialUrl) {
        return {
          success: false,
          error: 'Could not find official grant page',
        };
      }

      console.log(`📍 Found official URL: ${officialUrl}`);

      // Step 2: Scrape the official page
      const scrapedData = await this.scrapeGrantPage(officialUrl);

      return {
        success: true,
        data: scrapedData,
        source_url: officialUrl,
      };
    } catch (error: any) {
      console.error('❌ Enrichment failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Find the official URL for a grant program
   */
  private async findOfficialUrl(grantName: string): Promise<string | null> {
    try {
      // Known grant websites mapping
      const knownUrls: Record<string, string> = {
        'AHRQ Digital Health': 'https://digital.ahrq.gov/ahrq-digital-healthcare-research-funding-opportunities',
        'NIH SBIR/STTR': 'https://grants.nih.gov/grants/funding/sbir.htm',
        'NSF Seed Fund': 'https://seedfund.nsf.gov/',
        'ARPA-H': 'https://arpa-h.gov/research-and-funding',
        'BARDA DRIVe': 'https://www.medicalcountermeasures.gov/barda/drive/',
        'PCORI': 'https://www.pcori.org/funding-opportunities',
        'HRSA Telehealth': 'https://www.hrsa.gov/grants/find-funding',
        'FCC Connected Care': 'https://www.fcc.gov/wireline-competition/telecommunications-access-policy-division/connected-care-pilot-program',
        'DoD CDMRP': 'https://cdmrp.health.mil/',
      };

      // Check if we have a known URL
      for (const [key, url] of Object.entries(knownUrls)) {
        if (grantName.includes(key) || key.includes(grantName)) {
          return url;
        }
      }

      // If not found in known URLs, try Google search
      const searchQuery = `${grantName} official funding opportunity site:gov OR site:mil`;
      console.log(`🔎 Searching: ${searchQuery}`);

      // For MVP, return null and suggest manual URL entry
      // In production, you could implement Google Custom Search API
      return null;
    } catch (error) {
      console.error('Error finding official URL:', error);
      return null;
    }
  }

  /**
   * Scrape grant information from the official page
   */
  private async scrapeGrantPage(url: string): Promise<any> {
    try {
      console.log(`🕷️ Scraping: ${url}`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const scrapedData: any = {
        website_url: url,
      };

      // Generic extraction patterns
      // Description
      const descriptionSelectors = [
        'meta[name="description"]',
        'meta[property="og:description"]',
        '.description',
        '#description',
        'p:contains("Description")',
      ];

      for (const selector of descriptionSelectors) {
        const desc = $(selector).first();
        if (desc.length) {
          scrapedData.description = desc.attr('content') || desc.text().trim();
          if (scrapedData.description) break;
        }
      }

      // Eligibility
      const eligibilityText = this.extractTextByKeywords($, [
        'eligibility',
        'eligible',
        'requirements',
        'who can apply',
      ]);
      if (eligibilityText) {
        scrapedData.eligibility = eligibilityText;
      }

      // Award Amount
      const awardText = this.extractTextByKeywords($, [
        'award amount',
        'funding amount',
        'grant amount',
        'budget',
      ]);
      if (awardText) {
        scrapedData.award_amount = awardText;
      }

      // Deadline
      const deadlineText = this.extractTextByKeywords($, [
        'deadline',
        'due date',
        'submission date',
        'closing date',
      ]);
      if (deadlineText) {
        scrapedData.deadline = deadlineText;
      }

      // Get main content for additional info
      const mainContent = $('main').text().trim() || $('article').text().trim() || $('body').text().trim();
      if (mainContent && mainContent.length > 200) {
        scrapedData.additional_info = mainContent.substring(0, 1000) + '...';
      }

      console.log('✅ Scraping complete');
      return scrapedData;
    } catch (error: any) {
      console.error('Error scraping page:', error.message);
      throw new Error(`Failed to scrape page: ${error.message}`);
    }
  }

  /**
   * Helper to extract text by keywords
   */
  private extractTextByKeywords($: cheerio.CheerioAPI, keywords: string[]): string | null {
    for (const keyword of keywords) {
      // Try headers
      const header = $(`h1, h2, h3, h4, h5, h6`).filter((_, el) => {
        return $(el).text().toLowerCase().includes(keyword);
      });

      if (header.length) {
        let nextElem = header.next();
        let text = '';
        // Get next few elements
        for (let i = 0; i < 3 && nextElem.length; i++) {
          text += ' ' + nextElem.text().trim();
          nextElem = nextElem.next();
        }
        if (text.trim()) {
          return text.trim().substring(0, 500);
        }
      }

      // Try paragraphs
      const para = $('p').filter((_, el) => {
        const text = $(el).text().toLowerCase();
        return text.includes(keyword) && text.length > 50;
      }).first();

      if (para.length) {
        return para.text().trim().substring(0, 500);
      }
    }

    return null;
  }

  /**
   * Test the enrichment with a specific URL
   */
  async enrichFromUrl(url: string): Promise<EnrichmentResult> {
    try {
      console.log(`🔍 Enriching from URL: ${url}`);

      const scrapedData = await this.scrapeGrantPage(url);

      return {
        success: true,
        data: scrapedData,
        source_url: url,
      };
    } catch (error: any) {
      console.error('❌ Enrichment failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
