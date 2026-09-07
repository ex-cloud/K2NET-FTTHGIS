import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-compat";
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
  Sparkles,
  Copy,
  ExternalLink,
  Loader2,
  Info,
} from "lucide-react";
import {
  Card,
  Button,
  ActionTooltip,
  UniversalContextMenu,
  ContextMenuGroupConfig,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@k2net/ui";
import { GovernanceHealthBanner } from "@/components/governance-health-banner";

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

interface EndpointUsage {
  controller: string;
  method: string;
  httpMethod: string;
  path: string;
  authorizationExpression: string;
}

interface PermissionUsageResponse {
  code: string;
  usages: EndpointUsage[];
  totalUsages: number;
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
    ? "bg-primary/15 text-primary border border-primary/30"
    : "bg-sky-500/15 text-sky-400 border border-sky-500/30";
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

  // Traceability Modal state
  const [selectedUsageCode, setSelectedUsageCode] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<PermissionUsageResponse | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

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
    [session?.accessToken]
  );

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const fetchUsages = async (code: string) => {
    setSelectedUsageCode(code);
    setLoadingUsage(true);
    try {
      const res = await fetch(`/api/v1/security/permissions/${encodeURIComponent(code)}/usages`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (!res.ok) throw new Error("Gagal memuat jejak endpoint");
      const data: PermissionUsageResponse = await res.json();
      setUsageData(data);
    } catch (err) {
      toast.error("Gagal memuat traceability endpoint");
    } finally {
      setLoadingUsage(false);
    }
  };

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
  // Filter
  // ──────────────────────────────────────────────────────────────────────────
  const filtered = permissions.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.module.toLowerCase().includes(q);
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
        {/* GOVERNANCE HEALTH BANNER */}
        <GovernanceHealthBanner onSelectPermission={(code) => setSearch(code)} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/15 border border-primary/25">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Manajemen Permission</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Kelola seluruh kode hak akses yang tersedia di platform
              </p>
            </div>
          </div>
          <div className="sm:ml-auto flex items-center gap-2">
            <ActionTooltip label="Segarkan Data Permission" shortcut="R">
              <button
                onClick={() => fetchPermissions(true)}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-card/5 border border-border/80 transition-all disabled:opacity-40"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </ActionTooltip>
            <ActionTooltip label="Tambah Permission Baru" shortcut="C">
              <button
                id="btn-add-permission"
                onClick={() => setShowDialog(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-lg shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                Tambah Permission
              </button>
            </ActionTooltip>
          </div>
        </div>

        {/* Stats row with glowingEffect */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Permission", value: permissions.length, color: "text-foreground" },
            { label: "Module Aktif", value: Object.keys(groupByModule(permissions)).length, color: "text-sky-400" },
            {
              label: "Scope SYSTEM",
              value: permissions.filter((p) => p.scope === "SYSTEM").length,
              color: "text-primary",
            },
            {
              label: "Scope TENANT",
              value: permissions.filter((p) => p.scope === "TENANT").length,
              color: "text-primary",
            },
          ].map((stat) => (
            <Card
              key={stat.label}
              glowingEffect
              className="rounded-xl border border-border bg-card/60 backdrop-blur-md p-4"
            >
              <p className="text-xs text-foreground/75 dark:text-muted-foreground mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="input-permission-search"
              type="text"
              placeholder="Cari permission (code, name, module)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-card/60 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            {["ALL", "SYSTEM", "TENANT"].map((s) => (
              <button
                key={s}
                id={`filter-scope-${s.toLowerCase()}`}
                onClick={() => setScopeFilter(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  scopeFilter === s
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                }`}
              >
                {s === "ALL" ? "Semua" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Module Groups */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48 bg-card/20 rounded-xl border border-border">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : moduleKeys.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border border-border rounded-xl bg-card/20">
            Tidak ada permission yang cocok dengan pencarian.
          </div>
        ) : (
          <div className="space-y-4">
            {moduleKeys.map((mod) => (
              <ModuleGroup
                key={mod}
                module={mod}
                permissions={grouped[mod]}
                onDelete={(p) => setDeleteTarget(p)}
                onViewUsages={fetchUsages}
              />
            ))}
          </div>
        )}
      </div>

      {/* CREATE DIALOG */}
      {showDialog && (
        <CreatePermissionDialog
          form={form}
          setForm={setForm}
          onClose={() => setShowDialog(false)}
          onSubmit={handleCreate}
          isSubmitting={isSubmitting}
        />
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteTarget && (
        <DeleteConfirmDialog
          permission={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          isSubmitting={isSubmitting}
        />
      )}

      {/* TRACEABILITY MODAL */}
      <TraceabilityModal
        code={selectedUsageCode}
        data={usageData}
        loading={loadingUsage}
        onClose={() => setSelectedUsageCode(null)}
      />
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
  onViewUsages,
}: {
  module: string;
  permissions: Permission[];
  onDelete: (p: Permission) => void;
  onViewUsages: (code: string) => void;
}) {
  const [open, setOpen] = useState(true);

  const getPermissionContextMenuGroups = (p: Permission): ContextMenuGroupConfig[] => [
    {
      items: [
        {
          label: "Lihat Traceability Endpoint",
          icon: Code2,
          onClick: () => onViewUsages(p.code),
        },
        {
          label: "Tanya AI tentang Permission Ini",
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: {
                  prompt: `Jelaskan fungsi permission "${p.code}" (${p.name}), modul ${p.module}, dan scope ${p.scope} dalam arsitektur RBAC sistem FTTH GIS.`,
                },
              })
            );
            window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
          },
        },
      ],
    },
    {
      items: [
        {
          label: "Salin Kode Permission",
          icon: Copy,
          shortcut: "Ctrl+C",
          onClick: () => {
            navigator.clipboard.writeText(p.code);
            toast.success(`Kode permission "${p.code}" disalin!`);
          },
        },
        {
          label: "Salin Nama Permission",
          icon: Tag,
          shortcut: "Alt+C",
          onClick: () => {
            navigator.clipboard.writeText(p.name);
            toast.success(`Nama permission "${p.name}" disalin!`);
          },
        },
      ],
    },
    {
      items: [
        {
          label: "Hapus Permission",
          icon: Trash2,
          shortcut: "Del",
          onClick: () => onDelete(p),
        },
      ],
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
      {/* Module header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors text-left"
      >
        <Layers className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-semibold text-foreground capitalize flex-1">{module}</span>
        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted border border-border">
          {permissions.length}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Permission rows */}
      {open && (
        <div className="border-t border-border divide-y divide-border/40">
          {permissions.map((p) => (
            <UniversalContextMenu key={p.id} groups={getPermissionContextMenuGroups(p)}>
              <div className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors group">
                <Code2 className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onViewUsages(p.code)}
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 px-1.5 py-0.5 rounded border border-sky-500/20 transition-all text-left group/btn"
                      title="Klik untuk melihat endpoint yang menggunakan permission ini"
                    >
                      <span>{p.code}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover/btn:opacity-100" />
                    </button>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${scopeBadge(p.scope)}`}>
                      {p.scope}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{p.name}</p>
                  {p.description && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">{p.description}</p>
                  )}
                </div>
                <ActionTooltip label="Hapus Permission" shortcut="Del">
                  <button
                    id={`btn-delete-perm-${p.id}`}
                    onClick={() => onDelete(p)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground/60 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </ActionTooltip>
              </div>
            </UniversalContextMenu>
          ))}
        </div>
      )}
    </div>
  );
}

