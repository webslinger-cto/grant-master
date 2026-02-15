const XLSX = require('xlsx');
const knex = require('knex');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Database connection
const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: { min: 1, max: 2 },
});

async function importGrants() {
  try {
    console.log('📖 Reading Excel file...\n');

    // Read the Excel file
    const workbook = XLSX.readFile('/Users/abdulsar/Downloads/Grants Master Sheet.xlsx');
    const worksheet = workbook.Sheets['GrantsList'];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Found ${data.length} grant opportunities to import\n`);

    // First, let's get or create funding sources
    const fundingSourceMap = {};

    for (const row of data) {
      const grantProgram = row['Grant Program'];

      // Extract funding source from grant program name
      let fundingSourceName = 'Other';
      if (grantProgram.includes('NIH')) fundingSourceName = 'NIH';
      else if (grantProgram.includes('NSF')) fundingSourceName = 'NSF';
      else if (grantProgram.includes('ARPA-H')) fundingSourceName = 'ARPA-H';
      else if (grantProgram.includes('BARDA')) fundingSourceName = 'BARDA';
      else if (grantProgram.includes('DoD')) fundingSourceName = 'DoD';
      else if (grantProgram.includes('Gates')) fundingSourceName = 'Gates Foundation';
      else if (grantProgram.includes('Wellcome')) fundingSourceName = 'Wellcome Trust';

      if (!fundingSourceMap[fundingSourceName]) {
        // Check if funding source exists
        let fundingSource = await db('funding_sources')
          .where({ name: fundingSourceName })
          .first();

        if (!fundingSource) {
          // Create new funding source
          const [created] = await db('funding_sources')
            .insert({
              name: fundingSourceName,
              type: fundingSourceName.includes('NIH') || fundingSourceName.includes('NSF') ||
                    fundingSourceName.includes('ARPA') || fundingSourceName.includes('DoD') ||
                    fundingSourceName.includes('BARDA') ? 'federal' : 'foundation',
              website_url: getWebsiteUrl(fundingSourceName),
            })
            .returning('*');
          fundingSource = created;
        }

        fundingSourceMap[fundingSourceName] = fundingSource;
      }
    }

    console.log('✅ Funding sources ready\n');

    // Get a default user for created_by
    const defaultUser = await db('users').first();
    const userId = defaultUser?.id;

    // Import opportunities
    let importCount = 0;
    for (const row of data) {
      const grantProgram = row['Grant Program'];

      // Extract funding source
      let fundingSourceName = 'Other';
      if (grantProgram.includes('NIH')) fundingSourceName = 'NIH';
      else if (grantProgram.includes('NSF')) fundingSourceName = 'NSF';
      else if (grantProgram.includes('ARPA-H')) fundingSourceName = 'ARPA-H';
      else if (grantProgram.includes('BARDA')) fundingSourceName = 'BARDA';
      else if (grantProgram.includes('DoD')) fundingSourceName = 'DoD';
      else if (grantProgram.includes('Gates')) fundingSourceName = 'Gates Foundation';
      else if (grantProgram.includes('Wellcome')) fundingSourceName = 'Wellcome Trust';

      const fundingSource = fundingSourceMap[fundingSourceName];

      // Parse award size
      const awardSize = row['Typical Award Size'] || '';
      let minAward = null;
      let maxAward = null;

      // Try to extract dollar amounts
      const amounts = awardSize.match(/\$[\d,]+[kKmM]?/g);
      if (amounts) {
        amounts.forEach(amount => {
          const value = parseAwardAmount(amount);
          if (value) {
            if (!minAward || value < minAward) minAward = value;
            if (!maxAward || value > maxAward) maxAward = value;
          }
        });
      }

      // Check if opportunity already exists
      const existing = await db('opportunities')
        .where({ title: grantProgram })
        .first();

      if (existing) {
        console.log(`⚠️  Skipping existing opportunity: ${grantProgram}`);
        continue;
      }

      // Create opportunity
      const opportunity = {
        title: grantProgram,
        description: row['Best Fit Use Cases'] || '',
        eligibility: [
          row['Maturity Needed'] ? `Maturity: ${row['Maturity Needed']}` : '',
          row['Key Requirements'] ? `Requirements: ${row['Key Requirements']}` : ''
        ].filter(Boolean).join('\n'),
        min_award_amount: minAward,
        max_award_amount: maxAward,
        status: row['Current Status'] === 'Watchlist' ? 'upcoming' : 'open',
        metadata: JSON.stringify({
          filing_effort: row['Filing Effort'],
          timeline: row['Timeline (Prep → Decision)'],
          post_award_obligations: row['Post-Award Obligations'],
          financing_against_award: row['Financing Against Award?'],
          current_status: row['Current Status'],
          next_action: row['Next Action'],
          owner: row['Owner'],
        }),
        created_by: userId,
        posted_date: new Date(),
      };

      await db('opportunities').insert(opportunity);
      importCount++;

      console.log(`✅ Imported: ${grantProgram}`);
    }

    console.log(`\n🎉 Successfully imported ${importCount} grant opportunities!`);

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error(error);
  } finally {
    await db.destroy();
  }
}

function parseAwardAmount(amountStr) {
  // Remove $ and commas
  let value = amountStr.replace(/[$,]/g, '');

  // Check for k or M suffix
  if (value.toLowerCase().includes('k')) {
    return parseFloat(value) * 1000;
  } else if (value.toLowerCase().includes('m')) {
    return parseFloat(value) * 1000000;
  }

  return parseFloat(value);
}

function getWebsiteUrl(fundingSourceName) {
  const urls = {
    'NIH': 'https://www.nih.gov',
    'NSF': 'https://www.nsf.gov',
    'ARPA-H': 'https://arpa-h.gov',
    'BARDA': 'https://www.medicalcountermeasures.gov',
    'DoD': 'https://www.defense.gov',
    'Gates Foundation': 'https://www.gatesfoundation.org',
    'Wellcome Trust': 'https://wellcome.org',
  };
  return urls[fundingSourceName] || null;
}

// Run the import
importGrants();
