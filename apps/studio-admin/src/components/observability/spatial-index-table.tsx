"use client";

import React from "react";
import { Badge } from "@k2net/ui";
import { SpatialIndex } from "@/hooks/useDbPerformance";

interface SpatialIndexTableProps {
  spatialIndexes: SpatialIndex[];
}

export function SpatialIndexTable({ spatialIndexes }: SpatialIndexTableProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col px-4 md:px-6 pb-6">
      <div className="flex-1 min-h-0 border border-border bg-card/10 rounded-xl overflow-hidden overflow-y-auto overflow-x-auto custom-scrollbar-thin">
        <div className="min-w-[800px] w-full p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-transparent text-[11px] font-medium text-muted-foreground/85">
                  <th className="py-2.5 px-4">Table</th>
                  <th className="py-2.5 px-4">Index Definition</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {spatialIndexes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No spatial indexes registered.
                    </td>
                  </tr>
                ) : (
                  spatialIndexes.map((idx, indexIdx) => (
                    <tr key={indexIdx} className="hover:bg-muted/10 transition-colors">
                      <td className="py-3 px-4 font-mono text-foreground">{idx.tableName}</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground select-all break-all" title={idx.indexDef}>
                        {idx.indexDef}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{idx.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-muted-foreground">{idx.size}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
