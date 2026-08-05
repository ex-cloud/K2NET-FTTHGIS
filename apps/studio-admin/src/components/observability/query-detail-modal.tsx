"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@k2net/ui";
import { Copy, Check } from "lucide-react";
import { SlowQuery } from "@/hooks/useDbPerformance";

interface QueryDetailModalProps {
  selectedQuery: SlowQuery | null;
  onClose: () => void;
  onCopy: (text: string, idx: number) => void;
  copiedIdx: number | null;
}

export function QueryDetailModal({
  selectedQuery,
  onClose,
  onCopy,
  copiedIdx,
}: QueryDetailModalProps) {
  return (
    <Dialog open={!!selectedQuery} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border-border sm:max-w-[700px] p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-foreground flex items-center justify-between">
            <span>Full SQL Statement Details</span>
            {selectedQuery && (
              <button
                onClick={() => onCopy(selectedQuery.query, -1)}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-[10px]"
              >
                {copiedIdx === -1 ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy SQL</span>
                  </>
                )}
              </button>
            )}
          </DialogTitle>
        </DialogHeader>
        {selectedQuery && (
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded-lg bg-muted/40 border border-border overflow-x-auto max-h-[300px]">
              <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all select-all">
                {selectedQuery.query}
              </pre>
            </div>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-2.5 bg-muted/20 border border-border rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Calls</p>
                <p className="text-sm font-mono font-bold text-foreground mt-0.5">{selectedQuery.calls.toLocaleString()}</p>
              </div>
              <div className="p-2.5 bg-muted/20 border border-border rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Time</p>
                <p className="text-sm font-mono font-bold text-foreground mt-0.5">{(selectedQuery.totalTimeMs / 1000).toFixed(2)}s</p>
              </div>
              <div className="p-2.5 bg-muted/20 border border-border rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Mean Execution</p>
                <p className="text-sm font-mono font-bold text-foreground mt-0.5">{selectedQuery.meanTimeMs.toFixed(1)}ms</p>
              </div>
              <div className="p-2.5 bg-muted/20 border border-border rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Cache Hit Rate</p>
                <p className="text-sm font-mono font-bold text-foreground mt-0.5">{selectedQuery.cacheHitRate.toFixed(3)}%</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 bg-muted/20 border border-border rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Min Time</p>
                <p className="text-sm font-mono font-bold text-foreground mt-0.5">{selectedQuery.minTimeMs.toFixed(1)}ms</p>
              </div>
              <div className="p-2.5 bg-muted/20 border border-border rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Max Time</p>
                <p className="text-sm font-mono font-bold text-foreground mt-0.5">{selectedQuery.maxTimeMs.toFixed(1)}ms</p>
              </div>
              <div className="p-2.5 bg-muted/20 border border-border rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Rows Processed</p>
                <p className="text-sm font-mono font-bold text-foreground mt-0.5">{selectedQuery.rows.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
