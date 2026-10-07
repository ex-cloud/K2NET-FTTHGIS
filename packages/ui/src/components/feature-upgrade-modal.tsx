import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card } from "./card";
import { Zap, Sparkles, Check, ArrowRight, ShieldCheck } from "lucide-react";

export interface FeatureUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  badgeText?: string;
  targetTierTitle?: string;
  highlights?: string[];
  guaranteeText?: string;
  cancelText?: string;
  upgradeText?: string;
  isEnterprise?: boolean;
  onUpgradeClick?: () => void;
}

export function FeatureUpgradeModal({
  open,
  onOpenChange,
  title,
  description,
  badgeText,
  targetTierTitle,
  highlights = [],
  guaranteeText,
  cancelText = "Cancel",
  upgradeText = "View Plans",
  isEnterprise = false,
  onUpgradeClick,
}: FeatureUpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/80 bg-card">
        {/* Header Visual Hero */}
        <div className="relative p-6 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent border-b border-border/40">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/30 shadow-xs">
              {isEnterprise ? (
                <Sparkles className="h-5 w-5" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
            </div>
            {badgeText && (
              <Badge
                variant="outline"
                className="text-[10px] font-mono font-semibold uppercase tracking-wider bg-background/80 border-primary/40 text-primary"
              >
                {badgeText}
              </Badge>
            )}
          </div>

          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-lg font-bold text-foreground">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        </div>

        {/* Plan Specifications Card (No hardcoded price, purely focuses on specifications) */}
        <div className="p-6 space-y-4">
          <Card className="p-4 bg-muted/30 border-border/60 space-y-3">
            {targetTierTitle && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{targetTierTitle}</span>
                <span className="text-[10px] font-mono font-semibold text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                  Recommended
                </span>
              </div>
            )}

            {highlights.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-border/40">
                {highlights.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="leading-tight">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {guaranteeText && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{guaranteeText}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 bg-muted/20 border-t border-border/40 flex items-center justify-end gap-2 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              if (onUpgradeClick) {
                onUpgradeClick();
              }
            }}
            className="text-xs font-semibold gap-1.5 shadow-xs"
          >
            {upgradeText}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
