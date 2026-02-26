'use client';

import { useState, useEffect } from 'react';
import { Loader2, FileText, ChevronDown, ChevronUp, Pencil, Check, X, ExternalLink, AlertTriangle, Share2 } from 'lucide-react';
import { sectionsService } from '@/lib/services/sections.service';
import type { GeneratedSection } from '@/lib/services/chat.service';
import { ExportToDocsModal } from './ExportToDocsModal';

// Canonical display order for sections
const SECTION_ORDER: Record<string, number> = {
  'Project Summary':        1,
  'Specific Aims':          2,
  'Significance':           3,
  'Innovation':             4,
  'Approach':               5,
  'Project Narrative':      6,
  'Budget Justification':   7,
  'Biographical Sketch':    8,
  'Facilities & Resources': 9,
  'Data Management Plan':   10,
  'References':             11,
};

// ── NLM reference parser ───────────────────────────────────────────────

interface ParsedRef {
  number: number;
  text: string;       // NLM-formatted citation text
  pmid: string | null;
  unverified: boolean;
}

function parseReferencesContent(content: string): ParsedRef[] {
  return content
    .split('\n\n')
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const numMatch = block.match(/^\[(\d+)\]\s*/);
      const number = numMatch ? parseInt(numMatch[1], 10) : 0;
      const text = block.replace(/^\[\d+\]\s*/, '').trim();
      const pmidMatch = text.match(/PMID:\s*(\d+)/i);
      const pmid = pmidMatch ? pmidMatch[1] : null;
      const unverified = text.startsWith('[UNVERIFIED]');
      return { number, text: unverified ? text.replace('[UNVERIFIED]', '').trim() : text, pmid, unverified };
    })
    .filter((r) => r.number > 0);
}

