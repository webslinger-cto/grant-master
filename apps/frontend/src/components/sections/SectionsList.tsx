'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Plus, Download, Edit, Trash2, Loader2 } from 'lucide-react';
import { GeneratedSection } from '@/lib/services/chat.service';
import { sectionsService } from '@/lib/services/sections.service';
import { SectionEditor } from './SectionEditor';
import { chatService } from '@/lib/services/chat.service';

interface SectionsListProps {
  applicationId: string;
  onGenerateSection?: (sectionKey: string) => void;
}

export function SectionsList({ applicationId, onGenerateSection }: SectionsListProps) {
  const [sections, setSections] = useState<GeneratedSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<GeneratedSection | null>(null);
  const [showGenerateMenu, setShowGenerateMenu] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    loadSections();
    loadTemplates();
  }, [applicationId]);

  const loadSections = async () => {
    setIsLoading(true);
    try {
      const data = await sectionsService.getByApplicationId(applicationId);
      setSections(data);
    } catch (error) {
      console.error('Failed to load sections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await chatService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      await sectionsService.delete(id);
      setSections(sections.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Failed to delete section:', error);
      alert('Failed to delete section');
    }
  };

  const handleExport = async () => {
    try {
      const document = await sectionsService.exportApplication(applicationId);

      // Create a download link
      const blob = new Blob([document], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grant-application-${applicationId}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export application');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gm-navy" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Generated Sections</h2>
        <div className="flex items-center gap-2">
          {sections.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export All
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setShowGenerateMenu(!showGenerateMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-gm-navy text-white rounded-lg hover:bg-gm-navy-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              Generate Section
            </button>

            {/* Generate Menu Dropdown */}
            {showGenerateMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-2 max-h-96 overflow-y-auto">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        onGenerateSection?.(template.section_key);
                        setShowGenerateMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <p className="font-medium text-sm text-gray-900">{template.section_name}</p>
                      {template.page_limit && (
                        <p className="text-xs text-gray-500 mt-1">{template.page_limit} pages max</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sections List */}
      {sections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-2">No sections generated yet</p>
          <p className="text-sm text-gray-500">Click "Generate Section" to create your first section</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sections.map((section) => (
            <div
              key={section.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{section.section_name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(section.status)}`}>
                      {section.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Version {section.version_number} • Updated {new Date(section.updated_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedSection(section)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(section.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              {/* Content Preview */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-700 line-clamp-3">{section.content}</p>
              </div>

              {/* Metadata */}
              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                <span>{section.content.split(/\s+/).length} words</span>
                <span>•</span>
                <span>{section.content.length} characters</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section Editor Modal */}
      {selectedSection && (
        <SectionEditor
          section={selectedSection}
          onClose={() => setSelectedSection(null)}
          onSave={(updated) => {
            setSections(sections.map((s) => (s.id === updated.id ? updated : s)));
            setSelectedSection(null);
          }}
        />
      )}
    </div>
  );
}
