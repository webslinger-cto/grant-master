import * as dotenv from 'dotenv';
import { knex, Knex } from 'knex';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...\n');

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env file');
    process.exit(1);
  }

  // Mask password in URL for display
  const maskedUrl = databaseUrl.replace(/:([^@]+)@/, ':****@');
  console.log(`📊 Connecting to: ${maskedUrl}\n`);

  let db: Knex | null = null;

  try {
    // Create Knex instance
    db = knex({
      client: 'pg',
      connection: databaseUrl,
      pool: {
        min: 1,
        max: 2,
      },
    });

    // Test 1: Basic connectivity
    console.log('Test 1: Basic connectivity...');
    await db.raw('SELECT 1 as result');
    console.log('✅ Basic connectivity successful\n');

    // Test 2: Check PostgreSQL version
    console.log('Test 2: Checking PostgreSQL version...');
    const versionResult = await db.raw('SELECT version()');
    const version = versionResult.rows[0].version;
    console.log(`✅ PostgreSQL Version: ${version.split(',')[0]}\n`);

    // Test 3: Check current database
    console.log('Test 3: Checking current database...');
    const dbResult = await db.raw('SELECT current_database()');
    const currentDb = dbResult.rows[0].current_database;
    console.log(`✅ Connected to database: ${currentDb}\n`);

    // Test 4: Check if we can list tables
    console.log('Test 4: Listing existing tables...');
    const tablesResult = await db.raw(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    if (tablesResult.rows.length > 0) {
      console.log(`✅ Found ${tablesResult.rows.length} table(s):`);
      tablesResult.rows.forEach((row: any) => {
        console.log(`   - ${row.tablename}`);
      });
    } else {
      console.log('⚠️  No tables found in the database (this is normal for a new database)');
    }

    console.log('\n🎉 All database connection tests passed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run migrations: npm run migrate');
    console.log('   2. Run seeds: npm run seed');
    console.log('   3. Start the backend: npm run dev');

  } catch (error: any) {
    console.error('\n❌ Database connection failed!');
    console.error('\nError details:');
    console.error(`   Message: ${error.message}`);

    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }

    console.error('\n💡 Troubleshooting tips:');
    console.error('   1. Verify your DATABASE_URL in .env file');
    console.error('   2. Check if your Supabase project is active');
    console.error('   3. Verify your database password is correct');
    console.error('   4. Check if your IP is allowed in Supabase settings');
    console.error('   5. Ensure port 5432 is not blocked by firewall');

    process.exit(1);
  } finally {
    // Clean up connection
    if (db) {
      await db.destroy();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testDatabaseConnection();
