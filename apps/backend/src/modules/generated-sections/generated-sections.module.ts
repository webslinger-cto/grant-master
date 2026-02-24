import { Module } from '@nestjs/common';
import { GeneratedSectionsService } from './generated-sections.service';
import { GeneratedSectionsController } from './generated-sections.controller';

@Module({
  controllers: [GeneratedSectionsController],
  providers: [GeneratedSectionsService],
  exports: [GeneratedSectionsService],
})
export class GeneratedSectionsModule {}
