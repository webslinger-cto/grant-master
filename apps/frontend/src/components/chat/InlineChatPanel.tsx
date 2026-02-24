'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Loader2, PenLine, FilePlus, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { chatService, ChatMessage } from '@/lib/services/chat.service';
import { api } from '@/lib/api';
import { Application } from '@/lib/services/applications.service';
import { IntakeFlow, IntakeData } from './IntakeFlow';
import { IntakeEditModal } from './IntakeEditModal';

// Sections available in the "Add to Draft" picker
const DRAFT_SECTIONS = [
  { key: 'project_summary',       label: 'Project Summary / Abstract' },
  { key: 'specific_aims',         label: 'Specific Aims' },
  { key: 'significance',          label: 'Significance' },
  { key: 'innovation',            label: 'Innovation' },
  { key: 'approach',              label: 'Approach' },
  { key: 'project_narrative',     label: 'Project Narrative' },
  { key: 'budget_justification',  label: 'Budget Justification' },
  { key: 'biosketch',             label: 'Biographical Sketch' },
  { key: 'facilities_resources',  label: 'Facilities & Resources' },
  { key: 'data_management_plan',  label: 'Data Management Plan' },
];

const QUICK_ACTIONS = [
  {
    label: 'Specific Aims',
    prompt: 'Draft a compelling Specific Aims page for this application. Open with a sharp statistic that quantifies the clinical problem, define the unmet gap, state the central hypothesis, then outline 2–3 aims with testable milestones. Close with an innovation paragraph and an impact statement. Make it stand alone — a reviewer reading only this page should understand the full story.',
  },
  {
    label: 'Strengthen Significance',
    prompt: 'Critique and rewrite the Significance section using the Narrative Structure: (1) quantify the clinical/scientific problem with hard numbers and citations, (2) explain specifically why current approaches fail, (3) identify the precise knowledge gap, (4) explain how this work fills it. Flag any vague or generic statements and replace them with data-driven arguments.',
  },
  {
    label: 'Articulate Innovation',
    prompt: 'Help me frame the Innovation section for maximum reviewer impact. Identify what is genuinely novel (new concept, method, application, or IP position), explain why existing approaches are insufficient, and position this as a paradigm shift. Reference the competitive landscape and explain how we advance beyond it.',
  },
  {
    label: 'R&D Approach Plan',
    prompt: 'Help me structure the Approach section. For each Aim, provide: Hypothesis → Rationale → Experimental Design → Expected Outcomes → Potential Pitfalls & Mitigations → Go/No-Go criteria. Include a commercialization pathway (Phase I POC milestones → Phase II validation). Flag any areas where alternative approaches should be added.',
  },
  {
    label: 'Reviewer Critique',
    prompt: 'Act as a tough NIH study section reviewer. Score this application on all 5 criteria (Significance, Innovation, Investigators, Approach, Environment) from 1–9, identify the weakest areas, and give specific, actionable feedback on what would move the score from a 3 to a 2. Be direct — do not soften the critique.',
  },
  {
    label: 'Commercialization',
    prompt: 'Draft a strong commercialization section for this SBIR application. Include: market size (TAM/SAM/SOM with sources), competitive landscape, regulatory pathway (510(k)/PMA/De Novo with rationale), reimbursement strategy, revenue model, and named or described commercial partners. Make it investor-grade, not academic.',
  },
];

interface Props {
  applicationId: string | null;
  application: Application | null;
  userId: string;
  onSectionGenerated?: () => void;
  onApplicationUpdate?: (data: Partial<Application>) => void;
}

// Per-message draft state
interface DraftState {
  open: boolean;
  saving: boolean;
  saved: boolean;
}

