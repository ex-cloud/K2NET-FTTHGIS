import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Copy,
  Check,
  MapPin,
  ExternalLink,
  ShieldAlert,
  Code2,
  FileText,
  GitCompare,
  User,
  Clock,
  Server,
} from "lucide-react";
import {
  Button,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  ScrollArea,
  LogsDetailDrawerShell,
} from "@k2net/ui";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import type { TenantAuditEvent } from "../../types/tenant-audit";

interface TenantAuditDetailDrawerProps {
  event: TenantAuditEvent | null;
  open: boolean;
  onClose: () => void;
}

function DrawerHeader({
  event,
  copied,
  onCopyJson,
  onNavigateToGis,
}: {
  event: TenantAuditEvent;
  copied: boolean;
  onCopyJson: () => void;
  onNavigateToGis: () => void;
}) {
  const { t } = useTranslation();
  const isImpersonated =
    !!event.metadata?.impersonatedBy ||
    !!event.metadata?.superAdmin ||
    event.actorRole === "super_admin";

  const isNetworkResource =
    ["ODP", "ODC", "OLT", "CABLE", "FIBER", "CUSTOMER"].includes(
      (event.resourceType || "").toUpperCase()
    ) && !!event.projectId;

  return (
    <div className="p-4 border-b border-border/60 bg-muted/20 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-xs font-bold bg-primary/10 text-primary border-primary/20"
          >
            {event.action}
          </Badge>
          <Badge
            variant="outline"
            className={`font-mono text-xs ${
              event.scope === "PROJECT"
                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
            }`}
          >
            {event.scope}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {isNetworkResource && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToGis}
              className="h-7.5 px-2.5 text-xs font-semibold gap-1.5 bg-primary/5 hover:bg-primary/10 text-primary border-primary/30"
            >
              <MapPin className="h-3.5 w-3.5" />
              {t("gis.view_on_map")}
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopyJson}
            className="h-7.5 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t("common.copied") : t("security.audit_raw_payload")}
          </Button>
        </div>
      </div>

      {isImpersonated && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="space-y-0.5">
            <span className="font-bold block">
              {t("security.super_admin_impersonated_title")}
            </span>
            <p className="text-[11px] text-amber-700 dark:text-amber-300/90 leading-relaxed">
              {t("security.super_admin_impersonated_desc")} Operator:{" "}
              <strong className="font-mono">{String(event.metadata?.impersonatedBy || event.actorId)}</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewTab({ event }: { event: TenantAuditEvent }) {
  const { t, formatDate } = useTranslation();
  return (
    <TabsContent value="overview" className="mt-0 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-muted/20 border border-border/40 space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {t("security.audit_time_label")}
          </span>
          <span className="font-mono font-medium text-foreground block">
            {formatDate(new Date(event.occurredAt))}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground block">
            {new Date(event.occurredAt).toISOString()}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-muted/20 border border-border/40 space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" /> {t("security.audit_actor_label")}
          </span>
          <span className="font-mono font-medium text-foreground block truncate">
            {event.actorEmail || event.actorId}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground block">
            {t("security.audit_actor_role", { role: event.actorRole || "N/A", ip: event.actorIp || "127.0.0.1" })}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-muted/20 border border-border/40 space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
            <Server className="h-3 w-3" /> {t("security.audit_resource_label")}
          </span>
          <span className="font-mono font-medium text-foreground block truncate">
            {event.resourceType}: {event.resourceId}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground block">
            {t("security.audit_category_label")}: {event.category}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-muted/20 border border-border/40 space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            {t("security.audit_tenant_label")}
          </span>
          <span className="font-mono font-medium text-foreground block truncate">
            Tenant: {event.tenantSlug}
          </span>
          {event.projectId && (
            <span className="text-[10px] font-mono text-muted-foreground block truncate">
              {t("security.audit_project_context")}: {event.projectName || event.projectId}
            </span>
          )}
        </div>
      </div>

      {event.metadata && Object.keys(event.metadata).length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-foreground">
            {t("security.audit_metadata_ext")}
          </span>
          <pre className="p-3 rounded-lg bg-muted/40 border border-border/60 text-[11px] font-mono text-foreground overflow-x-auto">
            {JSON.stringify(event.metadata, null, 2)}
          </pre>
        </div>
      )}
    </TabsContent>
  );
}

function DiffTab({ event }: { event: TenantAuditEvent }) {
  const { t } = useTranslation();
  return (
    <TabsContent value="diff" className="mt-0 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-destructive flex items-center gap-1">
              {t("security.audit_old_value")}
            </span>
            <Badge variant="outline" className="text-[9px] font-mono bg-destructive/10 text-destructive border-destructive/20">
              {t("security.audit_prev_label")}
            </Badge>
          </div>
          <pre className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-[11px] font-mono text-foreground overflow-x-auto min-h-[120px]">
            {event.oldValue && Object.keys(event.oldValue).length > 0
              ? JSON.stringify(event.oldValue, null, 2)
              : t("security.audit_no_old_value")}
          </pre>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              {t("security.audit_new_value")}
            </span>
            <Badge variant="outline" className="text-[9px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
              {t("security.audit_updated_label")}
            </Badge>
          </div>
          <pre className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-[11px] font-mono text-foreground overflow-x-auto min-h-[120px]">
            {event.newValue && Object.keys(event.newValue).length > 0
              ? JSON.stringify(event.newValue, null, 2)
              : t("security.audit_no_new_value")}
          </pre>
        </div>
      </div>
    </TabsContent>
  );
}

function RawJsonTab({ event }: { event: TenantAuditEvent }) {
  return (
    <TabsContent value="raw" className="mt-0 space-y-2">
      <pre className="p-3 rounded-lg bg-muted/40 border border-border/60 text-[11px] font-mono text-foreground overflow-x-auto">
        {JSON.stringify(event, null, 2)}
      </pre>
    </TabsContent>
  );
}

export function TenantAuditDetailDrawer({
  event,
  open,
  onClose,
}: TenantAuditDetailDrawerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<"overview" | "diff" | "raw">("overview");
  const [copied, setCopied] = React.useState(false);

  if (!open || !event) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopied(true);
    toast.success(t("security.audit_copy_payload_success"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNavigateToGis = () => {
    if (!event.projectId) return;
    onClose();
    navigate({
      to: "/project/$projectId/infrastructure/topology",
      params: { projectId: event.projectId },
    });
  };

  return (
    <LogsDetailDrawerShell
      onClose={onClose}
      title={`${event.action} • ${event.resourceType}`}
      className="w-full sm:max-w-xl md:max-w-2xl bg-card border-l border-border/80 shadow-2xl p-0 flex flex-col h-full"
    >
      <DrawerHeader
        event={event}
        copied={copied}
        onCopyJson={handleCopyJson}
        onNavigateToGis={handleNavigateToGis}
      />

      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "overview" | "diff" | "raw")}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="px-4 border-b border-border/40 bg-muted/10">
          <TabsList className="bg-transparent h-10 p-0 gap-4">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-2 text-xs font-semibold gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" />
              {t("common.overview")}
            </TabsTrigger>
            <TabsTrigger
              value="diff"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-2 text-xs font-semibold gap-1.5"
            >
              <GitCompare className="h-3.5 w-3.5" />
              {t("security.audit_changes_diff")}
            </TabsTrigger>
            <TabsTrigger
              value="raw"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none px-2 text-xs font-semibold gap-1.5"
            >
              <Code2 className="h-3.5 w-3.5" />
              {t("security.audit_raw_payload")}
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 p-4 custom-scrollbar">
          <OverviewTab event={event} />
          <DiffTab event={event} />
          <RawJsonTab event={event} />
        </ScrollArea>
      </Tabs>
    </LogsDetailDrawerShell>
  );
}
