import * as React from "react";
import {
  Copy,
  Check,
  Building2,
  FolderKanban,
  Layers,
  History,
  ShieldCheck,
  Info,
  Code2,
  Server,
  Plus,
  Minus,
} from "lucide-react";
import { cn } from "../../utils";
import { Button } from "../button";
import {
  LogsDetailDrawerShell,
  type LogsDetailDrawerTabItem,
} from "./logs-detail-drawer-shell";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Status Bar Subheader Component
// ─────────────────────────────────────────────────────────────────────────────

export interface LogsDetailDrawerStatusBarProps {
  hash?: string;
  isImpersonated?: boolean;
  realActorId?: string;
  actor?: string;
  tenantSlug?: string;
  onCopyValue: (key: string, value: string) => void;
  copiedKey: string | null;
  className?: string;
}

export function LogsDetailDrawerStatusBar({
  hash,
  isImpersonated,
  realActorId,
  actor,
  tenantSlug,
  onCopyValue,
  copiedKey,
  className,
}: LogsDetailDrawerStatusBarProps) {
  if (!hash && !isImpersonated) return null;

  return (
    <div className={cn("border-groove-b bg-muted/15 p-2 px-3.5 space-y-1.5 shrink-0 select-none", className)}>
      {hash && (
        <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="font-bold text-[10px] uppercase tracking-wider text-foreground">
              SHA-256 Verified
            </span>
            <span className="text-[10px] text-muted-foreground truncate hidden sm:inline" title={hash}>
              • {hash.slice(0, 16)}...{hash.slice(-8)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onCopyValue("SHA-256 Hash", hash)}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground font-sans px-1.5 py-0.5 rounded border border-border/50 bg-card hover:bg-muted transition-colors cursor-pointer shrink-0 shadow-2xs font-medium"
            title="Copy full SHA-256 hash"
          >
            {copiedKey === "SHA-256 Hash" ? <Check className="w-3 h-3 text-foreground" /> : <Copy className="w-3 h-3" />}
            <span>{copiedKey === "SHA-256 Hash" ? "Copied" : "Copy Hash"}</span>
          </button>
        </div>
      )}

      {isImpersonated && (
        <div className="flex items-center justify-between gap-2 text-[10px] font-mono pt-1 border-t border-border/30">
          <div className="flex items-center gap-1.5 text-purple-400">
            <span>🎭</span>
            <span className="font-bold">Dual-Identity Session:</span>
            <span className="text-foreground">{realActorId || actor}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-purple-300 font-semibold">{tenantSlug || "Target Org"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Table Row & Key-Value Components
// ─────────────────────────────────────────────────────────────────────────────

export interface LogsDetailOverviewRowProps {
  label: string;
  children: React.ReactNode;
  copyValue?: string;
  onCopyValue?: (label: string, value: string) => void;
  copiedKey?: string | null;
  quickActionSlot?: React.ReactNode;
  breakAll?: boolean;
}

export function LogsDetailOverviewRow({
  label,
  children,
  copyValue,
  onCopyValue,
  copiedKey,
  quickActionSlot,
  breakAll = false,
}: LogsDetailOverviewRowProps) {
  const isCopied = copiedKey === label;

  return (
    <div className="group flex items-start justify-between p-2 px-3 hover:bg-muted/30 transition-colors">
      <span className="w-[32%] text-muted-foreground font-medium shrink-0 mt-0.5">{label}</span>
      <div className={cn("w-[68%] flex items-center justify-between gap-1 min-w-0 font-mono text-xs", breakAll && "items-start")}>
        <div className={cn("min-w-0 text-foreground", breakAll ? "break-all" : "truncate")}>
          {children}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 ml-1">
          {quickActionSlot}
          {copyValue && onCopyValue && (
            <button
              type="button"
              onClick={() => onCopyValue(label, copyValue)}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title={`Copy ${label}`}
            >
              {isCopied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function LogsDetailOverviewTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border border-border/60 rounded-lg overflow-hidden bg-card divide-y divide-border/40", className)}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Message Box Component
// ─────────────────────────────────────────────────────────────────────────────

export function LogsDetailMessageBox({
  label = "Event Message:",
  message,
}: {
  label?: string;
  message?: string;
}) {
  if (!message) return null;

  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
        {label}
      </span>
      <div className="bg-muted/20 p-3 rounded-lg border border-border/60 font-mono text-xs text-foreground break-all whitespace-pre-wrap select-text leading-relaxed">
        {message}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Data Mutation Diff Section
// ─────────────────────────────────────────────────────────────────────────────

export interface LogsDetailDiffSectionProps {
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  title?: string;
}

export function LogsDetailDiffSection({
  oldValue,
  newValue,
  title = "Data Mutation Diff",
}: LogsDetailDiffSectionProps) {
  const hasOld = Boolean(oldValue && Object.keys(oldValue).length > 0);
  const hasNew = Boolean(newValue && Object.keys(newValue).length > 0);

  if (!hasOld && !hasNew) return null;

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <History className="w-3.5 h-3.5 text-muted-foreground" />
        <span>{title}</span>
      </span>
      <div className="grid grid-cols-1 gap-2 font-mono text-xs">
        {hasOld && (
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-md p-2.5 space-y-1">
            <div className="text-rose-400 font-bold text-[10px] uppercase tracking-wider">- Old Value (Before)</div>
            <pre className="text-rose-300/90 overflow-x-auto whitespace-pre-wrap text-[11px]">
              {JSON.stringify(oldValue, null, 2)}
            </pre>
          </div>
        )}
        {hasNew && (
          <div className="bg-muted/30 border border-border/60 rounded-md p-2.5 space-y-1">
            <div className="text-foreground font-bold text-[10px] uppercase tracking-wider">+ New Value (After)</div>
            <pre className="text-foreground/90 overflow-x-auto whitespace-pre-wrap text-[11px]">
              {JSON.stringify(newValue, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Extended Metadata Fields Table
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_METADATA_IGNORED_KEYS = new Set([
  "oldValue",
  "newValue",
  "isImpersonated",
  "realActorId",
  "impersonationSessionId",
  "impersonatedTenantId",
  "scope",
  "projectId",
  "projectName",
  "severity",
  "logGroup",
  "hash",
  "prevHash",
]);

export interface LogsDetailMetadataFieldsProps {
  metadata?: Record<string, unknown> | null;
  title?: string;
  ignoredKeys?: Set<string>;
  emptyMessage?: string;
}

export function LogsDetailMetadataFields({
  metadata,
  title = "Extended Metadata Fields",
  ignoredKeys = DEFAULT_METADATA_IGNORED_KEYS,
  emptyMessage = "No extended metadata attached to this audit event.",
}: LogsDetailMetadataFieldsProps) {
  const visibleEntries = React.useMemo(() => {
    if (!metadata) return [];
    return Object.entries(metadata).filter(([key]) => !ignoredKeys.has(key));
  }, [metadata, ignoredKeys]);

  if (!metadata || visibleEntries.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground border border-dashed border-border/60 rounded-lg font-sans text-xs">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Layers className="w-3.5 h-3.5 text-muted-foreground" />
        <span>{title}</span>
      </span>
      <div className="border border-border/60 rounded-lg overflow-hidden bg-card divide-y divide-border/40 font-mono text-xs">
        {visibleEntries.map(([key, val]) => (
          <div key={key} className="flex items-start justify-between p-2 px-3 gap-2 hover:bg-muted/30">
            <span className="text-muted-foreground font-medium shrink-0">{key}:</span>
            <span className="text-foreground text-right break-all">
              {typeof val === "object" && val !== null ? JSON.stringify(val) : String(val)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Raw JSON Viewer Tab with Line Numbers & Syntax Highlighting
// ─────────────────────────────────────────────────────────────────────────────

function highlightJsonValue(valStr: string): React.ReactNode {
  const hasComma = valStr.endsWith(",");
  const core = hasComma ? valStr.slice(0, -1).trim() : valStr.trim();
  const trailingComma = hasComma ? <span className="text-muted-foreground/60">,</span> : null;

  if (core === "null") {
    return (
      <>
        <span className="text-sky-400 dark:text-sky-400 font-mono font-medium">null</span>
        {trailingComma}
      </>
    );
  }
  if (core === "true" || core === "false") {
    return (
      <>
        <span className="text-sky-400 dark:text-sky-400 font-mono font-medium">{core}</span>
        {trailingComma}
      </>
    );
  }
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(core)) {
    return (
      <>
        <span className="text-amber-400 dark:text-amber-300 font-mono font-medium">{core}</span>
        {trailingComma}
      </>
    );
  }
  if (core.startsWith('"') && core.endsWith('"')) {
    return (
      <>
        <span className="text-primary font-mono">{core}</span>
        {trailingComma}
      </>
    );
  }
  if (core === "{" || core === "}" || core === "[" || core === "]") {
    return (
      <>
        <span className="text-muted-foreground/80 font-mono">{core}</span>
        {trailingComma}
      </>
    );
  }

  return (
    <>
      <span className="text-foreground/90 font-mono">{core}</span>
      {trailingComma}
    </>
  );
}

function highlightJsonLine(line: string): React.ReactNode {
  // Check for key-value pattern: "key": value
  const kvMatch = line.match(/^(\s*)("(?:\\.|[^"\\])*")(\s*:\s*)(.*)$/);
  if (kvMatch) {
    const [, indent, key, colon, rest] = kvMatch;
    return (
      <>
        <span>{indent}</span>
        <span className="text-foreground/90 font-medium">{key}</span>
        <span className="text-muted-foreground/60">{colon}</span>
        {highlightJsonValue(rest)}
      </>
    );
  }

  // Standalone array element or bracket line
  const valMatch = line.match(/^(\s*)(.*)$/);
  if (valMatch) {
    const [, indent, rest] = valMatch;
    return (
      <>
        <span>{indent}</span>
        {highlightJsonValue(rest)}
      </>
    );
  }

  return line;
}

export function JsonCodeViewer({
  jsonString,
  startLineNumber = 1,
  className,
}: {
  jsonString: string;
  startLineNumber?: number;
  className?: string;
}) {
  const lines = React.useMemo(() => jsonString.split("\n"), [jsonString]);

  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card/60 dark:bg-muted/30 font-mono text-xs overflow-x-auto select-text shadow-2xs",
        className
      )}
    >
      <div className="flex min-w-full py-2.5">
        {/* Line Numbers Gutter */}
        <div
          className="select-none text-right text-muted-foreground/40 pr-3.5 pl-3 border-r border-border/40 shrink-0 font-mono text-[11px] leading-relaxed"
          aria-hidden="true"
        >
          {lines.map((_, i) => (
            <div key={i}>{startLineNumber + i}</div>
          ))}
        </div>

        {/* Code Content */}
        <div className="pl-3.5 pr-4 whitespace-pre font-mono text-[11px] leading-relaxed overflow-x-auto min-w-0 flex-1">
          {lines.map((line, i) => (
            <div key={i}>{highlightJsonLine(line)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export interface LogsDetailRawJsonTabProps {
  data: unknown;
  title?: string;
  copyButtonLabel?: string;
  onCopyJson: () => void;
}

export function LogsDetailRawJsonTab({
  data,
  title = "Full Audit Event JSON",
  copyButtonLabel = "Copy Raw JSON",
  onCopyJson,
}: LogsDetailRawJsonTabProps) {
  const jsonString = React.useMemo(() => {
    if (typeof data === "string") return data;
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <button
          type="button"
          onClick={onCopyJson}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-sans px-2 py-1 rounded border border-border/60 bg-card hover:bg-muted transition-colors cursor-pointer shadow-xs font-medium"
        >
          <Copy className="w-3 h-3" />
          <span>{copyButtonLabel}</span>
        </button>
      </div>
      <JsonCodeViewer jsonString={jsonString} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Standardized Universal Data Model & Composite Drawer Orchestrator
// ─────────────────────────────────────────────────────────────────────────────

export interface StandardLogsDetailModel {
  id: string;
  timestamp: string;
  severity?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  serviceSource?: string;
  tenantSlug?: string;
  scope?: string;
  projectName?: string;
  projectId?: string;
  actor?: string;
  actorRole?: string;
  actorIp?: string;
  method?: string;
  statusCode?: number | string;
  pathname?: string;
  message?: string;
  hash?: string;
  prevHash?: string;
  isImpersonated?: boolean;
  realActorId?: string;
  impersonationSessionId?: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  rawJson?: unknown;
}

export interface LogsDetailDrawerCoreProps {
  detail: StandardLogsDetailModel;
  open: boolean;
  onClose: () => void;
  title?: string;
  currentIndex?: number;
  totalLogsCount?: number;
  onPrevLog?: () => void;
  onNextLog?: () => void;
  hasPrevLog?: boolean;
  hasNextLog?: boolean;
  onNavigateToGis?: () => void;
  onQuickFilter?: (field: string, value: string, op?: string) => void;
  customOverviewRowsSlot?: React.ReactNode;
}

export function LogsDetailDrawerCore({
  detail,
  open,
  onClose,
  title,
  currentIndex,
  totalLogsCount,
  onPrevLog,
  onNextLog,
  hasPrevLog = false,
  hasNextLog = false,
  onNavigateToGis,
  onQuickFilter,
  customOverviewRowsSlot,
}: LogsDetailDrawerCoreProps) {
  const [activeTab, setActiveTab] = React.useState<"overview" | "metadata" | "json">("overview");
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  if (!open || !detail) return null;

  const severity = (detail.severity || "INFO").toUpperCase();
  const isCritical = severity === "CRITICAL";
  const isError = severity === "ERROR" || isCritical;
  const isWarning = severity === "WARN" || severity === "WARNING";

  const hasDiff = Boolean(
    (detail.oldValue && Object.keys(detail.oldValue).length > 0) ||
    (detail.newValue && Object.keys(detail.newValue).length > 0)
  );

  const hasExtMeta = Boolean(
    detail.metadata &&
      Object.keys(detail.metadata).some((k) => !DEFAULT_METADATA_IGNORED_KEYS.has(k))
  );

  const handleCopyValue = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleCopyRawJson = () => {
    const raw = detail.rawJson || detail;
    navigator.clipboard.writeText(JSON.stringify(raw, null, 2));
    setCopiedKey("RAW_JSON");
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const tabs: LogsDetailDrawerTabItem[] = [
    { key: "overview", label: "Overview", icon: <Info className="w-3.5 h-3.5" /> },
    { key: "metadata", label: "Metadata & Diff", icon: <Layers className="w-3.5 h-3.5" />, badge: hasDiff || hasExtMeta },
    { key: "json", label: "Raw JSON", icon: <Code2 className="w-3.5 h-3.5" /> },
  ];

  const effectiveMethod = detail.method || (detail.action.includes("CREATE") || detail.action.includes("ADD") ? "POST" : detail.action.includes("DELETE") ? "DELETE" : "RPC");
  const effectiveStatus = detail.statusCode || (isError ? 500 : isWarning ? 400 : 200);
  const effectivePath = detail.pathname || (detail.resourceType ? `${detail.resourceType.toLowerCase()}/${detail.resourceId || ""}` : "");

  return (
    <LogsDetailDrawerShell
      title={title || "Log Details"}
      currentIndex={currentIndex}
      totalLogsCount={totalLogsCount}
      onPrevLog={onPrevLog}
      onNextLog={onNextLog}
      hasPrevLog={hasPrevLog}
      hasNextLog={hasNextLog}
      onClose={onClose}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(k) => setActiveTab(k as "overview" | "metadata" | "json")}
      statusBarSlot={
        <LogsDetailDrawerStatusBar
          hash={detail.hash || detail.prevHash}
          isImpersonated={detail.isImpersonated}
          realActorId={detail.realActorId}
          actor={detail.actor}
          tenantSlug={detail.tenantSlug}
          onCopyValue={handleCopyValue}
          copiedKey={copiedKey}
        />
      }
      footerActionsSlot={
        <>
          <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
            Use &apos;j&apos; / &apos;k&apos; to navigate • &apos;Esc&apos; to close
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyRawJson}
            className="text-xs font-mono gap-1.5 h-7.5 px-3 border-border/70 bg-card hover:bg-muted cursor-pointer ml-auto shadow-xs font-medium"
          >
            <Copy className="w-3 h-3" />
            <span>{copiedKey === "RAW_JSON" ? "JSON Copied!" : "Copy Raw Event JSON"}</span>
          </Button>
        </>
      }
    >
      {activeTab === "overview" && (
        <div className="space-y-4">
          <LogsDetailOverviewTable>
            {/* EVENT ID */}
            <LogsDetailOverviewRow
              label="EVENT ID:"
              copyValue={detail.id}
              onCopyValue={handleCopyValue}
              copiedKey={copiedKey}
            >
              <span className="truncate text-foreground font-mono" title={detail.id}>{detail.id}</span>
            </LogsDetailOverviewRow>

            {/* Timestamp */}
            <LogsDetailOverviewRow
              label="Timestamp"
              copyValue={detail.timestamp}
              onCopyValue={handleCopyValue}
              copiedKey={copiedKey}
            >
              <span className="truncate text-foreground">{detail.timestamp}</span>
            </LogsDetailOverviewRow>

            {/* Severity & Level */}
            <LogsDetailOverviewRow
              label="Severity & Level"
              quickActionSlot={
                onQuickFilter && (
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => onQuickFilter("severity", severity, "eq")}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Filter severity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickFilter("severity", severity, "neq")}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Exclude severity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </div>
                )
              }
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    isCritical
                      ? "bg-rose-500 animate-pulse"
                      : isError
                      ? "bg-rose-500"
                      : isWarning
                      ? "bg-amber-500"
                      : "bg-muted-foreground/60"
                  )}
                />
                <span className="font-bold font-mono text-foreground text-xs">{severity}</span>
              </div>
            </LogsDetailOverviewRow>

            {/* Action / Type */}
            <LogsDetailOverviewRow
              label="Action / Type"
              copyValue={detail.action}
              onCopyValue={handleCopyValue}
              copiedKey={copiedKey}
            >
              <span className="font-semibold text-foreground truncate" title={detail.action}>
                {detail.action}
              </span>
            </LogsDetailOverviewRow>

            {/* Resource */}
            {detail.resourceType && (
              <LogsDetailOverviewRow label="Resource">
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-1.5 text-foreground truncate">
                    <Server className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span>{detail.resourceType} {detail.resourceId ? `(${detail.resourceId})` : ""}</span>
                  </span>
                  {onNavigateToGis && detail.projectId && (
                    <button
                      type="button"
                      onClick={onNavigateToGis}
                      className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline cursor-pointer font-sans shrink-0 ml-2"
                      title="View on Map"
                    >
                      <span>Map</span>
                    </button>
                  )}
                </div>
              </LogsDetailOverviewRow>
            )}

            {/* Service Source */}
            {detail.serviceSource && (
              <LogsDetailOverviewRow
                label="Service Source"
                copyValue={detail.serviceSource}
                onCopyValue={handleCopyValue}
                copiedKey={copiedKey}
              >
                <span className="flex items-center gap-1.5 text-foreground truncate">
                  <Layers className="w-3 h-3 text-muted-foreground" />
                  <span>{detail.serviceSource}</span>
                </span>
              </LogsDetailOverviewRow>
            )}

            {/* Tenant */}
            {detail.tenantSlug && (
              <LogsDetailOverviewRow
                label="Tenant"
                copyValue={detail.tenantSlug}
                onCopyValue={handleCopyValue}
                copiedKey={copiedKey}
              >
                <span className="flex items-center gap-1.5 text-foreground truncate">
                  <Building2 className="w-3 h-3 text-muted-foreground" />
                  <span>{detail.tenantSlug}</span>
                </span>
              </LogsDetailOverviewRow>
            )}

            {/* Scope */}
            {detail.scope && (
              <LogsDetailOverviewRow label="Scope">
                <span className="flex items-center gap-1.5 text-foreground truncate">
                  <FolderKanban className="w-3 h-3 text-muted-foreground" />
                  <span>{detail.scope}</span>
                  {(detail.projectName || detail.projectId) && (
                    <span className="text-muted-foreground">({detail.projectName || detail.projectId})</span>
                  )}
                </span>
              </LogsDetailOverviewRow>
            )}

            {/* Actor / User */}
            {detail.actor && (
              <LogsDetailOverviewRow
                label="Actor / User"
                copyValue={detail.actor}
                onCopyValue={handleCopyValue}
                copiedKey={copiedKey}
              >
                <span className="text-foreground truncate" title={detail.actor}>
                  {detail.actor}
                </span>
              </LogsDetailOverviewRow>
            )}

            {/* HTTP Request */}
            <LogsDetailOverviewRow label="HTTP Request">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="px-1.5 py-0.2 rounded border border-border/60 bg-muted/40 font-bold text-[10px]">
                  {effectiveMethod}
                </span>
                <span className="font-bold text-xs text-foreground">
                  {effectiveStatus}
                </span>
              </div>
            </LogsDetailOverviewRow>

            {/* Pathname */}
            {effectivePath && (
              <LogsDetailOverviewRow
                label="Pathname"
                copyValue={effectivePath}
                onCopyValue={handleCopyValue}
                copiedKey={copiedKey}
                breakAll
              >
                <span>{effectivePath}</span>
              </LogsDetailOverviewRow>
            )}

            {/* Client IP */}
            {detail.actorIp && (
              <LogsDetailOverviewRow
                label="Client IP"
                copyValue={detail.actorIp}
                onCopyValue={handleCopyValue}
                copiedKey={copiedKey}
              >
                <span>{detail.actorIp}</span>
              </LogsDetailOverviewRow>
            )}

            {customOverviewRowsSlot}
          </LogsDetailOverviewTable>

          {/* Event Message */}
          <LogsDetailMessageBox message={detail.message} />
        </div>
      )}

      {activeTab === "metadata" && (
        <div className="space-y-4">
          <LogsDetailDiffSection oldValue={detail.oldValue} newValue={detail.newValue} />
          <LogsDetailMetadataFields metadata={detail.metadata} />
        </div>
      )}

      {activeTab === "json" && (
        <LogsDetailRawJsonTab
          data={detail.rawJson || detail}
          onCopyJson={handleCopyRawJson}
        />
      )}
    </LogsDetailDrawerShell>
  );
}
