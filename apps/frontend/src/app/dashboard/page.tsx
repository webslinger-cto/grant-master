'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  List, FileText, MessageSquare,
  ChevronLeft, ChevronRight, RefreshCw,
  Briefcase, Search, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { GrantsList } from '@/components/grants/GrantsList';
import { DocumentPanel } from '@/components/documents/DocumentPanel';
import { InlineChatPanel } from '@/components/chat/InlineChatPanel';
import { GrantsSearch } from '@/components/grants/GrantsSearch';
import { BrandLogo } from '@/components/BrandLogo';
import { applicationsService, Application } from '@/lib/services/applications.service';

const MOCK_USER_ID = '20000001-0000-0000-0000-000000000001';

function getUserId(): string {
  if (typeof window === 'undefined') return MOCK_USER_ID;
  try {
    const token = localStorage.getItem('access_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub ?? payload.id ?? MOCK_USER_ID;
    }
  } catch {}
  return MOCK_USER_ID;
}

type ActiveView = 'pipeline' | 'search';

interface PanelState {
  list: boolean;
  document: boolean;
  chat: boolean;
}

// ── Left Nav Column ───────────────────────────────────────────────────
const NAV_ITEMS: { key: ActiveView; icon: any; label: string }[] = [
  { key: 'search',   icon: Search,    label: 'NIH Search' },
  { key: 'pipeline', icon: Briefcase, label: 'Pipeline' },
];

interface NavColumnProps {
  activeView: ActiveView;
  onViewChange: (v: ActiveView) => void;
  collapsed: boolean;
  onToggle: () => void;
}

