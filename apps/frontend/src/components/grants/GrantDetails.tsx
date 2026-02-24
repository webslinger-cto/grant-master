'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Check, FileText, TrendingUp, Calendar,
  DollarSign, Tag, RefreshCw, ExternalLink, Building2,
} from 'lucide-react';
import type { Application } from '@/lib/services/applications.service';
import { nihService, NihOpportunity } from '@/lib/services/nih.service';

const STAGES = ['qualification', 'planning', 'drafting', 'review', 'submitted'];

const STAGE_COLORS: Record<string, string> = {
  qualification: 'bg-gray-100 text-gray-700',
  planning:      'bg-gm-cyan-soft text-gm-navy',
  drafting:      'bg-yellow-100 text-yellow-800',
  review:        'bg-purple-100 text-purple-700',
  submitted:     'bg-green-100 text-green-700',
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(s?: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-3">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 flex-none">{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

function ReadField({ label, icon: Icon, children }: { label: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 mb-0.5">
        {Icon && <Icon className="w-3 h-3 text-gray-400" />}
        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">{label}</span>
      </div>
      <div className="text-sm text-gray-800 leading-relaxed">{children}</div>
    </div>
  );
}

interface Props {
  application: Application | null;
  onUpdate: (updated: Partial<Application>) => Promise<void>;
  onClose?: () => void;
  defaultEditing?: boolean;
}

export function GrantDetails({ application, onUpdate, onClose }: Props) {
  const [draft, setDraft] = useState<Partial<Application>>({});
  const [saving, setSaving] = useState(false);

  // NIH enrichment
  const [enriched, setEnriched] = useState<NihOpportunity | null>(null);
  const [enrichLoading, setEnrichLoading] = useState(false);

  // NIH deadline sync
  const [nihLoading, setNihLoading] = useState(false);
  const [nihResults, setNihResults] = useState<NihOpportunity[]>([]);
  const [nihError, setNihError] = useState<string | null>(null);
  const [showNihResults, setShowNihResults] = useState(false);

  // Parse opportunity number from outcome_notes or opportunity_title
  const opportunityNumber = useMemo(() => {
    if (!application) return null;
    const fromNotes = application.outcome_notes?.match(/Opportunity:\s*([A-Z0-9-]+)/i)?.[1];
    if (fromNotes) return fromNotes;
    const firstWord = application.opportunity_title?.split(' ')[0] ?? '';
    if (/^[A-Z]{2,5}-\d{2}-\d{3}/i.test(firstWord)) return firstWord;
    return null;
  }, [application?.outcome_notes, application?.opportunity_title]);

  // Fetch enriched grant data on open
  useEffect(() => {
    if (!opportunityNumber) return;
    setEnrichLoading(true);
    nihService.enrichOpportunity(opportunityNumber)
      .then((data) => setEnriched(data))
      .finally(() => setEnrichLoading(false));
  }, [opportunityNumber]);

  // Reset draft when application changes
  useEffect(() => { setDraft({}); }, [application?.id]);

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-300 bg-white">
        <FileText className="w-8 h-8 mb-2" />
        <p className="text-xs">Select a grant to view details</p>
      </div>
    );
  }

  const current = { ...application, ...draft };
  const set = (key: keyof Application, value: any) => setDraft((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    if (!Object.keys(draft).length) { onClose?.(); return; }
    setSaving(true);
    try {
      await onUpdate(draft);
      setDraft({});
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  const fetchNihDeadline = async () => {
    setNihLoading(true);
    setNihError(null);
    setNihResults([]);
    setShowNihResults(false);
    const query = nihService.buildSearchQuery(application.internal_name);
    try {
      const results = await nihService.searchOpportunities(query);
      if (results.length === 0) {
        setNihError(`No open opportunities found for "${query}" on Grants.gov`);
      } else {
        setNihResults(results);
        setShowNihResults(true);
      }
    } catch {
      setNihError('Grants.gov lookup failed — check backend connection');
    } finally {
      setNihLoading(false);
    }
  };

  const applyNihDeadline = (opp: NihOpportunity) => {
    if (!opp.closeDate) return;
    set('submission_deadline', opp.closeDate);
    setShowNihResults(false);
    setNihResults([]);
  };

  // Derive clean display values
  const agencyFromNotes = application.outcome_notes?.match(/Agency:\s*(.+)/i)?.[1]?.trim();
  const displayAgency = enriched?.agency ?? agencyFromNotes ?? null;
  const displayDescription = enriched?.description ?? application.opportunity_description ?? null;
  const displayUrl = enriched?.url ?? null;

  // Strip "Opportunity: X / Agency: X" lines from notes for the editable notes field
  const baseNotes = application.outcome_notes
    ?.split('\n')
    .filter((l) => !/^(Opportunity:|Agency:)\s/i.test(l.trim()))
    .join('\n')
    .trim() || '';

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── Header ── */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex-1 min-w-0 pr-3">
          <h2 className="text-sm font-semibold text-gray-900 leading-snug">
            {application.internal_name}
          </h2>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {opportunityNumber && (
              <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                {opportunityNumber}
              </span>
            )}
            {application.opportunity_title && !application.opportunity_title.startsWith(opportunityNumber ?? '___') && (
              <span className="text-[10px] text-gray-400">{application.opportunity_title}</span>
            )}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">

        {/* ── Section 1: Pipeline Tracking (editable) ── */}
        <SectionDivider label="Pipeline Tracking" />

        {/* Stage */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Tag className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Stage</span>
          </div>
          <select
            value={current.current_stage}
            onChange={(e) => set('current_stage', e.target.value)}
            className="text-xs px-2 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gm-cyan bg-white"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Win Probability */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Win Probability</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range" min="0" max="100" step="5"
              value={current.probability}
              onChange={(e) => set('probability', parseFloat(e.target.value))}
              className="w-32"
            />
            <span className="text-sm text-gm-navy font-medium w-10">{current.probability}%</span>
          </div>
        </div>

        {/* Internal Deadline */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Internal Deadline</span>
          </div>
          <input
            type="date"
            className="text-sm border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gm-cyan bg-white"
            value={current.internal_deadline?.slice(0, 10) ?? ''}
            onChange={(e) => set('internal_deadline', e.target.value || null)}
          />
          <p className="text-[10px] text-gray-400 mt-0.5">Your internal prep deadline (separate from submission)</p>
        </div>

        {/* Internal Notes */}
        <div className="mb-4">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Internal Notes</span>
          <textarea
            rows={3}
            className="mt-1.5 w-full text-xs px-2 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gm-cyan resize-none"
            placeholder="Add private team notes…"
            value={(draft.outcome_notes !== undefined ? draft.outcome_notes : baseNotes) ?? ''}
            onChange={(e) => set('outcome_notes', e.target.value)}
          />
        </div>

        {/* ── Section 2: Official Grant Information (read-only) ── */}
        <SectionDivider label="Grant Information" />

        {/* Amount + Agency row */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <ReadField label="Award Ceiling" icon={DollarSign}>
            {formatCurrency(application.amount_requested)}
          </ReadField>
          {displayAgency && (
            <ReadField label="Agency" icon={Building2}>
              {displayAgency}
            </ReadField>
          )}
        </div>

        {/* Submission Deadline */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                Submission Deadline
              </span>
            </div>
            <button
              onClick={fetchNihDeadline}
              disabled={nihLoading}
              className="flex items-center gap-1 text-[10px] text-gm-cyan hover:text-gm-navy disabled:opacity-40 transition-colors"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${nihLoading ? 'animate-spin' : ''}`} />
              {nihLoading ? 'Searching…' : 'Sync from NIH'}
            </button>
          </div>
          <p className="text-sm text-gray-800">
            {draft.submission_deadline
              ? formatDate(draft.submission_deadline as string)
              : formatDate(application.submission_deadline)}
            {draft.submission_deadline && (
              <span className="ml-2 text-[10px] text-gm-cyan">(updated — save to confirm)</span>
            )}
          </p>
          {nihError && <p className="text-[10px] text-red-400 mt-1">{nihError}</p>}
          {showNihResults && nihResults.length > 0 && (
            <div className="mt-2 rounded-lg border border-gm-cyan-soft overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-2.5 py-1.5 bg-gm-cyan-soft border-b border-gm-cyan-soft">
                <span className="text-[10px] font-semibold text-gm-navy">
                  {nihResults.length} opportunities found
                </span>
                <button onClick={() => setShowNihResults(false)} className="text-gm-cyan hover:text-gm-navy">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto divide-y divide-gray-100">
                {nihResults.map((opp) => (
                  <div key={opp.opportunityId} className="px-2.5 py-2 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-gray-800 line-clamp-1">{opp.title}</p>
                        <p className="text-[10px] text-gray-400">{opp.agency}</p>
                      </div>
                      {opp.closeDate && (
                        <div className="flex-shrink-0 text-right">
                          <p className="text-[10px] font-semibold text-gray-700">{formatDate(opp.closeDate)}</p>
                          <button
                            onClick={() => applyNihDeadline(opp)}
                            className="mt-0.5 text-[10px] px-2 py-0.5 bg-gm-navy text-white rounded hover:bg-gm-navy-dark transition-colors"
                          >
                            Use
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {(displayDescription || enrichLoading) && (
          <div className="mb-3">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 block mb-0.5">
              Description
            </span>
            {enrichLoading ? (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <span className="w-3 h-3 border-2 border-gray-200 border-t-gm-cyan rounded-full animate-spin" />
                Loading grant details…
              </div>
            ) : (
              <p className="text-xs text-gray-700 leading-relaxed">{displayDescription}</p>
            )}
          </div>
        )}

        {/* Eligibility */}
        {enriched?.eligibilitySummary && (
          <div className="mb-3">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 block mb-0.5">
              Eligibility
            </span>
            <p className="text-xs text-gray-700 leading-relaxed">{enriched.eligibilitySummary}</p>
          </div>
        )}

        {/* Funding categories / tags */}
        {(enriched?.fundingCategories?.length || enriched?.fundingInstruments?.length) && (
          <div className="mb-3">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 block mb-1.5">
              Categories
            </span>
            <div className="flex flex-wrap gap-1">
              {[...(enriched.fundingCategories ?? []), ...(enriched.fundingInstruments ?? [])].map((t) => (
                <span
                  key={t}
                  className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full border border-gray-200"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* View on Grants.gov */}
        {displayUrl && (
          <a
            href={displayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-gm-navy hover:text-gm-cyan transition-colors mt-1"
          >
            View on Grants.gov
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

      </div>

      {/* ── Footer (modal context only) ── */}
      {onClose && (
        <div className="flex-none flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-white">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-xs font-semibold bg-gm-navy text-white rounded-md hover:bg-gm-navy-dark transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Check className="w-3 h-3" />
                Save
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
