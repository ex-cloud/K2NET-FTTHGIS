import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Badge,
  Button,
  cn,
} from "@k2net/ui";
import {
  ShieldCheck,
  Fingerprint,
  FileCheck2,
  Layers,
  Sparkles,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-compat";
import type { AuditStreamEntry } from "@/hooks/use-audit-log-stream";
import {
  verifyBatchIntegrity,
  type BatchIntegrityReport,
} from "./logs-integrity-utils";
import { LogsIntegrityOverviewTab } from "./logs-integrity-overview-tab";
import { LogsIntegrityTreeTab } from "./logs-integrity-tree-tab";
import { LogsIntegrityCertificateTab } from "./logs-integrity-certificate-tab";

export interface LogsIntegrityVerifierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logs: AuditStreamEntry[];
  tenantSlug?: string;
}

export function LogsIntegrityVerifierModal({
  open,
  onOpenChange,
  logs,
}: LogsIntegrityVerifierModalProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"overview" | "tree" | "certificate">("overview");
  const [isVerifying, setIsVerifying] = useState(false);
  const [report, setReport] = useState<BatchIntegrityReport | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const runVerification = useCallback(async () => {
    if (logs.length === 0) {
      setReport(null);
      return;
    }
    setIsVerifying(true);
    try {
      const verifierPrincipal =
        session?.user?.email ||
        session?.user?.name ||
        "super_admin (Platform Super Admin)";

      const res = await verifyBatchIntegrity(logs, verifierPrincipal);
      setReport(res);
    } catch (err) {
      toast.error("Failed to execute cryptographic verification");
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  }, [logs, session]);

  useEffect(() => {
    if (open) {
      runVerification();
    }
  }, [open, runVerification]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard`);
  };

  const downloadCertificateJson = () => {
    if (!report) return;
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(report.certificate, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute(
      "download",
      `k2net-audit-integrity-${report.certificate.certificateId}.json`
    );
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success("Downloaded Forensic Audit Certificate");
  };

  const filteredEventResults = useMemo(() => {
    if (!report) return [];
    if (!searchQuery.trim()) return report.eventResults;
    const q = searchQuery.toLowerCase();
    return report.eventResults.filter(
      (ev) =>
        ev.id.toLowerCase().includes(q) ||
        ev.actor.toLowerCase().includes(q) ||
        ev.action.toLowerCase().includes(q) ||
        ev.calculatedHash.toLowerCase().includes(q)
    );
  }, [report, searchQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[82vh] flex flex-col p-0 gap-0 overflow-hidden font-mono border-border bg-card shadow-2xl rounded-xl">
        {/* Header */}
        <DialogHeader className="px-5 py-3.5 border-groove-b bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-muted/50 border border-border/60 text-muted-foreground shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                  <span>Tamper-Proof Audit Integrity & Merkle Inspector</span>
                  <Badge
                    variant="outline"
                    className="text-[9px] font-mono border-border/60 text-muted-foreground bg-muted/40 px-1.5 py-0 h-4"
                  >
                    FIPS 180-4 SHA-256
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                  Client-side zero-trust mathematical verification of event payloads, hash chaining, and Merkle tree roots.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Monochrome Segmented Style) */}
          <div className="flex items-center gap-1 mt-2.5 p-0.5 bg-muted/40 rounded-lg border border-border/50 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer select-none",
                activeTab === "overview"
                  ? "bg-card text-foreground border border-border/60 shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Fingerprint className="w-3 h-3 text-muted-foreground" />
              <span>Overview & Health</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tree")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer select-none",
                activeTab === "tree"
                  ? "bg-card text-foreground border border-border/60 shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Layers className="w-3 h-3 text-muted-foreground" />
              <span>Merkle Tree & Hash Chain ({report?.totalEvents ?? logs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("certificate")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer select-none",
                activeTab === "certificate"
                  ? "bg-card text-foreground border border-border/60 shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileCheck2 className="w-3 h-3 text-muted-foreground" />
              <span>Compliance Certificate</span>
            </button>
          </div>
        </DialogHeader>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar-thin p-4 space-y-4">
          {isVerifying && (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-7 h-7 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
              <div className="text-xs text-muted-foreground animate-pulse">
                Computing SHA-256 cryptographic hash chaining & building Merkle tree...
              </div>
            </div>
          )}

          {!isVerifying && logs.length === 0 && (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-center">
              <Inbox className="w-8 h-8 text-muted-foreground/60" />
              <div className="text-sm font-semibold text-foreground">No logs in current filter range</div>
              <div className="text-xs text-muted-foreground max-w-sm">
                Adjust your time range or filters in Logs Explorer to stream log events for cryptographic verification.
              </div>
            </div>
          )}

          {!isVerifying && report && logs.length > 0 && (
            <>
              {activeTab === "overview" && (
                <LogsIntegrityOverviewTab
                  report={report}
                  onCopy={copyToClipboard}
                  onViewTree={() => setActiveTab("tree")}
                />
              )}

              {activeTab === "tree" && (
                <LogsIntegrityTreeTab
                  report={report}
                  filteredList={filteredEventResults}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  expandedRowId={expandedRowId}
                  setExpandedRowId={setExpandedRowId}
                  onCopy={copyToClipboard}
                />
              )}

              {activeTab === "certificate" && (
                <LogsIntegrityCertificateTab
                  report={report}
                  onDownload={downloadCertificateJson}
                  onCopy={copyToClipboard}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-groove-t bg-muted/20 flex items-center justify-between shrink-0 select-none">
          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
            <span>Verified with Web Cryptography API</span>
            <span>•</span>
            <span>Zero-Trust Protocol</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runVerification}
              disabled={isVerifying || logs.length === 0}
              className="text-xs h-7.5 px-3 gap-1.5 cursor-pointer font-mono border-border/70 bg-card hover:bg-muted"
            >
              <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Re-Verify Batch</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-7.5 px-3 cursor-pointer font-mono bg-foreground text-background hover:bg-foreground/90 border border-foreground font-semibold shadow-xs"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
