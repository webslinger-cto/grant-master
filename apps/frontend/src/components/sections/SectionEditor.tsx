'use client';

import React, { useState, useEffect } from 'react';
import { Save, X, History, Check, AlertCircle, Clock, FileText } from 'lucide-react';
import { GeneratedSection } from '@/lib/services/chat.service';
import { sectionsService, UpdateSectionData } from '@/lib/services/sections.service';

interface SectionEditorProps {
  section: GeneratedSection;
  onClose: () => void;
  onSave: (updatedSection: GeneratedSection) => void;
}

export function SectionEditor({ section: initialSection, onClose, onSave }: SectionEditorProps) {
  const [section, setSection] = useState<GeneratedSection>(initialSection);
  const [content, setContent] = useState(initialSection.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versionHistory, setVersionHistory] = useState<GeneratedSection[]>([]);

  useEffect(() => {
    setIsModified(content !== section.content);
  }, [content, section.content]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updateData: UpdateSectionData = {
        content,
      };
      const updated = await sectionsService.update(section.id, updateData);
      setSection(updated);
      setIsModified(false);
      onSave(updated);
    } catch (error) {
      console.error('Failed to save section:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (status: 'draft' | 'under_review' | 'approved' | 'rejected') => {
    try {
      const updated = await sectionsService.update(section.id, { status });
      setSection(updated);
      onSave(updated);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    }
  };

  const loadVersionHistory = async () => {
    try {
      const history = await sectionsService.getVersionHistory(
        section.application_id,
        section.section_name
      );
      setVersionHistory(history);
      setShowVersionHistory(true);
    } catch (error) {
      console.error('Failed to load version history:', error);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      const restored = await sectionsService.setCurrentVersion(versionId);
      setSection(restored);
      setContent(restored.content);
      setShowVersionHistory(false);
      onSave(restored);
    } catch (error) {
      console.error('Failed to restore version:', error);
      alert('Failed to restore version');
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-4 h-4" />;
      case 'under_review':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <Check className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length;
  const charCount = content.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{section.section_name}</h2>
            <p className="text-sm text-gray-500 mt-1">Version {section.version_number}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(section.status)}`}>
              {getStatusIcon(section.status)}
              <span className="capitalize">{section.status.replace('_', ' ')}</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <button
              onClick={loadVersionHistory}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <History className="w-4 h-4" />
              Version History
            </button>

            <select
              value={section.status}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gm-cyan"
            >
              <option value="draft">Draft</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500">
              <span>{wordCount} words</span>
              <span className="mx-2">•</span>
              <span>{charCount} characters</span>
            </div>
            <button
              onClick={handleSave}
              disabled={!isModified || isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-gm-navy text-white rounded-lg hover:bg-gm-navy-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Content Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full min-h-[400px] p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gm-cyan font-mono text-sm"
            placeholder="Edit your section content here..."
          />
        </div>

        {/* Version History Modal */}
        {showVersionHistory && (
          <div className="absolute inset-0 bg-white rounded-lg p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
              <button
                onClick={() => setShowVersionHistory(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              {versionHistory.map((version) => (
                <div
                  key={version.id}
                  className={`p-4 border rounded-lg ${
                    version.is_current_version ? 'border-gm-navy bg-gm-cyan-soft' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">Version {version.version_number}</span>
                      {version.is_current_version && (
                        <span className="px-2 py-1 bg-gm-navy text-white text-xs rounded-full">Current</span>
                      )}
                    </div>
                    {!version.is_current_version && (
                      <button
                        onClick={() => handleRestoreVersion(version.id)}
                        className="px-3 py-1 text-sm bg-gm-navy text-white rounded-lg hover:bg-gm-navy-dark transition-colors"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {new Date(version.created_at).toLocaleString()}
                  </p>
                  <div className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200 max-h-32 overflow-y-auto">
                    {version.content.substring(0, 200)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
