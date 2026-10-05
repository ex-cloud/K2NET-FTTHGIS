import * as React from "react";
import {
  Input,
  Checkbox,
  LogsFacetSectionShell,
} from "@k2net/ui";
import { Zap } from "lucide-react";
import { useTranslation } from "@k2net/i18n";

export const LEVEL_OPTIONS = [
  { key: "success", label: "Success", badge: "2xx", dot: "bg-muted-foreground/40" },
  { key: "warning", label: "Warning", badge: "4xx", dot: "bg-amber-400" },
  { key: "error", label: "Error", badge: "5xx", dot: "bg-rose-400" },
];

export const SEVERITY_OPTIONS = [
  { key: "CRITICAL", label: "Critical", dot: "bg-rose-500" },
  { key: "ERROR", label: "Error", dot: "bg-rose-400" },
  { key: "WARN", label: "Warning", dot: "bg-amber-400" },
  { key: "INFO", label: "Info", dot: "bg-muted-foreground/40" },
];

export const SCOPE_OPTIONS = [
  { key: "ALL", label: "All Scopes" },
  { key: "SYSTEM", label: "System Core" },
  { key: "TENANT", label: "Tenant" },
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
  const normalizedScope = scopeFilter === "ORGANIZATION" ? "TENANT" : scopeFilter;
  const hasActive = normalizedScope !== "ALL" || Boolean(tenantFilter.trim());

  return (
    <LogsFacetSectionShell
      title={t("observability.tenant_and_scope") || "Tenant & Scope"}
      activeLabel={hasActive ? (tenantFilter.trim() || normalizedScope) : null}
      defaultOpen
    >
      <div className="grid grid-cols-2 gap-1 mb-2">
        {SCOPE_OPTIONS.map((s) => {
          const isSelected = normalizedScope === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScopeFilter(s.key)}
              className={`px-2 py-1 rounded text-[10px] border transition-colors text-left truncate font-medium cursor-pointer ${
                isSelected
                  ? "bg-muted/80 border-border text-foreground font-medium"
                  : "bg-muted/20 border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium"
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
              className="absolute right-2 text-muted-foreground hover:text-rose-400 transition-colors text-xs font-mono font-medium cursor-pointer"
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
    </LogsFacetSectionShell>
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
    <LogsFacetSectionShell
      title={t("observability.tenant")}
      activeLabel={tenantFilter.trim() || null}
      defaultOpen={false}
    >
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
          className="text-[10px] text-muted-foreground hover:text-rose-400 transition-colors font-mono font-medium cursor-pointer"
        >
          {t("observability.clear_tenant_filter")}
        </button>
      )}
      <p className="text-[9px] text-muted-foreground/50 italic font-sans leading-tight">
        {t("observability.superadmin_empty_all_tenants")}
      </p>
    </LogsFacetSectionShell>
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
    <LogsFacetSectionShell
      title="Level"
      activeLabel={activeCount > 0 ? `× ${activeCount}` : null}
      defaultOpen
    >
      <div className="rounded-md border border-border/70 bg-card/40 overflow-hidden divide-y divide-border/40 font-mono text-[11px] shadow-2xs mt-1">
        {LEVEL_OPTIONS.map((lvl) => {
          const count = levelCounts[lvl.key] ?? 0;
          const isChecked = !!selectedLevels[lvl.key];
          return (
            <label
              key={lvl.key}
              className="flex items-center justify-between px-2.5 py-1.5 hover:bg-muted/40 cursor-pointer transition-colors select-none group/lvl"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleLevel(lvl.key)}
                  className="size-3.5 rounded-[3px]"
                />
                <span className="text-muted-foreground group-hover/lvl:text-foreground transition-colors text-[11px] font-medium">{lvl.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/70">
                  <span className={`w-2 h-2 rounded-xs ${lvl.dot}`} />
                  <span>{lvl.badge}</span>
                </span>
                <span className={`text-[10px] font-mono min-w-[14px] text-right font-medium ${count > 0 ? "text-foreground font-medium" : "text-muted-foreground/40"}`}>
                  {count}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </LogsFacetSectionShell>
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
  const normalizedScope = scopeFilter === "ORGANIZATION" ? "TENANT" : scopeFilter;

  return (
    <LogsFacetSectionShell
      title="Scope & Project"
      activeLabel={normalizedScope !== "ALL" ? normalizedScope : null}
      defaultOpen
    >
      <div className="grid grid-cols-2 gap-1 mb-2">
        {SCOPE_OPTIONS.map((s) => {
          const isSelected = normalizedScope === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScopeFilter(s.key)}
              className={`px-2 py-1 rounded text-[10px] border transition-colors text-left truncate font-medium cursor-pointer ${
                isSelected
                  ? "bg-muted/80 border-border text-foreground font-medium"
                  : "bg-muted/20 border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium"
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
            className="text-[10px] text-muted-foreground hover:text-rose-400 transition-colors font-mono font-medium cursor-pointer"
          >
            Clear project filter
          </button>
        )}
      </div>
    </LogsFacetSectionShell>
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
    <LogsFacetSectionShell
      title="Severity"
      activeLabel={activeCount > 0 ? `× ${activeCount}` : null}
      defaultOpen
    >
      <div className="rounded-md border border-border/70 bg-card/40 overflow-hidden divide-y divide-border/40 font-mono text-[11px] shadow-2xs mt-1">
        {SEVERITY_OPTIONS.map((sev) => {
          const count = severityCounts[sev.key] ?? 0;
          const isChecked = !!selectedSeverities[sev.key];
          return (
            <label
              key={sev.key}
              className="flex items-center justify-between px-2.5 py-1.5 hover:bg-muted/40 cursor-pointer transition-colors select-none group/sev"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleSeverity(sev.key)}
                  className="size-3.5 rounded-[3px]"
                />
                <span className="text-muted-foreground group-hover/sev:text-foreground transition-colors text-[11px] font-medium">{sev.label}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-xs ${sev.dot}`} />
                <span className={`text-[10px] font-mono min-w-[14px] text-right font-medium ${count > 0 ? "text-foreground font-medium" : "text-muted-foreground/40"}`}>
                  {count}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </LogsFacetSectionShell>
  );
}

export const METHOD_OPTIONS = [
  { key: "GET", label: "GET", badge: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
  { key: "POST", label: "POST", badge: "text-primary bg-primary/10 border-primary/30" },
  { key: "PUT", label: "PUT", badge: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { key: "DELETE", label: "DELETE", badge: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  { key: "PATCH", label: "PATCH", badge: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
  { key: "RPC", label: "RPC", badge: "text-teal-400 bg-teal-500/10 border-teal-500/30" },
];

export function MethodFilterSection({
  selectedMethods,
  toggleMethod,
  methodCounts,
}: {
  selectedMethods: Record<string, boolean>;
  toggleMethod: (method: string) => void;
  methodCounts: Record<string, number>;
}) {
  const activeCount = Object.values(selectedMethods).filter(Boolean).length;

  return (
    <LogsFacetSectionShell
      title="Method"
      activeLabel={activeCount > 0 ? `× ${activeCount}` : null}
      defaultOpen={false}
    >
      <div className="rounded-md border border-border/70 bg-card/40 overflow-hidden divide-y divide-border/40 font-mono text-[11px] shadow-2xs mt-1">
        {METHOD_OPTIONS.map((m) => {
          const count = methodCounts[m.key] ?? 0;
          const isChecked = !!selectedMethods[m.key];
          return (
            <label
              key={m.key}
              className="flex items-center justify-between px-2.5 py-1.5 hover:bg-muted/40 cursor-pointer transition-colors select-none group/m"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleMethod(m.key)}
                  className="size-3.5 rounded-[3px]"
                />
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium border ${m.badge}`}>
                  {m.label}
                </span>
              </div>
              <span className={`text-[10px] font-mono min-w-[14px] text-right font-medium ${count > 0 ? "text-foreground font-medium" : "text-muted-foreground/40"}`}>
                {count}
              </span>
            </label>
          );
        })}
      </div>
    </LogsFacetSectionShell>
  );
}

