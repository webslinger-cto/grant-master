import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NihIntegrationController } from './nih-integration.controller';
import { NihReporterService } from './nih-reporter.service';
import { GrantsGovService } from './grants-gov.service';
import { SimplerGrantsGovService } from './simpler-grants-gov.service';

@Module({
  imports: [ConfigModule],
  controllers: [NihIntegrationController],
  providers: [NihReporterService, GrantsGovService, SimplerGrantsGovService],
  exports: [NihReporterService, GrantsGovService, SimplerGrantsGovService],
})
export class NihIntegrationModule {}
