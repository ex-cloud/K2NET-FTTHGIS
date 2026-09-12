import { Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Label, Separator, Switch } from "@k2net/ui";

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
  return (
    <Card glowingEffect className="bg-card/40 border-border shadow-xl backdrop-blur-sm">
      <CardHeader className="border-b border-border/40">
        <CardTitle className="text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Session &amp; Device Policies
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs">
          Govern session lifetimes and auto-lock security triggers for unauthorized terminal prevention.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Session Idle Timeout Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-foreground text-sm font-medium">Session Idle Logout</Label>
              <p className="text-xs text-muted-foreground font-normal">
                Terminate inactive SSO sessions and force user re-auth.
              </p>
            </div>
            <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              {sessionTimeout} minutes
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
              <Label className="text-foreground text-sm font-medium">Map Canvas Lock</Label>
              <p className="text-xs text-muted-foreground font-normal">
                Automatically blur and lock active FTTH GIS map screens.
              </p>
            </div>
            <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              {mapLockDuration} minutes
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
              <Label className="text-foreground text-xs font-semibold">Enforce Device Verification</Label>
              <p className="text-[10px] text-muted-foreground">
                Require OTP step-up authentication when login from a new device is detected.
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
              <Label className="text-foreground text-xs font-semibold">WhatsApp Gateway OTP</Label>
              <p className="text-[10px] text-muted-foreground">
                Use WhatsApp API as primary Multi-Factor auth provider instead of Email.
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
