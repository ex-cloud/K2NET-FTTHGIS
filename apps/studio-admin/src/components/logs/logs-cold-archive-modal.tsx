import * as React from "react";
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
  Archive,
  Search,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  Lock,
  ExternalLink,
  HardDrive,
  FileCheck2,
  Database,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAuditArchives,
  type AuditArchiveMeta,
  type ArchiveSummary,
} from "@/lib/actions/gateways/services";
import { useLogsFilter } from "./logs-filter-context";

export interface LogsColdArchiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogsColdArchiveModal({
  open,
  onOpenChange,
}: LogsColdArchiveModalProps) {
  const { setTimeRange } = useLogsFilter();
  const [loading, setLoading] = React.useState(false);
  const [archives, setArchives] = React.useState<AuditArchiveMeta[]>([]);
  const [summary, setSummary] = React.useState<ArchiveSummary | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [tableFilter, setTableFilter] = React.useState<string>("ALL");
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAuditArchives({
        table: tableFilter !== "ALL" ? tableFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      setArchives(res.data);
      setSummary(res.summary);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load archives";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [tableFilter, searchQuery]);

  React.useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied ${label} to clipboard.`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExplorePartition = (archive: AuditArchiveMeta) => {
    if (archive.startDate && archive.endDate) {
      setTimeRange(`custom:${archive.startDate}_${archive.endDate}`);
      toast.success(
        `Time range set to partition ${archive.partition} (${archive.startDate.slice(0, 10)} → ${archive.endDate.slice(0, 10)})`
      );
      onOpenChange(false);
    } else {
      toast.info(`Partition ${archive.partition} selected.`);
    }
  };

  const filteredList = React.useMemo(() => {
    return archives.filter((a) => {
      if (tableFilter !== "ALL" && a.parentTable !== tableFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.partition.toLowerCase().includes(q) ||
        a.archiveFileName.toLowerCase().includes(q) ||
        a.sha256Checksum.toLowerCase().includes(q)
      );
    });
  }, [archives, tableFilter, searchQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden bg-card border-border text-foreground font-sans max-h-[80vh] flex flex-col rounded-xl shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-5 py-3.5 border-groove-b bg-muted/20 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-center text-muted-foreground shrink-0">
                <Archive className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                  <span>Cold Storage S3 Archive Explorer</span>
                  <Badge variant="outline" className="text-[9px] font-mono bg-muted/40 text-muted-foreground border-border gap-1 py-0 px-1.5 h-4">
                    <Lock className="w-2.5 h-2.5" />
                    <span>WORM Compliance</span>
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                  Automated partition lifecycle offloading (&gt;90 days) to MinIO S3 with 3-Year Object Lock
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="h-7 text-xs gap-1.5 border-border bg-card text-foreground hover:bg-muted cursor-pointer font-mono"
            >
              <RefreshCw className={cn("w-3 h-3 text-muted-foreground", loading && "animate-spin")} />
              <span>Refresh</span>
            </Button>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            <div className="p-2 rounded-lg border border-border/60 bg-card shadow-2xs">
              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                <Layers className="w-3 h-3 text-muted-foreground" />
                <span>Total Archives</span>
              </div>
              <div className="text-sm font-bold font-mono mt-0.5 text-foreground">
                {summary ? summary.totalArchives : 0}
                <span className="text-[9px] font-normal text-muted-foreground ml-1">partitions</span>
              </div>
            </div>

            <div className="p-2 rounded-lg border border-border/60 bg-card shadow-2xs">
              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                <Database className="w-3 h-3 text-muted-foreground" />
                <span>Archived Records</span>
              </div>
              <div className="text-sm font-bold font-mono mt-0.5 text-foreground">
                {summary ? summary.totalArchivedRows.toLocaleString() : "0"}
                <span className="text-[9px] font-normal text-muted-foreground ml-1">rows</span>
              </div>
            </div>

            <div className="p-2 rounded-lg border border-border/60 bg-card shadow-2xs">
              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                <HardDrive className="w-3 h-3 text-muted-foreground" />
                <span>Storage Preserved</span>
              </div>
              <div className="text-sm font-bold font-mono mt-0.5 text-foreground">
                {summary ? summary.totalSizeFormatted : "0 B"}
                <span className="text-[9px] font-normal text-muted-foreground ml-1">compressed</span>
              </div>
            </div>

            <div className="p-2 rounded-lg border border-border/60 bg-card shadow-2xs">
              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                <FileCheck2 className="w-3 h-3 text-muted-foreground" />
                <span>WORM Retention</span>
              </div>
              <div className="text-xs font-bold font-mono mt-0.5 text-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
                <span>1095d (3 Years)</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Toolbar & Search Filter */}
        <div className="px-4 py-2 border-groove-b bg-muted/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search partition name, file, or SHA-256..."
                className="w-full pl-8 pr-3 py-1 bg-card border border-border rounded-md text-xs font-mono text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-border"
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground font-medium mr-1">Table:</span>
            {["ALL", "audit_events", "audit_logs"].map((tbl) => (
              <button
                key={tbl}
                type="button"
                onClick={() => setTableFilter(tbl)}
                className={cn(
                  "px-2 py-0.5 text-xs rounded-md transition-colors font-mono cursor-pointer border select-none",
                  tableFilter === tbl
                    ? "bg-foreground text-background border-foreground font-semibold shadow-xs"
                    : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                )}
              >
                {tbl}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-4 custom-scrollbar-thin">
          {filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <Archive className="w-7 h-7 mb-2 text-muted-foreground/40 stroke-1" />
              <p className="text-xs font-semibold text-foreground">No cold storage archives found</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm">
                Partitions older than 90 days are automatically archived on the 1st of each month via <code className="font-mono text-foreground bg-muted/50 px-1 py-0.5 rounded border border-border/60">archive-audit-logs.sh</code>.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden bg-card">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                    <th className="py-1.5 px-2.5">Partition & Date Span</th>
                    <th className="py-1.5 px-2.5">Parent Table</th>
                    <th className="py-1.5 px-2.5 text-right">Rows</th>
                    <th className="py-1.5 px-2.5 text-right">Size</th>
                    <th className="py-1.5 px-2.5">SHA-256 Checksum</th>
                    <th className="py-1.5 px-2.5">WORM Status</th>
                    <th className="py-1.5 px-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                  {filteredList.map((item) => (
                    <tr key={item.partition} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-2.5">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <span>{item.partition}</span>
                        </div>
                        {item.startDate && item.endDate && (
                          <div className="text-[10px] text-muted-foreground font-sans flex items-center gap-1 mt-0.5">
                            <Calendar className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                            <span>{item.startDate.slice(0, 10)} → {item.endDate.slice(0, 10)}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-2 px-2.5">
                        <Badge variant="outline" className="text-[10px] font-mono bg-muted/40 text-foreground border-border">
                          {item.parentTable}
                        </Badge>
                      </td>

                      <td className="py-2 px-2.5 text-right font-semibold text-foreground">
                        {item.totalRows.toLocaleString()}
                      </td>

                      <td className="py-2 px-2.5 text-right text-muted-foreground">
                        {(item.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
                      </td>

                      <td className="py-2 px-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={item.sha256Checksum}>
                            {item.sha256Checksum.slice(0, 12)}...{item.sha256Checksum.slice(-6)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.sha256Checksum, item.partition, "SHA-256 checksum")}
                            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="Copy SHA-256 Checksum"
                          >
                            {copiedKey === item.partition ? (
                              <Check className="w-3 h-3 text-foreground" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-2 px-2.5">
                        <Badge variant="outline" className="text-[9px] font-mono bg-muted/40 text-muted-foreground border-border gap-1 py-0 px-1.5">
                          <Lock className="w-2.5 h-2.5" />
                          <span>{item.wormRetentionDays}d WORM</span>
                        </Badge>
                      </td>

                      <td className="py-2 px-2.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExplorePartition(item)}
                          className="h-6 text-[10px] gap-1 px-2 border-border text-foreground hover:bg-muted hover:text-foreground rounded-md font-sans cursor-pointer"
                        >
                          <span>Explore Range</span>
                          <ExternalLink className="w-2.5 h-2.5 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-groove-t bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground shrink-0 select-none">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Object Storage Engine: MinIO S3 WORM Compliance Mode</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-7 text-xs border-border text-foreground hover:bg-muted cursor-pointer"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

