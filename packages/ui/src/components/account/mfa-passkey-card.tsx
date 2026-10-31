import * as React from "react";
import { ShieldCheck, ShieldAlert, Lock, Smartphone, Key, Info, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../card";
import { Button } from "../button";
import { Badge } from "../badge";
import { PlaneType, PersonalSecuritySummaryData, AccountLabels } from "./account-types";

export interface MfaPasskeyCardProps {
  plane?: PlaneType;
  summary?: PersonalSecuritySummaryData;
  labels?: AccountLabels;
  onSetupTotp?: () => void;
  onSetupPasskey?: () => void;
  isLoading?: boolean;
}

export function MfaPasskeyCard({
  plane = "TENANT",
  summary,
  labels,
  onSetupTotp,
  onSetupPasskey,
  isLoading = false,
}: MfaPasskeyCardProps) {
  const isSystemPlane = plane === "SYSTEM";
  const isEnforced = isSystemPlane || summary?.mfaEnforced;
  const isMfaActive = summary?.mfaEnabled;

  return (
    <Card className="border border-border/80 bg-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="size-4 text-muted-foreground" />
              {labels?.mfaTitle || "Multi-Factor Authentication (2FA & Passkeys)"}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              {labels?.mfaDesc ||
                "Protect your account with an extra layer of verification via TOTP Authenticator or hardware Passkey."}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isMfaActive ? (
              <Badge
                variant="outline"
                className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium"
              >
                <CheckCircle2 className="size-3" />
                <span>{labels?.mfaStatusActive || "2FA Active"}</span>
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1 border-border/80 bg-muted/40 text-muted-foreground text-[11px] font-medium"
              >
                <ShieldAlert className="size-3" />
                <span>{labels?.mfaStatusInactive || "Not Configured"}</span>
              </Badge>
            )}

            {isSystemPlane ? (
              <Badge
                variant="outline"
                className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-mono uppercase"
              >
                <Lock className="size-3" />
                <span>{labels?.mfaLockedPlatform || "Tier 0 PAM Baseline"}</span>
              </Badge>
            ) : summary?.mfaEnforced ? (
              <Badge
                variant="outline"
                className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-mono uppercase"
              >
                <Lock className="size-3" />
                <span>{labels?.mfaLockedTenant || "Org Enforced"}</span>
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1 text-[10px] font-mono text-muted-foreground"
              >
                <span>{labels?.mfaOptional || "Optional"}</span>
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isEnforced && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200 text-xs">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="space-y-0.5">
              <p className="font-semibold">
                {isSystemPlane
                  ? labels?.mfaLockedPlatform || "Mandatory Platform Baseline (Tier 0 PAM Standard)"
                  : labels?.mfaLockedTenant || "Mandatory by Organization Security Policy"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {isSystemPlane
                  ? "Platform operator and super admin accounts require mandatory 2FA/Passkey verification to protect platform infrastructure."
                  : "Your organization administrator enforces two-factor authentication for all workspace members."}
              </p>
            </div>
          </div>
        )}

        {!isEnforced && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/60 bg-muted/20 text-xs text-muted-foreground">
            <Info className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
            <p>
              {labels?.mfaOptInNotice ||
                "You can voluntarily enroll two-factor authentication to secure your account against credential stuffing."}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded-lg border border-border/80 bg-background/50 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Smartphone className="size-4 text-muted-foreground" />
                <h4 className="text-xs font-semibold">Authenticator App (TOTP)</h4>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Google Authenticator, Microsoft Authenticator, 1Password, or Bitwarden.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSetupTotp}
              disabled={isLoading}
              className="w-full gap-1.5 text-xs"
            >
              <Smartphone className="size-3.5" />
              <span>{labels?.mfaSetupTotp || "Set Up Authenticator App"}</span>
            </Button>
          </div>

          <div className="p-3.5 rounded-lg border border-border/80 bg-background/50 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Key className="size-4 text-muted-foreground" />
                <h4 className="text-xs font-semibold">Security Keys & Passkeys (FIDO2)</h4>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Hardware keys like YubiKey, Apple Touch ID, or Windows Hello.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSetupPasskey}
              disabled={isLoading}
              className="w-full gap-1.5 text-xs"
            >
              <Key className="size-3.5" />
              <span>{labels?.mfaSetupPasskey || "Register Passkey (FIDO2)"}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
