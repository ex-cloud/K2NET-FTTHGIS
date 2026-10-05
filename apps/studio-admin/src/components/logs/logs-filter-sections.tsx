import * as React from "react";
import {
  Input,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@k2net/ui";
import {
  Layers,
  Filter,
  ChevronDown,
  User,
  Shield,
  Zap,
} from "lucide-react";
import { useTranslation } from "@k2net/i18n";

export const LEVEL_OPTIONS = [
  { key: "success", label: "Success", badge: "2xx", color: "text-muted-foreground", bg: "bg-muted/20 border-border/30" },
  { key: "warning", label: "Warning", badge: "4xx", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { key: "error", label: "Error", badge: "5xx", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
];

export const SEVERITY_OPTIONS = [
  { key: "CRITICAL", label: "Critical", badge: "CRIT", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  { key: "ERROR", label: "Error", badge: "ERR", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  { key: "WARN", label: "Warning", badge: "WARN", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { key: "INFO", label: "Info", badge: "INFO", color: "text-muted-foreground", bg: "bg-muted/20 border-border/30" },
];

export const SCOPE_OPTIONS = [
  { key: "ALL", label: "All Scopes" },
  { key: "SYSTEM", label: "System Core" },
  { key: "ORGANIZATION", label: "Tenant Org" },
  { key: "PROJECT", label: "Project Tech" },
];

export function TenantScopeFilterSection({
  scopeFilter,
  setScopeFilter,
  tenantFilter,
  setTenantFilter,
}: {
  scopeFilter: string;
  setScopeFilter: (v: string) => void;
  tenantFilter: string;
  setTenantFilter: (v: string) => void;
}) {
  const { t } = useTranslation();
  const hasActive = scopeFilter !== "ALL" || Boolean(tenantFilter.trim());

  return (
    <Collapsible defaultOpen className="w-full space-y-1 pt-2 border-t border-border/40">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
        <span className="flex items-center gap-1.5">
          <User className="w-3 h-3 text-primary" /> {t("observability.tenant_and_scope") || "Tenant & Scope"}
        </span>
        <div className="flex items-center gap-1.5">
          {hasActive && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono font-semibold max-w-[100px] truncate">
              {tenantFilter.trim() || scopeFilter}
            </span>
          )}
          <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1 space-y-2 font-mono text-[11px]">
        <div className="grid grid-cols-2 gap-1">
          {SCOPE_OPTIONS.map((s) => {
            const isSelected = scopeFilter === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setScopeFilter(s.key)}
                className={`px-2 py-1 rounded text-[10px] border transition-colors text-left truncate ${
                  isSelected
                    ? "bg-primary/15 border-primary/40 text-primary font-semibold"
                    : "bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-1">
          <div className="relative flex items-center">
            <Input
              type="text"
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              placeholder={t("observability.filter_tenant_or_project") || "Filter tenant (slug/name), project..."}
              className="bg-background border-border/60 text-foreground text-xs h-7 font-mono focus:border-border focus-visible:ring-0 pr-6"
            />
            {tenantFilter && (
              <button
                type="button"
                onClick={() => setTenantFilter("")}
                className="absolute right-2 text-muted-foreground hover:text-rose-400 transition-colors text-xs font-mono"
                title={t("observability.clear_filter") || "Clear filter"}
              >
                ×
              </button>
            )}
          </div>
          <p className="text-[9px] text-muted-foreground/50 italic font-sans leading-tight">
            {t("observability.smart_tenant_search_hint") || "Matches tenant slug, display name, and project ID"}
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function TenantFilterSection({
  tenantFilter,
  setTenantFilter,
}: {
  tenantFilter: string;
  setTenantFilter: (v: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <Collapsible defaultOpen={false} className="w-full space-y-1 pt-2 border-t border-border/40">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
        <span className="flex items-center gap-1.5">
          <User className="w-3 h-3 text-primary" /> {t("observability.tenant")}
        </span>
        <div className="flex items-center gap-1.5">
          {tenantFilter && (
            <span className="text-[9px] px-1 rounded bg-primary/20 text-primary font-mono">
              {tenantFilter}
            </span>
          )}
          <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1 space-y-1">
        <Input
          type="text"
          value={tenantFilter}
          onChange={(e) => setTenantFilter(e.target.value)}
          placeholder={t("observability.filter_by_tenant_slug")}
          className="bg-background border-border/60 text-foreground text-xs h-7 font-mono focus:border-border focus-visible:ring-0"
        />
        {tenantFilter && (
          <button
            type="button"
            onClick={() => setTenantFilter("")}
            className="text-[10px] text-muted-foreground hover:text-rose-400 transition-colors font-mono"
          >
            {t("observability.clear_tenant_filter")}
          </button>
        )}
        <p className="text-[9px] text-muted-foreground/50 italic font-sans leading-tight">
          {t("observability.superadmin_empty_all_tenants")}
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function LevelFilterSection({
  selectedLevels,
  toggleLevel,
  levelCounts,
}: {
  selectedLevels: Record<string, boolean>;
  toggleLevel: (lvl: string) => void;
  levelCounts: Record<string, number>;
}) {
  const activeCount = Object.values(selectedLevels).filter(Boolean).length;

  return (
    <Collapsible defaultOpen className="w-full space-y-1 pt-2 border-t border-border/40">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
        <span className="flex items-center gap-1.5">
          <Filter className="w-3 h-3 text-primary" /> HTTP Status / Level
        </span>
        <div className="flex items-center gap-1.5">
          {activeCount > 0 && (
            <span className="text-[9px] font-mono text-primary font-semibold">
              × {activeCount}
            </span>
          )}
          <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 mt-1 font-mono text-[11px]">
        {LEVEL_OPTIONS.map((lvl) => {
          const count = levelCounts[lvl.key] ?? 0;
          return (
            <label
              key={lvl.key}
              className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted/40 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!selectedLevels[lvl.key]}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleLevel(lvl.key)}
                  className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <span className="text-muted-foreground">{lvl.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${lvl.color} ${lvl.bg}`}>
                  {lvl.badge}
                </span>
                <span className={`text-[10px] font-mono w-4 text-right ${count > 0 ? "text-foreground font-semibold" : "text-muted-foreground/40"}`}>
                  {count}
                </span>
              </div>
            </label>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ScopeFilterSection({
  scopeFilter,
  setScopeFilter,
  projectFilter,
  setProjectFilter,
}: {
  scopeFilter: string;
  setScopeFilter: (v: string) => void;
  projectFilter: string;
  setProjectFilter: (v: string) => void;
}) {
  return (
    <Collapsible defaultOpen className="w-full space-y-1 pt-2 border-t border-border/40">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
        <span className="flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-primary" /> Scope & Project
        </span>
        <div className="flex items-center gap-1.5">
          {scopeFilter !== "ALL" && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono font-semibold">
              {scopeFilter}
            </span>
          )}
          <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1 space-y-2 font-mono text-[11px]">
        <div className="grid grid-cols-2 gap-1">
          {SCOPE_OPTIONS.map((s) => {
            const isSelected = scopeFilter === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setScopeFilter(s.key)}
                className={`px-2 py-1 rounded text-[10px] border transition-colors text-left truncate ${isSelected
                  ? "bg-primary/15 border-primary/40 text-primary font-semibold"
                  : "bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-1">
          <Input
            type="text"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            placeholder="Filter Project ID / Name..."
            className="bg-background border-border/60 text-foreground text-xs h-7 font-mono focus:border-border focus-visible:ring-0"
          />
          {projectFilter && (
            <button
              type="button"
              onClick={() => setProjectFilter("")}
              className="text-[10px] text-muted-foreground hover:text-rose-400 transition-colors font-mono"
            >
              Clear project filter
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SeverityFilterSection({
  selectedSeverities,
  toggleSeverity,
  severityCounts,
}: {
  selectedSeverities: Record<string, boolean>;
  toggleSeverity: (sev: string) => void;
  severityCounts: Record<string, number>;
}) {
  const activeCount = Object.values(selectedSeverities).filter(Boolean).length;

  return (
    <Collapsible defaultOpen className="w-full space-y-1 pt-2 border-t border-border/40">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
        <span className="flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-primary" /> Severity
        </span>
        <div className="flex items-center gap-1.5">
          {activeCount > 0 && (
            <span className="text-[9px] font-mono text-primary font-semibold">
              × {activeCount}
            </span>
          )}
          <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 mt-1 font-mono text-[11px]">
        {SEVERITY_OPTIONS.map((sev) => {
          const count = severityCounts[sev.key] ?? 0;
          return (
            <label
              key={sev.key}
              className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted/40 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!selectedSeverities[sev.key]}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleSeverity(sev.key)}
                  className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <span className="text-muted-foreground">{sev.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold border ${sev.color} ${sev.bg}`}>
                  {sev.badge}
                </span>
                <span className={`text-[10px] font-mono w-4 text-right ${count > 0 ? "text-foreground font-semibold" : "text-muted-foreground/40"}`}>
                  {count}
                </span>
              </div>
            </label>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function BenchmarkFilterSection({
  includeBenchmark,
  setIncludeBenchmark,
}: {
  includeBenchmark: boolean;
  setIncludeBenchmark: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="pt-2 border-t border-border/40 font-mono text-[11px]">
      <div className="p-2 rounded-lg border border-border/50 bg-muted/20 space-y-1">
        <label className="flex items-center justify-between cursor-pointer group select-none">
          <div className="flex items-center gap-2 min-w-0">
            <input
              type="checkbox"
              checked={includeBenchmark}
              onChange={(e) => setIncludeBenchmark(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-border text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer shrink-0"
            />
            <span className="flex items-center gap-1.5 text-foreground/80 group-hover:text-foreground font-semibold transition-colors truncate text-[11px]">
              <Zap className="w-3 h-3 text-amber-500 shrink-0" />
              <span>Synthetic Telemetry</span>
            </span>
          </div>
          <span className="text-[8px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 shrink-0">
            ⚡ TEST
          </span>
        </label>
        <p className="pl-5 text-[9px] text-muted-foreground/60 font-sans leading-tight">
          Include synthetic simulations, flapping test devices, and load-test workers.
        </p>
      </div>
    </div>
  );
}


