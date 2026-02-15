import * as dotenv from 'dotenv';
import { knex, Knex } from 'knex';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '.env') });

async function verifyData() {
  console.log('🔍 Verifying seed data...\n');

  const db: Knex = knex({
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: { min: 1, max: 2 },
  });

  try {
    // Count records in each table
    const tables = [
      'organizations',
      'users',
      'roles',
      'user_roles',
      'funding_sources',
      'programs',
      'opportunities',
      'projects',
      'applications',
      'stage_history',
      'tasks',
      'task_dependencies',
    ];

    console.log('📊 Record counts:\n');

    for (const table of tables) {
      const result = await db(table).count('* as count');
      const count = result[0].count;
      console.log(`   ${table.padEnd(25)} ${count} records`);
    }

    console.log('\n✅ Sample data verification:\n');

    // Show some sample data
    const org = await db('organizations').first();
    console.log(`   Organization: ${org.name}`);

    const userCount = await db('users').count('* as count');
    console.log(`   Users: ${userCount[0].count} users created`);

    const appCount = await db('applications').count('* as count');
    console.log(`   Applications: ${appCount[0].count} applications created`);

    const taskCount = await db('tasks').count('* as count');
    console.log(`   Tasks: ${taskCount[0].count} tasks created`);

    console.log('\n🎉 Seed data verification complete!');
  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await db.destroy();
  }
}

verifyData();
