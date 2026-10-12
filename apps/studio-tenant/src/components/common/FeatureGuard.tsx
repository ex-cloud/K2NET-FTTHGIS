import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation, type TranslationKey } from "@k2net/i18n";
import { Card, Button, Badge, cn } from "@k2net/ui";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { useTenantEntitlements } from "../../hooks/useTenantEntitlements";

export interface FeatureGuardProps {
  /** Kode fitur yang diperlukan, e.g. 'feature.telemetry.olt_poller' */
  featureKey?: string;
  /** Kode paket alternatif yang diperlukan, e.g. 'PKG_OLT_POLLER' */
  packageCode?: string;
  /** Tampilan kustom jika fitur belum dimiliki */
  fallback?: React.ReactNode;
  /** Konten yang dilindungi */
  children: React.ReactNode;
  /** Jika true, anak dirender dalam kondisi blurred & tidak bisa diklik dengan overlay gembok di tengah */
  showLockOverlay?: boolean;
  /** Judul custom untuk banner/overlay */
  title?: string;
  /** Deskripsi custom */
  description?: string;
  /** Nama paket yang direkomendasikan */
  packageName?: string;
  className?: string;
}

/**
 * Komponen pembungkus kontrol hak akses fitur paket add-on tenant (Layer 2 Entitlement Guard).
 * Otomatis membuka konten jika tenant memiliki lisensi paket aktif, atau menampilkan banner terkunci.
 */
export function FeatureGuard({
  featureKey,
  packageCode,
  fallback,
  children,
  showLockOverlay = false,
  title,
  description,
  packageName,
  className,
}: FeatureGuardProps) {
  const { t } = useTranslation();
  const { hasFeature, hasPackage, isLoading } = useTenantEntitlements();

  const isGranted = React.useMemo(() => {
    if (!featureKey && !packageCode) return true;
    if (featureKey && hasFeature(featureKey)) return true;
    if (packageCode && hasPackage(packageCode)) return true;
    return false;
  }, [featureKey, packageCode, hasFeature, hasPackage]);

  if (isLoading) {
    return <>{children}</>;
  }

  if (isGranted) {
    return <>{children}</>;
  }

  // Jika custom fallback diberikan
  if (fallback) {
    return <>{fallback}</>;
  }

  const effectiveTitle = title || t("packages.feature_guard.locked_title" as TranslationKey);
  const effectiveDesc = description || t("packages.feature_guard.locked_desc" as TranslationKey);

  // Mode: Blurred children with center lock overlay
  if (showLockOverlay) {
    return (
      <div className={cn("relative overflow-hidden rounded-lg group", className)}>
        <div className="pointer-events-none select-none filter blur-[3px] opacity-30 transition-all">
          {children}
        </div>
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-background/70 backdrop-blur-xs text-center">
          <div className="size-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 shadow-xs">
            <Lock className="size-5" />
          </div>
          {packageName && (
            <Badge variant="outline" className="mb-2 text-[10px] font-mono tracking-wider text-primary border-primary/30 bg-primary/5">
              {packageName}
            </Badge>
          )}
          <h4 className="text-sm font-bold text-foreground tracking-tight mb-1">
            {effectiveTitle}
          </h4>
          <p className="text-xs text-muted-foreground max-w-md line-clamp-2 mb-4 leading-relaxed">
            {effectiveDesc}
          </p>
          <Link to="/billing/marketplace">
            <Button size="sm" className="gap-1.5 h-7 px-3 text-xs font-medium">
              <Sparkles className="size-3.5" />
              <span>{t("packages.feature_guard.btn_unlock_now" as TranslationKey)}</span>
              <ArrowRight className="size-3" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Mode Default: Dedicated locked card banner
  return (
    <Card
      className={cn(
        "p-6 flex flex-col items-center text-center justify-center bg-card border-border/80 shadow-2xs gap-3 my-4",
        className
      )}
    >
      <div className="size-12 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-xs">
        <Lock className="size-6" />
      </div>

      <div className="space-y-1 max-w-lg">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">
            {t("packages.feature_guard.locked_eyebrow" as TranslationKey)}
          </span>
          {packageCode && (
            <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 text-muted-foreground border-border">
              {packageCode}
            </Badge>
          )}
        </div>
        <h3 className="text-base font-bold text-foreground tracking-tight">
          {effectiveTitle}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {effectiveDesc}
        </p>
      </div>

      <div className="pt-2">
        <Link to="/billing/marketplace">
          <Button size="sm" className="gap-1.5 h-7 px-3 text-xs font-medium">
            <Sparkles className="size-3.5" />
            <span>{t("packages.feature_guard.btn_view_marketplace" as TranslationKey)}</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
