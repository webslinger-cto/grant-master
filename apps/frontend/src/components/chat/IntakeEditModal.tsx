'use client';

import { useState, useEffect } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import type { IntakeData } from './IntakeFlow';

const FUNDING_OPTIONS = [
  'NIH SBIR Phase I',
  'NIH SBIR Phase II',
  'NIH SBIR Fast-Track',
  'NIH R01',
  'NIH R21',
  'NSF SBIR Phase I',
  'NSF SBIR Phase II',
  'NSF STTR',
  'DoD / DARPA BAA',
  'BARDA',
  'ARPA-H',
  'Other',
];

const STAGE_OPTIONS = [
  'Concept / Idea Only',
  'Prototype Built',
  'Bench Testing Complete',
  'Pre-clinical / Animal Studies',
  'Clinical Pilot / Feasibility Study',
  'FDA Submission in Progress',
  'FDA Cleared / Approved',
];

interface Props {
  initialData: Partial<IntakeData>;
  onSave: (data: IntakeData) => Promise<void>;
  onClose: () => void;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
      {children}
    </span>
  );
}

export function IntakeEditModal({ initialData, onSave, onClose }: Props) {
  const [data, setData] = useState<Partial<IntakeData>>(initialData ?? {});
  const [saving, setSaving] = useState(false);

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const set = (key: keyof IntakeData, val: string) =>
    setData((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(data as IntakeData);
    } finally {
      setSaving(false);
    }
  };

  const isValid = !!(
    data.projectName?.trim() &&
    data.oneLiner?.trim() &&
    data.clinicalProblem?.trim() &&
    data.targetUsers?.trim() &&
    data.coreTechnology?.trim() &&
    data.differentiation?.trim() &&
    data.fundingMechanism?.trim() &&
    data.developmentStage?.trim()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-none">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Edit Project Context</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              This information shapes every AI-generated section. Update any field and save.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">

            {/* Project Name */}
            <div>
              <Label>Project / Product Name</Label>
              <input
                type="text"
                value={data.projectName ?? ''}
                onChange={(e) => set('projectName', e.target.value)}
                placeholder="e.g. SurgiVision"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gm-cyan-soft focus:border-gm-navy"
              />
            </div>

            {/* Funding Mechanism */}
            <div>
              <Label>Funding Mechanism</Label>
              <select
                value={data.fundingMechanism ?? ''}
                onChange={(e) => set('fundingMechanism', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gm-cyan-soft focus:border-gm-navy bg-white"
              >
                <option value="">Select…</option>
                {FUNDING_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            {/* One-Liner — full width */}
            <div className="col-span-2">
              <Label>One-Liner Description</Label>
              <input
                type="text"
                value={data.oneLiner ?? ''}
                onChange={(e) => set('oneLiner', e.target.value)}
                placeholder="e.g. AR smartglasses that overlay real-time MRI/CT imaging onto a surgeon's field of view intraoperatively."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gm-cyan-soft focus:border-gm-navy"
              />
            </div>

            {/* Clinical Problem — full width */}
            <div className="col-span-2">
              <Label>Clinical Problem</Label>
              <p className="text-[10px] text-gray-400 mb-1.5">
                Quantify it — include failure rates, complication rates, mortality burden, or economic cost.
              </p>
              <textarea
                value={data.clinicalProblem ?? ''}
                onChange={(e) => set('clinicalProblem', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gm-cyan-soft focus:border-gm-navy resize-none"
              />
            </div>

            {/* Target Users */}
            <div>
              <Label>Target Users &amp; Clinical Setting</Label>
              <p className="text-[10px] text-gray-400 mb-1.5">
                Who uses this and where?
              </p>
              <textarea
                value={data.targetUsers ?? ''}
                onChange={(e) => set('targetUsers', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gm-cyan-soft focus:border-gm-navy resize-none"
              />
            </div>

            {/* Development Stage */}
            <div>
              <Label>Development Stage</Label>
              <p className="text-[10px] text-gray-400 mb-1.5">
                Determines which feasibility claims you can credibly make.
              </p>
              <div className="flex flex-col gap-1.5">
                {STAGE_OPTIONS.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => set('developmentStage', o)}
                    className={`text-left px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                      data.developmentStage === o
                        ? 'border-gm-navy bg-gm-cyan-soft text-gm-navy font-medium'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            {/* Core Technology — full width */}
            <div className="col-span-2">
              <Label>Core Technology &amp; Innovation</Label>
              <p className="text-[10px] text-gray-400 mb-1.5">
                Describe the mechanism, key technical components, and what makes the approach novel.
              </p>
              <textarea
                value={data.coreTechnology ?? ''}
                onChange={(e) => set('coreTechnology', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gm-cyan-soft focus:border-gm-navy resize-none"
              />
            </div>

            {/* Differentiation — full width */}
            <div className="col-span-2">
              <Label>Differentiation from Existing Approaches</Label>
              <p className="text-[10px] text-gray-400 mb-1.5">
                Name competitors or prior art and explain specifically what you do better or differently.
              </p>
              <textarea
                value={data.differentiation ?? ''}
                onChange={(e) => set('differentiation', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gm-cyan-soft focus:border-gm-navy resize-none"
              />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex-none flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white rounded-b-xl">
          <p className="text-[10px] text-gray-400">
            Changes take effect on the next AI-generated section.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid || saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-gm-navy text-white rounded-lg hover:bg-gm-navy-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>
              ) : (
                <><Check className="w-3 h-3" /> Save Context</>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
