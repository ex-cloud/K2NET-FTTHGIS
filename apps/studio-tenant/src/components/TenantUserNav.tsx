import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  UserNavShell,
  DropdownMenuGroup,
  DropdownMenuItem,
  useTheme,
} from "@k2net/ui";
import { ShieldAlert, Building, Users, CreditCard } from "lucide-react";
import { useAuth } from "@k2net/auth/client";
import { useTranslation } from "@k2net/i18n";
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

export function TenantUserNav() {
  const { t } = useTranslation();
  const { user, logout, initialized } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const { organizationName } = useTenantInfo();
  const { isImpersonating, exitSession, isExiting } = useImpersonationSession();
  const navigate = useNavigate();

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const { isMono, toggleMono } = useMonoMode(mounted);

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }
    await logout({
      redirectUri: `${window.location.origin}/login`,
    });
  };

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
      onLogout={handleLogout}
      labels={{
        themeTitle: t("nav.theme"),
        themeSystem: t("common.theme_system"),
        themeDark: t("common.theme_dark"),
        themeLight: t("common.theme_light"),
        modeTitle: t("nav.mode"),
        modeMono: t("common.mode_mono"),
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
    />
  );
}
