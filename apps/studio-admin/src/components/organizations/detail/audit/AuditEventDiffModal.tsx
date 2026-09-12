import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@k2net/ui";
import { Code2 } from "lucide-react";
import type { TenantAuditEvent } from "./types";

interface AuditEventDiffModalProps {
  selectedEvent: TenantAuditEvent | null;
  onClose: () => void;
}

export function AuditEventDiffModal({
  selectedEvent,
  onClose,
}: AuditEventDiffModalProps) {
  return (
    <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-popover/95 backdrop-blur-2xl border-border text-foreground rounded-2xl shadow-2xl p-6 max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase font-bold">
              <Code2 className="h-4 w-4" />
              <span>Audit Event Payload Inspector</span>
            </div>
            <Badge variant="outline" className="border-border text-[10px] font-mono">
              {selectedEvent?.id}
            </Badge>
          </div>
          <DialogTitle className="text-base font-bold text-foreground">
            {selectedEvent?.action}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {selectedEvent?.details}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 overflow-y-auto pr-1">
          {/* Event Meta */}
          <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-card border border-border">
            <div>
              <span className="text-[10px] uppercase font-mono text-muted-foreground block">Actor</span>
              <span className="font-semibold text-foreground">
                {selectedEvent?.actorUsername} ({selectedEvent?.actorEmail})
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-muted-foreground block">Client IP</span>
              <span className="font-mono text-foreground">{selectedEvent?.ipAddress}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-muted-foreground block">Target</span>
              <span className="font-mono text-foreground">
                {selectedEvent?.targetEntity} ({selectedEvent?.targetId})
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-muted-foreground block">Waktu Event</span>
              <span className="font-mono text-foreground">{selectedEvent?.timestamp}</span>
            </div>
          </div>

          {/* Before vs After State Diff */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>State Sebelum (Before)</span>
              </span>
              <pre className="p-3 rounded-xl bg-card border border-border text-[11px] font-mono text-foreground overflow-auto max-h-48 leading-relaxed">
                {JSON.stringify(selectedEvent?.beforeState || {}, null, 2)}
              </pre>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span>State Sesudah (After)</span>
              </span>
              <pre className="p-3 rounded-xl bg-card border border-border text-[11px] font-mono text-primary overflow-auto max-h-48 leading-relaxed">
                {JSON.stringify(selectedEvent?.afterState || {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs border-border cursor-pointer"
          >
            Tutup Inspector
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
