import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import { AlertOctagon, RotateCcw, Terminal, Layers } from "lucide-react";
import type { DeadLetterLog } from "./types";

interface DlqDetailModalProps {
  selectedLog: DeadLetterLog | null;
  onClose: () => void;
  onReplay: (id: string) => void;
}

export function DlqDetailModal({
  selectedLog,
  onClose,
  onReplay,
}: DlqDetailModalProps) {
  if (!selectedLog) return null;

  return (
    <Dialog open={!!selectedLog} onOpenChange={(open) => !open && onClose()}>
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
            onClick={onClose}
            className="h-8 text-xs border-border"
          >
            Tutup
          </Button>
          <Button
            type="button"
            onClick={() => {
              const id = selectedLog.id;
              onClose();
              onReplay(id);
            }}
            className="h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Kirim Ulang Sekarang</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
