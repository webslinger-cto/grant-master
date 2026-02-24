'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';
import { chatService, ChatMessage } from '@/lib/services/chat.service';

interface ChatSidebarProps {
  applicationId: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatSidebar({ applicationId, userId, isOpen, onClose }: ChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history when sidebar opens
  useEffect(() => {
    if (isOpen && applicationId) {
      loadChatHistory();
    }
  }, [isOpen, applicationId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Connect WebSocket
  useEffect(() => {
    if (isOpen) {
      chatService.connectWebSocket(
        (text) => {
          // Handle streaming chunk
          setStreamingMessage((prev) => prev + text);
        },
        (data) => {
          // Handle completion
          const assistantMessage: ChatMessage = {
            id: data.messageId,
            application_id: applicationId,
            user_id: userId,
            role: 'assistant',
            content: data.content,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setStreamingMessage('');
          setIsStreaming(false);
          setIsLoading(false);
        },
        (error) => {
          // Handle error
          console.error('WebSocket error:', error);
          setIsStreaming(false);
          setIsLoading(false);
        }
      );

      return () => {
        chatService.disconnectWebSocket();
      };
    }
  }, [isOpen, applicationId, userId]);

  const loadChatHistory = async () => {
    try {
      const history = await chatService.getChatHistory(applicationId);
      setMessages(history);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      application_id: applicationId,
      user_id: userId,
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingMessage('');

    try {
      // Use streaming WebSocket
      chatService.streamMessage(applicationId, userMessage.content, userId);
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: 'Generate Specific Aims', sectionKey: 'specific_aims' },
    { label: 'Generate Significance', sectionKey: 'significance' },
    { label: 'Generate Innovation', sectionKey: 'innovation' },
    { label: 'Generate Approach', sectionKey: 'approach' },
  ];

  const handleQuickAction = (sectionKey: string) => {
    setInput(`Generate the ${sectionKey.replace('_', ' ')} section for this grant application.`);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gm-navy" />
          <h2 className="text-lg font-semibold text-gray-900">GrantsMaster AI Assistant</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <p className="text-xs font-medium text-gray-600 mb-2">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.sectionKey}
              onClick={() => handleQuickAction(action.sectionKey)}
              className="text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gm-cyan-soft hover:border-gm-cyan-soft transition-colors text-left"
              disabled={isLoading}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !streamingMessage && (
          <div className="text-center text-gray-400 mt-8">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Ask me anything about your grant application!</p>
            <p className="text-xs mt-2">I can help you write sections, provide feedback, and answer questions.</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-gm-navy text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {new Date(message.created_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {streamingMessage && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 text-gray-900">
              <p className="text-sm whitespace-pre-wrap">{streamingMessage}</p>
              <div className="flex items-center gap-1 mt-1">
                <Loader2 className="w-3 h-3 animate-spin text-gm-navy" />
                <span className="text-xs text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gm-cyan resize-none"
            rows={3}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-gm-navy text-white rounded-lg hover:bg-gm-navy-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
