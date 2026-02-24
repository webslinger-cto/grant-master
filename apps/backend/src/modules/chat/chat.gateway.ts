import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@/database/database.service';
import Anthropic from '@anthropic-ai/sdk';

/**
 * WebSocket Gateway for streaming AI chat responses
 *
 * This allows real-time, ChatGPT-like streaming of responses
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly anthropic: Anthropic;
  private readonly defaultModel: string;
  private readonly maxTokensPerRequest: number;

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    this.anthropic = new Anthropic({ apiKey });
    this.defaultModel = this.configService.get<string>('AI_DEFAULT_MODEL', 'claude-3-5-sonnet-20241022');
    this.maxTokensPerRequest = parseInt(this.configService.get<string>('AI_MAX_TOKENS_PER_REQUEST', '4000'));
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Stream chat message with real-time response
   *
   * Client emits: { applicationId, content, userId }
   * Server emits back:
   *  - 'chunk': text chunk as it arrives
   *  - 'done': final message when complete
   *  - 'error': if something goes wrong
   */
  @SubscribeMessage('stream-message')
  async handleStreamMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { applicationId: string; content: string; userId: string },
  ) {
    const { applicationId, content, userId } = data;

    try {
      // Save user message (best-effort — don't abort if table missing)
      let userMessageId: string | null = null;
      try {
        const [userMessage] = await this.db.db('chat_messages')
          .insert({
            application_id: applicationId,
            user_id: userId,
            role: 'user',
            content: content,
          })
          .returning('*');
        userMessageId = userMessage?.id ?? null;
      } catch (dbErr) {
        this.logger.warn(`Could not save user message (DB): ${(dbErr as Error).message}`);
      }

      // Get application context (gracefully degrade if not found)
      const application = await this.db.db('applications')
        .select(
          'applications.*',
          'projects.name as project_name',
          'opportunities.title as opportunity_title',
        )
        .leftJoin('projects', 'applications.project_id', 'projects.id')
        .leftJoin('opportunities', 'applications.opportunity_id', 'opportunities.id')
        .where('applications.id', applicationId)
        .first()
        .catch(() => null);

      if (!application) {
        this.logger.warn(`Application not found: ${applicationId} — proceeding without context`);
      }

      const applicationContext = application ? `
Application: ${application.internal_name}
Project: ${application.project_name || 'N/A'}
Opportunity: ${application.opportunity_title || 'N/A'}
Amount Requested: ${application.amount_requested ? `$${application.amount_requested.toLocaleString()}` : 'N/A'}
Current Stage: ${application.current_stage}
`.trim() : 'No application context available.';

      // Get recent chat history (best-effort)
      let history: any[] = [];
      try {
        history = await this.db.db('chat_messages')
          .select('*')
          .where('application_id', applicationId)
          .orderBy('created_at', 'desc')
          .limit(10);
      } catch {
        // chat_messages table may not exist yet
      }

      const messages = history.reverse().map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      messages.push({ role: 'user', content });

      const systemPrompt = `You are an expert NIH grant writing assistant. You help users write compelling grant applications.

Application Context:
${applicationContext}

Be professional, concise, and helpful.`;

      // Stream response from Anthropic
      const stream = await this.anthropic.messages.stream({
        model: this.defaultModel,
        max_tokens: this.maxTokensPerRequest,
        system: systemPrompt,
        messages: messages as any,
      });

      let fullResponse = '';
      let inputTokens = 0;
      let outputTokens = 0;

      // Listen to stream events
      stream.on('text', (text) => {
        fullResponse += text;
        client.emit('chunk', { text });
      });

      stream.on('message', (message) => {
        if (message.usage) {
          inputTokens = message.usage.input_tokens || 0;
          outputTokens = message.usage.output_tokens || 0;
        }
      });

      // Wait for stream to complete
      await stream.finalMessage();

      // Save assistant message (best-effort)
      let assistantMessageId = `local-${Date.now()}`;
      const totalTokens = inputTokens + outputTokens;
      try {
        const [assistantMessage] = await this.db.db('chat_messages')
          .insert({
            application_id: applicationId,
            user_id: userId,
            role: 'assistant',
            content: fullResponse,
            parent_message_id: userMessageId,
            metadata: {
              model: this.defaultModel,
              tokens: {
                input: inputTokens,
                output: outputTokens,
                total: totalTokens,
              },
            },
          })
          .returning('*');
        assistantMessageId = assistantMessage?.id ?? assistantMessageId;

        // Track usage (ignore if table missing)
        const costUsd = (totalTokens / 1_000_000) * 9;
        await this.db.db('ai_usage_tracking').insert({
          user_id: userId,
          application_id: applicationId,
          action_type: 'chat_message_stream',
          tokens_used: totalTokens,
          cost_usd: costUsd,
          model: this.defaultModel,
        }).catch(() => {});
      } catch (dbErr) {
        this.logger.warn(`Could not save assistant message (DB): ${(dbErr as Error).message}`);
      }

      // Notify client of completion
      client.emit('done', {
        messageId: assistantMessageId,
        content: fullResponse,
        tokens: { input: inputTokens, output: outputTokens, total: totalTokens },
      });

      this.logger.log(`Streamed message completed: ${totalTokens} tokens used`);
    } catch (error) {
      this.logger.error('Stream message error:', error);
      client.emit('error', { message: 'Failed to stream message' });
    }
  }
}
