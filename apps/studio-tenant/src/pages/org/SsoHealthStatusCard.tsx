import { Activity, AlertTriangle, CheckCircle2, Clock, KeyRound, ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge, Card } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

export interface SsoHealthStatusCardProps {
  healthStatus?: string;
  lastHealthCheckAt?: string;
  lastHealthLatencyMs?: number;
  consecutiveProbeFailures?: number;
  lastHealthError?: string | null;
  tlsCertExpiresAt?: string | null;
  tlsCertDaysRemaining?: number | null;
  samlCertExpiresAt?: string | null;
  samlCertDaysRemaining?: number | null;
  clientSecretExpiresAt?: string | null;
  clientSecretDaysRemaining?: number | null;
}

function getHealthBadgeMeta(
  status: string | undefined,
  t: ReturnType<typeof useTranslation>["t"]
) {
  switch (status) {
    case "HEALTHY":
      return {
        label: t("settings.sso_health_status_healthy"),
        className: "border-primary/40 text-primary bg-primary/10 text-[10px]",
        icon: <CheckCircle2 className="size-3" />,
      };
    case "DEGRADED":
      return {
        label: t("settings.sso_health_status_degraded"),
        className: "border-border text-foreground bg-muted text-[10px]",
        icon: <AlertTriangle className="size-3" />,
      };
    case "UNHEALTHY":
      return {
        label: t("settings.sso_health_status_unhealthy"),
        className: "border-destructive/40 text-destructive bg-destructive/10 text-[10px]",
        icon: <ShieldAlert className="size-3" />,
      };
    default:
      return {
        label: t("settings.sso_health_status_unknown"),
        className: "border-border text-muted-foreground text-[10px]",
        icon: <Clock className="size-3" />,
      };
  }
}

function ExpiryItemBox({
  label,
  expiresAt,
  daysRemaining,
}: {
  label: string;
  expiresAt?: string | null;
  daysRemaining?: number | null;
}) {
  const { t } = useTranslation();
  const isExpired = typeof daysRemaining === "number" && daysRemaining <= 0;
  const isWarning = typeof daysRemaining === "number" && daysRemaining > 0 && daysRemaining <= 30;

  return (
    <div className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
          <KeyRound className="size-3 text-muted-foreground" />
          {label}
        </span>
        {typeof daysRemaining === "number" && (
          <Badge
            variant="outline"
            className={
              isExpired
                ? "border-destructive/40 text-destructive bg-destructive/10 text-[10px] font-mono"
                : isWarning
                ? "border-border text-foreground bg-muted text-[10px] font-mono"
                : "border-primary/30 text-primary bg-primary/10 text-[10px] font-mono"
            }
          >
            {isExpired
              ? t("settings.sso_health_expired_badge")
              : t("settings.sso_health_days_left", { days: daysRemaining })}
          </Badge>
        )}
      </div>
      <div className="text-xs font-mono text-foreground">
        {expiresAt
          ? new Date(expiresAt).toLocaleDateString()
          : t("settings.sso_health_not_tracked")}
      </div>
    </div>
  );
}

export function SsoHealthStatusCard({
  healthStatus,
  lastHealthCheckAt,
  lastHealthLatencyMs,
  consecutiveProbeFailures,
  lastHealthError,
  tlsCertExpiresAt,
  tlsCertDaysRemaining,
  samlCertExpiresAt,
  samlCertDaysRemaining,
  clientSecretExpiresAt,
  clientSecretDaysRemaining,
}: SsoHealthStatusCardProps) {
  const { t } = useTranslation();
  const badge = getHealthBadgeMeta(healthStatus, t);
  const showWarningBanner = healthStatus === "DEGRADED" || healthStatus === "UNHEALTHY";

  return (
    <Card className="p-5 border-border/60 bg-card space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <h4 className="text-xs font-semibold text-foreground">
              {t("settings.sso_health_card_title")}
            </h4>
            <Badge variant="outline" className={badge.className}>
              <span className="flex items-center gap-1">
                {badge.icon}
                {badge.label}
              </span>
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t("settings.sso_health_card_desc")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {t("settings.sso_health_last_check")}:{" "}
            {lastHealthCheckAt
              ? new Date(lastHealthCheckAt).toLocaleString()
              : t("settings.sso_health_never")}
          </span>
          {typeof lastHealthLatencyMs === "number" && (
            <span className="flex items-center gap-1">
              <Activity className="size-3 text-primary" />
              {t("settings.sso_health_latency")}: {lastHealthLatencyMs}ms
            </span>
          )}
          {typeof consecutiveProbeFailures === "number" && consecutiveProbeFailures > 0 && (
            <span className="text-destructive">
              {t("settings.sso_health_failures")}: {consecutiveProbeFailures}
            </span>
          )}
        </div>
      </div>

      {showWarningBanner && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 flex items-start gap-2.5">
          <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground">
              {t("settings.sso_health_warning_banner_title")}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {lastHealthError || t("settings.sso_health_degraded_desc")}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ExpiryItemBox
          label={t("settings.sso_health_tls_cert")}
          expiresAt={tlsCertExpiresAt}
          daysRemaining={tlsCertDaysRemaining}
        />
        <ExpiryItemBox
          label={t("settings.sso_health_saml_cert")}
          expiresAt={samlCertExpiresAt}
          daysRemaining={samlCertDaysRemaining}
        />
        <ExpiryItemBox
          label={t("settings.sso_health_secret_expiry")}
          expiresAt={clientSecretExpiresAt}
          daysRemaining={clientSecretDaysRemaining}
        />
      </div>
    </Card>
  );
}