const PATH_PRESETS = [
  "/api/v1/auth",
  "/api/v1/customers",
  "/api/v1/network",
  "/api/v1/invoices",
  "/api/v1/system",
  "/actuator/health",
];

export function PathnameFilterSection({
  pathnameFilter,
  setPathnameFilter,
}: {
  pathnameFilter: string;
  setPathnameFilter: (path: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <LogsFacetSectionShell
      title={t("observability.pathname") || "Pathname"}
      activeLabel={pathnameFilter.trim() || null}
      defaultOpen={false}
    >
      <div className="relative flex items-center mb-2">
        <Input
          type="text"
          value={pathnameFilter}
          onChange={(e) => setPathnameFilter(e.target.value)}
          placeholder="Search path, e.g. /api/v1/auth..."
          className="bg-background border-border/60 text-foreground text-xs h-7 font-mono focus:border-border focus-visible:ring-0 pr-6"
        />
        {pathnameFilter && (
          <button
            type="button"
            onClick={() => setPathnameFilter("")}
            className="absolute right-2 text-muted-foreground hover:text-rose-400 transition-colors text-xs font-mono font-medium cursor-pointer"
            title="Clear path filter"
          >
            ×
          </button>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-[9px] font-medium text-muted-foreground/70 uppercase tracking-wider">
          Quick Endpoints
        </div>
        <div className="flex flex-wrap gap-1">
          {PATH_PRESETS.map((path) => (
            <button
              key={path}
              type="button"
              onClick={() => setPathnameFilter(pathnameFilter === path ? "" : path)}
              className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors truncate max-w-full font-mono cursor-pointer font-medium ${
                pathnameFilter === path
                  ? "bg-primary/15 border-primary/40 text-primary font-medium"
                  : "bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/60 font-medium"
              }`}
            >
              {path}
            </button>
          ))}
        </div>
      </div>
    </LogsFacetSectionShell>
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
    <div className="pt-2.5 border-groove-t font-mono text-[11px]">
      <div className="p-2 rounded-lg border border-border/50 bg-muted/20 space-y-1">
        <label className="flex items-center justify-between cursor-pointer group select-none">
          <div className="flex items-center gap-2 min-w-0">
            <Checkbox
              checked={includeBenchmark}
              onCheckedChange={(checked) => setIncludeBenchmark(!!checked)}
              className="size-3.5 rounded-[3px] shrink-0"
            />
            <span className="flex items-center gap-1.5 text-foreground/80 group-hover:text-foreground font-medium transition-colors truncate text-[11px]">
              <Zap className="w-3 h-3 text-muted-foreground/60 shrink-0" />
              <span>Synthetic Telemetry</span>
            </span>
          </div>
          <span className="text-[8px] px-1.5 py-0.2 rounded font-mono font-medium bg-muted/60 text-muted-foreground border border-border/40 shrink-0">
            TEST
          </span>
        </label>
        <p className="pl-5 text-[9px] text-muted-foreground/60 font-sans leading-tight">
          Include synthetic simulations, flapping test devices, and load-test workers.
        </p>
      </div>
    </div>
  );
}
