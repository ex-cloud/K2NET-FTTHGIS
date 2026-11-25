import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Lock,
  Play,
  Sparkles,
} from "lucide-react";
import { Badge, Button, Card, Label, Switch } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

export function SsoLockedNoticeCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card className="border-border bg-muted/20 p-4 sm:p-5 relative overflow-hidden shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted text-foreground border border-border shrink-0">
            <Lock className="size-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              {t("settings.sso_locked_title")}
              <Badge variant="outline" className="border-border text-muted-foreground text-[10px] px-1.5 py-0 font-mono">
                {t("settings.sso_badge_locked")}
              </Badge>
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              {t("settings.sso_locked_desc")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs font-medium gap-1.5 border-border/80"
            onClick={() => navigate({ to: "/billing/marketplace" as unknown as string })}
          >
            <ExternalLink className="size-3.5" />
            {t("settings.sso_marketplace_btn")}
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-7 px-2.5 text-xs font-medium gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => navigate({ to: "/billing/license" as unknown as string })}
          >
            <Sparkles className="size-3.5" />
            {t("settings.sso_upgrade_btn")}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function SsoProbeHeader({
  isSsoAllowed,
  isTesting,
  canProbe,
  lastTestStatus,
  lastTestAt,
  onTestProbe,
}: {
  isSsoAllowed: boolean;
  isTesting: boolean;
  canProbe: boolean;
  lastTestStatus?: string;
  lastTestAt?: string;
  onTestProbe: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-muted/30 border border-border/40">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-semibold">{t("settings.sso_integration_label")}</Label>
          <Badge
            variant="outline"
            className={
              lastTestStatus === "SUCCESS"
                ? "border-primary/40 text-primary bg-primary/10 text-[10px]"
                : lastTestStatus === "FAILED"
                ? "border-destructive/40 text-destructive bg-destructive/10 text-[10px]"
                : "border-border text-muted-foreground text-[10px]"
            }
          >
            {lastTestStatus === "SUCCESS" ? (
              <span className="flex items-center gap-1"><CheckCircle2 className="size-3" /> {t("settings.sso_status_verified")}</span>
            ) : lastTestStatus === "FAILED" ? (
              <span className="flex items-center gap-1"><AlertCircle className="size-3" /> {t("settings.sso_status_failed")}</span>
            ) : (
              t("settings.sso_status_not_tested")
            )}
          </Badge>
          {lastTestAt && (
            <span className="text-[10px] text-muted-foreground font-mono">
              ({new Date(lastTestAt).toLocaleTimeString()})
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {t("settings.sso_integration_desc")}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!isSsoAllowed || isTesting || !canProbe}
          onClick={onTestProbe}
          className="h-7 px-2.5 text-xs font-medium gap-1.5 border-border/80"
        >
          {isTesting ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5 text-primary" />}
          {isTesting ? t("settings.sso_test_probe_testing") : t("settings.sso_test_probe_btn")}
        </Button>
      </div>
    </div>
  );
}

export function SsoEnforcementSwitches({
  isSsoAllowed,
  isLoading,
  lastTestStatus,
  enforceSso,
  allowBreakGlassBypass,
  onEnforceSsoChange,
  onAllowBreakGlassBypassChange,
}: {
  isSsoAllowed: boolean;
  isLoading: boolean;
  lastTestStatus?: string;
  enforceSso: boolean;
  allowBreakGlassBypass: boolean;
  onEnforceSsoChange: (val: boolean) => void;
  onAllowBreakGlassBypassChange: (val: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 pt-3 border-t border-border/50">
      <div
        className="flex items-center justify-between p-3.5 rounded-lg bg-muted/20 border border-border/50 hover:border-border/80 transition-colors cursor-pointer"
        onClick={() => {
          if (isSsoAllowed && !isLoading) {
            onEnforceSsoChange(!enforceSso);
          }
        }}
      >
        <div className="space-y-0.5 pr-4">
          <Label htmlFor="sso-enforce-switch" className="text-xs font-semibold flex items-center gap-2 cursor-pointer">
            <span>{t("settings.sso_enforce_label")}</span>
            <Badge
              variant="outline"
              className={
                enforceSso
                  ? "border-primary/40 text-primary bg-primary/10 text-[10px]"
                  : "border-border text-muted-foreground text-[10px]"
              }
            >
              {enforceSso ? "ENFORCED (ON)" : "OPTIONAL (OFF)"}
            </Badge>
            {lastTestStatus !== "SUCCESS" && (
              <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
                {t("settings.sso_probe_required_badge")}
              </Badge>
            )}
          </Label>
          <p className="text-[11px] text-muted-foreground">
            {t("settings.sso_enforce_desc")}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Switch
            id="sso-enforce-switch"
            disabled={!isSsoAllowed || isLoading}
            checked={enforceSso}
            onCheckedChange={onEnforceSsoChange}
          />
        </div>
      </div>

      <div
        className="flex items-center justify-between p-3.5 rounded-lg bg-muted/20 border border-border/50 hover:border-border/80 transition-colors cursor-pointer"
        onClick={() => {
          if (isSsoAllowed && !isLoading) {
            onAllowBreakGlassBypassChange(!allowBreakGlassBypass);
          }
        }}
      >
        <div className="space-y-0.5 pr-4">
          <Label htmlFor="sso-breakglass-switch" className="text-xs font-semibold flex items-center gap-2 cursor-pointer">
            <span>{t("settings.sso_break_glass_label")}</span>
            <Badge
              variant="outline"
              className={
                allowBreakGlassBypass
                  ? "border-primary/40 text-primary bg-primary/10 text-[10px]"
                  : "border-border text-muted-foreground text-[10px]"
              }
            >
              {allowBreakGlassBypass ? "ENABLED (ON)" : "DISABLED (OFF)"}
            </Badge>
          </Label>
          <p className="text-[11px] text-muted-foreground">{t("settings.sso_break_glass_desc")}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Switch
            id="sso-breakglass-switch"
            disabled={!isSsoAllowed || isLoading}
            checked={allowBreakGlassBypass}
            onCheckedChange={onAllowBreakGlassBypassChange}
          />
        </div>
      </div>
    </div>
  );
}
