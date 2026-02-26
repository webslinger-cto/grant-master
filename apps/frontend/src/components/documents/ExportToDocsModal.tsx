'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X, Loader2, FileCheck, ExternalLink, Copy, Check, AlertTriangle, Link } from 'lucide-react';
import { exportService, ExportToDocsResult } from '@/lib/services/export.service';

interface Props {
  applicationId: string;
  grantName: string;
  sectionCount: number;
  onClose: () => void;
}

type Step = 'checking' | 'connect' | 'form' | 'loading' | 'success';

// Minimal Google Docs colour logo mark
function GoogleDocsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="4" fill="#4285F4" />
      <path d="M6 6h12v2H6V6zm0 4h12v2H6v-2zm0 4h8v2H6v-2z" fill="white" />
    </svg>
  );
}

export function ExportToDocsModal({ applicationId, grantName, sectionCount, onClose }: Props) {
  const [step, setStep] = useState<Step>('checking');
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [result, setResult] = useState<ExportToDocsResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check Drive connection on mount
  useEffect(() => {
    exportService.getDriveStatus()
      .then(({ connected }) => setStep(connected ? 'form' : 'connect'))
      .catch(() => setStep('connect'));
  }, []);

  // ── Email chip helpers ───────────────────────────────────────────────
  const commitEmail = () => {
    const val = emailInput.trim().toLowerCase();
    if (!val) return;
    if (!val.includes('@') || emails.includes(val)) { setEmailInput(''); return; }
    setEmails((prev) => [...prev, val]);
    setEmailInput('');
  };

  const removeEmail = (email: string) =>
    setEmails((prev) => prev.filter((e) => e !== email));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commitEmail(); }
    else if (e.key === 'Backspace' && !emailInput && emails.length) {
      removeEmail(emails[emails.length - 1]);
    }
  };

  // ── Connect Google Drive (popup) ─────────────────────────────────────
  const connectDrive = () => {
    const popup = window.open(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'}/export/connect-drive`,
      'connect-google-drive',
      'width=520,height=620,scrollbars=yes',
    );

    const handler = (e: MessageEvent) => {
      if (e.data === 'drive-connected') {
        window.removeEventListener('message', handler);
        popup?.close();
        setStep('form');
      }
    };
    window.addEventListener('message', handler);

    // Fallback: if popup closed without message, re-check status
    const poll = setInterval(() => {
      if (popup?.closed) {
        clearInterval(poll);
        window.removeEventListener('message', handler);
        exportService.getDriveStatus()
          .then(({ connected }) => { if (connected) setStep('form'); })
          .catch(() => {});
      }
    }, 800);
  };

  // ── Export ───────────────────────────────────────────────────────────
  const handleExport = async () => {
    setStep('loading');
    setError(null);
    try {
      const res = await exportService.exportToGoogleDocs(
        applicationId,
        emails,
        emailMessage || undefined,
      );
      setResult(res);
      setStep('success');
    } catch (err: any) {
      const msg =
        err?.response?.data?.errors?.[0]?.message ??
        err?.response?.data?.message ??
        'Export failed. Please try again.';
      // If Drive is no longer connected (token expired), go back to connect step
      if (msg.toLowerCase().includes('authoris') || msg.toLowerCase().includes('authoriz')) {
        setStep('connect');
      } else {
        setError(msg);
        setStep('form');
      }
    }
  };

  const copyLink = async () => {
    if (!result?.docUrl) return;
    await navigator.clipboard.writeText(result.docUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <GoogleDocsIcon size={28} />
            <div>
              <p className="text-sm font-semibold text-gray-900">Export to Google Docs</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {sectionCount} section{sectionCount !== 1 ? 's' : ''} · {grantName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-5 py-5">

          {/* Checking status */}
          {step === 'checking' && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {/* Connect Drive */}
          {step === 'connect' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                <Link className="w-7 h-7 text-[#4285F4]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Connect Google Drive</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Authorise GrantsMaster to create Google Docs in your Drive.
                  This is a one-time step.
                </p>
              </div>
              <button
                onClick={connectDrive}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#4285F4] text-white text-xs font-semibold rounded-xl hover:bg-[#3367d6] transition-colors"
              >
                <GoogleDocsIcon size={14} />
                Connect Google Drive
              </button>
            </div>
          )}

          {/* Loading */}
          {step === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-10">
              <Loader2 className="w-10 h-10 animate-spin text-[#4285F4]" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-800">Creating your Google Doc…</p>
                <p className="text-xs text-gray-400 mt-1">
                  Formatting {sectionCount} sections and configuring sharing
                </p>
              </div>
            </div>
          )}

          {/* Success */}
          {step === 'success' && result && (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-2 py-3">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                  <FileCheck className="w-7 h-7 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Your Google Doc is ready</p>
                <p className="text-xs text-gray-500">
                  {result.sectionCount} section{result.sectionCount !== 1 ? 's' : ''} exported
                  {result.sharedWith > 0
                    ? ` · sharing notifications sent to ${result.sharedWith} recipient${result.sharedWith !== 1 ? 's' : ''}`
                    : ''}
                </p>
              </div>

              {/* Doc URL preview */}
              <div className="bg-gray-50 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                <GoogleDocsIcon size={16} />
                <p className="flex-1 text-xs text-gray-500 truncate">{result.docUrl}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5">
                <a
                  href={result.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#4285F4] text-white text-xs font-semibold rounded-xl hover:bg-[#3367d6] transition-colors"
                >
                  Open in Google Docs
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-xs font-medium text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {copied
                    ? <><Check className="w-3.5 h-3.5 text-green-600" /> Copied!</>
                    : <><Copy className="w-3.5 h-3.5" /> Copy Link</>}
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          {step === 'form' && (
            <div className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 bg-red-50 text-red-700 text-xs px-3.5 py-3 rounded-xl">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email chips input */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Share With
                  <span className="ml-1 normal-case font-normal text-gray-400">(optional — comma or Enter to add)</span>
                </label>
                <div
                  className="min-h-[44px] flex flex-wrap items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-400 cursor-text transition-all"
                  onClick={() => inputRef.current?.focus()}
                >
                  {emails.map((email) => (
                    <span
                      key={email}
                      className="flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium"
                    >
                      {email}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeEmail(email); }}
                        className="text-blue-400 hover:text-blue-700 transition-colors ml-0.5"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={inputRef}
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={commitEmail}
                    placeholder={emails.length ? '' : 'surgeon@hospital.edu, colleague@lab.org…'}
                    className="flex-1 min-w-[180px] text-xs outline-none placeholder:text-gray-400 bg-transparent"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Recipients get commenter access + a sharing email from Google
                </p>
              </div>

              {/* Optional personal message */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Sharing Message
                  <span className="ml-1 normal-case font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="e.g. Please review our draft — specifically the Significance and Approach sections…"
                  rows={3}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 placeholder:text-gray-400 transition-all leading-relaxed"
                />
              </div>

              {/* What will be exported */}
              <div className="bg-blue-50/60 rounded-xl px-3.5 py-3 text-xs text-blue-800 leading-relaxed">
                <span className="font-semibold">What gets exported: </span>
                All {sectionCount} current section{sectionCount !== 1 ? 's' : ''} with headings and content,
                formatted as a Google Doc. Anyone with the link can view; shared recipients can comment.
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {step === 'form' && (
          <div className="px-5 pb-5 flex gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4285F4] text-white text-xs font-semibold rounded-xl hover:bg-[#3367d6] transition-colors"
            >
              <GoogleDocsIcon size={14} />
              Export to Google Docs
              {emails.length > 0 && ` & Share with ${emails.length}`}
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="px-5 pb-5">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
