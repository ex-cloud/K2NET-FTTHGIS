import { Terminal, RefreshCw } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@k2net/ui";
import { cn } from "@/lib/utils";

interface DnsDiagnosticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diagnosingDomain: string;
  diagnosticsOutput: string[];
  runningDiag: boolean;
}

export function DnsDiagnosticsModal({
  open,
  onOpenChange,
  diagnosingDomain,
  diagnosticsOutput,
  runningDiag,
}: DnsDiagnosticsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover/95 backdrop-blur-xl border-border sm:max-w-[560px] p-0 overflow-hidden shadow-2xl text-foreground rounded-2xl">
        <DialogHeader className="p-6 pb-2 text-foreground">
          <DialogTitle className="text-base font-bold flex items-center gap-2 font-mono">
            <Terminal className="w-4 h-4 text-primary" />
            <span>DNS Dig &amp; TLS Inspection: {diagnosingDomain}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-3">
          <div className="rounded-xl bg-black/90 p-4 font-mono text-xs text-foreground/90 space-y-1 max-h-[300px] overflow-auto custom-scrollbar border border-border/40">
            {diagnosticsOutput.map((line, idx) => (
              <div
                key={idx}
                className={cn(
                  line.startsWith(";;")
                    ? "text-muted-foreground/80"
                    : line.includes("SUCCESS")
                    ? "text-primary font-bold"
                    : "text-foreground"
                )}
              >
                {line || "\u00A0"}
              </div>
            ))}
            {runningDiag && (
              <div className="flex items-center gap-2 text-primary pt-2">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Resolving DNS records via 8.8.8.8...</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
          <Button size="sm" onClick={() => onOpenChange(false)} className="text-xs cursor-pointer">
            Close Inspector
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
