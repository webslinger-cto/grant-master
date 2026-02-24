'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Search, Loader2, ExternalLink, ChevronDown, ChevronUp,
  Calendar, Building2, DollarSign, FileText, BookOpen, X, Clock, Bookmark, BookmarkCheck,
  PlusCircle, CheckCircle2,
} from 'lucide-react';
import { nihService, NihOpportunity, NihProject } from '@/lib/services/nih.service';
import { bookmarksService } from '@/lib/services/bookmarks.service';

type SearchMode = 'opportunities' | 'projects';

// Grants.gov uses sub-agency codes as strings — parent codes (e.g. "HHS") return 0 results
const AGENCY_OPTIONS = [
  { value: '',           label: 'All agencies' },
  { value: 'HHS-NIH11', label: 'NIH' },
  { value: 'HHS-FDA',   label: 'FDA' },
  { value: 'HHS-CDC',   label: 'CDC' },
  { value: 'HHS-AHRQ',  label: 'AHRQ' },
  { value: 'NSF',       label: 'NSF' },
  { value: 'DOD-AMRAA', label: 'DoD — USAMRAA' },
  { value: 'DOD-DARPA', label: 'DARPA' },
];

const ACTIVITY_CODES = ['R01', 'R21', 'R03', 'K99', 'K01', 'P01', 'U01', 'SBIR', 'STTR'];

// ── Search history ─────────────────────────────────────────────────────
const HISTORY_KEY = 'grantmaster:search_history';
const MAX_HISTORY = 5;

interface SearchHistoryItem {
  id: string;
  mode: SearchMode;
  query: string;
  agencyFilter: string;
  codeFilter: string;
  resultCount: number;
  results: NihOpportunity[] | NihProject[];
  timestamp: number;
  label: string;
}

function makeLabel(mode: SearchMode, query: string, agencyFilter: string, codeFilter: string): string {
  const agencyLabel = agencyFilter
    ? (AGENCY_OPTIONS.find((a) => a.value === agencyFilter)?.label ?? agencyFilter)
    : '';
  const parts: string[] = [];
  if (query.trim()) parts.push(query.trim().slice(0, 20) + (query.trim().length > 20 ? '…' : ''));
  if (agencyLabel) parts.push(agencyLabel);
  if (codeFilter) parts.push(codeFilter);
  return parts.length ? parts.join(' · ') : (mode === 'opportunities' ? 'All Opps' : 'All Projects');
}

function loadHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveHistory(items: SearchHistoryItem[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  } catch {
    // quota exceeded — silently skip
  }
}

function addToHistory(
  current: SearchHistoryItem[],
  entry: Omit<SearchHistoryItem, 'id' | 'label' | 'timestamp'>,
): SearchHistoryItem[] {
  const label = makeLabel(entry.mode, entry.query, entry.agencyFilter, entry.codeFilter);
  const newItem: SearchHistoryItem = { ...entry, id: String(Date.now()), label, timestamp: Date.now() };
  // Replace duplicate (same mode + query + filters)
  const deduped = current.filter(
    (h) => !(h.mode === entry.mode && h.query === entry.query &&
             h.agencyFilter === entry.agencyFilter && h.codeFilter === entry.codeFilter),
  );
  return [newItem, ...deduped].slice(0, MAX_HISTORY);
}

function formatDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function DeadlinePill({ date }: { date: string | null }) {
  if (!date) return <span className="text-xs text-gray-300">No deadline</span>;
  const days = daysUntil(date);
  const color =
    days === null ? 'text-gray-400' :
    days < 0 ? 'text-gray-400 line-through' :
    days <= 30 ? 'text-red-600 font-semibold' :
    days <= 90 ? 'text-orange-500 font-medium' :
    'text-green-600';
  return (
    <span className={`text-xs ${color}`}>
      {formatDate(date)}
      {days !== null && days >= 0 && (
        <span className="ml-1 text-gray-400 font-normal">({days}d)</span>
      )}
    </span>
  );
}

