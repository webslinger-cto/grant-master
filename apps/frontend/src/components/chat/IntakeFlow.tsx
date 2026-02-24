'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle2, Sparkles } from 'lucide-react';

export interface IntakeData {
  projectName: string;
  oneLiner: string;
  clinicalProblem: string;
  targetUsers: string;
  coreTechnology: string;
  differentiation: string;
  fundingMechanism: string;
  developmentStage: string;
}

interface Props {
  onComplete: (data: IntakeData) => Promise<void>;
  onStepSave?: (partial: Partial<IntakeData>) => void;
  initialData?: Partial<IntakeData>;
  initialStep?: number;
  onSkip?: () => void;
}

type StepKey = keyof IntakeData;

interface SelectOption {
  label: string;
  description?: string;
}

interface Step {
  key: StepKey;
  label: string;
  question: string;
  hint: string;
  type: 'text' | 'textarea' | 'select';
  options?: SelectOption[];
}

const STEPS: Step[] = [
  {
    key: 'projectName',
    label: 'Product',
    question: 'What is your project or product name?',
    hint: 'e.g. SurgiVision',
    type: 'text',
  },
  {
    key: 'oneLiner',
    label: 'One-Liner',
    question: 'Describe it in one sentence for a reviewer.',
    hint: "e.g. AR smartglasses that overlay real-time MRI/CT imaging onto a surgeon's field of view intraoperatively.",
    type: 'text',
  },
  {
    key: 'clinicalProblem',
    label: 'Problem',
    question: 'What specific clinical problem does this solve?',
    hint: 'Quantify it — include failure rates, complication rates, mortality burden, or economic cost.',
    type: 'textarea',
  },
  {
    key: 'targetUsers',
    label: 'Users',
    question: 'Who are the primary end users and in what clinical setting?',
    hint: 'e.g. Neurosurgeons and surgical oncologists performing open resection in tertiary-care ORs.',
    type: 'textarea',
  },
  {
    key: 'coreTechnology',
    label: 'Technology',
    question: 'How does the technology work? What is the core innovation?',
    hint: 'Describe the mechanism, key technical components, and what makes the approach novel.',
    type: 'textarea',
  },
  {
    key: 'differentiation',
    label: 'Differentiation',
    question: 'How is this different from existing approaches or competitors?',
    hint: 'Name competitors or prior art and explain specifically what you do better or differently.',
    type: 'textarea',
  },
  {
    key: 'fundingMechanism',
    label: 'Funding',
    question: 'Which funding mechanism is this application targeting?',
    hint: 'This shapes framing — SBIR needs commercialization; R01 needs scientific rigor.',
    type: 'select',
    options: [
      {
        label: 'NIH SBIR Phase I',
        description: '~$300K · 6-12 months · Prove feasibility. Primary goal: generate data to justify Phase II.',
      },
      {
        label: 'NIH SBIR Phase II',
        description: 'Up to $2M · 2 years · Full R&D, prototype validation, clinical pilot. Requires strong Phase I results.',
      },
      {
        label: 'NIH SBIR Fast-Track',
        description: 'Combined Phase I + II in one application. Best when you have strong preliminary data and a commercialization partner ready.',
      },
      {
        label: 'NIH R01',
        description: 'Up to ~$500K/yr · 3-5 years · Flagship research grant. Requires academic PI, deep preliminary data, scientific rigor. No commercialization requirement.',
      },
      {
        label: 'NIH R21',
        description: 'Up to $275K · 2 years · Exploratory/developmental. Lower preliminary data bar than R01. Good for testing novel, high-risk ideas.',
      },
      {
        label: 'NSF SBIR Phase I',
        description: '~$275K · 6-12 months · Emphasis on technological innovation + broad societal/economic impact. Strong commercialization orientation.',
      },
      {
        label: 'NSF SBIR Phase II',
        description: 'Up to $1M · 2 years · Builds on NSF Phase I. Requires clear path to market and demonstrated innovation.',
      },
      {
        label: 'NSF STTR',
        description: 'Like SBIR but requires a formal university research partner. Best if your IP or core technology originated in academia.',
      },
      {
        label: 'DoD / DARPA BAA',
        description: 'Mission-critical framing required. DARPA funds "moonshot" high-risk/high-reward concepts. Larger awards, longer timelines, defense relevance essential.',
      },
      {
        label: 'BARDA',
        description: 'Biomedical Advanced Research and Development Authority. Funds advanced medical countermeasures and emergency preparedness technologies. Very large late-stage awards.',
      },
      {
        label: 'ARPA-H',
        description: 'NIH\'s DARPA-equivalent. Funds bold, time-bound programs for systems-level transformation in health — not incremental research. Milestone-driven.',
      },
      {
        label: 'Other',
        description: 'Other federal, state, or private funding mechanism not listed above.',
      },
    ],
  },
  {
    key: 'developmentStage',
    label: 'Stage',
    question: 'What is the current development stage of the technology?',
    hint: 'This determines which feasibility claims you can credibly make.',
    type: 'select',
    options: [
      { label: 'Concept / Idea Only' },
      { label: 'Prototype Built' },
      { label: 'Bench Testing Complete' },
      { label: 'Pre-clinical / Animal Studies' },
      { label: 'Clinical Pilot / Feasibility Study' },
      { label: 'FDA Submission in Progress' },
      { label: 'FDA Cleared / Approved' },
    ],
  },
];

