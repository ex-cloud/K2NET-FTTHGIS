import React from "react";
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
    <div className="space-y-3 animate-in fade-in duration-150 text-xs">
      {/* Slim Monochrome Status Banner */}
      <div className="p-3 rounded-lg border border-border/60 bg-muted/15 flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          {isHealthy ? (
            <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-destructive shrink-0" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground truncate">
                {isHealthy
                  ? "Cryptographic Chaining Intact & Verified"
                  : "Cryptographic Integrity Warning"}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] font-mono py-0 px-1.5 h-4 shrink-0",
                  isHealthy
                    ? "border-border bg-muted/40 text-muted-foreground"
                    : "border-destructive/40 bg-destructive/10 text-destructive"
                )}
              >
                {report.overallStatus}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {isHealthy
                ? "All events match deterministic SHA-256 signatures with unbroken hash chain continuity."
                : "One or more events exhibit broken hash chaining or modified payload checksums."}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 font-mono">
          <div className="text-sm font-bold text-foreground">
            {report.verifiedCount} / {report.totalEvents}
          </div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-sans">
            Verified
          </div>
        </div>
      </div>

      {/* 4 KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="p-2.5 rounded-lg border border-border/60 bg-card flex flex-col gap-1">
          <span className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider font-sans">
            Merkle Tree Root
          </span>
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-mono font-semibold text-foreground truncate">
              {report.merkleTree.root.substring(0, 12)}...
            </span>
            <button
              type="button"
              onClick={() => onCopy(report.merkleTree.root, "Merkle Root")}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Copy Merkle Tree Root"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="p-2.5 rounded-lg border border-border/60 bg-card flex flex-col gap-1">
          <span className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider font-sans">
            Genesis Root Anchor
          </span>
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-mono font-semibold text-foreground truncate">
              {report.genesisHash.substring(0, 14)}...
            </span>
            <button
              type="button"
              onClick={() => onCopy(report.genesisHash, "Genesis Hash")}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Copy Genesis Anchor Hash"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="p-2.5 rounded-lg border border-border/60 bg-card flex flex-col gap-1">
          <span className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider font-sans">
            Tampered Breaches
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {report.tamperedCount === 0 ? (
              <span className="text-xs font-semibold text-foreground font-mono">0 (Clean)</span>
            ) : (
              <span className="text-xs font-bold text-destructive font-mono">
                {report.tamperedCount} Corrupted
              </span>
            )}
          </div>
        </div>

        <div className="p-2.5 rounded-lg border border-border/60 bg-card flex flex-col gap-1">
          <span className="text-[9px] uppercase text-muted-foreground font-semibold tracking-wider font-sans">
            Verification Speed
          </span>
          <div className="text-xs font-semibold text-foreground font-mono mt-0.5">
            {report.computationDurationMs} ms (Client)
          </div>
        </div>
      </div>

      {/* Compact Forensic Navigation Strip */}
      <div className="p-2.5 px-3 rounded-lg border border-border/60 bg-muted/15 flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px]">
          <Layers className="w-3.5 h-3.5 text-muted-foreground" />
          <span>
            {report.merkleTree.totalLeaves} leaves in {report.merkleTree.levels.length} Merkle levels • SOC 2 & ISO 27001 Compliant
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewTree}
          className="text-xs h-6.5 px-2 text-foreground hover:bg-muted cursor-pointer font-sans"
        >
          <span>Inspect Merkle Tree</span>
          <ChevronRight className="w-3.5 h-3.5 ml-1 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