export function InlineChatPanel({
  applicationId,
  application,
  userId,
  onSectionGenerated,
  onApplicationUpdate,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showIntake, setShowIntake] = useState(false);
  const [intakeCompleted, setIntakeCompleted] = useState(false);
  const [draftStates, setDraftStates] = useState<Record<string, DraftState>>({});
  const [contextExpanded, setContextExpanded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevAppId = useRef<string | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // When application changes: reset messages and decide whether to show intake
  useEffect(() => {
    if (!applicationId || applicationId === prevAppId.current) return;
    prevAppId.current = applicationId;
    setMessages([]);
    setDraftStates({});

    // Show intake if never started, or started but not yet marked complete
    const hasCompletedIntake = !!application?.metadata?.intakeComplete;
    setIntakeCompleted(hasCompletedIntake);
    setShowIntake(!hasCompletedIntake);

    if (hasCompletedIntake) {
      chatService.getChatHistory(applicationId)
        .then(setMessages)
        .catch(() => {});
    }
  }, [applicationId, application]);

  const handleIntakeComplete = async (intakeData: IntakeData) => {
    if (!applicationId || !application) return;
    const updatedMetadata = {
      ...(application.metadata ?? {}),
      intake: intakeData,
      intakeComplete: true,
    };
    await onApplicationUpdate?.({ metadata: updatedMetadata });
    setIntakeCompleted(true);  // set locally — don't wait for prop to propagate
    setShowIntake(false);
    chatService.getChatHistory(applicationId).then(setMessages).catch(() => {});
  };

  // Called after each step to persist partial progress
  const handleStepSave = (partial: Partial<IntakeData> & { _step?: number }) => {
    if (!applicationId || !application) return;
    const updatedMetadata = {
      ...(application.metadata ?? {}),
      intake: partial,
      intakeComplete: false,  // not yet complete — keeps chat locked
    };
    // Fire-and-forget: don't await, don't block the UI
    onApplicationUpdate?.({ metadata: updatedMetadata });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !applicationId) return;

    const content = input.trim();
    const userMsg: ChatMessage = {
      id: `tmp-${Date.now()}`,
      application_id: applicationId,
      user_id: userId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const body = await api.post<any>('/chat/message', { applicationId, content });
      const payload = body?.data ?? body;
      const assistantContent: string = payload?.response ?? payload?.assistantMessage?.content ?? '';
      const assistantId: string = payload?.assistantMessage?.id ?? `ai-${Date.now()}`;

      const assistantMsg: ChatMessage = {
        id: assistantId,
        application_id: applicationId,
        user_id: userId,
        role: 'assistant',
        content: assistantContent,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      onSectionGenerated?.();
    } catch (err: any) {
      const errMsg = err?.response?.data?.errors?.[0]?.message ?? 'Failed to get a response. Please try again.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          application_id: applicationId,
          user_id: 'system',
          role: 'assistant',
          content: `⚠️ ${errMsg}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openDraftPicker = (msgId: string) => {
    setDraftStates((prev) => ({
      ...prev,
      [msgId]: { open: true, saving: false, saved: prev[msgId]?.saved ?? false },
    }));
  };

  const closeDraftPicker = (msgId: string) => {
    setDraftStates((prev) => ({
      ...prev,
      [msgId]: { ...prev[msgId], open: false },
    }));
  };

  const saveAsDraft = async (msgId: string, sectionKey: string, content: string) => {
    if (!applicationId) return;
    setDraftStates((prev) => ({
      ...prev,
      [msgId]: { open: false, saving: true, saved: false },
    }));
    try {
      await api.post('/chat/save-to-draft', { applicationId, sectionKey, content });
      setDraftStates((prev) => ({
        ...prev,
        [msgId]: { open: false, saving: false, saved: true },
      }));
      onSectionGenerated?.();
    } catch {
      setDraftStates((prev) => ({
        ...prev,
        [msgId]: { open: false, saving: false, saved: false },
      }));
    }
  };

  const noApp = !applicationId;
  const intakeComplete = intakeCompleted;

  // ── Intake view ─────────────────────────────────────────────────────
  if (applicationId && showIntake) {
    const savedIntake = application?.metadata?.intake as (Partial<IntakeData> & { _step?: number }) | undefined;
    return (
      <IntakeFlow
        onComplete={handleIntakeComplete}
        onStepSave={handleStepSave}
        initialData={savedIntake}
        initialStep={savedIntake?._step ?? 0}
        onSkip={() => setShowIntake(false)}
      />
    );
  }

  // ── Normal chat view ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-none">
        <Sparkles className="w-4 h-4 text-gm-navy" />
        <span className="text-sm font-semibold text-gray-800">AI Counsel</span>
        {!noApp && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400" title="Ready" />
        )}
      </div>

      {/* Project Context Summary — visible when intake is complete */}
      {intakeCompleted && application?.metadata?.intake && (() => {
        const intake = application.metadata.intake as IntakeData & { _step?: number };
        return (
          <div className="border-b border-gray-100 flex-none">
            <button
              onClick={() => setContextExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gm-navy">Project Context</span>
                <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Saved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }}
                  className="text-[10px] text-gray-400 hover:text-gm-navy flex items-center gap-0.5 transition-colors"
                  title="Edit project context"
                >
                  <PenLine className="w-2.5 h-2.5" />
                  Edit
                </button>
                {contextExpanded
                  ? <ChevronUp className="w-3 h-3 text-gray-400" />
                  : <ChevronDown className="w-3 h-3 text-gray-400" />}
              </div>
            </button>

            {contextExpanded && (
              <div className="px-3 pb-3 space-y-2 text-xs">
                {intake.projectName && (
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400">Project</span>
                    <p className="text-gray-800 font-medium">{intake.projectName}</p>
                  </div>
                )}
                {intake.oneLiner && (
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400">One-liner</span>
                    <p className="text-gray-700 leading-relaxed">{intake.oneLiner}</p>
                  </div>
                )}
                {intake.clinicalProblem && (
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400">Clinical Problem</span>
                    <p className="text-gray-700 leading-relaxed line-clamp-3">{intake.clinicalProblem}</p>
                  </div>
                )}
                {intake.targetUsers && (
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400">Target Users</span>
                    <p className="text-gray-700">{intake.targetUsers}</p>
                  </div>
                )}
                {intake.coreTechnology && (
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400">Core Technology</span>
                    <p className="text-gray-700 leading-relaxed line-clamp-2">{intake.coreTechnology}</p>
                  </div>
                )}
                {intake.differentiation && (
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400">Differentiation</span>
                    <p className="text-gray-700 leading-relaxed line-clamp-2">{intake.differentiation}</p>
                  </div>
                )}
                {intake.fundingMechanism && (
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400">Funding Mechanism</span>
                    <p className="text-gray-700">{intake.fundingMechanism}</p>
                  </div>
                )}
                {intake.developmentStage && (
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400">Stage</span>
                    <p className="text-gray-700">{intake.developmentStage}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Quick Actions — locked until intake complete */}
      <div className="px-3 py-2.5 border-b border-gray-50 bg-gray-50 flex-none">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Quick Actions</p>
          {!intakeComplete && !noApp && (
            <button
              onClick={() => setShowIntake(true)}
              className="text-[10px] text-gm-navy hover:underline"
            >
              Add project context first →
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              disabled={isLoading || noApp || !intakeComplete}
              onClick={() => { setInput(a.prompt); inputRef.current?.focus(); }}
              className="text-[11px] text-left px-2.5 py-1.5 bg-white rounded-md border border-gray-200 text-gray-600 hover:border-gm-cyan-soft hover:bg-gm-cyan-soft hover:text-gm-navy transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {a.label}
            </button>
          ))}
        </div>
        {!intakeComplete && !noApp && (
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            Complete project context to unlock quick actions
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {noApp ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 pt-10">
            <Sparkles className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs text-center">Select a grant to start chatting</p>
          </div>
        ) : messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 pt-10">
            <Sparkles className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs text-center text-gray-400">Ask me anything about this grant</p>
            <p className="text-[10px] text-center text-gray-300 mt-1">
              I can draft sections, provide feedback, and answer questions.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="relative max-w-[90%] group">
                  <div
                    className={`rounded-xl px-3.5 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-gm-navy text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <span className={`text-[10px] mt-1 block ${msg.role === 'user' ? 'text-cyan-100' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Add to Draft button — assistant messages only */}
                  {msg.role === 'assistant' && !msg.content.startsWith('⚠️') && applicationId && (
                    <div className="mt-1.5 relative">
                      {draftStates[msg.id]?.saved ? (
                        <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                          <Check className="w-3 h-3" /> Saved to draft
                        </span>
                      ) : draftStates[msg.id]?.saving ? (
                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              draftStates[msg.id]?.open
                                ? closeDraftPicker(msg.id)
                                : openDraftPicker(msg.id)
                            }
                            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gm-navy transition-colors group-hover:opacity-100"
                          >
                            <FilePlus className="w-3 h-3" />
                            Add to Draft
                            <ChevronDown className="w-2.5 h-2.5" />
                          </button>

                          {/* Section picker dropdown */}
                          {draftStates[msg.id]?.open && (
                            <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-52">
                              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                                Save to section
                              </p>
                              {DRAFT_SECTIONS.map((s) => (
                                <button
                                  key={s.key}
                                  onClick={() => saveAsDraft(msg.id, s.key, msg.content)}
                                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gm-cyan-soft hover:text-gm-navy transition-colors"
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-xl px-3.5 py-2.5 bg-gray-100 text-gray-900 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin text-gm-navy" />
                    <span className="text-[10px] text-gray-400">Thinking…</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Edit Context Modal */}
      {showEditModal && (
        <IntakeEditModal
          initialData={(application?.metadata?.intake as Partial<IntakeData>) ?? {}}
          onClose={() => setShowEditModal(false)}
          onSave={async (updated) => {
            await handleIntakeComplete(updated);
            setShowEditModal(false);
          }}
        />
      )}

      {/* Input */}
      <div className="px-3 py-3 border-t border-gray-100 flex-none">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={noApp ? 'Select a grant first…' : 'Ask anything about this grant…'}
            disabled={isLoading || noApp}
            rows={2}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gm-cyan-soft focus:border-gm-cyan resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || noApp}
            className="flex-shrink-0 p-2.5 bg-gm-navy text-white rounded-lg hover:bg-gm-navy-dark disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
