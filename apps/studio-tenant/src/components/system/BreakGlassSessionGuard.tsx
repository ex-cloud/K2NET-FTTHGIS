import * as React from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ShieldCheck, Lock, Loader2 } from "lucide-react";
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
import {
  useAuth,
  fetchSudoStatus,
  onSudoStatusChange,
  requestSudoElevation,
  type SudoStatusResponse,
} from "@k2net/auth/client";
import { useTranslation } from "@k2net/i18n";
import { getApiAuthToken } from "../../lib/api-client";

const BANNER_DISMISSED_STORAGE_KEY = "k2net_break_glass_banner_dismissed";
const LEGACY_STEP_UP_STORAGE_KEY = "k2net_break_glass_stepup_until";

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
  const { isBreakGlassSession, token } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const [sudoStatus, setSudoStatus] = React.useState<SudoStatusResponse | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = React.useState(false);

  const [isBannerDismissed, setIsBannerDismissed] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      window.sessionStorage.removeItem(LEGACY_STEP_UP_STORAGE_KEY);
      return window.sessionStorage.getItem(BANNER_DISMISSED_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const { isHighRisk, moduleLabel } = React.useMemo(() => isHighRiskPath(pathname), [pathname]);
  const activeToken = token || getApiAuthToken();

  // Keep synchronized with live server Sudo elevation state (and Lock Sudo Mode revocations)
  React.useEffect(() => {
    const unsubscribe = onSudoStatusChange((next) => {
      if (next) {
        setSudoStatus(next);
      }
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    if (!isBreakGlassSession || !isHighRisk) return;
    let cancelled = false;
    setIsCheckingStatus(true);
    void fetchSudoStatus(activeToken).then((status) => {
      if (!cancelled) {
        setSudoStatus(status);
        setIsCheckingStatus(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isBreakGlassSession, isHighRisk, activeToken]);

  const requiresStepUpModal =
    Boolean(isBreakGlassSession) && isHighRisk && !sudoStatus?.sudoActive;

  const handleConfirmStepUp = async () => {
    const elevated = await requestSudoElevation({
      action: "break_glass.module_access",
      isBreakGlass: true,
    });
    if (elevated) {
      const updated = await fetchSudoStatus(activeToken);
      if (updated) {
        setSudoStatus(updated);
      }
    }
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
          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void navigate({ to: "/projects" })}
              className="h-7 px-2.5 text-xs font-medium"
            >
              {t("auth.sudo.cancel_btn")}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isCheckingStatus}
              onClick={() => void handleConfirmStepUp()}
              className="h-7 px-2.5 text-xs font-medium gap-1.5"
            >
              {isCheckingStatus ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="size-3.5" />
              )}
              <span>{t("settings.break_glass_stepup_verify_btn")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
