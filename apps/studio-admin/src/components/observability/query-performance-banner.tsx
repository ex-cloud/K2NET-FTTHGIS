

import React from "react";
import { Button } from "@k2net/ui";
import { X } from "lucide-react";

interface QueryPerformanceBannerProps {
  show: boolean;
  onClose: () => void;
  onOpenResetModal: () => void;
}

export function QueryPerformanceBanner({
  show,
  onClose,
  onOpenResetModal,
}: QueryPerformanceBannerProps) {
  if (!show) return null;

  return (
    <div className="sticky bottom-0 w-full bg-card border-t border-border p-5 z-40 shadow-xl backdrop-blur-sm transition-all duration-300">
      <button 
        onClick={onClose}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-all"
        title="Close info panel"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pr-6 text-xs text-muted-foreground px-4 md:px-6">
        <div>
          <h4 className="font-semibold text-foreground mb-1">Reset report</h4>
          <p className="mb-3 leading-relaxed">Consider resetting the analysis statistics after optimizing any indexes or queries to clear the historical baselines.</p>
          <Button variant="outline" size="sm" onClick={onOpenResetModal} className="h-8 font-semibold">
            Reset report
          </Button>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-1">How is this report generated?</h4>
          <p className="leading-relaxed">This report aggregates query statistics collected by the PostgreSQL <code>pg_stat_statements</code> extension. Metrics are updated continuously during query executions.</p>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-1">Inspect your database for potential issues</h4>
          <p className="leading-relaxed">Verify that spatial indexes are active for your geocoding tables. Lack of GIST indexes on spatial columns causes heavy sequential scans.</p>
        </div>
      </div>
    </div>
  );
}
