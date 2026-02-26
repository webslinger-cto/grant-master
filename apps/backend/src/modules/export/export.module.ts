import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@/database/database.module';
import { GoogleDocsService } from './google-docs.service';
import { ExportController } from './export.controller';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [ExportController],
  providers: [GoogleDocsService],
  exports: [GoogleDocsService],
})
export class ExportModule {}
