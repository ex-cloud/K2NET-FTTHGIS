import * as React from "react";
import {
  PageHero,
  Card,
  Button,
  Input,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  Bell,
  Mail,
  MessageSquare,
  Search,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Eye,
  FileText,
} from "lucide-react";
import {
  useAllGlobalNotificationLogs,
  type LicenseNotificationLog,
} from "@/hooks/useOrganizationLicenses";

export default function LicenseNotificationsPage() {
  const { t } = useTranslation();
  const { data: logs = [], isLoading, isFetching, refetch } = useAllGlobalNotificationLogs();

  const [search, setSearch] = React.useState<string>("");
  const [channelFilter, setChannelFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [selectedLog, setSelectedLog] = React.useState<LicenseNotificationLog | null>(null);

  // Compute metrics
  const totalCount = logs.length;
  const emailCount = logs.filter((l) => l.channel?.toUpperCase() === "EMAIL").length;
  const waCount = logs.filter((l) => l.channel?.toUpperCase() === "WHATSAPP").length;
  const failedCount = logs.filter((l) => l.status?.toUpperCase() === "FAILED").length;

  // Filtered logs
  const filteredLogs = React.useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        search.trim() === "" ||
        log.recipient?.toLowerCase().includes(search.toLowerCase()) ||
        log.subject?.toLowerCase().includes(search.toLowerCase()) ||
        log.organizationName?.toLowerCase().includes(search.toLowerCase()) ||
        log.organizationSlug?.toLowerCase().includes(search.toLowerCase()) ||
        log.triggeredBy?.toLowerCase().includes(search.toLowerCase());

      const matchChannel =
        channelFilter === "ALL" || log.channel?.toUpperCase() === channelFilter;

      const matchStatus =
        statusFilter === "ALL" || log.status?.toUpperCase() === statusFilter;

      return matchSearch && matchChannel && matchStatus;
    });
  }, [logs, search, channelFilter, statusFilter]);

  return (
    <div className="relative flex flex-col w-full h-full bg-background pt-6 pb-0 gap-5 overflow-hidden">
      {/* Page Hero Header */}
      <div className="px-4 md:px-6 shrink-0">
        <PageHero
          bordered={false}
          className="pb-0"
          eyebrow={t("license.hero_eyebrow")}
          title={t("license.notifications.global_title")}
          icon={Bell}
          subtitle={t("license.notifications.global_desc")}
          meta={
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground/90 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground font-mono">{totalCount}</span>
                <span>{t("license.notifications.total_dispatches")}</span>
              </div>
              <span className="text-muted-foreground/30 px-1">/</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground font-mono">{emailCount}</span>
                <span>Email</span>
              </div>
              <span className="text-muted-foreground/30 px-1">/</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground font-mono">{waCount}</span>
                <span>WhatsApp</span>
              </div>
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="gap-1.5 text-xs font-medium"
              >
                <RefreshCcw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
                <span>{t("common.refresh")}</span>
              </Button>
            </div>
          }
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-8 space-y-5">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card glowingEffect className="p-4 flex flex-col justify-between gap-3 bg-card border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
                {t("license.notifications.total_dispatches")}
              </span>
              <div className="h-6 w-6 rounded-lg bg-foreground/5 border border-border flex items-center justify-center text-foreground">
                <Bell className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {isLoading ? "—" : totalCount}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {t("license.notifications.total_dispatches")}
              </p>
            </div>
          </Card>

          <Card glowingEffect className="p-4 flex flex-col justify-between gap-3 bg-card border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
                {t("license.notifications.email_dispatches")}
              </span>
              <div className="h-6 w-6 rounded-lg bg-foreground/5 border border-border flex items-center justify-center text-foreground">
                <Mail className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {isLoading ? "—" : emailCount}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">SMTP & Transactional Invoices</p>
            </div>
          </Card>

          <Card glowingEffect className="p-4 flex flex-col justify-between gap-3 bg-card border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
                {t("license.notifications.whatsapp_dispatches")}
              </span>
              <div className="h-6 w-6 rounded-lg bg-foreground/5 border border-border flex items-center justify-center text-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {isLoading ? "—" : waCount}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">WABA Proactive Alert Bot</p>
            </div>
          </Card>

          <Card glowingEffect className="p-4 flex flex-col justify-between gap-3 bg-card border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase font-mono">
                {t("license.notifications.failed_dispatches")}
              </span>
              <div className="h-6 w-6 rounded-lg bg-foreground/5 border border-border flex items-center justify-center text-foreground">
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {isLoading ? "—" : failedCount}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {failedCount > 0 ? t("license.kpi.attention_needed") : t("license.kpi.healthy")}
              </p>
            </div>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder={t("license.notifications.search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-muted/20 border-border"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Channel filter */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-border"
            >
              <option value="ALL">All Channels</option>
              <option value="EMAIL">Email</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-border"
            >
              <option value="ALL">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {/* Dispatch Logs Table */}
        <div className="rounded-lg border border-border/80 bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-[11px] font-semibold text-foreground h-8">
                  {t("license.notifications.sent_at")}
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-foreground h-8">
                  {t("license.table.tenant_org")}
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-foreground h-8">
                  {t("license.notifications.channel")}
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-foreground h-8">
                  {t("license.notifications.stage")}
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-foreground h-8">
                  {t("license.notifications.recipient")}
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-foreground h-8">
                  {t("license.notifications.status")}
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-foreground h-8 text-right pr-4">
                  {t("license.table.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                    {t("common.loading")}
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                    {t("license.notifications.no_logs")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const isWa = log.channel?.toUpperCase() === "WHATSAPP";
                  const isSent = log.status?.toUpperCase() === "SENT";

                  return (
                    <TableRow key={log.id} className="border-border/60 hover:bg-muted/15 transition-colors">
                      <TableCell className="py-2 text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {log.sentAt ? log.sentAt.replace("T", " ").substring(0, 19) : "—"}
                      </TableCell>

                      <TableCell className="py-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                          <div>
                            <span className="font-medium text-foreground">
                              {log.organizationName || log.organizationSlug || "—"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-2 text-xs">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs border border-border bg-muted/20 text-[10px] font-mono">
                          {isWa ? <MessageSquare className="size-2.5 text-primary" /> : <Mail className="size-2.5 text-foreground" />}
                          <span>{log.channel}</span>
                        </span>
                      </TableCell>

                      <TableCell className="py-2 text-xs">
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {log.stage}
                        </span>
                      </TableCell>

                      <TableCell className="py-2 text-xs font-mono text-foreground truncate max-w-[200px]">
                        {log.recipient}
                      </TableCell>

                      <TableCell className="py-2 text-xs">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs border text-[10px] font-mono font-medium ${
                            isSent
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-border bg-muted text-muted-foreground"
                          }`}
                        >
                          {isSent ? <CheckCircle2 className="size-2.5" /> : <AlertTriangle className="size-2.5" />}
                          <span>{log.status}</span>
                        </span>
                      </TableCell>

                      <TableCell className="py-2 text-xs text-right pr-4">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setSelectedLog(log)}
                          className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                        >
                          <Eye className="size-3" />
                          <span>{t("license.notifications.view_content")}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Message Content Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-muted text-foreground">
                <FileText className="size-3.5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground">
                  {t("license.notifications.message_content")}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {selectedLog?.recipient} ({selectedLog?.channel})
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-3 py-2 text-xs">
              {selectedLog.subject && (
                <div className="p-2.5 rounded-md border border-border/70 bg-muted/20">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block mb-0.5">
                    Subject
                  </span>
                  <p className="font-semibold text-foreground">{selectedLog.subject}</p>
                </div>
              )}

              <div className="p-3 rounded-md border border-border/70 bg-muted/10">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">
                  {t("license.notifications.message_content")}
                </span>
                <pre className="text-[11px] font-mono text-foreground whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {selectedLog.messageContent || "No message body recorded"}
                </pre>
              </div>

              {selectedLog.errorDetails && (
                <div className="p-2.5 rounded-md border border-border/70 bg-muted/20 text-muted-foreground">
                  <span className="text-[10px] font-mono uppercase block mb-0.5 text-foreground font-semibold">
                    {t("license.notifications.error_details")}
                  </span>
                  <p className="text-[11px] font-mono">{selectedLog.errorDetails}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
