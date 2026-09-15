import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  ActionTooltip,
} from "@k2net/ui";
import {
  AlertOctagon,
  RotateCcw,
  Eye,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import type { DeadLetterLog, PingResult } from "./types";
import { DlqDetailModal } from "./DlqDetailModal";

interface DeadLetterQueueTableProps {
  dlqLogs: DeadLetterLog[];
  loadingDlq: boolean;
  onReplayWebhook: (logId: string) => Promise<PingResult>;
  onRefreshDlq: () => void;
}

export function DeadLetterQueueTable({
  dlqLogs,
  loadingDlq,
  onReplayWebhook,
  onRefreshDlq,
}: DeadLetterQueueTableProps) {
  const { canAccess } = usePermissions();
  const canManage = canAccess("system.organizations.webhooks.manage");

  const [selectedLog, setSelectedLog] = useState<DeadLetterLog | null>(null);
  const [replayingId, setReplayingId] = useState<string | null>(null);

  const handleReplay = async (id: string) => {
    try {
      setReplayingId(id);
      await onReplayWebhook(id);
      onRefreshDlq();
    } finally {
      setReplayingId(null);
    }
  };

  const renderStatusBadge = (log: DeadLetterLog) => {
    if (log.status === "RETRYING") {
      return (
        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[9px] gap-1">
          <Clock className="h-2.5 w-2.5 animate-spin" />
          RETRYING ({log.retryCount}/{log.maxRetries})
        </Badge>
      );
    }
    if (log.status === "FAILED_DLQ" || log.status === "EXHAUSTED") {
      return (
        <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive font-mono text-[9px] gap-1">
          <AlertOctagon className="h-2.5 w-2.5" />
          DEAD LETTER (DLQ)
        </Badge>
      );
    }
    if (log.status === "DELIVERED") {
      return (
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[9px] gap-1">
          <CheckCircle2 className="h-2.5 w-2.5" />
          RECOVERED
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-border text-muted-foreground font-mono text-[9px]">
        {log.status}
      </Badge>
    );
  };

  return (
    <Card className="p-5 space-y-4 bg-card border-border shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shrink-0 shadow-xs">
            <AlertOctagon className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-foreground">Dead Letter Queue (DLQ) & Retry Engine</h3>
              <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive text-[9px] font-mono">
                {dlqLogs.length} FAILED DELIVERIES
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Antrean event yang gagal terkirim ke server tujuan setelah 4x percobaan bertahap (0s, 30s, 5m, 30m).
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefreshDlq}
          disabled={loadingDlq}
          className="h-7 px-2.5 text-xs border-border text-foreground hover:bg-muted gap-1.5 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Refresh DLQ</span>
        </Button>
      </div>

      {loadingDlq ? (
        <div className="p-6 text-center text-xs text-muted-foreground animate-pulse">
          Memeriksa antrean Dead Letter Queue...
        </div>
      ) : dlqLogs.length === 0 ? (
        <div className="p-6 rounded-lg border border-dashed border-border bg-background/50 text-center space-y-2">
          <CheckCircle2 className="h-6 w-6 text-primary mx-auto" />
          <div className="text-xs font-medium text-foreground">Tidak Ada Antrean Dead Letter Queue</div>
          <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
            Semua webhook berhasil terkirim ke endpoint tujuan tenant atau telah dipulihkan dengan sukses.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border/80 bg-background/30">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider border-b border-border/80">
              <tr>
                <th className="py-2.5 px-3">Event</th>
                <th className="py-2.5 px-3">Target URL</th>
                <th className="py-2.5 px-3">Status / Retries</th>
                <th className="py-2.5 px-3">Last Error</th>
                <th className="py-2.5 px-3">Next Retry</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {dlqLogs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-foreground">
                    {log.eventType}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] max-w-[220px] truncate text-foreground">
                    {log.targetUrl}
                  </td>
                  <td className="py-2.5 px-3">{renderStatusBadge(log)}</td>
                  <td className="py-2.5 px-3 text-[11px] font-mono text-destructive max-w-[200px] truncate">
                    {log.errorMessage || (log.httpStatus ? `HTTP ${log.httpStatus}` : "Timeout")}
                  </td>
                  <td className="py-2.5 px-3 text-[10px] text-muted-foreground font-mono">
                    {log.nextRetryAt
                      ? new Date(log.nextRetryAt).toLocaleTimeString("id-ID")
                      : "Selesai"}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="h-6 px-2 text-[10px] border-border text-foreground hover:bg-muted gap-1 cursor-pointer"
                      >
                        <Eye className="h-2.5 w-2.5" />
                        <span>Detail</span>
                      </Button>
                      {canManage ? (
                        <Button
                          size="sm"
                          onClick={() => handleReplay(log.id)}
                          disabled={replayingId === log.id}
                          className="h-6 px-2 text-[10px] bg-primary text-primary-foreground hover:bg-primary/90 gap-1 cursor-pointer"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                          <span>{replayingId === log.id ? "Replaying..." : "Replay"}</span>
                        </Button>
                      ) : (
                        <ActionTooltip label="Akses Read-Only: Memerlukan izin system.organizations.webhooks.manage">
                          <span className="inline-block">
                            <Button
                              size="sm"
                              disabled
                              className="h-6 px-2 text-[10px] bg-muted text-muted-foreground opacity-50 cursor-not-allowed gap-1"
                            >
                              <ShieldAlert className="h-2.5 w-2.5" />
                              <span>Replay</span>
                            </Button>
                          </span>
                        </ActionTooltip>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DlqDetailModal
        selectedLog={selectedLog}
        onClose={() => setSelectedLog(null)}
        onReplay={handleReplay}
      />
    </Card>
  );
}
