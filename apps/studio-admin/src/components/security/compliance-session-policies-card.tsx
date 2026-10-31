import { Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Label, Separator, Switch } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

interface ComplianceSessionPoliciesCardProps {
  sessionTimeout: number;
  setSessionTimeout: (val: number) => void;
  mapLockDuration: number;
  setMapLockDuration: (val: number) => void;
  mfaEnforced: boolean;
  setMfaEnforced: (val: boolean) => void;
  waOtpEnabled: boolean;
  setWaOtpEnabled: (val: boolean) => void;
}

export function ComplianceSessionPoliciesCard({
  sessionTimeout,
  setSessionTimeout,
  mapLockDuration,
  setMapLockDuration,
  mfaEnforced,
  setMfaEnforced,
  waOtpEnabled,
  setWaOtpEnabled,
}: ComplianceSessionPoliciesCardProps) {
  const { t } = useTranslation();

  return (
    <Card glowingEffect className="bg-card/40 border-border shadow-xl backdrop-blur-sm">
      <CardHeader className="border-b border-border/40">
        <CardTitle className="text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> {t("security.session_policies_title")}
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs">
          {t("security.session_policies_desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Session Idle Timeout Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-foreground text-sm font-medium">{t("security.session_idle_logout_title")}</Label>
              <p className="text-xs text-muted-foreground font-normal">
                {t("security.session_idle_logout_desc")}
              </p>
            </div>
            <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              {sessionTimeout} {t("security.minutes_unit")}
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="120"
            step="5"
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        <Separator className="bg-muted/60" />

        {/* Map Auto-Lock Timeout */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-foreground text-sm font-medium">{t("security.map_lock_title")}</Label>
              <p className="text-xs text-muted-foreground font-normal">
                {t("security.map_lock_desc")}
              </p>
            </div>
            <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              {mapLockDuration} {t("security.minutes_unit")}
            </span>
          </div>
          <input
            type="range"
            min="2"
            max="60"
            step="2"
            value={mapLockDuration}
            onChange={(e) => setMapLockDuration(parseInt(e.target.value))}
            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        <Separator className="bg-muted/60" />

        {/* Multi Factor Authentication Switches */}
        <div className="space-y-4">
          {/* Enforce MFA Globally */}
          <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border bg-background/20">
            <div className="space-y-1">
              <Label className="text-foreground text-xs font-semibold">{t("security.enforce_device_verification_title")}</Label>
              <p className="text-[10px] text-muted-foreground">
                {t("security.enforce_device_verification_desc")}
              </p>
            </div>
            <Switch
              checked={mfaEnforced}
              onCheckedChange={setMfaEnforced}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {/* WhatsApp OTP Mode */}
          <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border bg-background/20">
            <div className="space-y-1">
              <Label className="text-foreground text-xs font-semibold">{t("security.wa_gateway_otp_title")}</Label>
              <p className="text-[10px] text-muted-foreground">
                {t("security.wa_gateway_otp_desc")}
              </p>
            </div>
            <Switch
              checked={waOtpEnabled}
              onCheckedChange={setWaOtpEnabled}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
