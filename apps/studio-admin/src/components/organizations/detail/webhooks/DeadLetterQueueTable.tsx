import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import {
  AlertOctagon,
  RotateCcw,
  Eye,
  CheckCircle2,
  Clock,
  Terminal,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeadLetterLog } from "./types";

interface DeadLetterQueueTableProps {
  dlqLogs: DeadLetterLog[];
  loadingDlq: boolean;
  onReplayWebhook: (logId: string) => Promise<{ status: number; latencyMs: number; success: boolean; errorMessage?: string }>;
  onRefreshDlq: () => void;
}

export function DeadLetterQueueTable({
  dlqLogs,
  loadingDlq,
  onReplayWebhook,
  onRefreshDlq,
}: DeadLetterQueueTableProps) {
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

  const getStatusBadge = (log: DeadLetterLog) => {
    switch (log.status) {
      case "RETRYING":
        return (
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[9px] gap-1">
            <Clock className="h-2.5 w-2.5 animate-spin" />
            RETRYING ({log.retryCount}/{log.maxRetries})
          </Badge>
        );
      case "FAILED_DLQ":
      case "EXHAUSTED":
        return (
          <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive font-mono text-[9px] gap-1">
            <AlertOctagon className="h-2.5 w-2.5" />
            DEAD LETTER (DLQ)
          </Badge>
        );
      case "DELIVERED":
        return (
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[9px] gap-1">
            <CheckCircle2 className="h-2.5 w-2.5" />
            RECOVERED
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-border text-muted-foreground font-mono text-[9px]">
            {log.status}
          </Badge>
        );
    }
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshDlq}
            disabled={loadingDlq}
            className="h-7 px-2.5 text-xs border-border text-foreground hover:bg-muted gap-1.5 cursor-pointer"
          >
            <RotateCcw className={cn("h-3 w-3", loadingDlq && "animate-spin")} />
            <span>Refresh DLQ</span>
          </Button>
        </div>
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
                  <td className="py-2.5 px-3">{getStatusBadge(log)}</td>
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
                        title="Lihat Detail Payload & Error"
                      >
                        <Eye className="h-2.5 w-2.5" />
                        <span>Detail</span>
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleReplay(log.id)}
                        disabled={replayingId === log.id}
                        className="h-6 px-2 text-[10px] bg-primary text-primary-foreground hover:bg-primary/90 gap-1 cursor-pointer"
                        title="Coba kirim ulang payload sekarang"
                      >
                        <RotateCcw className={cn("h-2.5 w-2.5", replayingId === log.id && "animate-spin")} />
                        <span>{replayingId === log.id ? "Replaying..." : "Manual Replay"}</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="max-w-xl bg-card border-border shadow-lg p-6 space-y-4">
            <DialogHeader className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shrink-0">
                  <AlertOctagon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-bold text-foreground">
                    Detail Gagal Pengiriman Webhook
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    ID: <code className="font-mono text-foreground">{selectedLog.id}</code>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 pt-1 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-background/50 border border-border">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Event Type:</span>
                  <span className="font-mono font-semibold text-foreground">{selectedLog.eventType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Target URL:</span>
                  <span className="font-mono text-foreground text-[11px] truncate block">{selectedLog.targetUrl}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Percobaan Retry:</span>
                  <span className="font-mono text-foreground">{selectedLog.retryCount} dari {selectedLog.maxRetries}x</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Waktu Dibuat:</span>
                  <span className="text-foreground">{new Date(selectedLog.createdAt).toLocaleString("id-ID")}</span>
                </div>
              </div>

              {selectedLog.errorMessage && (
                <div className="space-y-1">
                  <span className="font-semibold text-foreground text-xs">Pesan Error Terakhir:</span>
                  <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 font-mono text-[11px] text-destructive">
                    {selectedLog.errorMessage}
                  </div>
                </div>
              )}

              {selectedLog.payloadJson && (
                <div className="space-y-1">
                  <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-primary" />
                    <span>Payload JSON yang Dikirimkan:</span>
                  </span>
                  <pre className="p-3 rounded-lg bg-background border border-border font-mono text-[10px] max-h-48 overflow-y-auto select-all text-foreground leading-relaxed">
                    {selectedLog.payloadJson}
                  </pre>
                </div>
              )}

              {selectedLog.responseBody && (
                <div className="space-y-1">
                  <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Response Body dari Server Tujuan:</span>
                  </span>
                  <pre className="p-2.5 rounded-lg bg-background border border-border font-mono text-[10px] max-h-24 overflow-y-auto text-muted-foreground">
                    {selectedLog.responseBody}
                  </pre>
                </div>
              )}
            </div>

            <DialogFooter className="pt-2 sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedLog(null)}
                className="h-8 text-xs border-border"
              >
                Tutup
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const id = selectedLog.id;
                  setSelectedLog(null);
                  handleReplay(id);
                }}
                className="h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Kirim Ulang Sekarang</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
