import * as React from "react";
import { Button } from "./button";
import { Card } from "./card";
import { Badge } from "./badge";
import { FeatureUpgradeModal } from "./feature-upgrade-modal";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "../utils";

export interface TierQuotaGuardProps {
  children: React.ReactNode;
  isAllowed: boolean;
  featureName: string;
  featureDescription?: string;
  requiredTier?: "starter" | "pro" | "enterprise";
  currentTier?: string;
  fallbackVariant?: "card" | "banner" | "hidden";
  className?: string;
  onUpgradeClick?: () => void;
}

export function TierQuotaGuard({
  children,
  isAllowed,
  featureName,
  featureDescription,
  requiredTier = "pro",
  currentTier = "free",
  fallbackVariant = "card",
  className,
  onUpgradeClick,
}: TierQuotaGuardProps) {
  const [modalOpen, setModalOpen] = React.useState(false);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallbackVariant === "hidden") {
    return null;
  }

  const handleOpenUpgrade = () => {
    setModalOpen(true);
  };

  const handleProceedUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    }
  };

  if (fallbackVariant === "banner") {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5 text-foreground">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20">
              <Lock className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold">Fitur {featureName} Dibatasi</p>
              <p className="text-[11px] text-muted-foreground">
                Tersedia pada paket {requiredTier.toUpperCase()} atau lebih tinggi.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="default"
            onClick={handleOpenUpgrade}
            className="h-7 px-2.5 text-xs font-medium gap-1"
          >
            Upgrade
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>

        <FeatureUpgradeModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          featureName={featureName}
          featureDescription={featureDescription}
          requiredTier={requiredTier}
          currentTier={currentTier}
          onUpgradeClick={handleProceedUpgrade}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-xl overflow-hidden", className)}>
      <Card className="p-8 text-center flex flex-col items-center justify-center space-y-4 border-dashed border-border/80 bg-card/60">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
          <Lock className="h-6 w-6" />
          <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-3 w-3" />
          </div>
        </div>

        <div className="space-y-1.5 max-w-md">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-sm font-bold text-foreground">
              Fitur {featureName} Memerlukan Akses {requiredTier.toUpperCase()}
            </h3>
            <Badge variant="outline" className="text-[9px] font-mono uppercase bg-muted text-muted-foreground border-border">
              {requiredTier.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {featureDescription ||
              `Tingkatkan paket organisasi Anda ke ${requiredTier.toUpperCase()} untuk mengaktifkan modul ${featureName} dan memperluas kapasitas jaringan.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 pt-2">
          <Button
            size="sm"
            variant="default"
            onClick={handleOpenUpgrade}
            className="text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Tingkatkan Paket Langganan
          </Button>
        </div>
      </Card>

      <FeatureUpgradeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        featureName={featureName}
        featureDescription={featureDescription}
        requiredTier={requiredTier}
        currentTier={currentTier}
        onUpgradeClick={handleProceedUpgrade}
      />
    </div>
  );
}
