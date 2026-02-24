import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CitationsController } from './citations.controller';
import { CitationsService } from './citations.service';
import { CitationFetcherService } from './citation-fetcher.service';
import { CitationFormatterService } from './citation-formatter.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [CitationsController],
  providers: [CitationsService, CitationFetcherService, CitationFormatterService],
  exports: [CitationsService],
})
export class CitationsModule {}
