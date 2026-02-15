import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';

// Modules
import { IdentityModule } from './modules/identity/identity.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { PipelineModule } from './modules/pipeline/pipeline.module';
import { WorkMgmtModule } from './modules/work-mgmt/work-mgmt.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { DocsModule } from './modules/docs/docs.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { PostAwardModule } from './modules/post-award/post-award.module';
import { ForecastingModule } from './modules/forecasting/forecasting.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { PartnersModule } from './modules/partners/partners.module';
import { DatabaseModule } from './database/database.module';
import { EnrichmentModule } from './enrichment/enrichment.module';

// Conditional imports based on environment
const conditionalImports: DynamicModule[] = [];

// Only include BullMQ if Redis URL is provided
if (process.env.REDIS_URL) {
  conditionalImports.push(
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_URL?.split('://')[1]?.split(':')[0] || 'localhost',
        port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379'),
      },
    }),
  );
}

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Event system
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 10,
    }),

    // Conditional imports (Redis/Queue system if available)
    ...conditionalImports,

    // Database
    DatabaseModule,

    // Core modules
    IdentityModule,
    CatalogModule,
    PipelineModule,
    WorkMgmtModule,
    BudgetsModule,
    DocsModule,
    ReviewsModule,
    PostAwardModule,
    ForecastingModule,
    NotificationsModule,
    AuditModule,
    PartnersModule,
    EnrichmentModule,
  ],
})
export class AppModule {}
