import * as React from "react";
import { Badge } from "@k2net/ui";
import {
  CheckCircle2,
  AlertTriangle,
  Copy,
  ChevronRight,
  ChevronDown,
  Search,
} from "lucide-react";
import type { BatchIntegrityReport, EventIntegrityResult } from "./logs-integrity-utils";

export interface TreeTabContentProps {
  report: BatchIntegrityReport;
  filteredList: EventIntegrityResult[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  expandedRowId: string | null;
  setExpandedRowId: React.Dispatch<React.SetStateAction<string | null>>;
  onCopy: (text: string, label: string) => void;
}

export function LogsIntegrityTreeTab({
  report,
  filteredList,
  searchQuery,
  setSearchQuery,
  expandedRowId,
  setExpandedRowId,
  onCopy,
}: TreeTabContentProps) {
  return (
    <div className="space-y-3 animate-in fade-in duration-150">
      {/* Search Filter */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by event ID, actor, action, or SHA-256 hash..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/20 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-border font-mono"
          />
        </div>
        <div className="text-[11px] text-muted-foreground shrink-0">
          Showing {filteredList.length} of {report.totalEvents} events
        </div>
      </div>

      {/* Events Hash Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="max-h-[380px] overflow-y-auto custom-scrollbar-thin divide-y divide-border/40">
          {filteredList.map((item, idx) => {
            const isExpanded = expandedRowId === item.id;
            return (
              <div key={item.id} className="text-xs transition-colors hover:bg-muted/30">
                <div
                  onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                  className="p-2.5 flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono text-muted-foreground w-6 text-right shrink-0">
                      #{idx + 1}
                    </span>
                    {item.isValid ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                    )}
                    <span className="font-semibold text-foreground truncate">{item.action}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">by {item.actor}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                    <span className="text-muted-foreground/80 hidden sm:inline">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono border-border bg-muted/30 text-foreground"
                    >
                      {item.calculatedHash.substring(0, 10)}...
                    </Badge>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-3 bg-muted/20 border-t border-border/40 space-y-2 font-mono text-[11px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="p-2 rounded bg-card border border-border/60 space-y-1">
                        <div className="text-[9px] uppercase text-muted-foreground font-bold">
                          Calculated SHA-256 Hash
                        </div>
                        <div className="flex items-center justify-between gap-1 text-primary break-all">
                          <span>{item.calculatedHash}</span>
                          <button
                            type="button"
                            onClick={() => onCopy(item.calculatedHash, "Calculated Hash")}
                            className="p-1 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="p-2 rounded bg-card border border-border/60 space-y-1">
                        <div className="text-[9px] uppercase text-muted-foreground font-bold">
                          Previous Hash Pointer (Chain Link)
                        </div>
                        <div className="flex items-center justify-between gap-1 text-foreground break-all">
                          <span>{item.prevHash}</span>
                          <button
                            type="button"
                            onClick={() => onCopy(item.prevHash, "Previous Hash")}
                            className="p-1 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {item.reason && (
                      <div className="p-2 rounded bg-destructive/10 border border-destructive/30 text-destructive text-[10px]">
                        ⚠️ {item.reason}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
