'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FolderOpen, Plus, Copy, Pencil, Trash2, ChevronRight,
  Briefcase, Loader2, Check, X, GitBranch, FileText,
  Calendar, DollarSign,
} from 'lucide-react';
import { projectsService, Project } from '@/lib/services/projects.service';
import { IntakeEditModal } from '@/components/chat/IntakeEditModal';
import type { IntakeData } from '@/components/chat/IntakeFlow';

const STAGE_COLORS: Record<string, string> = {
  qualification: 'bg-gray-100 text-gray-600',
  planning:      'bg-blue-100 text-blue-700',
  drafting:      'bg-yellow-100 text-yellow-700',
  review:        'bg-purple-100 text-purple-700',
  submitted:     'bg-green-100 text-green-700',
};

function formatMoney(n: number | null) {
  if (!n) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function formatDate(s?: string | null) {
  if (!s) return null;
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface Props {
  onNavigateToPipeline?: (applicationId: string) => void;
}

type ModalMode = 'create' | 'edit' | 'clone' | null;

export function ProjectsView({ onNavigateToPipeline }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [modalInitialData, setModalInitialData] = useState<Partial<IntakeData>>({});
  const [newProjectName, setNewProjectName] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectsService.getAll();
      setProjects(data);
      if (data.length && !selectedId) {
        setSelectedId(data[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    setDetailLoading(true);
    projectsService.getById(selectedId)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const openCreate = () => {
    setNewProjectName('');
    setModalInitialData({});
    setModalMode('create');
  };

  const openEdit = () => {
    if (!detail) return;
    setModalInitialData((detail.context as Partial<IntakeData>) ?? {});
    setModalMode('edit');
  };

  const openClone = () => {
    if (!detail) return;
    setNewProjectName(`${detail.name} (copy)`);
    setModalInitialData((detail.context as Partial<IntakeData>) ?? {});
    setModalMode('clone');
  };

  const handleModalSave = async (data: IntakeData) => {
    if (modalMode === 'create') {
      const created = await projectsService.create({ name: newProjectName || data.projectName, context: data });
      setProjects((prev) => [...prev, { ...created, grant_count: 0 }]);
      setSelectedId(created.id);
    } else if (modalMode === 'edit' && detail) {
      const updated = await projectsService.update(detail.id, { context: data });
      setProjects((prev) => prev.map((p) => p.id === updated.id ? { ...p, ...updated } : p));
      setDetail((prev) => prev ? { ...prev, context: data } : prev);
    } else if (modalMode === 'clone' && detail) {
      const cloned = await projectsService.clone(detail.id, {
        name: newProjectName || `${detail.name} (copy)`,
        context: data,
      });
      setProjects((prev) => [...prev, { ...cloned, grant_count: 0 }]);
      setSelectedId(cloned.id);
    }
    setModalMode(null);
  };

  const handleDelete = async () => {
    if (!detail || !window.confirm(`Delete project "${detail.name}"? Associated grants will be unassigned.`)) return;
    setDeleting(true);
    try {
      await projectsService.remove(detail.id);
      setProjects((prev) => prev.filter((p) => p.id !== detail.id));
      setSelectedId(null);
      setDetail(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">

      {/* ── Left panel: project list ── */}
      <div className="flex-none flex flex-col border-r border-gray-200 bg-white overflow-hidden" style={{ width: '260px' }}>
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 flex-none">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Projects</span>
          <button
            onClick={openCreate}
            className="flex items-center gap-1 text-[10px] font-medium text-gm-navy hover:text-gm-cyan transition-colors"
            title="New project"
          >
            <Plus className="w-3 h-3" />
            New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
            </div>
          ) : projects.length === 0 ? (
            <div className="p-6 text-center">
              <FolderOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No projects yet</p>
              <button
                onClick={openCreate}
                className="mt-3 text-[11px] text-gm-navy hover:underline"
              >
                Create your first project →
              </button>
            </div>
          ) : (
            projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left px-3 py-2.5 border-b border-gray-50 transition-colors border-l-2 ${
                  selectedId === p.id
                    ? 'bg-gm-cyan-soft border-l-gm-navy'
                    : 'border-l-transparent hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <FolderOpen className={`w-3 h-3 flex-shrink-0 ${selectedId === p.id ? 'text-gm-navy' : 'text-gray-400'}`} />
                  <span className="text-xs font-medium text-gray-800 truncate flex-1">{p.name}</span>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">{p.grant_count ?? 0}</span>
                </div>
                {p.parent_project_name && (
                  <div className="flex items-center gap-1 mt-0.5 pl-4">
                    <GitBranch className="w-2.5 h-2.5 text-gray-300" />
                    <span className="text-[9px] text-gray-400 truncate">{p.parent_project_name}</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right panel: project detail ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {!selectedId ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300">
            <FolderOpen className="w-12 h-12 mb-3" />
            <p className="text-sm text-gray-400">Select a project to view details</p>
          </div>
        ) : detailLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
          </div>
        ) : detail ? (
          <>
            {/* Detail header */}
            <div className="flex-none flex items-start justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-base font-semibold text-gray-900">{detail.name}</h2>
                {detail.parent_project_name && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <GitBranch className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">Based on <span className="text-gm-navy">{detail.parent_project_name}</span></span>
                  </div>
                )}
                {detail.description && (
                  <p className="text-xs text-gray-500 mt-1">{detail.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={openEdit}
                  title="Edit project context"
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 border border-gray-200 rounded-md hover:border-gm-navy hover:text-gm-navy transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={openClone}
                  title="Clone this project"
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 border border-gray-200 rounded-md hover:border-gm-cyan hover:text-gm-navy transition-colors"
                >
                  <Copy className="w-3 h-3" /> Clone
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  title="Delete project"
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Context section */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Project Context</span>
                  {(!detail.context || Object.keys(detail.context).length === 0) && (
                    <button
                      onClick={openEdit}
                      className="text-[10px] text-gm-navy hover:underline"
                    >
                      + Add context
                    </button>
                  )}
                </div>

                {detail.context && Object.keys(detail.context).length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {[
                      { key: 'projectName',      label: 'Product Name' },
                      { key: 'fundingMechanism',  label: 'Funding Mechanism' },
                      { key: 'oneLiner',          label: 'One-Liner', span: true },
                      { key: 'clinicalProblem',   label: 'Clinical Problem', span: true },
                      { key: 'targetUsers',       label: 'Target Users' },
                      { key: 'developmentStage',  label: 'Dev Stage' },
                      { key: 'coreTechnology',    label: 'Core Technology', span: true },
                      { key: 'differentiation',   label: 'Differentiation', span: true },
                    ].map(({ key, label, span }) => {
                      const val = (detail.context as any)?.[key];
                      if (!val) return null;
                      return (
                        <div key={key} className={span ? 'col-span-2' : ''}>
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400 block">{label}</span>
                          <p className="text-xs text-gray-700 leading-relaxed mt-0.5 line-clamp-2">{val}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No context added yet — click Edit to add project details.</p>
                )}
              </div>

              {/* Associated grants */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Associated Grants ({detail.grants?.length ?? 0})
                  </span>
                </div>

                {!detail.grants?.length ? (
                  <div className="flex flex-col items-center py-8 text-gray-300">
                    <Briefcase className="w-8 h-8 mb-2" />
                    <p className="text-xs text-gray-400">No grants assigned to this project yet.</p>
                    <p className="text-[10px] text-gray-300 mt-1">
                      Assign grants from the Pipeline view or when adding from NIH Search.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detail.grants.map((grant) => (
                      <button
                        key={grant.id}
                        onClick={() => onNavigateToPipeline?.(grant.id)}
                        className="w-full text-left px-3 py-2.5 rounded-lg border border-gray-100 hover:border-gm-cyan-soft hover:bg-gm-cyan-soft/30 transition-colors group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-gray-800 truncate flex-1">
                            {grant.internal_name}
                          </span>
                          <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-gm-navy flex-shrink-0 transition-colors" />
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${STAGE_COLORS[grant.current_stage] ?? 'bg-gray-100 text-gray-600'}`}>
                            {grant.current_stage}
                          </span>
                          {formatMoney(grant.amount_requested) && (
                            <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                              <DollarSign className="w-2.5 h-2.5" />
                              {formatMoney(grant.amount_requested)}
                            </span>
                          )}
                          {grant.submission_deadline && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              {formatDate(grant.submission_deadline)}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* ── Modals ── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={() => setModalMode(null)} />

          {/* Name step for create/clone — shown before IntakeEditModal */}
          {(modalMode === 'create' || modalMode === 'clone') && (
            <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  {modalMode === 'create' ? 'New Project' : `Clone "${detail?.name}"`}
                </h2>
                <button onClick={() => setModalMode(null)} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {modalMode === 'clone' && (
                <p className="text-xs text-gray-500 mb-4">
                  Creates a copy of this project's context. Update any fields to specialise it for specific grants.
                </p>
              )}
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Project Name
              </label>
              <input
                autoFocus
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder={modalMode === 'clone' ? `${detail?.name} (copy)` : 'e.g. SurgiVision'}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gm-cyan-soft focus:border-gm-navy"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newProjectName.trim()) {
                    setModalMode(modalMode === 'create' ? 'create-context' as any : 'clone-context' as any);
                  }
                }}
              />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setModalMode(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-md">
                  Cancel
                </button>
                <button
                  disabled={!newProjectName.trim()}
                  onClick={() => setModalMode(modalMode === 'create' ? 'create-context' as any : 'clone-context' as any)}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-gm-navy text-white rounded-md disabled:opacity-40"
                >
                  Next: Add Context <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* IntakeEditModal for context entry */}
      {(modalMode === ('create-context' as any) || modalMode === ('clone-context' as any) || modalMode === 'edit') && (
        <IntakeEditModal
          initialData={modalInitialData}
          title={
            modalMode === 'edit'
              ? `Edit Context — ${detail?.name}`
              : `Set Context — ${newProjectName}`
          }
          onClose={() => setModalMode(null)}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}
