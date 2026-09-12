import * as React from "react";
import { Terminal, Clock } from "lucide-react";
import { Badge } from "@k2net/ui";
import { cn } from "@/lib/utils";

export interface DnsDiagnosticResult {
  success: boolean;
  domain: string;
  cname: string | null;
  isCnameMatched: boolean;
  ip: string | null;
  latencyMs: number;
  status: "OK" | "MISMATCH" | "ERROR";
  sslReady: boolean;
  logs: string[];
  timestamp: string;
}

interface DnsDiagnosticConsoleProps {
  dnsResult: DnsDiagnosticResult;
}

export function DnsDiagnosticConsole({ dnsResult }: DnsDiagnosticConsoleProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-background/90 p-3 space-y-2 font-mono text-[11px] animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Terminal className="h-3.5 w-3.5 text-primary" />
          <span>Live DNS Dig Console</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            <span>{dnsResult.latencyMs}ms</span>
          </span>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] font-mono",
              dnsResult.status === "OK"
                ? "border-primary/30 bg-primary/10 text-primary"
                : dnsResult.status === "MISMATCH"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            )}
          >
            {dnsResult.status}
          </Badge>
        </div>
      </div>

      <div className="bg-muted/40 rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1 custom-scrollbar text-[10px] leading-relaxed">
        {dnsResult.logs.map((log, idx) => (
          <div
            key={idx}
            className={cn(
              log.includes("[MATCH-SUCCESS]")
                ? "text-primary font-bold"
                : log.includes("[ERROR]") || log.includes("[DIAGNOSTIC-FAIL]")
                ? "text-destructive font-semibold"
                : log.includes("[MATCH-WARNING]")
                ? "text-amber-500"
                : "text-muted-foreground"
            )}
          >
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
