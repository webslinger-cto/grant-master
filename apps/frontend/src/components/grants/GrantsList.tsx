'use client';

import { useState, useEffect } from 'react';
import { FileText, Search, Bookmark, X, ExternalLink, PlusCircle, CheckCircle2, Loader2, ChevronRight } from 'lucide-react';
import type { Application } from '@/lib/services/applications.service';
import { bookmarksService, BookmarkedOpp } from '@/lib/services/bookmarks.service';
import { GrantDetailModal } from './GrantDetailModal';

const STAGE_LABELS: Record<string, string> = {
  drafting: 'Drafting',
  review: 'In Review',
  planning: 'Planning',
  qualification: 'Qualification',
  submitted: 'Submitted',
};

const STAGE_COLORS: Record<string, string> = {
  drafting:     'bg-blue-100 text-blue-700',
  review:       'bg-yellow-100 text-yellow-700',
  planning:     'bg-purple-100 text-purple-700',
  qualification:'bg-gray-100 text-gray-600',
  submitted:    'bg-green-100 text-green-700',
};

const STAGE_ORDER = ['drafting', 'review', 'planning', 'qualification', 'submitted'];

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMoney(n: number | null) {
  if (!n) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

interface Props {
  applications: Application[];
  selectedId: string | null;
  onSelect: (app: Application) => void;
  onUpdate: (data: Partial<Application>) => Promise<void>;
  loading: boolean;
}

export function GrantsList({ applications, selectedId, onSelect, onUpdate, loading }: Props) {
  const [search, setSearch] = useState('');
  const [bookmarks, setBookmarks] = useState<BookmarkedOpp[]>([]);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [modalApp, setModalApp] = useState<Application | null>(null);

  useEffect(() => {
    setBookmarks(bookmarksService.getAll());
  }, []);

  // Re-sync whenever bookmarks change (e.g. user bookmarks from NIH Search view)
  useEffect(() => {
    const sync = () => setBookmarks(bookmarksService.getAll());
    window.addEventListener('grantmaster:bookmarks-changed', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('grantmaster:bookmarks-changed', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  const removeBookmark = (id: string) => {
    setBookmarks(bookmarksService.remove(id));
  };

  const addToPipeline = async (b: BookmarkedOpp) => {
    if (addingIds.has(b.id) || addedIds.has(b.id)) return;
    setAddingIds((s) => new Set(s).add(b.id));
    try {
      const { applicationsService } = await import('@/lib/services/applications.service');
      await applicationsService.create({
        internal_name: b.title.slice(0, 200),
        amount_requested: b.awardCeiling ?? b.estimatedTotalProgramFunding ?? 0,
        submission_deadline: b.closeDate ?? null,
        current_stage: 'qualification',
        probability: 10,
        outcome_notes: [
          b.opportunityNumber && `Opportunity: ${b.opportunityNumber}`,
          b.agency && `Agency: ${b.agency}`,
        ].filter(Boolean).join('\n') || null,
      });
      setAddedIds((s) => new Set(s).add(b.id));
      // Remove from bookmarks once moved to pipeline
      setBookmarks(bookmarksService.remove(b.id));
    } catch {
      /* silently fail */
    } finally {
      setAddingIds((s) => { const next = new Set(s); next.delete(b.id); return next; });
    }
  };

  const filtered = applications.filter((a) =>
    a.internal_name.toLowerCase().includes(search.toLowerCase())
  );

  const grouped: Record<string, Application[]> = {};
  for (const stage of STAGE_ORDER) {
    const items = filtered.filter((a) => a.current_stage === stage);
    if (items.length) grouped[stage] = items;
  }
  for (const app of filtered) {
    if (!STAGE_ORDER.includes(app.current_stage) && !grouped[app.current_stage]) {
      grouped[app.current_stage] = filtered.filter((a) => a.current_stage === app.current_stage);
    }
  }

  const filteredBookmarks = bookmarks.filter(
    (b) => !search || b.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search */}
      <div className="px-3 py-2.5 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Filter…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 text-xs rounded-md border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gm-cyan focus:border-gm-navy"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-xs text-gray-400 text-center">Loading…</div>
        ) : (
          <>
            {/* ── Shortlisted from NIH Search ── */}
            {filteredBookmarks.length > 0 && (
              <div>
                <div className="px-3 py-1.5 bg-gm-navy/5 border-b border-gray-100 flex items-center gap-1.5">
                  <Bookmark className="w-3 h-3 text-gm-navy" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gm-navy">
                    Shortlisted
                  </span>
                  <span className="text-[9px] text-gray-400 ml-auto">{filteredBookmarks.length}</span>
                </div>
                {filteredBookmarks.map((b) => (
                  <div
                    key={b.id}
                    className="group relative px-3 py-2.5 border-b border-gray-50 hover:bg-gm-cyan-soft transition-colors border-l-2 border-l-gm-navy/30"
                  >
                    <div className="text-xs font-medium text-gray-900 truncate leading-snug pr-5">
                      {b.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-gray-400">{b.agency}</span>
                      {b.awardCeiling && (
                        <>
                          <span className="text-[10px] text-gray-300">·</span>
                          <span className="text-[10px] text-green-600 font-medium">
                            {formatMoney(b.awardCeiling)}
                          </span>
                        </>
                      )}
                      {b.closeDate && (
                        <>
                          <span className="text-[10px] text-gray-300">·</span>
                          <span className="text-[10px] text-gray-400">
                            {formatDate(b.closeDate)}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => addToPipeline(b)}
                        disabled={addingIds.has(b.id) || addedIds.has(b.id)}
                        title="Add to Pipeline"
                        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold border transition-colors ${
                          addedIds.has(b.id)
                            ? 'bg-green-600 text-white border-green-600'
                            : 'border-gray-200 text-gray-400 hover:border-green-500 hover:text-green-600 bg-white disabled:opacity-50'
                        }`}
                      >
                        {addedIds.has(b.id) ? (
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        ) : addingIds.has(b.id) ? (
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        ) : (
                          <><PlusCircle className="w-2.5 h-2.5" /> Pipeline</>
                        )}
                      </button>
                      {b.url && (
                        <a
                          href={b.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-300 hover:text-gm-navy rounded transition-colors"
                          title="View on Grants.gov"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        onClick={() => removeBookmark(b.id)}
                        className="p-1 text-gray-300 hover:text-red-400 rounded transition-colors"
                        title="Remove from Shortlist"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Pipeline stages ── */}
            {Object.keys(grouped).length === 0 && filteredBookmarks.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <FileText className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No grants found</p>
              </div>
            ) : (
              Object.entries(grouped).map(([stage, items]) => (
                <div key={stage}>
                  <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      {STAGE_LABELS[stage] ?? stage}
                    </span>
                  </div>
                  {items.map((app) => {
                    const isSelected = selectedId === app.id;
                    return (
                      <div key={app.id} className={`border-b border-gray-50 border-l-2 transition-colors ${isSelected ? 'border-l-gm-navy bg-gm-cyan-soft' : 'border-l-transparent hover:bg-gm-cyan-soft/50'}`}>
                        {/* Row header — always visible, click to select */}
                        <button
                          onClick={() => onSelect(app)}
                          className="w-full text-left px-3 py-2.5"
                        >
                          <div className="text-xs font-medium text-gray-900 truncate leading-snug">
                            {app.internal_name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-gray-500">
                              {formatCurrency(app.amount_requested)}
                            </span>
                            <span className="text-[10px] text-gray-300">·</span>
                            <span className="text-[10px] text-gray-400">
                              {formatDate(app.submission_deadline)}
                            </span>
                          </div>
                        </button>

                        {/* Expanded detail strip — only when selected */}
                        {isSelected && (
                          <div className="px-3 pb-3 flex flex-col gap-1.5">
                            {/* Stage + probability */}
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${STAGE_COLORS[app.current_stage] ?? 'bg-gray-100 text-gray-600'}`}>
                                {STAGE_LABELS[app.current_stage] ?? app.current_stage}
                              </span>
                              {app.probability != null && (
                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                  <div className="flex-1 h-1 rounded-full bg-gray-200 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-gm-navy"
                                      style={{ width: `${app.probability}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] text-gray-500 flex-none">{app.probability}%</span>
                                </div>
                              )}
                            </div>

                            {/* Notes snippet */}
                            {app.outcome_notes && (
                              <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">
                                {app.outcome_notes}
                              </p>
                            )}

                            {/* Edit / See All button */}
                            <button
                              onClick={() => setModalApp(app)}
                              className="self-start flex items-center gap-1 text-[10px] font-medium text-gm-navy hover:text-gm-cyan transition-colors mt-0.5"
                            >
                              Edit details
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Detail / Edit modal */}
      {modalApp && (
        <GrantDetailModal
          application={modalApp}
          onClose={() => setModalApp(null)}
          onUpdate={async (data) => {
            await onUpdate(data);
            // Keep modal app in sync with latest data
            setModalApp((prev) => prev ? { ...prev, ...data } : prev);
          }}
        />
      )}
    </div>
  );
}
