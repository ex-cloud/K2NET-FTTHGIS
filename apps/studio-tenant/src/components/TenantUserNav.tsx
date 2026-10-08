import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  UserNavShell,
  DropdownMenuGroup,
  DropdownMenuItem,
  useTheme,
  cn,
} from "@k2net/ui";
import { ShieldAlert, Building, Users, CreditCard, Sparkles, ArrowUpRight } from "lucide-react";
import { useAuth } from "@k2net/auth/client";
import { useTranslation, type SupportedLocale } from "@k2net/i18n";
import { useTenantInfo } from "../hooks/useTenantInfo";
import { useImpersonationSession } from "../lib/useImpersonationSession";

function useMonoMode(mounted: boolean) {
  const [isMono, setIsMono] = React.useState(false);

  React.useEffect(() => {
    if (!mounted) return;
    const savedMono = localStorage.getItem("theme-mono") === "true";
    setIsMono(savedMono);

    if (savedMono) {
      document.documentElement.classList.add("mono");
    } else {
      document.documentElement.classList.remove("mono");
    }
  }, [mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    if (isMono) {
      document.documentElement.classList.add("mono");
    } else {
      document.documentElement.classList.remove("mono");
    }
  }, [isMono, mounted]);

  const toggleMono = () => {
    const newState = !isMono;
    setIsMono(newState);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme-mono", newState.toString());
    }
  };

  return { isMono, toggleMono };
}

function useTimezonePreference(mounted: boolean) {
  const [selectedTimezone, setSelectedTimezone] = React.useState<string>("auto");

  React.useEffect(() => {
    if (!mounted) return;
    const saved = localStorage.getItem("k2net_timezone_preference") || "auto";
    setSelectedTimezone(saved);
  }, [mounted]);

  const setTimezone = (tz: string) => {
    setSelectedTimezone(tz);
    if (typeof window !== "undefined") {
      localStorage.setItem("k2net_timezone_preference", tz);
      window.dispatchEvent(new CustomEvent("k2net-timezone-changed", { detail: tz }));
    }
  };

  return { selectedTimezone, setTimezone };
}

export function TenantUserNav() {
  const { t, locale, setLocale } = useTranslation();
  const { user, logout, initialized } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const { organizationName, planTier } = useTenantInfo();
  const { isImpersonating, exitSession, isExiting } = useImpersonationSession();
  const navigate = useNavigate();

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const { isMono, toggleMono } = useMonoMode(mounted);
  const { selectedTimezone, setTimezone } = useTimezonePreference(mounted);

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }
    await logout({
      redirectUri: `${window.location.origin}/login`,
    });
  };

  const nextPlanInfo = React.useMemo(() => {
    const rawTier = (planTier || "pro").toLowerCase();
    if (rawTier.includes("enterprise") || rawTier.includes("sla")) {
      return {
        isTopTier: true,
        targetPlan: "Enterprise",
        label: `${t("billing.current_plan")}: Enterprise`,
      };
    }
    if (rawTier.includes("pro") || rawTier.includes("business")) {
      return {
        isTopTier: false,
        targetPlan: "Enterprise",
        label: t("billing.upgrade_to", { planName: "Enterprise" }) || "Upgrade to Enterprise",
      };
    }
    if (rawTier.includes("starter")) {
      return {
        isTopTier: false,
        targetPlan: "Pro",
        label: t("billing.upgrade_to", { planName: "Pro" }) || "Upgrade to Pro",
      };
    }
    // Free / Trial / Basic
    return {
      isTopTier: false,
      targetPlan: "Starter",
      label: t("billing.upgrade_to", { planName: "Starter" }) || "Upgrade to Starter",
    };
  }, [planTier, t]);

  const displayName = isImpersonating
    ? `Super Admin (${t("security.impersonation_active_title")})`
    : (user?.name || user?.username || "Tenant Admin");
  const subText = isImpersonating
    ? `${organizationName || "Tenant"} Workspace`
    : (user?.email || (organizationName ? `${organizationName} Workspace` : "Organization Workspace"));

  return (
    <UserNavShell
      isLoading={!mounted || !initialized}
      portalName="Tenant"
      user={{
        name: displayName,
        username: isImpersonating ? "Super Admin" : user?.username,
        email: subText,
        avatarUrl: user?.avatarUrl,
        badgeText: isImpersonating ? "ASSIST" : undefined,
        badgeVariant: isImpersonating ? "assist" : "default",
      }}
      theme={resolvedTheme}
      onSetTheme={setTheme}
      isMono={isMono}
      onToggleMono={toggleMono}
      locale={locale}
      onSetLocale={(l) => setLocale(l as SupportedLocale)}
      selectedTimezone={selectedTimezone}
      onTimezoneChange={setTimezone}
      onLogout={handleLogout}
      labels={{
        themeTitle: t("nav.theme"),
        themeSystem: t("common.theme_system"),
        themeDark: t("common.theme_dark"),
        themeLight: t("common.theme_light"),
        modeTitle: t("nav.mode"),
        modeMono: t("common.mode_mono"),
        languageTitle: t("nav.language"),
        timezoneTitle: t("nav.timezone"),
        autoDetect: t("nav.auto_detect"),
        searchTimezone: t("nav.search_timezone"),
        signOut: t("nav.sign_out"),
      }}
      navigationSlot={
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="focus:bg-accent focus:text-accent-foreground text-xs font-medium cursor-pointer gap-2"
            onClick={() => navigate({ to: "/settings" })}
          >
            <Building className="size-3.5 text-muted-foreground" />
            <span>{t("nav.tenant_settings")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="focus:bg-accent focus:text-accent-foreground text-xs font-medium cursor-pointer gap-2"
            onClick={() => navigate({ to: "/team" })}
          >
            <Users className="size-3.5 text-muted-foreground" />
            <span>{t("nav.tenant_team")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="focus:bg-accent focus:text-accent-foreground text-xs font-medium cursor-pointer gap-2"
            onClick={() => navigate({ to: "/billing" })}
          >
            <CreditCard className="size-3.5 text-muted-foreground" />
            <span>{t("nav.tenant_billing")}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      }
      impersonationSlot={
        isImpersonating ? (
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="focus:bg-amber-500/10 focus:text-amber-500 text-xs font-bold cursor-pointer gap-2 text-amber-500"
              onClick={exitSession}
              disabled={isExiting}
            >
              <ShieldAlert className="size-3.5 text-amber-500" />
              <span>{isExiting ? t("common.processing") : t("security.end_session_btn")}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        ) : undefined
      }
      actionSlot={
        !isImpersonating ? (
          <div className="p-0.5">
            <button
              type="button"
              onClick={() => navigate({ to: "/billing" })}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer group shadow-xs select-none",
                nextPlanInfo.isTopTier
                  ? "bg-purple-500/10 hover:bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                  : "bg-primary/10 hover:bg-primary/15 text-primary border border-primary/30"
              )}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles className="size-3.5 shrink-0 transition-transform group-hover:scale-110" />
                <span className="truncate">{nextPlanInfo.label}</span>
              </div>
              <ArrowUpRight className="size-3.5 opacity-70 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
            </button>
          </div>
        ) : undefined
      }
    />
  );
}