function NavColumn({ activeView, onViewChange, collapsed, onToggle }: NavColumnProps) {
  return (
    <div
      className="flex-none flex flex-col bg-white border-r border-gray-200 transition-all duration-200 overflow-hidden z-10"
      style={{ width: collapsed ? '44px' : '160px' }}
    >
      {/* Logo / brand */}
      <div
        className={`flex items-center h-12 border-b border-gray-100 flex-none px-3 ${collapsed ? 'justify-center' : 'gap-2'}`}
      >
        <BrandLogo compact className="h-6 w-6 flex-shrink-0" />
        {!collapsed && (
          <div className="min-w-0 overflow-hidden">
            <p className="text-sm font-semibold tracking-tight leading-none mt-0.5">
              <span className="text-gm-navy">Grants</span>
              <span className="text-gm-magenta">Master</span>
            </p>
            <p className="text-[9px] leading-none text-gm-cyan mt-0.5">AI Grant Platform</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <div className="flex-1 py-2">
        {NAV_ITEMS.map(({ key, icon: Icon, label }) => {
          const active = activeView === key;
          return (
            <button
              key={key}
              onClick={() => onViewChange(key)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center transition-colors ${
                collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-2.5'
              } ${
                active
                  ? 'text-gm-navy bg-gm-cyan-soft border-r-2 border-gm-navy'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 border-r-2 border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && (
                <span className={`text-xs font-medium ${active ? 'text-gm-navy' : ''}`}>
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse toggle */}
      <div className="flex-none border-t border-gray-100 p-2 flex justify-center">
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand nav' : 'Collapse nav'}
          className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          {collapsed
            ? <PanelLeftOpen className="w-3.5 h-3.5" />
            : <PanelLeftClose className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [activeView, setActiveView] = useState<ActiveView>('pipeline');
  const [navCollapsed, setNavCollapsed] = useState(false);

  // Pipeline state
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [docRefreshTick, setDocRefreshTick] = useState(0);
  const [panels, setPanels] = useState<PanelState>({
    list: false, document: false, chat: false,
  });

  const userId = getUserId();

  const loadApplications = useCallback(async () => {
    setLoading(true);
    const apps = await applicationsService.getAll();
    setApplications(apps);
    if (apps.length) setSelectedApp((prev) => prev ?? apps[0]);
    setLoading(false);
  }, []);

  useEffect(() => { loadApplications(); }, [loadApplications]);

  // Reload whenever a new application is added (e.g. from NIH Search)
  useEffect(() => {
    const handler = () => loadApplications();
    window.addEventListener('grantmaster:pipeline-changed', handler);
    return () => window.removeEventListener('grantmaster:pipeline-changed', handler);
  }, [loadApplications]);

  const togglePanel = (key: keyof PanelState) =>
    setPanels((p) => ({ ...p, [key]: !p[key] }));

  const handleUpdateApp = async (data: Partial<Application>) => {
    if (!selectedApp) return;
    const updated = await applicationsService.update(selectedApp.id, data);
    setSelectedApp(updated);
    setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const panelWidth = (key: keyof PanelState, expanded: string) =>
    panels[key] ? '44px' : expanded;

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">

      {/* ── Left Nav Column ── */}
      <NavColumn
        activeView={activeView}
        onViewChange={setActiveView}
        collapsed={navCollapsed}
        onToggle={() => setNavCollapsed((c) => !c)}
      />

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <header className="flex-none flex items-center justify-between h-12 px-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            {activeView === 'pipeline' ? (
              <>
                <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-700">Pipeline</span>
                {selectedApp && (
                  <>
                    <span className="text-gray-300">/</span>
                    <span className="text-xs text-gray-400 max-w-[200px] truncate">
                      {selectedApp.internal_name}
                    </span>
                  </>
                )}
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-700">NIH Grants Search</span>
              </>
            )}
          </div>

          {/* Right side — panel toggles (pipeline view only) + refresh */}
          <div className="flex items-center gap-1.5">
            {activeView === 'pipeline' && (
              <>
                {(
                  [
                    { key: 'list' as const,     icon: List,         label: 'Grants'    },
                    { key: 'document' as const, icon: FileText,     label: 'Document'  },
                    { key: 'chat' as const,     icon: MessageSquare, label: 'AI Counsel' },
                  ] as const
                ).map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => togglePanel(key)}
                    title={`${panels[key] ? 'Show' : 'Hide'} ${label}`}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors ${
                      !panels[key]
                        ? 'bg-gm-cyan-soft text-gm-navy border border-gm-cyan-soft'
                        : 'text-gray-400 hover:text-gray-600 border border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <button
                  onClick={loadApplications}
                  className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </header>

        {/* ── View Content ── */}
        {activeView === 'search' ? (
          <div className="flex-1 overflow-hidden">
            <GrantsSearch />
          </div>
        ) : (
          /* Pipeline 4-panel layout */
          <div className="flex-1 flex overflow-hidden">

            {/* Panel 1: Grants List */}
            <div
              className="flex-none flex flex-col border-r border-gray-200 bg-white transition-all duration-200 overflow-hidden"
              style={{ width: panelWidth('list', '280px') }}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 flex-none">
                {!panels.list && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Grants
                  </span>
                )}
                <button
                  onClick={() => togglePanel('list')}
                  className={`p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 ${panels.list ? 'mx-auto' : 'ml-auto'}`}
                >
                  {panels.list
                    ? <ChevronRight className="w-3.5 h-3.5" />
                    : <ChevronLeft className="w-3.5 h-3.5" />}
                </button>
              </div>
              {panels.list ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <List className="w-4 h-4 text-gray-400" />
                </div>
              ) : (
                <div className="flex-1 overflow-hidden">
                  <GrantsList
                    applications={applications}
                    selectedId={selectedApp?.id ?? null}
                    onSelect={setSelectedApp}
                    onUpdate={handleUpdateApp}
                    loading={loading}
                  />
                </div>
              )}
            </div>

            {/* Panel 2 (Details) removed — details now expand inline in the grants list row */}

            {/* Panel 3: Document */}
            <div
              className="flex flex-col border-r border-gray-200 bg-white transition-all duration-200 overflow-hidden"
              style={panels.document ? { width: '44px', flex: 'none' } : { flex: '1', minWidth: 0 }}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 flex-none">
                {!panels.document && (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Document
                    </span>
                    {selectedApp && (
                      <>
                        <span className="text-gray-300 text-xs">·</span>
                        <span className="text-[10px] text-gray-400 truncate">
                          {selectedApp.internal_name}
                        </span>
                      </>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1 ml-auto">
                  {!panels.document && (
                    <button
                      onClick={() => setDocRefreshTick((t) => t + 1)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors"
                      title="Refresh sections"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => togglePanel('document')}
                    className={`p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 ${panels.document ? 'mx-auto' : ''}`}
                  >
                    {panels.document
                      ? <ChevronRight className="w-3.5 h-3.5" />
                      : <ChevronLeft className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              {panels.document ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <FileText className="w-4 h-4 text-gray-400" />
                </div>
              ) : (
                <div className="flex-1 overflow-hidden">
                  <DocumentPanel
                    applicationId={selectedApp?.id ?? null}
                    refreshTick={docRefreshTick}
                  />
                </div>
              )}
            </div>

            {/* Panel 4: AI Chat */}
            <div
              className="flex flex-col bg-white transition-all duration-200 overflow-hidden"
              style={panels.chat ? { width: '44px', flex: 'none' } : { flex: '1', minWidth: '300px' }}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 flex-none">
                {!panels.chat && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    AI Counsel
                  </span>
                )}
                <button
                  onClick={() => togglePanel('chat')}
                  className={`p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 ${panels.chat ? 'mx-auto' : 'ml-auto'}`}
                >
                  {panels.chat
                    ? <ChevronLeft className="w-3.5 h-3.5" />
                    : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
              {panels.chat ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                </div>
              ) : (
                <div className="flex-1 overflow-hidden">
                  <InlineChatPanel
                    applicationId={selectedApp?.id ?? null}
                    application={selectedApp}
                    userId={userId}
                    onSectionGenerated={() => setDocRefreshTick((t) => t + 1)}
                    onApplicationUpdate={handleUpdateApp}
                  />
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
