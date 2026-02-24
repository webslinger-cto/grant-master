/**
 * Chat Service - API calls for AI chatbot
 */

import { api } from '../api';
import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  application_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: any;
  created_at: string;
}

export interface GenerateSection {
  applicationId: string;
  sectionKey: string;
  additionalContext?: Record<string, any>;
}

export interface SectionTemplate {
  id: string;
  grant_type: string;
  section_name: string;
  section_key: string;
  description: string;
  page_limit?: number;
  word_limit?: number;
  sort_order: number;
}

export interface GeneratedSection {
  id: string;
  application_id: string;
  section_template_id: string;
  section_name: string;
  version_number: number;
  content: string;
  status: 'draft' | 'under_review' | 'approved' | 'rejected';
  generated_by: string;
  created_at: string;
  updated_at: string;
}

class ChatService {
  private socket: Socket | null = null;

  /**
   * Send a chat message and get AI response
   */
  async sendMessage(applicationId: string, content: string): Promise<{ response: string; messageId: string }> {
    const response = await api.post<any>('/chat/message', {
      applicationId,
      content,
    });

    return {
      response: response.data.response,
      messageId: response.data.assistantMessage.id,
    };
  }

  /**
   * Get chat history for an application
   */
  async getChatHistory(applicationId: string, limit: number = 50): Promise<ChatMessage[]> {
    // api interceptor returns response.data (the full body), which TransformInterceptor wraps as { data, meta, errors }
    const body = await api.get<any>(`/chat/history?applicationId=${applicationId}&limit=${limit}`);
    const msgs: ChatMessage[] = body?.data ?? body ?? [];
    // Backend returns newest-first; reverse to chronological for display
    return msgs.slice().reverse();
  }

  /**
   * Generate a specific grant section
   */
  async generateSection(data: GenerateSection): Promise<GeneratedSection> {
    const response = await api.post<any>('/chat/generate-section', data);
    return response.data;
  }

  /**
   * Connect to WebSocket for streaming chat
   */
  connectWebSocket(onChunk: (text: string) => void, onDone: (data: any) => void, onError: (error: any) => void): void {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

    this.socket = io(`${wsUrl}/chat`, {
      transports: ['websocket'],
      reconnection: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
    });

    this.socket.on('chunk', ({ text }: { text: string }) => {
      onChunk(text);
    });

    this.socket.on('done', (data: any) => {
      onDone(data);
    });

    this.socket.on('error', (error: any) => {
      onError(error);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });
  }

  /**
   * Send message via WebSocket for streaming
   */
  streamMessage(applicationId: string, content: string, userId: string): void {
    if (!this.socket) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('stream-message', {
      applicationId,
      content,
      userId,
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Get available section templates
   */
  async getTemplates(grantType: string = 'NIH_R01'): Promise<SectionTemplate[]> {
    const response = await api.get<any>(`/generated-sections/meta/templates?grantType=${grantType}`);
    return response.data;
  }
}

export const chatService = new ChatService();
