import * as React from "react";
import { Badge, Button, cn } from "@k2net/ui";
import {
  CheckCircle2,
  ShieldAlert,
  Copy,
  Layers,
  ChevronRight,
} from "lucide-react";
import type { BatchIntegrityReport } from "./logs-integrity-utils";

export interface OverviewTabContentProps {
  report: BatchIntegrityReport;
  onCopy: (text: string, label: string) => void;
  onViewTree: () => void;
}

export function LogsIntegrityOverviewTab({
  report,
  onCopy,
  onViewTree,
}: OverviewTabContentProps) {
  const isHealthy = report.overallStatus === "COMPLIANT_UNALTERED";

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Big Status Banner */}
      <div
        className={cn(
          "p-4 rounded-xl border flex items-start justify-between gap-4",
          isHealthy
            ? "bg-primary/10 border-primary/30 text-foreground"
            : "bg-destructive/10 border-destructive/30 text-foreground"
        )}
      >
        <div className="flex items-start gap-3">
          {isHealthy ? (
            <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
          )}
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              <span>
                {isHealthy
                  ? "100% Cryptographically Intact & Tamper-Proof"
                  : "Cryptographic Integrity Warning Detected"}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-mono",
                  isHealthy
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-destructive/40 bg-destructive/15 text-destructive"
                )}
              >
                {report.overallStatus}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              {isHealthy
                ? "Every scanned event matches its deterministic SHA-256 signature and maintains unbroken cryptographic hash chain continuity back to the Genesis root."
                : "One or more events exhibit broken hash chaining or modified payload checksums. Immediate security review recommended."}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-foreground">
            {report.verifiedCount} / {report.totalEvents}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Events Verified
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-lg border border-border bg-card flex flex-col gap-1">
          <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">
            Merkle Tree Root
          </span>
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-mono font-bold text-foreground truncate">
              {report.merkleTree.root.substring(0, 12)}...
            </span>
            <button
              type="button"
              onClick={() => onCopy(report.merkleTree.root, "Merkle Root")}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border bg-card flex flex-col gap-1">
          <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">
            Genesis Root Anchor
          </span>
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-mono font-bold text-foreground truncate">
              {report.genesisHash.substring(0, 14)}...
            </span>
            <button
              type="button"
              onClick={() => onCopy(report.genesisHash, "Genesis Hash")}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border bg-card flex flex-col gap-1">
          <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">
            Tampered Breaches
          </span>
          <div className="flex items-center gap-1.5">
            {report.tamperedCount === 0 ? (
              <span className="text-xs font-bold text-primary">0 (Zero Violations)</span>
            ) : (
              <span className="text-xs font-bold text-destructive">
                {report.tamperedCount} Corrupted
              </span>
            )}
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border bg-card flex flex-col gap-1">
          <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">
            Verification Speed
          </span>
          <div className="text-xs font-bold text-foreground">
            {report.computationDurationMs} ms (Client-Side)
          </div>
        </div>
      </div>

      {/* Forensic Topology Breakdown */}
      <div className="p-3.5 rounded-xl border border-border bg-card/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Cryptographic Chaining Architecture</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewTree}
            className="text-xs h-6 px-2 text-primary hover:text-primary cursor-pointer font-mono"
          >
            <span>Explore Tree Details</span>
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
        <div className="p-3 rounded-lg bg-muted/20 border border-border/50 text-[11px] leading-relaxed text-muted-foreground space-y-1.5">
          <div>
            • <strong className="text-foreground">Formula:</strong>{" "}
            <code className="text-primary font-mono">
              H_n = SHA256(H_prev | Tenant | Actor | Action | Resource | Time | PayloadChecksum)
            </code>
          </div>
          <div>
            • <strong className="text-foreground">Merkle Hierarchy:</strong>{" "}
            {report.merkleTree.totalLeaves} leaves aggregated into {report.merkleTree.levels.length}{" "}
            tree levels.
          </div>
          <div>
            • <strong className="text-foreground">Compliance:</strong> Meets SOC 2 CC7.2 (Log
            Integrity), ISO 27001 A.8.15, & UU PDP Article 35.
          </div>
        </div>
      </div>
    </div>
  );
}
