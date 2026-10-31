import * as React from "react";
import { Lock, ShieldAlert, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../dialog";
import { Button } from "../button";
import { AccountLabels } from "./account-types";

export interface UseIdleTimeoutOptions {
  timeoutMinutes?: number;
  onIdle?: () => void;
  isEnabled?: boolean;
}

export function useIdleTimeout({
  timeoutMinutes = 30,
  onIdle,
  isEnabled = true,
}: UseIdleTimeoutOptions = {}) {
  const [isIdle, setIsIdle] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isEnabled || timeoutMinutes <= 0) return;

    timerRef.current = setTimeout(() => {
      setIsIdle(true);
      if (onIdle) onIdle();
    }, timeoutMinutes * 60 * 1000);
  }, [isEnabled, timeoutMinutes, onIdle]);

  React.useEffect(() => {
    if (!isEnabled || timeoutMinutes <= 0) return;

    const events = ["mousemove", "keydown", "scroll", "touchstart", "click"];
    const handleActivity = () => {
      if (!isIdle) {
        resetTimer();
      }
    };

    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
    };
  }, [isEnabled, timeoutMinutes, isIdle, resetTimer]);

  const unlock = React.useCallback(() => {
    setIsIdle(false);
    resetTimer();
  }, [resetTimer]);

  return { isIdle, unlock };
}

export interface IdleLockModalProps {
  open: boolean;
  onUnlock: () => void;
  onLogout?: () => void;
  labels?: AccountLabels;
}

export function IdleLockModal({ open, onUnlock, onLogout, labels }: IdleLockModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md p-6 border-border/80 bg-card select-none"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-3 items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500">
            <Lock className="size-6" />
          </div>
          <DialogTitle className="text-base font-semibold">
            {labels?.idleLockTitle || "Session Auto-Lock Active"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground max-w-xs">
            {labels?.idleLockDesc ||
              "Your session has been automatically locked due to inactivity to protect sensitive network data."}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
          {onLogout && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="w-full sm:w-auto text-xs gap-1.5"
            >
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </Button>
          )}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onUnlock}
            className="w-full sm:w-auto text-xs gap-1.5"
          >
            <ShieldAlert className="size-3.5" />
            <span>{labels?.unlockSessionBtn || "Unlock Session"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
