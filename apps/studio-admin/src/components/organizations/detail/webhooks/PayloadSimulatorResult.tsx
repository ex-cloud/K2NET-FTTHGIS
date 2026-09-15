import { Badge } from "@k2net/ui";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SimulateEventResponse } from "./types";

interface PayloadSimulatorResultProps {
  result: SimulateEventResponse | null;
}

export function PayloadSimulatorResult({ result }: PayloadSimulatorResultProps) {
  if (!result) return null;

  return (
    <div
      className={cn(
        "p-4 rounded-xl border space-y-2.5 transition-all",
        result.success
          ? "bg-primary/5 border-primary/30"
          : "bg-destructive/5 border-destructive/30"
      )}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {result.success ? (
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive shrink-0" />
          )}
          <span className="text-xs font-bold text-foreground">
            Hasil Pengiriman Simulasi:
          </span>
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-[9px]",
              result.success
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-destructive/40 bg-destructive/10 text-destructive"
            )}
          >
            HTTP {result.httpStatus || "ERR"}
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Latency: {result.latencyMs}ms
          </span>
        </div>
      </div>

      {result.errorMessage && (
        <div className="p-2 rounded bg-destructive/10 border border-destructive/20 text-destructive font-mono text-[11px]">
          <strong>Error:</strong> {result.errorMessage}
        </div>
      )}

      <div className="text-[11px] text-muted-foreground">
        Payload berhasil diverifikasi dan dikirim ke <code className="font-mono text-foreground">{result.targetUrl}</code>.
      </div>
    </div>
  );
}
