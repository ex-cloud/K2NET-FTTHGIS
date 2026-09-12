import { Info } from "lucide-react";

export function FeaturesEntitlementLegend() {
  return (
    <div className="px-4 md:px-6 shrink-0">
      <div className="rounded-xl border border-border/80 bg-card/40 backdrop-blur-md p-3 px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Info className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="font-semibold text-foreground">Default Entitlement:</span>
            <span className="text-muted-foreground ml-1.5">
              <strong className="text-muted-foreground">Starter</strong> (GIS Core + WA) •{" "}
              <strong className="text-primary">Professional</strong> (+ OLT Poller) •{" "}
              <strong className="text-purple-400">Enterprise</strong> (+ AI Copilot).
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span>Toggle switch menyimpan add-on kustom langsung ke PostgreSQL</span>
        </div>
      </div>
    </div>
  );
}
