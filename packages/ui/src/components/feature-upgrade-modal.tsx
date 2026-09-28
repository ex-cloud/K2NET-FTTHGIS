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
  featureName: string;
  featureDescription?: string;
  requiredTier?: "starter" | "pro" | "enterprise";
  currentTier?: string;
  onUpgradeClick?: () => void;
}

export function FeatureUpgradeModal({
  open,
  onOpenChange,
  featureName,
  featureDescription,
  requiredTier = "pro",
  currentTier = "free",
  onUpgradeClick,
}: FeatureUpgradeModalProps) {
  const isEnterpriseRequired = requiredTier === "enterprise";
  const isStarterRequired = requiredTier === "starter";

  const tierTitle = isEnterpriseRequired
    ? "Enterprise Core"
    : isStarterRequired
    ? "Starter ISP"
    : "Professional ISP";

  const tierPrice = isEnterpriseRequired
    ? "Rp 12.500.000 / bulan"
    : isStarterRequired
    ? "Rp 990.000 / bulan"
    : "Rp 3.900.000 / bulan";

  const highlights = isEnterpriseRequired
    ? [
        "Maks. 25 OLT & 12.000 ODP, 25.000 Pelanggan",
        "AI Fiber Diagnostics Copilot & Core Engine",
        "500 GB MinIO S3 Storage & 30.000 RPM API",
        "Keycloak SSO + SAML, Custom Domain White-Label",
        "Platinum 99.9% 24/7 SLA Matrix & Dedicated TAM",
      ]
    : isStarterRequired
    ? [
        "Maks. 2 OLT & 300 ODP, 500 Pelanggan",
        "15 GB MinIO S3 Storage & 2.000 RPM API",
        "Akses Webhook & REST API Integrasi",
        "Standard SLA & Community Support",
      ]
    : [
        "Maks. 6 OLT & 2.500 ODP, 5.000 Pelanggan",
        "Visualisasi Heatmap Redaman Optik Interaktif",
        "Live SNMP OLT Telemetry & Poller Status Integration",
        "100 GB MinIO S3 Storage & 8.000 RPM API",
        "Keycloak SSO / LDAP Federation & Gold 99.5% SLA",
      ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/80 bg-card">
        {/* Header Visual Hero */}
        <div className="relative p-6 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent border-b border-border/40">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/30 shadow-xs">
              {isEnterpriseRequired ? (
                <Sparkles className="h-5 w-5" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
            </div>
            <Badge variant="outline" className="text-[10px] font-mono font-semibold uppercase tracking-wider bg-background/80 border-primary/40 text-primary">
              Tingkatkan ke {tierTitle}
            </Badge>
          </div>

          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-lg font-bold text-foreground">
              Fitur {featureName} Dibatasi
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {featureDescription ||
                `Fitur ini memerlukan paket ${tierTitle} atau lebih tinggi. Paket aktif Anda saat ini: ${currentTier.toUpperCase()}.`}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Plan Value Card */}
        <div className="p-6 space-y-4">
          <Card className="p-4 bg-muted/30 border-border/60 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-foreground">{tierTitle}</span>
              <span className="text-xs font-mono font-bold text-primary">{tierPrice}</span>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/40">
              {highlights.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="leading-tight">{item}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Aktivasi instan tanpa downtime data jaringan.</span>
          </div>
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
            Nanti Saja
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
            Lihat Pilihan Paket
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