function ReferencesRenderer({ content }: { content: string }) {
  const refs = parseReferencesContent(content);
  if (!refs.length) {
    return (
      <p className="text-xs text-gray-400 italic">No references yet.</p>
    );
  }
  return (
    <ol className="space-y-3">
      {refs.map((ref) => (
        <li key={ref.number} className="flex gap-3 text-xs text-gray-700 leading-relaxed">
          <span className="flex-shrink-0 w-6 text-right font-medium text-gray-400 pt-0.5">
            [{ref.number}]
          </span>
          <span className="flex-1">
            {ref.unverified ? (
              <span className="flex items-start gap-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                <span className="text-amber-700">{ref.text}</span>
              </span>
            ) : (
              ref.text
            )}
            {ref.pmid && !ref.unverified && (
              <a
                href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-medium text-gm-navy hover:underline"
              >
                PubMed <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}

const STATUS_COLORS: Record<string, string> = {
  draft:        'bg-gray-100 text-gray-500',
  under_review: 'bg-yellow-100 text-yellow-700',
  approved:     'bg-green-100 text-green-700',
  rejected:     'bg-red-100 text-red-600',
};

const STATUS_LABELS: Record<string, string> = {
  draft:        'Draft',
  under_review: 'In Review',
  approved:     'Approved',
  rejected:     'Rejected',
};

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

interface Props {
  applicationId: string | null;
  applicationName?: string;
  refreshTick: number;
}

export function DocumentPanel({ applicationId, applicationName, refreshTick }: Props) {
  const [sections, setSections] = useState<GeneratedSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    if (!applicationId) { setSections([]); return; }
    setLoading(true);
    sectionsService.getByApplicationId(applicationId)
      .then((data) => {
        setSections(data);
        // Auto-open the first section
        const first = latestVersions(data)[0];
        if (first) setOpenIds(new Set([first.id]));
      })
      .catch(() => setSections([]))
      .finally(() => setLoading(false));
  }, [applicationId, refreshTick]);

  function latestVersions(raw: GeneratedSection[]) {
    const byName: Record<string, GeneratedSection> = {};
    for (const s of raw) {
      if (!byName[s.section_name] || s.version_number > byName[s.section_name].version_number) {
        byName[s.section_name] = s;
      }
    }
    return Object.values(byName).sort((a, b) => {
      const oa = SECTION_ORDER[a.section_name] ?? 99;
      const ob = SECTION_ORDER[b.section_name] ?? 99;
      return oa !== ob ? oa - ob : a.section_name.localeCompare(b.section_name);
    });
  }

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const startEdit = (section: GeneratedSection) => {
    setEditingId(section.id);
    setEditContent(section.content);
    setOpenIds((prev) => new Set(prev).add(section.id));
  };

  const cancelEdit = () => { setEditingId(null); setEditContent(''); };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      await sectionsService.update(id, { content: editContent });
      setSections((prev) => prev.map((s) => s.id === id ? { ...s, content: editContent } : s));
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id: string, status: GeneratedSection['status']) => {
    await sectionsService.update(id, { status });
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
  };

  // ── Empty states ──────────────────────────────────────────────────────
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

  const sorted = latestVersions(sections);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-white">
        <FileText className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">No sections generated yet</p>
        <p className="text-xs text-gray-300 mt-1">Use AI Counsel to generate and add sections</p>
      </div>
    );
  }

  const approvedCount = sorted.filter((s) => s.status === 'approved').length;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">

      {/* Document header */}
      <div className="flex-none px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Grant Application</p>
            <h1 className="text-base font-semibold text-gray-900">Document Sections</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:inline">
              {sorted.length} section{sorted.length !== 1 ? 's' : ''} · {approvedCount} approved
            </span>
            {sorted.length > 0 && (
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4285F4] text-white text-[11px] font-semibold rounded-lg hover:bg-[#3367d6] transition-colors"
                title="Export to Google Docs"
              >
                <Share2 className="w-3 h-3" />
                Export
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Export modal */}
      {showExportModal && applicationId && (
        <ExportToDocsModal
          applicationId={applicationId}
          grantName={applicationName ?? 'Grant Application'}
          sectionCount={sorted.length}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Accordion list */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {sorted.map((section) => {
          const isOpen = openIds.has(section.id);
          const isEditing = editingId === section.id;
          const words = wordCount(section.content);

          return (
            <div key={section.id}>

              {/* ── Section header row ── */}
              <div
                className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer select-none transition-colors ${
                  isOpen ? 'bg-gm-cyan-soft/40' : 'hover:bg-gray-50'
                }`}
                onClick={() => toggle(section.id)}
              >
                {/* Chevron */}
                <span className="text-gray-400 flex-shrink-0">
                  {isOpen
                    ? <ChevronUp className="w-3.5 h-3.5" />
                    : <ChevronDown className="w-3.5 h-3.5" />}
                </span>

                {/* Name */}
                <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                  {section.section_name}
                </span>

                {/* Meta — right side */}
                <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[10px] text-gray-400 hidden sm:inline">
                    {words.toLocaleString()} w · v{section.version_number}
                  </span>

                  <select
                    value={section.status}
                    onChange={(e) => changeStatus(section.id, e.target.value as GeneratedSection['status'])}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border-0 focus:outline-none focus:ring-1 focus:ring-gm-cyan cursor-pointer ${STATUS_COLORS[section.status] ?? STATUS_COLORS.draft}`}
                  >
                    <option value="draft">Draft</option>
                    <option value="under_review">In Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  {!isEditing && (
                    <button
                      onClick={() => startEdit(section)}
                      className="p-1 rounded text-gray-400 hover:text-gm-navy hover:bg-white transition-colors"
                      title="Edit section"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* ── Expanded content ── */}
              {isOpen && (
                <div className="px-8 pb-6 pt-4 bg-white">
                  {isEditing ? (
                    <div>
                      <textarea
                        autoFocus
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full text-sm text-gray-800 leading-relaxed border border-gm-cyan-soft rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-gm-cyan-soft resize-none min-h-[200px]"
                        rows={14}
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => saveEdit(section.id)}
                          disabled={saving}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gm-navy text-white rounded-md hover:bg-gm-navy-dark disabled:opacity-50 transition-colors"
                        >
                          {saving
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Check className="w-3 h-3" />}
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : section.section_name === 'References' ? (
                    <ReferencesRenderer content={section.content} />
                  ) : (
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}
