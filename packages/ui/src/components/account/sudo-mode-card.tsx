import * as React from "react";
import { Lock, ShieldCheck, KeyRound, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../card";
import { Badge } from "../badge";
import { Button } from "../button";
import type { AccountLabels, SudoStatusViewData } from "./account-types";

export interface SudoModeCardProps {
  sudoStatus?: SudoStatusViewData | null;
  labels?: AccountLabels;
  onLockSudo?: () => Promise<void> | void;
  onElevateSudo?: () => Promise<void> | void;
  isLocking?: boolean;
  isLoading?: boolean;
}

export function SudoModeCard({
  sudoStatus,
  labels,
  onLockSudo,
  onElevateSudo,
  isLocking = false,
  isLoading = false,
}: SudoModeCardProps) {
  const [liveRemaining, setLiveRemaining] = React.useState<number>(
    sudoStatus?.remainingSeconds ?? 0
  );

  React.useEffect(() => {
    setLiveRemaining(sudoStatus?.remainingSeconds ?? 0);
  }, [sudoStatus?.remainingSeconds, sudoStatus?.elevated, sudoStatus?.source]);

  React.useEffect(() => {
    if (!sudoStatus?.elevated || liveRemaining <= 0) return;
    const timer = window.setInterval(() => {
      setLiveRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sudoStatus?.elevated, liveRemaining]);

  const isElevated = Boolean(sudoStatus?.elevated) && liveRemaining > 0;
  const mins = Math.floor(liveRemaining / 60);
  const secs = String(liveRemaining % 60).padStart(2, "0");

  const statusText = React.useMemo(() => {
    if (!isElevated) {
      return labels?.sudoStatusLocked || "Verification Required";
    }
    const tpl =
      sudoStatus?.source === "fresh_login"
        ? labels?.sudoStatusFreshLogin || "Fresh Login Window ({{minutes}}m {{seconds}}s left)"
        : labels?.sudoStatusActive || "Elevated ({{minutes}}m {{seconds}}s left)";
    return tpl.replace("{{minutes}}", String(mins)).replace("{{seconds}}", secs);
  }, [isElevated, labels, mins, secs, sudoStatus?.source]);

  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold text-foreground">
                {labels?.sudoCardTitle || "Sudo Mode (Privileged Step-Up Session)"}
              </CardTitle>
              <Badge
                variant={isElevated ? "secondary" : "outline"}
                className="text-[11px] font-medium gap-1"
              >
                {isElevated ? (
                  <Clock className="size-3" />
                ) : (
                  <Lock className="size-3" />
                )}
                <span>{statusText}</span>
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              {labels?.sudoCardDesc ||
                "Protects destructive security, SSO, member, and MFA changes with a time-boxed 15-minute cryptographic elevation window."}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isElevated && onLockSudo ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading || isLocking}
                onClick={() => void onLockSudo()}
                className="h-7 px-2.5 text-xs font-medium gap-1.5"
              >
                <Lock className="size-3.5" />
                <span>
                  {isLocking
                    ? labels?.sudoLockingBtn || "Locking..."
                    : labels?.sudoLockBtn || "Lock Sudo Mode"}
                </span>
              </Button>
            ) : (
              onElevateSudo && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={isLoading}
                  onClick={() => void onElevateSudo()}
                  className="h-7 px-2.5 text-xs font-medium gap-1.5"
                >
                  <ShieldCheck className="size-3.5" />
                  <span>{labels?.sudoVerifyBtn || "Verify Sudo Mode"}</span>
                </Button>
              )
            )}
          </div>
        </div>
      </CardHeader>

      {sudoStatus?.isBreakGlass && (
        <CardContent className="pt-0">
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="size-3.5 shrink-0 text-foreground" />
            <span>
              {labels?.sudoStatusBreakGlassNotice ||
                "Break-Glass sessions do not receive a fresh-login grace window and require explicit MFA elevation."}
            </span>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
