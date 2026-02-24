'use client';

/**
 * Example Integration Page - AI Assistant for Grant Applications
 *
 * This page demonstrates how to integrate the chatbot and section editor
 * into your application detail pages.
 */

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, FileText, BookOpen } from 'lucide-react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { SectionsList } from '@/components/sections/SectionsList';
import CitationManager from '@/components/citations/CitationManager';
import { chatService } from '@/lib/services/chat.service';

type TabType = 'sections' | 'citations';

export default function AIAssistantPage() {
  const params = useParams();
  const applicationId = params.id as string;

  // In a real app, you'd get userId from auth context
  const userId = '20000001-0000-0000-0000-000000000001'; // Example user ID

  const [activeTab, setActiveTab] = useState<TabType>('sections');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSection = async (sectionKey: string) => {
    setIsGenerating(true);
    try {
      await chatService.generateSection({
        applicationId,
        sectionKey,
      });

      // Refresh the sections list
      window.location.reload();
    } catch (error) {
      console.error('Failed to generate section:', error);
      alert('Failed to generate section');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">GrantsMaster AI Assistant</h1>
              <p className="text-gray-600 mt-1">Generate and manage grant application sections</p>
            </div>

            <button
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gm-navy text-white rounded-lg hover:bg-gm-navy-dark transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              Open AI Chat
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('sections')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'sections'
                  ? 'border-gm-navy text-gm-navy'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-5 h-5" />
              Grant Sections
            </button>
            <button
              onClick={() => setActiveTab('citations')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === 'citations'
                  ? 'border-gm-navy text-gm-navy'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              Citations & Bibliography
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'sections' && (
          <SectionsList
            applicationId={applicationId}
            onGenerateSection={handleGenerateSection}
          />
        )}

        {activeTab === 'citations' && (
          <CitationManager applicationId={applicationId} />
        )}
      </div>

      {/* Chat Sidebar */}
      <ChatSidebar
        applicationId={applicationId}
        userId={userId}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Generating Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-6 h-6 text-gm-navy animate-pulse" />
              <h3 className="text-lg font-semibold">Generating Section...</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Claude is writing your grant section. This may take a minute.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
