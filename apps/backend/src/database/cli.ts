#!/usr/bin/env node
import { knex, Knex } from 'knex';
import knexConfig from './knexfile';

const db: Knex = knex(knexConfig);

const command = process.argv[2];

async function runMigrations() {
  try {
    console.log('🔄 Running migrations...\n');
    const [batchNo, log] = await db.migrate.latest();

    if (log.length === 0) {
      console.log('✅ Already up to date');
    } else {
      console.log(`✅ Batch ${batchNo} run: ${log.length} migrations`);
      log.forEach((migration) => {
        console.log(`   - ${migration}`);
      });
    }
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

async function rollbackMigrations() {
  try {
    console.log('🔄 Rolling back migrations...\n');
    const [batchNo, log] = await db.migrate.rollback();

    if (log.length === 0) {
      console.log('✅ Already at the base migration');
    } else {
      console.log(`✅ Batch ${batchNo} rolled back: ${log.length} migrations`);
      log.forEach((migration) => {
        console.log(`   - ${migration}`);
      });
    }
  } catch (error: any) {
    console.error('❌ Rollback failed:', error.message);
    throw error;
  }
}

async function makeMigration() {
  const name = process.argv[3];
  if (!name) {
    console.error('❌ Please provide a migration name');
    console.log('Usage: npm run migrate:create <migration-name>');
    process.exit(1);
  }

  try {
    console.log(`🔄 Creating migration: ${name}...\n`);
    const migrationPath = await db.migrate.make(name);
    console.log(`✅ Created migration: ${migrationPath}`);
  } catch (error: any) {
    console.error('❌ Migration creation failed:', error.message);
    throw error;
  }
}

async function runSeeds() {
  try {
    console.log('🔄 Running seeds...\n');
    const [log] = await db.seed.run();

    if (log.length === 0) {
      console.log('✅ No seed files to run');
    } else {
      console.log(`✅ Ran ${log.length} seed files`);
      log.forEach((seed) => {
        console.log(`   - ${seed}`);
      });
    }
  } catch (error: any) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  }
}

async function main() {
  try {
    switch (command) {
      case 'migrate:latest':
        await runMigrations();
        break;
      case 'migrate:rollback':
        await rollbackMigrations();
        break;
      case 'migrate:make':
        await makeMigration();
        break;
      case 'seed:run':
        await runSeeds();
        break;
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('\nAvailable commands:');
        console.log('  migrate:latest   - Run all pending migrations');
        console.log('  migrate:rollback - Rollback the last batch of migrations');
        console.log('  migrate:make     - Create a new migration file');
        console.log('  seed:run         - Run seed files');
        process.exit(1);
    }
  } catch (error) {
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

main();
