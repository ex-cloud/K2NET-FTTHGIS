import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  useTheme,
  AppVersionBadge,
} from "@k2net/ui";
import { Dot, ShieldAlert, Building, Users, CreditCard, LogOut } from "lucide-react";
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

function UserNavThemeSection({
  theme,
  onSetTheme,
}: {
  theme?: string;
  onSetTheme: (theme: "system" | "dark" | "light") => void;
}) {
  const { t } = useTranslation();

  const themeLabels: Record<string, string> = {
    system: t("common.theme_system"),
    dark: t("common.theme_dark"),
    light: t("common.theme_light"),
  };

  return (
    <>
      <DropdownMenuSeparator className="bg-border" />
      <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold tracking-tight">
        {t("nav.theme")}
      </DropdownMenuLabel>
      {(["system", "dark", "light"] as const).map((key) => (
        <DropdownMenuItem
          key={key}
          className="text-xs focus:bg-accent focus:text-accent-foreground cursor-pointer font-medium capitalize"
          onClick={() => onSetTheme(key)}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-3.5 w-3.5 items-center justify-center">
              {theme === key && <Dot className="size-8 text-primary" />}
            </div>
            <span>{themeLabels[key] || key}</span>
          </div>
        </DropdownMenuItem>
      ))}
    </>
  );
}

function UserNavModeSection({
  isMono,
  onToggleMono,
}: {
  isMono: boolean;
  onToggleMono: () => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <DropdownMenuSeparator className="bg-border" />
      <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold tracking-tight">
        {t("nav.mode")}
      </DropdownMenuLabel>
      <DropdownMenuItem
        className="text-xs focus:bg-accent focus:text-accent-foreground cursor-pointer font-medium"
        onClick={onToggleMono}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-3.5 w-3.5 items-center justify-center">
            {isMono && <Dot className="size-8 text-primary" />}
          </div>
          <span>{t("common.mode_mono")}</span>
        </div>
      </DropdownMenuItem>
    </>
  );
}

export function TenantUserNav() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
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

  if (!mounted) return <div className="h-8 w-8 rounded-full bg-muted/50 animate-pulse border border-border" />;

  const displayName = isImpersonating
    ? `Super Admin (${t("security.impersonation_active_title")})`
    : (user?.name || user?.username || "Tenant Admin");
  const subText = isImpersonating
    ? `${organizationName || "Tenant"} Workspace`
    : (user?.email || (organizationName ? `${organizationName} Workspace` : "Organization Workspace"));
  const initial = isImpersonating
    ? "S"
    : (user?.username?.[0] || user?.name?.[0] || "U").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 cursor-pointer">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage
              src={user?.avatarUrl || ""}
              alt={displayName}
            />
            <AvatarFallback className="bg-muted text-muted-foreground font-bold text-xs">
              {initial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 bg-popover border-border text-muted-foreground"
        side="bottom"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-semibold">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm leading-none text-foreground font-bold truncate">
                {displayName}
              </p>
              {isImpersonating && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-500">
                  ASSIST
                </span>
              )}
            </div>
            <p className="text-xs leading-none text-muted-foreground font-medium truncate">
              {subText}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-border" />
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

        {isImpersonating && (
          <>
            <DropdownMenuSeparator className="bg-border" />
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
          </>
        )}

        <UserNavThemeSection
          theme={resolvedTheme}
          onSetTheme={setTheme}
        />

        <UserNavModeSection
          isMono={isMono}
          onToggleMono={toggleMono}
        />

        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          className="text-xs focus:bg-accent cursor-pointer text-destructive focus:text-destructive font-semibold gap-2"
          onClick={handleLogout}
        >
          <LogOut className="size-3.5" />
          <span>{t("nav.sign_out")}</span>
        </DropdownMenuItem>

        {/* Standardized Version Badge Footer */}
        <div className="pt-2 mt-1 border-t border-border/80 px-2.5 pb-1 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/60 font-mono select-none">Platform</span>
          <AppVersionBadge portalName="Tenant" />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
