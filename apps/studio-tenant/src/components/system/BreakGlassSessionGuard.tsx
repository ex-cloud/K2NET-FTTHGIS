import * as React from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ShieldCheck, Lock } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FloatingBanner,
} from "@k2net/ui";
import { useAuth } from "@k2net/auth/client";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";

const STEP_UP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const STEP_UP_STORAGE_KEY = "k2net_break_glass_stepup_until";
const BANNER_DISMISSED_STORAGE_KEY = "k2net_break_glass_banner_dismissed";

function isHighRiskPath(pathname: string): { isHighRisk: boolean; moduleLabel: string } {
  if (pathname.startsWith("/billing")) {
    return { isHighRisk: true, moduleLabel: "Billing & Subscription" };
  }
  if (pathname.startsWith("/settings/sso")) {
    return { isHighRisk: true, moduleLabel: "Enterprise Single Sign-On (SSO)" };
  }
  if (pathname.startsWith("/settings/security")) {
    return { isHighRisk: true, moduleLabel: "Organization Security Policy" };
  }
  return { isHighRisk: false, moduleLabel: "" };
}

export function BreakGlassSessionGuard() {
  const { t } = useTranslation();
  const { isBreakGlassSession } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const [stepUpVerifiedUntil, setStepUpVerifiedUntil] = React.useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      return Number(window.sessionStorage.getItem(STEP_UP_STORAGE_KEY) || "0");
    } catch {
      return 0;
    }
  });

  const [isBannerDismissed, setIsBannerDismissed] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem(BANNER_DISMISSED_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const { isHighRisk, moduleLabel } = React.useMemo(() => isHighRiskPath(pathname), [pathname]);

  const requiresStepUpModal =
    Boolean(isBreakGlassSession) && isHighRisk && Date.now() >= stepUpVerifiedUntil;

  const handleConfirmStepUp = () => {
    const expiry = Date.now() + STEP_UP_WINDOW_MS;
    setStepUpVerifiedUntil(expiry);
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(STEP_UP_STORAGE_KEY, String(expiry));
      } catch {
        // ignore storage error
      }
    }
    toast.success(t("settings.break_glass_stepup_verified_toast"));
  };

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(BANNER_DISMISSED_STORAGE_KEY, "1");
      } catch {
        // ignore storage error
      }
    }
  };

  if (!isBreakGlassSession) {
    return null;
  }

  return (
    <>
      {!isBannerDismissed && (
        <FloatingBanner
          variant="warning"
          badgeText={t("settings.break_glass_banner_badge")}
          title={t("settings.break_glass_banner_title")}
          description={t("settings.break_glass_banner_desc")}
          actionText={t("settings.break_glass_banner_action_btn")}
          onAction={() => void navigate({ to: "/settings/sso" })}
          onClose={handleDismissBanner}
        />
      )}

      <Dialog open={requiresStepUpModal}>
        <DialogContent className="sm:max-w-md [&>button]:hidden">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-md border border-border bg-muted/50 text-foreground">
                <Lock className="size-4" />
              </div>
              <DialogTitle className="text-sm font-semibold">
                {t("settings.break_glass_stepup_title")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-2">
              {t("settings.break_glass_stepup_desc", { module: moduleLabel })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmStepUp}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 w-full sm:w-auto"
            >
              <ShieldCheck className="size-3.5" />
              <span>{t("settings.break_glass_stepup_verify_btn")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