function TraceabilityModal({
  code,
  data,
  loading,
  onClose,
}: {
  code: string | null;
  data: PermissionUsageResponse | null;
  loading: boolean;
  onClose: () => void;
}) {
  if (!code) return null;

  return (
    <Dialog open={!!code} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-sky-500/10 text-sky-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                Traceability Endpoint
                <code className="text-xs font-mono text-sky-400 bg-sky-500/15 px-2 py-0.5 rounded border border-sky-500/30">
                  {code}
                </code>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Daftar endpoint controller backend yang diproteksi oleh kode hak akses ini.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-2 max-h-[350px] overflow-y-auto custom-scrollbar space-y-3">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
              Memindai metadata otorisasi endpoint...
            </div>
          ) : !data || data.usages.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/10 space-y-1 text-center">
              <span className="text-sm font-semibold text-amber-400 block">⚪ Belum Digunakan (Dead Entry)</span>
              <p className="text-xs text-muted-foreground">
                Permission ini belum diterapkan pada anotasi <code>@PreAuthorize</code> di controller backend manapun.
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2.5">HTTP &amp; Path</th>
                    <th className="p-2.5">Controller &amp; Method</th>
                    <th className="p-2.5">Otorisasi (SpEL)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.usages.map((u, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="p-2.5">
                        <span className="font-bold text-sky-400 font-mono text-[10px] mr-1.5 px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                          {u.httpMethod}
                        </span>
                        <span className="font-mono text-foreground">{u.path}</span>
                      </td>
                      <td className="p-2.5 font-mono text-muted-foreground">
                        <span className="text-foreground font-medium">{u.controller}</span>.{u.method}()
                      </td>
                      <td className="p-2.5 font-mono text-[10px] text-muted-foreground break-all">
                        {u.authorizationExpression}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} className="border-border">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/15 border border-primary/25">
            <Plus className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Tambah Permission Baru</h2>
            <p className="text-xs text-muted-foreground">Isi detail permission yang ingin ditambahkan</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Module */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Module <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                id="input-perm-module"
                type="text"
                list="module-suggestions"
                value={form.module}
                onChange={(e) => handleField("module", e.target.value)}
                placeholder="contoh: nodes, customers, billing"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all"
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
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="input-perm-name"
              type="text"
              value={form.name}
              onChange={(e) => handleField("name", e.target.value)}
              placeholder="contoh: View Network Nodes"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Code */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Code <span className="text-rose-400">*</span>
            </label>
            <input
              id="input-perm-code"
              type="text"
              value={form.code}
              onChange={(e) => handleField("code", e.target.value)}
              placeholder="contoh: nodes.view atau system.nodes.manage"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary font-mono transition-all"
            />
          </div>

          {/* Scope */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Scope</label>
            <div className="grid grid-cols-2 gap-2">
              {SCOPE_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleField("scope", s)}
                  className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                    form.scope === s
                      ? "bg-primary/15 border-primary text-primary font-semibold"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Deskripsi (Opsional)
            </label>
            <textarea
              id="input-perm-desc"
              value={form.description}
              onChange={(e) => handleField("description", e.target.value)}
              rows={2}
              placeholder="Deskripsi singkat fungsi permission ini..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 border-border text-muted-foreground hover:text-foreground"
          >
            Batal
          </Button>
          <Button
            id="btn-submit-create-perm"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tambah Permission"}
          </Button>
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
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">Hapus Permission?</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Apakah Anda yakin ingin menghapus kode permission{" "}
          <code className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">
            {permission.code}
          </code>
          ? Tindakan ini akan mencabut permission ini dari seluruh role.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 border-border text-muted-foreground hover:text-foreground"
          >
            Batal
          </Button>
          <Button
            id="btn-confirm-delete-perm"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 bg-rose-600 hover:bg-rose-500 text-foreground font-semibold shadow-lg shadow-rose-600/20"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hapus"}
          </Button>
        </div>
      </div>
    </div>
  );
}
