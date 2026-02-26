import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsArray, MaxLength } from 'class-validator';
import { ChatService } from './chat.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { GenerateSectionDto } from './dto/generate-section.dto';
import { ChatHistoryQueryDto } from './dto/chat-history.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

class ResolveCitationsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  content: string;
}

class SaveToDraftDto {
  @IsString()
  @IsNotEmpty()
  applicationId: string;

  @IsString()
  @IsNotEmpty()
  sectionKey: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  content: string;

  @IsOptional()
  @IsArray()
  preResolvedRefs?: any[];
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Send a chat message and get AI response
   * POST /chat/message
   */
  @Public() // Temporarily public for testing
  @Post('message')
  @HttpCode(HttpStatus.OK)
  async sendMessage(@Request() req, @Body() dto: CreateChatMessageDto) {
    // Use mock user ID for testing when no auth
    const userId = req.user?.id || '20000001-0000-0000-0000-000000000001';
    return this.chatService.sendMessage(userId, dto);
  }

  /**
   * Generate a specific grant section
   * POST /chat/generate-section
   */
  @Public() // Temporarily public for testing
  @Post('generate-section')
  @HttpCode(HttpStatus.OK)
  async generateSection(@Request() req, @Body() dto: GenerateSectionDto) {
    // Use mock user ID for testing when no auth
    const userId = req.user?.id || '20000001-0000-0000-0000-000000000001';
    return this.chatService.generateSection(userId, dto);
  }

  /**
   * Resolve citation markers in content via PubMed — no DB writes.
   * Used by frontend for eager (pre-save) citation preview.
   * POST /chat/resolve-citations
   */
  @Public()
  @Post('resolve-citations')
  @HttpCode(HttpStatus.OK)
  async resolveCitations(@Body() dto: ResolveCitationsDto) {
    return this.chatService.resolveForPreview(dto.content);
  }

  /**
   * Save a chat response as a draft section (no AI call)
   * POST /chat/save-to-draft
   */
  @Public()
  @Post('save-to-draft')
  @HttpCode(HttpStatus.OK)
  async saveToDraft(@Request() req, @Body() dto: SaveToDraftDto) {
    const userId = req.user?.id || '20000001-0000-0000-0000-000000000001';
    return this.chatService.saveToDraft(userId, dto);
  }

  /**
   * Get chat history for an application
   * GET /chat/history?applicationId=xxx&limit=50&offset=0
   */
  @Public() // Temporarily public for testing
  @Get('history')
  async getChatHistory(@Query() query: ChatHistoryQueryDto) {
    return this.chatService.getChatHistory(query.applicationId, query.limit);
  }
}
