// admin upload config management desk — list, add, edit, delete cloudinary endpoints
'use client';

import React, { useState } from 'react';
import {
  Cloud,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Link,
  Activity,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import {
  useUploadConfigsQuery,
  useCreateUploadConfigMutation,
  useUpdateUploadConfigMutation,
  useDeleteUploadConfigMutation,
  useResetUploadConfigLoadMutation,
  type UploadConfig,
} from '@/hooks/queries/use-upload-config-queries';

type ModalMode = 'create' | 'edit';

interface FormState {
  name: string;
  uploadUrl: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = { name: '', uploadUrl: '', isActive: true };

export function AdminUploadConfigDesk() {
  const { data: configs = [], isLoading, isError, refetch } = useUploadConfigsQuery();

  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<UploadConfig | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const createMutation = useCreateUploadConfigMutation();
  const updateMutation = useUpdateUploadConfigMutation();
  const deleteMutation = useDeleteUploadConfigMutation();
  const resetLoadMutation = useResetUploadConfigLoadMutation();

  // close modal on Escape
  React.useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isModalOpen]);

  const openCreate = () => {
    setModalMode('create');
    setEditingConfig(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEdit = (config: UploadConfig) => {
    setModalMode('edit');
    setEditingConfig(config);
    setForm({ name: config.name, uploadUrl: config.uploadUrl, isActive: config.isActive });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.uploadUrl.trim()) {
      setFormError('upload URL is required');
      return;
    }

    try {
      new URL(form.uploadUrl.trim());
    } catch {
      setFormError('upload URL must be a valid URL');
      return;
    }

    if (modalMode === 'edit' && editingConfig) {
      updateMutation.mutate(
        {
          id: editingConfig.id,
          updates: {
            name: form.name.trim(),
            uploadUrl: form.uploadUrl.trim(),
            isActive: form.isActive,
          },
        },
        {
          onSuccess: () => setIsModalOpen(false),
          onError: (err: any) => setFormError(err.message || 'failed to update config'),
        }
      );
    } else {
      createMutation.mutate(
        {
          name: form.name.trim(),
          uploadUrl: form.uploadUrl.trim(),
          isActive: form.isActive,
        },
        {
          onSuccess: () => setIsModalOpen(false),
          onError: (err: any) => setFormError(err.message || 'failed to create config'),
        }
      );
    }
  };

  const handleDelete = (id: string) => {
    setActionError('');
    deleteMutation.mutate(id, {
      onSuccess: () => setDeleteConfirmId(null),
      onError: (err: any) => {
        setActionError(err.message || 'Failed to delete upload configuration');
        setDeleteConfirmId(null);
      },
    });
  };

  const handleResetLoad = (id: string) => {
    setActionError('');
    resetLoadMutation.mutate(id, {
      onError: (err: any) => {
        setActionError(err.message || 'Failed to reset load count');
      },
    });
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 leading-tight">Upload Configs</h2>
            <p className="text-[11px] text-slate-400 font-medium">cloudinary endpoints with load balancing</p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-slate-900/10 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Config</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError('')}
            className="text-rose-500 hover:text-rose-700 text-[11px] font-bold shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-sky-600 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-semibold text-slate-600">failed to load upload configs</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-2xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : configs.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto">
            <Cloud className="w-6 h-6 text-sky-400" />
          </div>
          <p className="text-sm font-black text-slate-700">No upload configs yet</p>
          <p className="text-xs text-slate-400 font-medium">
            Add a Cloudinary upload endpoint to get started
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-black cursor-pointer hover:bg-slate-800 transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add First Config
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => (
            <div
              key={config.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-slate-900">
                      {config.name || 'Unnamed Config'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                        config.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {config.isActive ? (
                        <ShieldCheck className="w-2.5 h-2.5" />
                      ) : (
                        <ShieldOff className="w-2.5 h-2.5" />
                      )}
                      {config.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 min-w-0">
                    <Link className="w-3 h-3 text-slate-400 shrink-0" />
                    <p className="text-[11px] text-slate-400 font-mono truncate max-w-[220px]">
                      {config.uploadUrl}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleResetLoad(config.id)}
                    disabled={resetLoadMutation.isPending}
                    title="Reset load counter"
                    className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 flex items-center justify-center transition cursor-pointer disabled:opacity-50"
                  >
                    {resetLoadMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(config)}
                    title="Edit"
                    className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center justify-center transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(config.id)}
                    title="Delete"
                    className="w-8 h-8 rounded-xl border border-rose-100 hover:bg-rose-50 text-rose-500 flex items-center justify-center transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-[11px] text-slate-400 font-medium">Load count:</span>
                <span
                  className={`text-[11px] font-black tabular-nums ${
                    config.load > 1000
                      ? 'text-rose-600'
                      : config.load > 500
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {config.load.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-300 font-medium">uploads</span>
              </div>

              {deleteConfirmId === config.id && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-rose-50 border border-rose-200">
                  <p className="text-xs font-semibold text-rose-700">
                    Delete this config permanently?
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(config.id)}
                      disabled={deleteMutation.isPending}
                      className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-black cursor-pointer hover:bg-rose-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : null}
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={modalMode === 'edit' ? 'Edit upload config' : 'Add upload config'}
            className="relative w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">
                {modalMode === 'edit' ? 'Edit Upload Config' : 'Add Upload Config'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Name <span className="text-slate-300 lowercase font-normal">— optional label</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Primary Cloudinary, Backup Account"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-400/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Cloudinary Upload URL *
                </label>
                <input
                  type="url"
                  value={form.uploadUrl}
                  onChange={(e) => setForm((f) => ({ ...f, uploadUrl: e.target.value }))}
                  placeholder="https://api.cloudinary.com/v1_1/{cloud}/image/upload?upload_preset=xxx"
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-400/20 placeholder:font-sans placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-700">Endpoint Active</span>
                  <p className="text-[11px] text-slate-400 font-medium">
                    inactive endpoints are skipped during upload routing
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                    form.isActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {form.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isMutating}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-md shadow-slate-900/10 cursor-pointer disabled:opacity-50"
              >
                {isMutating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>{modalMode === 'edit' ? 'Save Changes' : 'Add Config'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
