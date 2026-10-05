import * as React from "react";
import {
  Input,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Checkbox,
} from "@k2net/ui";
import { ChevronDown, Zap } from "lucide-react";
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
    <Collapsible defaultOpen className="w-full space-y-1 pt-2 border-t border-border/40">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group select-none">
        <span>{t("observability.tenant_and_scope") || "Tenant & Scope"}</span>
        <div className="flex items-center gap-1.5">
          {hasActive && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-mono font-semibold max-w-[100px] truncate border border-border/40">
              {tenantFilter.trim() || normalizedScope}
            </span>
          )}
          <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180 text-muted-foreground/40" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1 space-y-2 font-mono text-[11px]">
        <div className="grid grid-cols-2 gap-1">
          {SCOPE_OPTIONS.map((s) => {
            const isSelected = normalizedScope === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setScopeFilter(s.key)}
                className={`px-2 py-1 rounded text-[10px] border transition-colors text-left truncate ${
                  isSelected
                    ? "bg-muted/80 border-border text-foreground font-semibold"
                    : "bg-muted/20 border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/40"
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
      <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group select-none">
        <span>{t("observability.tenant")}</span>
        <div className="flex items-center gap-1.5">
          {tenantFilter && (
            <span className="text-[9px] px-1 rounded bg-muted/60 text-muted-foreground font-mono">
              {tenantFilter}
            </span>
          )}
          <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180 text-muted-foreground/40" />
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
      <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group select-none">
        <span>Level</span>
        <div className="flex items-center gap-1.5">
          {activeCount > 0 && (
            <span className="text-[9px] font-mono text-muted-foreground font-semibold">
              × {activeCount}
            </span>
          )}
          <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180 text-muted-foreground/40" />
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
                <Checkbox
                  checked={!!selectedLevels[lvl.key]}
                  onCheckedChange={() => toggleLevel(lvl.key)}
                  className="size-3.5 rounded-[3px]"
                />
                <span className="text-muted-foreground text-[11px]">{lvl.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/70">
                  <span className={`w-2 h-2 rounded-xs ${lvl.dot}`} />
                  <span>{lvl.badge}</span>
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
  const normalizedScope = scopeFilter === "ORGANIZATION" ? "TENANT" : scopeFilter;

  return (
    <Collapsible defaultOpen className="w-full space-y-1 pt-2 border-t border-border/40">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group select-none">
        <span>Scope & Project</span>
        <div className="flex items-center gap-1.5">
          {normalizedScope !== "ALL" && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-mono font-semibold border border-border/40">
              {normalizedScope}
            </span>
          )}
          <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180 text-muted-foreground/40" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1 space-y-2 font-mono text-[11px]">
        <div className="grid grid-cols-2 gap-1">
          {SCOPE_OPTIONS.map((s) => {
            const isSelected = normalizedScope === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setScopeFilter(s.key)}
                className={`px-2 py-1 rounded text-[10px] border transition-colors text-left truncate ${
                  isSelected
                    ? "bg-muted/80 border-border text-foreground font-semibold"
                    : "bg-muted/20 border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/40"
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
      <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group select-none">
        <span>Severity</span>
        <div className="flex items-center gap-1.5">
          {activeCount > 0 && (
            <span className="text-[9px] font-mono text-muted-foreground font-semibold">
              × {activeCount}
            </span>
          )}
          <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180 text-muted-foreground/40" />
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
                <Checkbox
                  checked={!!selectedSeverities[sev.key]}
                  onCheckedChange={() => toggleSeverity(sev.key)}
                  className="size-3.5 rounded-[3px]"
                />
                <span className="text-muted-foreground text-[11px]">{sev.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-xs ${sev.dot}`} />
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
            <Checkbox
              checked={includeBenchmark}
              onCheckedChange={(checked) => setIncludeBenchmark(!!checked)}
              className="size-3.5 rounded-[3px] shrink-0"
            />
            <span className="flex items-center gap-1.5 text-foreground/80 group-hover:text-foreground font-semibold transition-colors truncate text-[11px]">
              <Zap className="w-3 h-3 text-muted-foreground/60 shrink-0" />
              <span>Synthetic Telemetry</span>
            </span>
          </div>
          <span className="text-[8px] px-1.5 py-0.2 rounded font-mono font-bold bg-muted/60 text-muted-foreground border border-border/40 shrink-0">
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