export function IntakeFlow({ onComplete, onStepSave, initialData, initialStep, onSkip }: Props) {
  const [step, setStep] = useState(initialStep ?? 0);
  const [data, setData] = useState<Partial<IntakeData>>(initialData ?? {});
  const [saving, setSaving] = useState(false);

  const currentStep = STEPS[step];
  const value = (data[currentStep.key] as string) ?? '';
  const isLast = step === STEPS.length - 1;
  const canAdvance = value.trim().length > 0;

  const handleChange = (val: string) => {
    setData((prev) => ({ ...prev, [currentStep.key]: val }));
  };

  const handleNext = async () => {
    if (!canAdvance) return;
    if (isLast) {
      setSaving(true);
      try {
        await onComplete(data as IntakeData);
      } finally {
        setSaving(false);
      }
    } else {
      const next = step + 1;
      setStep(next);
      onStepSave?.({ ...data, _step: next } as any);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (currentStep.type !== 'textarea' && e.key === 'Enter' && canAdvance) {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-none">
        <Sparkles className="w-4 h-4 text-gm-navy" />
        <span className="text-sm font-semibold text-gray-800">Project Context</span>
        <span className="ml-auto text-[10px] text-gray-400">
          {step + 1} of {STEPS.length}
        </span>
      </div>

      {/* Step rail — all 8 steps always visible */}
      <div className="px-4 py-3 border-b border-gray-100 flex-none bg-gray-50">
        <div className="flex items-start justify-between">
          {STEPS.map((s, i) => {
            const isDone = i < step;
            const isActive = i === step;
            const isFuture = i > step;
            const hasAnswer = !!(data[s.key] as string)?.trim();

            return (
              <div key={s.key} className="flex flex-col items-center gap-1 flex-1 relative">
                {/* Connecting line (left half) */}
                {i > 0 && (
                  <div
                    className={`absolute top-[9px] right-1/2 w-full h-px ${
                      isDone || isActive ? 'bg-gm-navy' : 'bg-gray-200'
                    }`}
                  />
                )}

                {/* Circle */}
                <button
                  onClick={() => isDone ? setStep(i) : undefined}
                  disabled={!isDone}
                  className={`relative z-10 w-[18px] h-[18px] rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                    isDone
                      ? 'bg-gm-navy cursor-pointer hover:bg-gm-navy-dark'
                      : isActive
                      ? 'bg-gm-navy ring-2 ring-gm-navy ring-offset-1 cursor-default'
                      : 'bg-white border border-gray-300 cursor-default'
                  }`}
                  title={isDone ? `Go back to ${s.label}` : s.label}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  ) : (
                    <span
                      className={`text-[9px] font-bold leading-none ${
                        isActive ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {i + 1}
                    </span>
                  )}
                </button>

                {/* Label */}
                <span
                  className={`text-[9px] leading-tight text-center max-w-[36px] truncate ${
                    isActive
                      ? 'text-gm-navy font-semibold'
                      : isDone
                      ? 'text-gray-500'
                      : 'text-gray-300'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex flex-col px-4 py-5 gap-4 overflow-y-auto">
        {/* Step label */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gm-navy bg-gm-cyan-soft px-2 py-0.5 rounded-full">
            {currentStep.label}
          </span>
        </div>

        {/* Question */}
        <p className="text-sm font-semibold text-gray-800 leading-snug">
          {currentStep.question}
        </p>

        {/* Input */}
        {currentStep.type === 'select' ? (
          <div className="flex flex-col gap-2">
            {currentStep.options!.map((opt) => (
              <button
                key={opt.label}
                onClick={() => handleChange(opt.label)}
                className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
                  value === opt.label
                    ? 'border-gm-navy bg-gm-cyan-soft'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <p className={`text-sm font-medium leading-snug ${
                  value === opt.label ? 'text-gm-navy' : 'text-gray-700'
                }`}>
                  {opt.label}
                </p>
                {opt.description && (
                  <p className={`text-[11px] mt-0.5 leading-snug ${
                    value === opt.label ? 'text-gm-navy opacity-75' : 'text-gray-400'
                  }`}>
                    {opt.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        ) : currentStep.type === 'textarea' ? (
          <textarea
            autoFocus
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={currentStep.hint}
            rows={5}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gm-cyan-soft focus:border-gm-navy resize-none"
          />
        ) : (
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder={currentStep.hint}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gm-cyan-soft focus:border-gm-navy"
          />
        )}

        {/* Hint text for non-select */}
        {currentStep.type !== 'select' && (
          <p className="text-[10px] text-gray-400 leading-relaxed -mt-2">{currentStep.hint}</p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-none px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canAdvance || saving}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gm-navy text-white text-sm font-medium rounded-lg hover:bg-gm-navy-dark disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>Saving context…</>
            ) : isLast ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Complete — Start Drafting
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
        {onSkip && (
          <button
            onClick={onSkip}
            className="w-full text-center text-[10px] text-gray-300 hover:text-gray-500 mt-2 transition-colors"
          >
            Skip for now — add context later via Edit Context
          </button>
        )}
      </div>
    </div>
  );
}
