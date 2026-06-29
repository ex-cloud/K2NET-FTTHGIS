"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Shield,
  Plus,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Code2,
  Layers,
  Tag,
  ChevronDown,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
interface Permission {
  id: number;
  code: string;
  name: string;
  description?: string;
  module: string;
  scope: string;
}

interface NewPermissionForm {
  code: string;
  name: string;
  description: string;
  module: string;
  scope: string;
}

const SCOPE_OPTIONS = ["SYSTEM", "TENANT"] as const;
const MODULE_SUGGESTIONS = [
  "nodes",
  "network",
  "customers",
  "projects",
  "roles",
  "users",
  "reports",
  "billing",
  "settings",
  "audit",
];

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
function scopeBadge(scope: string) {
  return scope === "SYSTEM"
    ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
    : "bg-sky-500/15 text-sky-300 border border-sky-500/30";
}

function groupByModule(permissions: Permission[]) {
  return permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.module] = acc[p.module] || []).push(p);
    return acc;
  }, {});
}

// ────────────────────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────────────────────
export default function PermissionsPage() {
  const { data: session } = useSession();

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter state
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<string>("ALL");

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState<NewPermissionForm>({
    code: "",
    name: "",
    description: "",
    module: "",
    scope: "TENANT",
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Data fetching
  // ──────────────────────────────────────────────────────────────────────────
  const fetchPermissions = useCallback(
    async (silent = false) => {
      if (!session?.accessToken) return;
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);
      try {
        const res = await fetch("/api/v1/roles/permissions", {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        if (!res.ok) throw new Error("Gagal memuat daftar permission");
        const data: Permission[] = await res.json();
        setPermissions(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [session?.accessToken],
  );

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // ──────────────────────────────────────────────────────────────────────────
  // Create permission
  // ──────────────────────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!form.code.trim() || !form.name.trim() || !form.module.trim()) {
      toast.error("Code, Name, dan Module wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/roles/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal membuat permission");
      }
      toast.success(`Permission "${form.code}" berhasil ditambahkan`);
      setShowDialog(false);
      setForm({ code: "", name: "", description: "", module: "", scope: "TENANT" });
      await fetchPermissions(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Delete permission
  // ──────────────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/roles/permissions/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (!res.ok) throw new Error("Gagal menghapus permission");
      toast.success(`Permission "${deleteTarget.code}" berhasil dihapus`);
      setDeleteTarget(null);
      await fetchPermissions(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Filter & group
  // ──────────────────────────────────────────────────────────────────────────
  const filtered = permissions.filter((p) => {
    const matchSearch =
      !search ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.module.toLowerCase().includes(search.toLowerCase());
    const matchScope = scopeFilter === "ALL" || p.scope === scopeFilter;
    return matchSearch && matchScope;
  });

  const grouped = groupByModule(filtered);
  const moduleKeys = Object.keys(grouped).sort();

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 w-full min-w-0 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto w-full pb-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/15 border border-violet-500/25">
              <Shield className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">
                Manajemen Permission
              </h1>
              <p className="text-sm text-zinc-400 mt-0.5">
                Kelola seluruh kode hak akses yang tersedia di platform
              </p>
            </div>
          </div>
          <div className="sm:ml-auto flex items-center gap-2">
            <button
              onClick={() => fetchPermissions(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 border border-white/8 transition-all disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              id="btn-add-permission"
              onClick={() => setShowDialog(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-lg shadow-violet-500/20"
            >
              <Plus className="w-4 h-4" />
              Tambah Permission
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Permission", value: permissions.length, color: "text-white" },
            { label: "Module Aktif", value: Object.keys(groupByModule(permissions)).length, color: "text-sky-400" },
            { label: "Scope SYSTEM", value: permissions.filter(p => p.scope === "SYSTEM").length, color: "text-violet-400" },
            { label: "Scope TENANT", value: permissions.filter(p => p.scope === "TENANT").length, color: "text-emerald-400" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/8 bg-white/3 p-4"
            >
              <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              id="input-permission-search"
              type="text"
              placeholder="Cari permission (code, name, module)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-white/10 bg-white/4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 focus:bg-white/6 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
            {["ALL", "SYSTEM", "TENANT"].map((s) => (
              <button
                key={s}
                id={`filter-scope-${s.toLowerCase()}`}
                onClick={() => setScopeFilter(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  scopeFilter === s
                    ? "bg-violet-600 text-white"
                    : "border border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                }`}
              >
                {s === "ALL" ? "Semua" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState onAdd={() => setShowDialog(true)} />
        ) : (
          <div className="space-y-4">
            {moduleKeys.map((module) => (
              <ModuleGroup
                key={module}
                module={module}
                permissions={grouped[module]}
                onDelete={(p) => setDeleteTarget(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      {showDialog && (
        <CreatePermissionDialog
          form={form}
          setForm={setForm}
          onClose={() => {
            setShowDialog(false);
            setForm({ code: "", name: "", description: "", module: "", scope: "TENANT" });
          }}
          onSubmit={handleCreate}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          permission={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

function ModuleGroup({
  module,
  permissions,
  onDelete,
}: {
  module: string;
  permissions: Permission[];
  onDelete: (p: Permission) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
      {/* Module header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/3 transition-colors text-left"
      >
        <Layers className="w-4 h-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-white capitalize flex-1">
          {module}
        </span>
        <span className="text-xs text-zinc-500 px-2 py-0.5 rounded-full bg-white/5 border border-white/8">
          {permissions.length}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Permission rows */}
      {open && (
        <div className="border-t border-white/6 divide-y divide-white/4">
          {permissions.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 px-5 py-3 hover:bg-white/3 transition-colors group"
            >
              <Code2 className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-xs font-mono text-sky-300 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                    {p.code}
                  </code>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${scopeBadge(p.scope)}`}
                  >
                    {p.scope}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 truncate">{p.name}</p>
                {p.description && (
                  <p className="text-[10px] text-zinc-600 mt-0.5 truncate">
                    {p.description}
                  </p>
                )}
              </div>
              <button
                id={`btn-delete-perm-${p.id}`}
                onClick={() => onDelete(p)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Hapus permission"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreatePermissionDialog({
  form,
  setForm,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  form: NewPermissionForm;
  setForm: (f: NewPermissionForm) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  const handleField = (field: keyof NewPermissionForm, value: string) =>
    setForm({ ...form, [field]: value });

  // Auto-generate code from module + name if code is empty
  const autoCode = () => {
    if (!form.code && form.module && form.name) {
      const action = form.name.toLowerCase().replace(/\s+/g, "_");
      handleField("code", `${form.module.toLowerCase()}.${action}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-violet-500/15 border border-violet-500/25">
            <Plus className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Tambah Permission Baru</h2>
            <p className="text-xs text-zinc-500">Isi detail permission yang ingin ditambahkan</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Module */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Module <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                id="input-perm-module"
                type="text"
                list="module-suggestions"
                value={form.module}
                onChange={(e) => handleField("module", e.target.value)}
                placeholder="contoh: nodes, customers, billing"
                className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60 transition-all"
              />
              <datalist id="module-suggestions">
                {MODULE_SUGGESTIONS.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Nama Permission <span className="text-red-400">*</span>
            </label>
            <input
              id="input-perm-name"
              type="text"
              value={form.name}
              onChange={(e) => handleField("name", e.target.value)}
              onBlur={autoCode}
              placeholder="contoh: Lihat Daftar Node"
              className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60 transition-all"
            />
          </div>

          {/* Code */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Code (Unik) <span className="text-red-400">*</span>
            </label>
            <input
              id="input-perm-code"
              type="text"
              value={form.code}
              onChange={(e) => handleField("code", e.target.value.toLowerCase())}
              placeholder="contoh: nodes.view"
              className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/4 text-sm font-mono text-sky-300 placeholder-zinc-600 focus:outline-none focus:border-violet-500/60 transition-all"
            />
            <p className="text-[10px] text-zinc-600 mt-1">
              Format: <code>module.aksi</code> — lowercase, tanpa spasi
            </p>
          </div>

          {/* Scope */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Scope</label>
            <div className="flex gap-2">
              {SCOPE_OPTIONS.map((s) => (
                <button
                  key={s}
                  id={`scope-btn-${s.toLowerCase()}`}
                  type="button"
                  onClick={() => handleField("scope", s)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    form.scope === s
                      ? s === "SYSTEM"
                        ? "bg-violet-600/80 border-violet-500 text-white"
                        : "bg-sky-600/80 border-sky-500 text-white"
                      : "border-white/10 text-zinc-500 hover:text-white hover:border-white/20"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Deskripsi <span className="text-zinc-600">(opsional)</span>
            </label>
            <textarea
              id="input-perm-description"
              rows={2}
              value={form.description}
              onChange={(e) => handleField("description", e.target.value)}
              placeholder="Jelaskan kegunaan permission ini…"
              className="w-full px-3 py-2.5 rounded-lg border border-white/10 bg-white/4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
          >
            Batal
          </button>
          <button
            id="btn-submit-permission"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
          >
            {isSubmitting ? "Menyimpan…" : "Simpan Permission"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmDialog({
  permission,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  permission: Permission;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-6">
        <div className="flex flex-col items-center text-center gap-3 mb-5">
          <div className="p-3 rounded-full bg-red-500/15 border border-red-500/25">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Hapus Permission?</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Tindakan ini tidak dapat dibatalkan. Permission akan dihapus dari semua role yang terkait.
            </p>
          </div>
          <div className="w-full rounded-lg border border-white/8 bg-white/3 p-3 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <code className="text-xs font-mono text-sky-300">{permission.code}</code>
            </div>
            <p className="text-xs text-zinc-500 mt-1">{permission.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-lg text-sm border border-white/10 text-zinc-400 hover:text-white transition-all disabled:opacity-40"
          >
            Batal
          </button>
          <button
            id="btn-confirm-delete-permission"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Menghapus…" : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-white/8 bg-white/2 p-4 animate-pulse"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-4 w-4 bg-white/8 rounded" />
            <div className="h-4 w-24 bg-white/8 rounded" />
          </div>
          <div className="space-y-2.5 pl-7">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-center gap-3">
                <div className="h-3 w-28 bg-white/6 rounded" />
                <div className="h-3 w-40 bg-white/4 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="p-4 rounded-2xl bg-white/4 border border-white/8 mb-4">
        <Shield className="w-8 h-8 text-zinc-500" />
      </div>
      <p className="text-zinc-400 font-medium mb-1">Belum ada permission</p>
      <p className="text-sm text-zinc-600 mb-6">
        Mulai dengan menambahkan permission pertama untuk platform ini.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white transition-all"
      >
        <Plus className="w-4 h-4" />
        Tambah Permission Pertama
      </button>
    </div>
  );
}
