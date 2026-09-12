import { Button, ActionTooltip } from "@k2net/ui";
import { Sliders, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface FeaturesHeaderProps {
  onBulkEnableAI: () => void;
  onRefresh: () => void;
}

export function FeaturesHeader({ onBulkEnableAI, onRefresh }: FeaturesHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 md:px-6 shrink-0">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Sliders className="h-5 w-5 text-primary" />
          <span>Feature Flags &amp; Module Entitlements Matrix</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Centralized B2B module entitlement &amp; add-on management across all tenant organizations.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <ActionTooltip label="Enable AI Fiber Copilot for all Enterprise organizations" shortcut="A">
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkEnableAI}
            className="h-8 px-3 text-xs font-semibold border-border bg-card hover:bg-muted text-foreground gap-1.5 shadow-2xs cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
            <span>Enable AI on Enterprise</span>
          </Button>
        </ActionTooltip>

        <ActionTooltip label="Refresh Entitlements from Database" shortcut="R">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onRefresh();
              toast.success("Entitlements refreshed from backend");
            }}
            className="h-8 px-3 text-xs font-semibold border-border bg-card hover:bg-muted text-foreground gap-1.5 shadow-2xs cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </ActionTooltip>
      </div>
    </div>
  );
}