// ── Opportunity card ──────────────────────────────────────────────────
function OppCard({
  opp, selected, bookmarked, onClick, onBookmark,
}: { opp: NihOpportunity; selected: boolean; bookmarked: boolean; onClick: () => void; onBookmark: (e: React.MouseEvent) => void }) {
  const ceiling = opp.awardCeiling ?? opp.estimatedTotalProgramFunding;
  return (
    <div
      className={`relative w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gm-cyan-soft transition-colors cursor-pointer group ${
        selected ? 'bg-gm-cyan-soft border-l-2 border-l-gm-navy' : 'border-l-2 border-l-transparent'
      }`}
      onClick={onClick}
    >
      <p className="text-xs font-medium text-gray-900 line-clamp-2 leading-snug mb-1 pr-6">
        {opp.title || '(Untitled)'}
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[10px] text-gray-500">{opp.agency || '—'}</span>
        {opp.opportunityNumber && (
          <span className="text-[10px] font-mono text-gray-400">{opp.opportunityNumber}</span>
        )}
        {ceiling != null && (
          <span className="text-[10px] text-green-600 font-medium">
            {formatMoney(ceiling)}
          </span>
        )}
        <DeadlinePill date={opp.closeDate} />
      </div>
      <button
        onClick={onBookmark}
        title={bookmarked ? 'Remove from Shortlist' : 'Add to Shortlist'}
        className={`absolute top-2.5 right-2.5 p-1 rounded transition-colors ${
          bookmarked
            ? 'text-gm-navy'
            : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-gm-navy'
        }`}
      >
        {bookmarked
          ? <BookmarkCheck className="w-3.5 h-3.5" />
          : <Bookmark className="w-3.5 h-3.5" />
        }
      </button>
    </div>
  );
}

