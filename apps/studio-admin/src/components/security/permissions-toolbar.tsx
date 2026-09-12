import { Shield, Plus, Search, Filter, RefreshCw } from "lucide-react";
import { Card, ActionTooltip } from "@k2net/ui";

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
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-card/5 border border-border/80 transition-all disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </ActionTooltip>
          <ActionTooltip label="Tambah Permission Baru" shortcut="C">
            <button
              id="btn-add-permission"
              onClick={onOpenCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id="input-permission-search"
            type="text"
            placeholder="Cari permission (code, name, module)…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-card/60 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {["ALL", "SYSTEM", "TENANT"].map((s) => (
            <button
              key={s}
              id={`filter-scope-${s.toLowerCase()}`}
              onClick={() => onScopeFilterChange(s)}
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
    </>
  );
}
