'use client';

import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, FileText } from 'lucide-react';
import { sectionsService } from '@/lib/services/sections.service';
import type { GeneratedSection } from '@/lib/services/chat.service';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  under_review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
};

interface Props {
  applicationId: string | null;
  refreshTick: number;
}

export function DocumentPanel({ applicationId, refreshTick }: Props) {
  const [sections, setSections] = useState<GeneratedSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!applicationId) { setSections([]); return; }
    setLoading(true);
    sectionsService.getByApplicationId(applicationId)
      .then(setSections)
      .catch(() => setSections([]))
      .finally(() => setLoading(false));
  }, [applicationId, refreshTick]);

  const startEdit = (section: GeneratedSection) => {
    setEditingId(section.id);
    setEditContent(section.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      await sectionsService.update(id, { content: editContent });
      setSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, content: editContent } : s))
      );
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id: string, status: GeneratedSection['status']) => {
    await sectionsService.update(id, { status });
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  if (!applicationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-300 bg-white">
        <FileText className="w-10 h-10 mb-3" />
        <p className="text-sm text-gray-400">Select a grant to view its document</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-white">
        <FileText className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">No sections generated yet</p>
        <p className="text-xs text-gray-300 mt-1">Use AI Counsel to generate sections</p>
      </div>
    );
  }

  // Group and sort by version — keep only current versions
  const current = sections.filter((s) => {
    // Check if there's a higher version of the same section_name
    const maxVersion = Math.max(
      ...sections
        .filter((x) => x.section_name === s.section_name)
        .map((x) => x.version_number)
    );
    return s.version_number === maxVersion;
  });

  // Sort by section_template_id (proxy for order) or alphabetically
  const sorted = [...current].sort((a, b) => a.section_name.localeCompare(b.section_name));

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-3xl mx-auto px-8 py-8">
        {/* Document title */}
        <div className="mb-8 pb-6 border-b border-gray-100">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Grant Application</p>
          <h1 className="text-2xl font-semibold text-gray-900">
            {sections[0]?.section_name ? 'Document Sections' : 'Grant Document'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {sorted.length} section{sorted.length !== 1 ? 's' : ''} ·{' '}
            {sorted.filter((s) => s.status === 'approved').length} approved
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {sorted.map((section) => (
            <section key={section.id} className="group">
              {/* Section header */}
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">{section.section_name}</h2>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <select
                    value={section.status}
                    onChange={(e) => changeStatus(section.id, e.target.value as GeneratedSection['status'])}
                    className="text-[10px] px-2 py-1 rounded-full border border-gray-200 focus:outline-none cursor-pointer"
                  >
                    <option value="draft">Draft</option>
                    <option value="under_review">In Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  {editingId !== section.id && (
                    <button
                      onClick={() => startEdit(section)}
                      className="text-[10px] px-2 py-1 text-gray-500 hover:text-gm-navy border border-gray-200 rounded-full hover:border-gm-cyan-soft transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Status badge — always visible */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[section.status] ?? STATUS_COLORS.draft}`}>
                  {section.status.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-gray-400">v{section.version_number}</span>
              </div>

              {/* Content */}
              {editingId === section.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full text-sm text-gray-800 leading-relaxed border border-gm-cyan-soft rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-gm-cyan-soft resize-none min-h-[200px]"
                    rows={12}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => saveEdit(section.id)}
                      disabled={saving}
                      className="text-xs px-3 py-1.5 bg-gm-navy text-white rounded-md hover:bg-gm-navy-dark disabled:opacity-50 transition-colors"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-xs px-3 py-1.5 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </div>
              )}

              <div className="mt-6 border-b border-gray-50" />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