// ── Project card ──────────────────────────────────────────────────────
function ProjectCard({
  project, selected, onClick,
}: { project: NihProject; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gm-cyan-soft transition-colors ${
        selected ? 'bg-gm-cyan-soft border-l-2 border-l-gm-navy' : 'border-l-2 border-l-transparent'
      }`}
    >
      <p className="text-xs font-medium text-gray-900 line-clamp-2 leading-snug mb-1">
        {project.title || '(Untitled)'}
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[10px] font-mono text-gm-navy font-medium">{project.activityCode}</span>
        {project.piName && <span className="text-[10px] text-gray-500">{project.piName}</span>}
        {project.awardAmount && (
          <span className="text-[10px] text-green-600 font-medium">
            ${(project.awardAmount / 1000).toFixed(0)}K
          </span>
        )}
        <span className="text-[10px] text-gray-400">FY{project.fiscalYear}</span>
      </div>
    </button>
  );
}

function formatMoney(n: number | null | undefined) {
  if (n === null || n === undefined) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

// ── Opportunity detail pane ───────────────────────────────────────────
function OppDetail({ opp, bookmarked, onBookmark }: { opp: NihOpportunity; bookmarked: boolean; onBookmark: () => void }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const addToPipeline = async () => {
    setAdding(true);
    try {
      const { applicationsService } = await import('@/lib/services/applications.service');
      await applicationsService.create({
        internal_name: opp.title.slice(0, 200),
        amount_requested: opp.awardCeiling ?? opp.estimatedTotalProgramFunding ?? 0,
        submission_deadline: opp.closeDate ?? null,
        current_stage: 'qualification',
        probability: 10,
        outcome_notes: [
          opp.opportunityNumber && `Opportunity: ${opp.opportunityNumber}`,
          opp.agency && `Agency: ${opp.agency}`,
        ].filter(Boolean).join('\n') || null,
      });
      setAdded(true);
      // Remove from bookmarks once in pipeline
      if (bookmarked) onBookmark();
    } catch {
      /* silently fail — user can retry */
    } finally {
      setAdding(false);
    }
  };

  const hasRichData =
    opp.awardCeiling != null ||
    opp.estimatedTotalProgramFunding != null ||
    opp.expectedNumberOfAwards != null;

  return (
    <div className="h-full overflow-y-auto px-5 py-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="text-sm font-semibold text-gray-900 leading-snug">{opp.title}</h2>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={onBookmark}
            title={bookmarked ? 'Remove from Shortlist' : 'Save to Shortlist'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-colors ${
              bookmarked
                ? 'bg-gm-navy text-white border-gm-navy'
                : 'border-gray-200 text-gray-500 hover:border-gm-navy hover:text-gm-navy'
            }`}
          >
            {bookmarked
              ? <><BookmarkCheck className="w-3 h-3" /> Shortlisted</>
              : <><Bookmark className="w-3 h-3" /> Shortlist</>
            }
          </button>
          <button
            onClick={addToPipeline}
            disabled={adding || added}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-colors ${
              added
                ? 'bg-green-600 text-white border-green-600'
                : 'border-gray-200 text-gray-500 hover:border-green-600 hover:text-green-600 disabled:opacity-50'
            }`}
          >
            {added ? (
              <><CheckCircle2 className="w-3 h-3" /> Added!</>
            ) : adding ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> Adding…</>
            ) : (
              <><PlusCircle className="w-3 h-3" /> Add to Pipeline</>
            )}
          </button>
        </div>
      </div>

      {/* Core metadata */}
      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          {opp.agency || '—'}
        </div>
        {opp.opportunityNumber && (
          <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
            <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            {opp.opportunityNumber}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Close date · </span>
            <DeadlinePill date={opp.closeDate} />
          </div>
        </div>
        {opp.openDate && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Open · </span>
            <span className="text-xs">{formatDate(opp.openDate)}</span>
          </div>
        )}
      </div>

      {/* Funding details (simpler.grants.gov rich data) */}
      {hasRichData && (
        <div className="mb-5 rounded-lg bg-green-50 border border-green-100 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-green-600 mb-2.5">
            Funding Details
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {opp.estimatedTotalProgramFunding != null && (
              <div>
                <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-0.5">
                  Est. Program Funding
                </p>
                <p className="text-xs font-semibold text-green-700">
                  {formatMoney(opp.estimatedTotalProgramFunding)}
                </p>
              </div>
            )}
            {opp.awardCeiling != null && (
              <div>
                <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-0.5">
                  Award Ceiling
                </p>
                <p className="text-xs font-semibold text-gray-700">
                  {formatMoney(opp.awardCeiling)}
                </p>
              </div>
            )}
            {opp.awardFloor != null && (
              <div>
                <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-0.5">
                  Award Floor
                </p>
                <p className="text-xs font-semibold text-gray-700">
                  {formatMoney(opp.awardFloor)}
                </p>
              </div>
            )}
            {opp.expectedNumberOfAwards != null && (
              <div>
                <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-0.5">
                  Expected Awards
                </p>
                <p className="text-xs font-semibold text-gray-700">
                  {opp.expectedNumberOfAwards}
                </p>
              </div>
            )}
            {opp.isCostSharing != null && (
              <div>
                <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-0.5">
                  Cost Sharing
                </p>
                <p className="text-xs font-medium text-gray-700">
                  {opp.isCostSharing ? 'Required' : 'Not required'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Eligibility */}
      {opp.eligibilitySummary && (
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1.5">
            Eligibility
          </p>
          <p className="text-xs text-gray-700 leading-relaxed">{opp.eligibilitySummary}</p>
        </div>
      )}

      {/* Funding categories / instruments */}
      {((opp.fundingCategories?.length ?? 0) > 0 || (opp.fundingInstruments?.length ?? 0) > 0) && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {opp.fundingCategories?.map((c) => (
            <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-gm-cyan-soft text-gm-navy font-medium">
              {c}
            </span>
          ))}
          {opp.fundingInstruments?.map((i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {i}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      {opp.description && (
        <div className="mb-5">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1.5">Description</p>
          <div
            className="grant-html-body"
            dangerouslySetInnerHTML={{ __html: opp.description }}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        {opp.url && (
          <a
            href={opp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gm-navy hover:text-gm-navy-dark font-medium"
          >
            View on Grants.gov <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

// ── Project detail pane ───────────────────────────────────────────────
function ProjectDetail({ project }: { project: NihProject }) {
  return (
    <div className="h-full overflow-y-auto px-5 py-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-mono font-semibold text-gm-navy bg-gm-cyan-soft px-2 py-0.5 rounded">
          {project.activityCode}
        </span>
        <span className="text-[10px] text-gray-400">FY{project.fiscalYear}</span>
      </div>

      <h2 className="text-sm font-semibold text-gray-900 leading-snug mb-4">{project.title}</h2>

      <div className="space-y-3 mb-5">
        {project.piName && (
          <div className="flex items-start gap-2 text-xs text-gray-700">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 w-20 flex-shrink-0 mt-0.5">PI</span>
            {project.piName}
          </div>
        )}
        {project.organization && (
          <div className="flex items-start gap-2 text-xs text-gray-700">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 w-20 flex-shrink-0 mt-0.5">Org</span>
            {project.organization}
          </div>
        )}
        {project.awardAmount && (
          <div className="flex items-start gap-2 text-xs text-gray-700">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 w-20 flex-shrink-0 mt-0.5">Award</span>
            <span className="text-green-600 font-medium">
              ${project.awardAmount.toLocaleString()}
            </span>
          </div>
        )}
        {(project.startDate || project.endDate) && (
          <div className="flex items-start gap-2 text-xs text-gray-700">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 w-20 flex-shrink-0 mt-0.5">Period</span>
            {formatDate(project.startDate)} → {formatDate(project.endDate)}
          </div>
        )}
        {project.projectNumber && (
          <div className="flex items-start gap-2 text-xs text-gray-700">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 w-20 flex-shrink-0 mt-0.5">Project #</span>
            <span className="font-mono text-gray-600">{project.projectNumber}</span>
          </div>
        )}
      </div>

      {project.abstract && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1.5">Abstract</p>
          <p className="text-xs text-gray-700 leading-relaxed">{project.abstract}…</p>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export function GrantsSearch() {
  const [mode, setMode] = useState<SearchMode>('opportunities');
  const [query, setQuery] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('');
  const [codeFilter, setCodeFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [opportunities, setOpportunities] = useState<NihOpportunity[]>([]);
  const [projects, setProjects] = useState<NihProject[]>([]);
  const [selectedOpp, setSelectedOpp] = useState<NihOpportunity | null>(null);
  const [selectedProject, setSelectedProject] = useState<NihProject | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const inputRef = useRef<HTMLInputElement>(null);

  // Load history and bookmarks from localStorage on mount
  useEffect(() => {
    setHistory(loadHistory());
    setBookmarkedIds(new Set(bookmarksService.getAll().map((b) => b.id)));
  }, []);

  const toggleBookmark = (opp: NihOpportunity) => {
    if (bookmarksService.isBookmarked(opp.opportunityId)) {
      bookmarksService.remove(opp.opportunityId);
    } else {
      bookmarksService.add(opp);
    }
    setBookmarkedIds(new Set(bookmarksService.getAll().map((b) => b.id)));
  };

  const handleSearch = async () => {
    if (!query.trim() && !codeFilter && !agencyFilter) return;
    setLoading(true);
    setSearched(true);
    setSelectedOpp(null);
    setSelectedProject(null);

    try {
      if (mode === 'opportunities') {
        const results = await nihService.searchOpportunities(
          query.trim() || codeFilter || 'NIH',
          agencyFilter || undefined,
        );
        setOpportunities(results);
        const updated = addToHistory(loadHistory(), { mode, query, agencyFilter, codeFilter, resultCount: results.length, results });
        setHistory(updated);
        saveHistory(updated);
      } else {
        const results = await nihService.searchProjects(
          query.trim(),
          codeFilter || undefined,
        );
        setProjects(results);
        const updated = addToHistory(loadHistory(), { mode, query, agencyFilter, codeFilter, resultCount: results.length, results });
        setHistory(updated);
        saveHistory(updated);
      }
    } finally {
      setLoading(false);
    }
  };

  const replaySearch = (item: SearchHistoryItem) => {
    setMode(item.mode);
    setQuery(item.query);
    setAgencyFilter(item.agencyFilter);
    setCodeFilter(item.codeFilter);
    setSearched(true);
    setSelectedOpp(null);
    setSelectedProject(null);
    if (item.mode === 'opportunities') {
      setOpportunities(item.results as NihOpportunity[]);
      setProjects([]);
    } else {
      setProjects(item.results as NihProject[]);
      setOpportunities([]);
    }
  };

  const removeHistoryItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    saveHistory(updated);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const selectOpp = async (opp: NihOpportunity) => {
    setSelectedOpp(opp);
    setSelectedProject(null);
    // Enrich with simpler.grants.gov data (award ceiling, eligibility, etc.)
    if (opp.opportunityNumber && opp.awardCeiling === undefined) {
      setEnriching(true);
      try {
        const rich = await nihService.enrichOpportunity(opp.opportunityNumber);
        if (rich) {
          setSelectedOpp((prev) =>
            prev?.opportunityId === opp.opportunityId
              ? { ...prev, ...rich, title: prev.title, agency: prev.agency }
              : prev,
          );
        }
      } finally {
        setEnriching(false);
      }
    }
  };

  const switchMode = (m: SearchMode) => {
    setMode(m);
    setSearched(false);
    setOpportunities([]);
    setProjects([]);
    setSelectedOpp(null);
    setSelectedProject(null);
    setQuery('');
    setAgencyFilter('');
    setCodeFilter('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const currentResults = mode === 'opportunities' ? opportunities : projects;
  const hasResults = currentResults.length > 0;

  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── Top bar ── */}
      <div className="flex-none px-5 pt-5 pb-4 border-b border-gray-100">
        {/* Mode tabs */}
        <div className="flex gap-1 mb-4 p-0.5 bg-gray-100 rounded-lg w-fit">
          <button
            onClick={() => switchMode('opportunities')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === 'opportunities'
                ? 'bg-white text-gm-navy shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Open Opportunities
          </button>
          <button
            onClick={() => switchMode('projects')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === 'projects'
                ? 'bg-white text-gm-navy shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Funded Projects
          </button>
        </div>

        {/* Recent search chips */}
        {history.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <Clock className="w-3 h-3 text-gray-300 flex-shrink-0" />
            {history.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full border border-gray-200 bg-gray-50 hover:border-gm-cyan-soft hover:bg-gm-cyan-soft transition-colors cursor-pointer"
                onClick={() => replaySearch(item)}
              >
                {item.mode === 'opportunities'
                  ? <Calendar className="w-2.5 h-2.5 text-gray-400 group-hover:text-gm-cyan flex-shrink-0" />
                  : <BookOpen className="w-2.5 h-2.5 text-gray-400 group-hover:text-gm-cyan flex-shrink-0" />
                }
                <span className="text-[10px] text-gray-600 group-hover:text-gm-navy font-medium max-w-[120px] truncate">
                  {item.label}
                </span>
                <span className="text-[9px] text-gray-400 group-hover:text-gm-cyan ml-0.5">
                  {item.resultCount}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeHistoryItem(item.id); }}
                  className="ml-0.5 p-0.5 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder={
                mode === 'opportunities'
                  ? 'R01, SBIR, cardiac imaging…'
                  : 'surgical AR, remote monitoring…'
              }
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gm-cyan-soft focus:border-gm-cyan"
            />
          </div>

          {/* Agency filter (opportunities only) */}
          {mode === 'opportunities' && (
            <select
              value={agencyFilter}
              onChange={(e) => setAgencyFilter(e.target.value)}
              className="text-xs px-2 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gm-cyan bg-white text-gray-600 cursor-pointer"
            >
              {AGENCY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}

          {/* Activity code filter (projects only) */}
          {mode === 'projects' && (
            <select
              value={codeFilter}
              onChange={(e) => setCodeFilter(e.target.value)}
              className="text-xs px-2 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gm-cyan bg-white text-gray-600 cursor-pointer"
            >
              <option value="">Any code</option>
              {ACTIVITY_CODES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-gm-navy text-white text-sm font-medium rounded-lg hover:bg-gm-navy-dark disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Search
          </button>
        </div>

        {/* Context hint */}
        {!searched && (
          <p className="text-[10px] text-gray-400 mt-2">
            {mode === 'opportunities'
              ? 'Search currently open federal grant opportunities — live from Grants.gov'
              : 'Search NIH-funded projects — live from NIH REPORTER'}
          </p>
        )}
        {searched && !loading && (
          <p className="text-[10px] text-gray-400 mt-2">
            {currentResults.length} result{currentResults.length !== 1 ? 's' : ''} ·{' '}
            {mode === 'opportunities' ? 'Grants.gov' : 'NIH REPORTER'}
          </p>
        )}
      </div>

      {/* ── Body: Results + Detail ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Results list */}
        <div
          className={`flex flex-col border-r border-gray-100 overflow-hidden transition-all duration-200 ${
            (selectedOpp || selectedProject) ? 'w-80 flex-none' : 'flex-1'
          }`}
        >
          {loading && (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          )}

          {!loading && searched && !hasResults && (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 px-6 text-center">
              <Search className="w-7 h-7 mb-2 opacity-30" />
              <p className="text-sm">No results found</p>
              <p className="text-xs text-gray-300 mt-1">Try a different keyword or relax the filters</p>
            </div>
          )}

          {!loading && !searched && (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 px-6 text-center">
              <Search className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm text-gray-400">Enter a search query above</p>
              <p className="text-xs mt-1">
                {mode === 'opportunities'
                  ? 'Try: "R01", "SBIR cardiac", "AR surgery"'
                  : 'Try: "surgical robotics", "remote monitoring"'}
              </p>
            </div>
          )}

          {!loading && hasResults && (
            <div className="flex-1 overflow-y-auto">
              {mode === 'opportunities'
                ? opportunities.map((opp) => (
                    <OppCard
                      key={opp.opportunityId}
                      opp={opp}
                      selected={selectedOpp?.opportunityId === opp.opportunityId}
                      bookmarked={bookmarkedIds.has(opp.opportunityId)}
                      onClick={() => selectOpp(opp)}
                      onBookmark={(e) => { e.stopPropagation(); toggleBookmark(opp); }}
                    />
                  ))
                : projects.map((p, i) => (
                    <ProjectCard
                      key={p.projectNumber || i}
                      project={p}
                      selected={selectedProject?.projectNumber === p.projectNumber}
                      onClick={() => { setSelectedProject(p); setSelectedOpp(null); }}
                    />
                  ))}
            </div>
          )}
        </div>

        {/* Detail pane */}
        {(selectedOpp || selectedProject) && (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 flex-none">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {mode === 'opportunities' ? 'Opportunity Detail' : 'Project Detail'}
                </span>
                {enriching && (
                  <Loader2 className="w-3 h-3 animate-spin text-gm-cyan" />
                )}
              </div>
              <button
                onClick={() => { setSelectedOpp(null); setSelectedProject(null); }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {selectedOpp && (
                <OppDetail
                  opp={selectedOpp}
                  bookmarked={bookmarkedIds.has(selectedOpp.opportunityId)}
                  onBookmark={() => toggleBookmark(selectedOpp)}
                />
              )}
            {selectedProject && <ProjectDetail project={selectedProject} />}
          </div>
        )}
      </div>
    </div>
  );
}
