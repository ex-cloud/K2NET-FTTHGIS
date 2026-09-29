import * as React from "react";
import { Button, Card } from "@k2net/ui";
import { Check, Star } from "lucide-react";
import type { SubscriptionPlanInfo } from "./billing-types";

interface BillingTopPlanCardProps {
  plan: SubscriptionPlanInfo;
  isCurrent: boolean;
  isDowngrade: boolean;
  onSelectPlan: (plan: SubscriptionPlanInfo) => void;
}

export function BillingTopPlanCard({
  plan,
  isCurrent,
  isDowngrade,
  onSelectPlan,
}: BillingTopPlanCardProps) {
  const isFree = plan.code.toUpperCase() === "FREE" || plan.name.toUpperCase() === "FREE";
  const isStarter = plan.code.toUpperCase() === "STARTER" || plan.name.toUpperCase() === "STARTER";
  const isPopular = isStarter;

  return (
    <Card
      glowingEffect
      className={`relative p-5 flex flex-col justify-between transition-all duration-300 ${
        isPopular
          ? "border-primary/55 dark:border-primary/55 ring-1 ring-primary/25 bg-card/85 shadow-[0_0_20px_rgba(16,185,129,0.08)]"
          : "border-border bg-card/60"
      }`}
    >
      {/* Floating Most Popular Badge on Top Border */}
      {isPopular && !isCurrent && (
        <div className="absolute -top-2.5 right-4 z-20 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs tracking-wider uppercase font-mono select-none">
          <Star className="h-2.5 w-2.5 fill-current text-current" />
          <span>MOST POPULAR</span>
        </div>
      )}

      <div className="space-y-3.5">
        {/* Header Row: Plan Name + Status */}
        <div className="flex items-center justify-between gap-2 min-h-[20px]">
          <span className="text-xs font-bold font-mono tracking-wider text-primary uppercase">
            {plan.name}
          </span>

          {isCurrent && (
            <span className="text-[11px] text-muted-foreground font-medium">
              Current plan
            </span>
          )}
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-1 py-0.5">
          <span className="text-base font-bold font-mono text-foreground">{plan.price}</span>
          <span className="text-xs text-muted-foreground font-normal">{plan.period}</span>
        </div>

        {/* Plan Action Button */}
        <Button
          size="sm"
          disabled={isCurrent}
          onClick={() => !isCurrent && onSelectPlan(plan)}
          className={`w-full text-xs font-semibold h-8 rounded-md transition-all ${
            isCurrent
              ? "bg-muted/40 text-muted-foreground border border-border/90 dark:border-border font-medium cursor-not-allowed shadow-2xs"
              : isDowngrade
                ? "bg-muted hover:bg-muted/80 text-foreground border border-border cursor-pointer"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs cursor-pointer"
          }`}
        >
          {isCurrent
            ? "Current plan"
            : isDowngrade
              ? `Downgrade to ${plan.name}`
              : `Upgrade to ${plan.name}`}
        </Button>

        {/* Features Section */}
        <div className="space-y-2 pt-2.5">
          {plan.features.map((feat) => (
            <div key={feat.title} className="flex items-start gap-2 text-xs">
              <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="text-[11.5px] font-medium text-foreground block">
                  {feat.title}
                </span>
                {feat.detail && (
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    {feat.detail}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Free Plan Footnote (Supabase Reference) */}
      {isFree && (
        <div className="mt-4 pt-3 border-groove-t text-[10.5px] text-muted-foreground/80 leading-relaxed">
          Free projects are paused after 2 week of inactivity. Limit of 1 active projects.
        </div>
      )}
    </Card>
  );
}
