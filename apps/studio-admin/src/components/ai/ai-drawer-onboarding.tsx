

import { Sparkles, Check } from "lucide-react";
import { Badge } from "@k2net/ui";

interface AiDrawerOnboardingProps {
  onReviewPermissions: () => void;
}

/**
 * Compact Cloudflare-style onboarding card (Step 1: Enable K2 Agent access).
 * Rendered inside the Sheet drawer — no external overlay.
 */
export function AiDrawerOnboarding({ onReviewPermissions }: AiDrawerOnboardingProps) {
  return (
    <div className="flex-1 flex items-start justify-center pt-8 px-4 overflow-y-auto">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
        {/* Icon + Heading */}
        <div className="pt-7 pb-4 flex flex-col items-center gap-3 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/30 via-primary/15 to-amber-500/20 border border-primary/25 flex items-center justify-center shadow-md shadow-primary/10">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center px-4">
            <h2 className="text-base font-bold text-foreground">Enable K2 Agent access</h2>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              An API token will be created to let K2 Agent access your platform resources.
            </p>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Grant all accounts toggle */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-background border border-border">
            <div>
              <p className="text-xs font-semibold text-foreground">Grant access to all modules</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Including modules added in the future</p>
            </div>
            <div className="w-9 h-5 rounded-full bg-primary flex items-center justify-end px-0.5 cursor-pointer shrink-0">
              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </div>
          </div>

          {/* Current account */}
          <div>
            <p className="text-[11px] font-semibold text-foreground/75 dark:text-muted-foreground mb-1.5">Select account(s)</p>
            <div className="p-3 rounded-xl border border-primary/40 bg-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">K2NET Core Platform (Root HQ)</p>
                  <p className="text-[10px] font-mono text-muted-foreground">Scope: PLATFORM_INTERNAL</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] font-mono border-primary/30 text-primary bg-primary/10">
                Current
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground text-right mt-1">
              At least one account must be selected.
            </p>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={onReviewPermissions}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors cursor-pointer shadow-md shadow-primary/20"
          >
            Review permissions
          </button>
        </div>
      </div>
    </div>
  );
}
