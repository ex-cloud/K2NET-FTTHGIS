import * as React from "react";
import { Badge, Button } from "@k2net/ui";
import { Copy, Download } from "lucide-react";
import type { BatchIntegrityReport } from "./logs-integrity-utils";

export interface CertificateTabContentProps {
  report: BatchIntegrityReport;
  onDownload: () => void;
  onCopy: (text: string, label: string) => void;
}

export function LogsIntegrityCertificateTab({
  report,
  onDownload,
  onCopy,
}: CertificateTabContentProps) {
  const cert = report.certificate;

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="p-4 rounded-xl border border-border bg-card shadow-inner space-y-3 font-mono">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <div className="text-xs uppercase text-muted-foreground tracking-widest">
              Official Audit Attestation
            </div>
            <div className="text-sm font-bold text-foreground mt-0.5">{cert.certificateId}</div>
          </div>
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 text-primary text-[10px]"
          >
            {cert.overallStatus}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground text-[10px] block">Verified Principal</span>
            <span className="font-semibold text-foreground">{cert.verifiedBy}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-[10px] block">Attestation Timestamp</span>
            <span className="font-semibold text-foreground">
              {new Date(cert.generatedAt).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground text-[10px] block">Algorithm Standard</span>
            <span className="font-semibold text-foreground">{cert.hashAlgorithm}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-[10px] block">Total Events Verified</span>
            <span className="font-semibold text-foreground">
              {cert.totalEventsScanned} Events ({cert.tamperedCount} Tampered)
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 space-y-1">
          <span className="text-[10px] uppercase text-muted-foreground font-bold block">
            Merkle Root Signature
          </span>
          <div className="flex items-center justify-between gap-1 text-[11px] text-primary break-all">
            <span>{cert.merkleRoot}</span>
            <button
              type="button"
              onClick={() => onCopy(cert.merkleRoot, "Merkle Root")}
              className="p-1 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="space-y-1 pt-1">
          <span className="text-[10px] uppercase text-muted-foreground font-bold block">
            Compliance Attestation Standards
          </span>
          <div className="flex flex-wrap gap-1.5">
            {cert.standardsCompliance.map((std) => (
              <Badge
                key={std}
                variant="outline"
                className="text-[10px] border-border bg-muted/20 text-muted-foreground"
              >
                {std}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCopy(JSON.stringify(cert, null, 2), "Certificate JSON")}
          className="text-xs h-8 gap-1.5 font-mono cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Copy Certificate JSON</span>
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onDownload}
          className="text-xs h-8 gap-1.5 font-mono cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Audit Certificate (.JSON)</span>
        </Button>
      </div>
    </div>
  );
}
