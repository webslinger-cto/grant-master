import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { PubMedService } from './pubmed.service';

@Module({
  imports: [ConfigModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, PubMedService],
  exports: [ChatService, PubMedService],
})
export class ChatModule {}
