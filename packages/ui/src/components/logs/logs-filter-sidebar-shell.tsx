import * as React from "react";
import { RotateCcw, Bookmark, ChevronDown, Plus, Minus, Search } from "lucide-react";
import { SecondarySidebarHeader } from "../layout/secondary-sidebar-header";
import { ActionTooltip } from "../tooltip";
import { Badge } from "../badge";
import { Checkbox } from "../checkbox";
import { Input } from "../input";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../collapsible";
import { LogsDateRangePickerCore } from "./logs-date-range-picker-core";
import { LogsFacetSectionShell } from "./logs-facet-section-shell";

export interface LogsSidebarPresetItem {
  key: string;
  label: string;
  tag?: string;
}

export interface LogsSidebarSeverityItem {
  key: string;
  label: string;
  dot: string;
  count?: number;
}

export interface LogsSidebarFacetSubItem {
  key: string;
  label: string;
  count?: number;
}

export interface LogsSidebarFacetItem {
  key: string;
  label: string;
  count?: number;
  subItems?: LogsSidebarFacetSubItem[];
}

export interface LogsSidebarLevelItem {
  key: string;
  label: string;
  badge: string;
  dot: string;
}

export interface LogsSidebarMethodItem {
  key: string;
  label: string;
  badge: string;
}

export interface LogsFilterSidebarShellProps {
  title: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  hasActiveFilters: boolean;
  onResetAll: () => void;
  resetTooltipLabel?: string;
  timeRange: string;
  onTimeRangeChange: (val: string) => void;
  timeRangeLabel?: string;
  presets?: LogsSidebarPresetItem[];
  activePreset?: string | null;
  onApplyPreset?: (key: string) => void;
  onSavePreset?: () => void;
  severities?: LogsSidebarSeverityItem[];
  isSeveritySelected: (key: string) => boolean;
  onToggleSeverity?: (key: string) => void;
  facetTitle?: string;
  facetItems?: LogsSidebarFacetItem[];
  isFacetItemSelected: (key: string) => boolean;
  onToggleFacetItem?: (key: string) => void;
  isSubFacetItemSelected?: (subKey: string) => boolean;
  onToggleSubFacetItem?: (subKey: string) => void;
  levels?: LogsSidebarLevelItem[];
  isLevelSelected?: (key: string) => boolean;
  onToggleLevel?: (key: string) => void;
  methods?: LogsSidebarMethodItem[];
  isMethodSelected?: (key: string) => boolean;
  onToggleMethod?: (key: string) => void;
  pathnameFilter?: string;
  onPathnameFilterChange?: (path: string) => void;
  quickPaths?: string[];
  customSectionsSlot?: React.ReactNode;
  translateFn?: (key: string) => string;
}

