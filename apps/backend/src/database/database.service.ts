import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Knex, knex } from 'knex';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private knexInstance: Knex;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.knexInstance = knex({
      client: 'pg',
      connection: this.configService.get('DATABASE_URL'),
      pool: {
        min: 2,
        max: 10,
      },
      migrations: {
        directory: './src/database/migrations',
        extension: 'ts',
      },
      seeds: {
        directory: './src/database/seeds',
        extension: 'ts',
      },
    });

    // Test connection
    try {
      await this.knexInstance.raw('SELECT 1');
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.knexInstance.destroy();
  }

  get db(): Knex {
    return this.knexInstance;
  }

  // Helper methods for common operations
  async transaction<T>(callback: (trx: Knex.Transaction) => Promise<T>): Promise<T> {
    return this.knexInstance.transaction(callback);
  }
}
