import { Shield, Plus, Search, Filter, RefreshCw } from "lucide-react";
import { Card, ActionTooltip } from "@k2net/ui";
import { usePermissions } from "@/hooks/use-permissions";

interface PermissionsToolbarProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenCreate: () => void;
  stats: { label: string; value: number; color: string }[];
  search: string;
  onSearchChange: (val: string) => void;
  scopeFilter: string;
  onScopeFilterChange: (val: string) => void;
}

export function PermissionsToolbar({
  onRefresh,
  isRefreshing,
  onOpenCreate,
  stats,
  search,
  onSearchChange,
  scopeFilter,
  onScopeFilterChange,
}: PermissionsToolbarProps) {
  const { canAccess } = usePermissions();
  const canManageSecurity = canAccess("system.security.manage");

  return (
    <>
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
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/80 transition-all disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
              Refresh
            </button>
          </ActionTooltip>
          <ActionTooltip
            label={
              canManageSecurity
                ? "Tambah Permission Baru"
                : "Akses Read-Only: Memerlukan izin system.security.manage"
            }
            shortcut={canManageSecurity ? "C" : undefined}
          >
            <button
              id="btn-add-permission"
              onClick={onOpenCreate}
              disabled={!canManageSecurity}
              className="flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Plus className="size-3.5" />
              Tambah Permission
            </button>
          </ActionTooltip>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((stat) => (
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
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            id="input-permission-search"
            type="text"
            placeholder="Cari permission (code, name, module)…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-4 h-8 rounded-md border border-border/80 bg-card/40 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="size-3.5 text-muted-foreground shrink-0" />
          <div className="flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-md border border-border/70">
            {["ALL", "SYSTEM", "TENANT"].map((s) => (
              <button
                key={s}
                id={`filter-scope-${s.toLowerCase()}`}
                onClick={() => onScopeFilterChange(s)}
                className={`px-2.5 h-6 rounded text-xs font-medium transition-all cursor-pointer ${
                  scopeFilter === s
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "ALL" ? "Semua" : s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