function SidebarPresetsSection({
  presets,
  activePreset,
  onApplyPreset,
  onSavePreset,
}: {
  presets?: LogsSidebarPresetItem[];
  activePreset?: string | null;
  onApplyPreset?: (key: string) => void;
  onSavePreset?: () => void;
}) {
  if (!presets || presets.length === 0) return null;

  return (
    <Collapsible defaultOpen className="w-full space-y-1 pt-2.5 border-groove-t">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-1 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/80 uppercase tracking-widest hover:text-foreground group select-none">
        <span className="flex items-center gap-1.5">
          <Bookmark className="w-3 h-3 text-muted-foreground/70 group-hover:text-foreground dark:text-muted-foreground/80" />
          <span>SAVED PRESETS</span>
        </span>
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="text-[9px] font-mono px-1 py-0 h-3.5 border-border bg-muted/40 text-muted-foreground"
          >
            {presets.length}
          </Badge>
          <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180 text-muted-foreground/60 group-hover:text-foreground dark:text-muted-foreground/70" />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-1 mt-1">
        <div className="space-y-0.5 max-h-[220px] overflow-y-auto custom-scrollbar-thin pr-1 font-sans">
          {presets.map((preset) => {
            const isActive = activePreset === preset.key;
            return (
              <div
                key={preset.key}
                onClick={() => onApplyPreset?.(preset.key)}
                className={`flex items-center justify-between px-2 py-1.5 rounded-md transition-colors cursor-pointer group text-xs ${
                  isActive
                    ? "bg-muted text-foreground font-semibold"
                    : "hover:bg-muted/70 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 pr-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 group-hover:bg-foreground/70 transition-colors shrink-0" />
                  <span
                    title={preset.label}
                    className="truncate font-medium text-[11px] group-hover:text-foreground transition-colors select-none"
                  >
                    {preset.label}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[9px] font-mono font-semibold px-1 py-0.5 rounded bg-muted/70 text-muted-foreground/70 border border-border/30">
                    {preset.tag || "SYS"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {onSavePreset && (
          <button
            type="button"
            onClick={onSavePreset}
            className="w-full flex items-center justify-center gap-1.5 py-1 px-2 mt-1 rounded-md border border-dashed border-border/80 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3 text-muted-foreground" />
            <span>Save Current Search</span>
          </button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function SidebarSeveritySection({
  severities,
  isSeveritySelected,
  onToggleSeverity,
}: {
  severities?: LogsSidebarSeverityItem[];
  isSeveritySelected: (key: string) => boolean;
  onToggleSeverity?: (key: string) => void;
}) {
  if (!severities || severities.length === 0) return null;
  const activeCount = severities.filter((s) => isSeveritySelected(s.key)).length;

  return (
    <LogsFacetSectionShell
      title="Severity"
      activeLabel={activeCount > 0 ? `× ${activeCount}` : null}
      defaultOpen
    >
      <div className="rounded-md border border-border/70 bg-card/40 overflow-hidden divide-y divide-border/40 font-mono text-[11px] shadow-2xs mt-1">
        {severities.map((sev) => {
          const isChecked = isSeveritySelected(sev.key);
          const count = sev.count ?? 0;
          return (
            <label
              key={sev.key}
              className="flex items-center justify-between px-2.5 py-1.5 hover:bg-muted/40 cursor-pointer transition-colors select-none group/sev"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => onToggleSeverity?.(sev.key)}
                  className="size-3.5 rounded-[3px]"
                />
                <span className="text-muted-foreground group-hover/sev:text-foreground transition-colors text-[11px] font-medium">
                  {sev.label}
                </span>
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

function SidebarFacetListSection({
  facetTitle = "LOG TYPE",
  facetItems,
  isFacetItemSelected,
  onToggleFacetItem,
  isSubFacetItemSelected,
  onToggleSubFacetItem,
}: {
  facetTitle?: string;
  facetItems?: LogsSidebarFacetItem[];
  isFacetItemSelected: (key: string) => boolean;
  onToggleFacetItem?: (key: string) => void;
  isSubFacetItemSelected?: (subKey: string) => boolean;
  onToggleSubFacetItem?: (subKey: string) => void;
}) {
  const [typeSearch, setTypeSearch] = React.useState("");
  const [expandedTypes, setExpandedTypes] = React.useState<Record<string, boolean>>({});

  if (!facetItems || facetItems.length === 0) return null;

  const activeCount = facetItems.filter((f) => isFacetItemSelected(f.key)).length;

  const toggleExpand = (key: string) => {
    setExpandedTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const q = typeSearch.toLowerCase().trim();
  const filtered = facetItems.filter((item) => {
    if (!q) return true;
    const matchLabel = item.label.toLowerCase().includes(q);
    const matchKey = item.key.toLowerCase().includes(q);
    const matchSub = item.subItems?.some(
      (sub) => sub.label.toLowerCase().includes(q) || sub.key.toLowerCase().includes(q)
    );
    return matchLabel || matchKey || matchSub;
  });

  return (
    <LogsFacetSectionShell
      title={facetTitle}
      activeLabel={activeCount > 0 ? `× ${activeCount}` : null}
      defaultOpen
    >
      <div className="space-y-1.5 mt-1">
        <div className="relative">
          <Input
            type="text"
            value={typeSearch}
            onChange={(e) => setTypeSearch(e.target.value)}
            placeholder={`Search ${facetTitle.toLowerCase()}...`}
            className="bg-background border-border/60 text-foreground text-xs h-7 pl-7 font-mono focus:border-border focus-visible:ring-0"
          />
          <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
        </div>

        <div className="rounded-md border border-border/70 bg-card/40 overflow-hidden divide-y divide-border/40 font-mono text-[11px] shadow-2xs max-h-[300px] overflow-y-auto custom-scrollbar-thin">
          {filtered.map((item) => {
            const isChecked = isFacetItemSelected(item.key);
            const count = item.count ?? 0;
            const hasSub = item.subItems && item.subItems.length > 0;
            const isExpanded = (q && hasSub) ? true : !!expandedTypes[item.key];

            return (
              <div key={item.key} className="transition-colors">
                <div
                  onClick={() => onToggleFacetItem?.(item.key)}
                  className="flex items-center justify-between px-2.5 py-1.5 hover:bg-muted/40 transition-colors cursor-pointer group/type select-none"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => onToggleFacetItem?.(item.key)}
                      className="size-3.5 rounded-[3px] shrink-0"
                    />
                    <span className="text-muted-foreground group-hover/type:text-foreground transition-colors truncate text-[11px] font-medium">
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasSub && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleExpand(item.key);
                        }}
                        className="w-4 h-4 flex items-center justify-center rounded hover:bg-muted text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer"
                      >
                        {isExpanded ? (
                          <Minus className="w-3 h-3 stroke-[2.5]" />
                        ) : (
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                        )}
                      </button>
                    )}
                    <span className={`text-[10px] font-mono min-w-[14px] text-right font-medium ${count > 0 ? "text-foreground font-medium" : "text-muted-foreground/40"}`}>
                      {count}
                    </span>
                  </div>
                </div>

                {isExpanded && hasSub && (
                  <div className="bg-muted/15 border-t border-border/30 divide-y divide-border/20">
                    {item.subItems!.map((sub, idx) => {
                      const isLast = idx === item.subItems!.length - 1;
                      const isSubChecked = !!isSubFacetItemSelected?.(sub.key);
                      const subCount = sub.count ?? 0;
                      return (
                        <div
                          key={sub.key}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSubFacetItem?.(sub.key);
                          }}
                          className="relative pl-7 pr-2.5 py-1 hover:bg-muted/30 cursor-pointer transition-colors select-none group/sub flex items-center justify-between"
                        >
                          <div
                            className="absolute left-[17px] top-0 w-[1px] bg-border/60 pointer-events-none"
                            style={{ height: isLast ? "50%" : "100%" }}
                          />
                          <div className="absolute left-[17px] top-1/2 w-2.5 h-[1px] bg-border/60 pointer-events-none" />

                          <div className="flex items-center gap-2 min-w-0">
                            <Checkbox
                              checked={isSubChecked}
                              onCheckedChange={() => onToggleSubFacetItem?.(sub.key)}
                              className="size-3 rounded-[2px]"
                            />
                            <span className="text-[10px] text-muted-foreground group-hover/sub:text-foreground transition-colors truncate">
                              {sub.label}
                            </span>
                          </div>

                          <span className={`text-[9px] font-mono ${subCount > 0 ? "text-foreground font-medium" : "text-muted-foreground/40"}`}>
                            {subCount}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </LogsFacetSectionShell>
  );
}

function SidebarLevelSection({
  levels,
  isLevelSelected,
  onToggleLevel,
}: {
  levels?: LogsSidebarLevelItem[];
  isLevelSelected?: (key: string) => boolean;
  onToggleLevel?: (key: string) => void;
}) {
  if (!levels || levels.length === 0 || !isLevelSelected) return null;
  const activeCount = levels.filter((lvl) => isLevelSelected(lvl.key)).length;

  return (
    <LogsFacetSectionShell
      title="Level"
      activeLabel={activeCount > 0 ? `× ${activeCount}` : null}
      defaultOpen={false}
    >
      <div className="rounded-md border border-border/70 bg-card/40 overflow-hidden divide-y divide-border/40 font-mono text-[11px] shadow-2xs mt-1">
        {levels.map((lvl) => {
          const isChecked = isLevelSelected(lvl.key);
          return (
            <label
              key={lvl.key}
              className="flex items-center justify-between px-2.5 py-1.5 hover:bg-muted/40 cursor-pointer transition-colors select-none group/lvl"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => onToggleLevel?.(lvl.key)}
                  className="size-3.5 rounded-[3px]"
                />
                <span className="text-muted-foreground group-hover/lvl:text-foreground transition-colors text-[11px] font-medium">
                  {lvl.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/70">
                <span className={`w-2 h-2 rounded-xs ${lvl.dot}`} />
                <span>{lvl.badge}</span>
              </div>
            </label>
          );
        })}
      </div>
    </LogsFacetSectionShell>
  );
}

function SidebarMethodSection({
  methods,
  isMethodSelected,
  onToggleMethod,
}: {
  methods?: LogsSidebarMethodItem[];
  isMethodSelected?: (key: string) => boolean;
  onToggleMethod?: (key: string) => void;
}) {
  if (!methods || methods.length === 0 || !isMethodSelected) return null;
  const activeCount = methods.filter((m) => isMethodSelected(m.key)).length;

  return (
    <LogsFacetSectionShell
      title="Method"
      activeLabel={activeCount > 0 ? `× ${activeCount}` : null}
      defaultOpen={false}
    >
      <div className="rounded-md border border-border/70 bg-card/40 overflow-hidden divide-y divide-border/40 font-mono text-[11px] shadow-2xs mt-1">
        {methods.map((m) => {
          const isChecked = isMethodSelected(m.key);
          return (
            <label
              key={m.key}
              className="flex items-center justify-between px-2.5 py-1.5 hover:bg-muted/40 cursor-pointer transition-colors select-none group/m"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => onToggleMethod?.(m.key)}
                  className="size-3.5 rounded-[3px]"
                />
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium border ${m.badge}`}>
                  {m.label}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </LogsFacetSectionShell>
  );
}

function SidebarPathnameSection({
  pathnameFilter = "",
  onPathnameFilterChange,
  quickPaths,
}: {
  pathnameFilter?: string;
  onPathnameFilterChange?: (path: string) => void;
  quickPaths?: string[];
}) {
  if (!onPathnameFilterChange) return null;

  return (
    <LogsFacetSectionShell
      title="Pathname"
      activeLabel={pathnameFilter.trim() || null}
      defaultOpen={false}
    >
      <div className="relative flex items-center mb-2">
        <Input
          type="text"
          value={pathnameFilter}
          onChange={(e) => onPathnameFilterChange(e.target.value)}
          placeholder="Search path..."
          className="bg-background border-border/60 text-foreground text-xs h-7 font-mono focus:border-border focus-visible:ring-0 pr-6"
        />
        {pathnameFilter && (
          <button
            type="button"
            onClick={() => onPathnameFilterChange("")}
            className="absolute right-2 text-muted-foreground hover:text-rose-400 transition-colors text-xs font-mono font-medium cursor-pointer"
            title="Clear path filter"
          >
            ×
          </button>
        )}
      </div>

      {quickPaths && quickPaths.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] font-medium text-muted-foreground/70 uppercase tracking-wider">
            Quick Endpoints
          </div>
          <div className="flex flex-wrap gap-1">
            {quickPaths.map((path) => (
              <button
                key={path}
                type="button"
                onClick={() => onPathnameFilterChange(pathnameFilter === path ? "" : path)}
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
      )}
    </LogsFacetSectionShell>
  );
}

export function LogsFilterSidebarShell({
  title,
  isCollapsed,
  onToggleCollapse,
  hasActiveFilters,
  onResetAll,
  resetTooltipLabel = "Reset filter",
  timeRange,
  onTimeRangeChange,
  timeRangeLabel = "TIME RANGE",
  presets,
  activePreset,
  onApplyPreset,
  onSavePreset,
  severities,
  isSeveritySelected,
  onToggleSeverity,
  facetTitle = "LOG TYPE",
  facetItems,
  isFacetItemSelected,
  onToggleFacetItem,
  isSubFacetItemSelected,
  onToggleSubFacetItem,
  levels,
  isLevelSelected,
  onToggleLevel,
  methods,
  isMethodSelected,
  onToggleMethod,
  pathnameFilter,
  onPathnameFilterChange,
  quickPaths,
  customSectionsSlot,
  translateFn,
}: LogsFilterSidebarShellProps) {
  if (isCollapsed) return null;

  return (
    <div className="flex flex-col h-full w-[240px] font-sans text-xs bg-sidebar select-none border-groove-r shrink-0">
      <SecondarySidebarHeader
        title={title}
        onCollapse={onToggleCollapse}
        actions={
          hasActiveFilters ? (
            <ActionTooltip label={resetTooltipLabel}>
              <button
                type="button"
                onClick={onResetAll}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Reset</span>
              </button>
            </ActionTooltip>
          ) : null
        }
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar-thin p-3 space-y-4">
        {/* 1. TIME RANGE */}
        <div className="w-full space-y-1">
          <div className="flex items-center justify-between px-1 py-1">
            <span className="text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/80 uppercase tracking-widest">
              {timeRangeLabel}
            </span>
          </div>
          <LogsDateRangePickerCore
            value={timeRange}
            onChange={onTimeRangeChange}
            translateFn={translateFn}
          />
        </div>

        {/* 2. SAVED PRESETS */}
        <SidebarPresetsSection
          presets={presets}
          activePreset={activePreset}
          onApplyPreset={onApplyPreset}
          onSavePreset={onSavePreset}
        />

        {/* 3. SEVERITY */}
        <SidebarSeveritySection
          severities={severities}
          isSeveritySelected={isSeveritySelected}
          onToggleSeverity={onToggleSeverity}
        />

        {/* 4. CUSTOM SECTIONS (e.g. Tenant Scope Filter in studio-admin) */}
        {customSectionsSlot}

        {/* 5. PRIMARY FACET (Category / Log Type) */}
        <SidebarFacetListSection
          facetTitle={facetTitle}
          facetItems={facetItems}
          isFacetItemSelected={isFacetItemSelected}
          onToggleFacetItem={onToggleFacetItem}
          isSubFacetItemSelected={isSubFacetItemSelected}
          onToggleSubFacetItem={onToggleSubFacetItem}
        />

        {/* 6. LEVEL */}
        <SidebarLevelSection
          levels={levels}
          isLevelSelected={isLevelSelected}
          onToggleLevel={onToggleLevel}
        />

        {/* 7. METHOD */}
        <SidebarMethodSection
          methods={methods}
          isMethodSelected={isMethodSelected}
          onToggleMethod={onToggleMethod}
        />

        {/* 8. PATHNAME */}
        <SidebarPathnameSection
          pathnameFilter={pathnameFilter}
          onPathnameFilterChange={onPathnameFilterChange}
          quickPaths={quickPaths}
        />
      </div>
    </div>
  );
}
