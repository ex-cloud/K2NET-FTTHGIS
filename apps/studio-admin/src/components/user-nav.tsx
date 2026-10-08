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
  AppVersionBadge,
} from "@k2net/ui";
import { Dot, ShieldCheck, LogOut } from "lucide-react";
import { useTranslation } from "@k2net/i18n";
import { useTheme } from "@/lib/navigation-compat";
import { signOut, useSession } from "@/lib/auth-compat";
import { getSystemUrl, parseDomain } from "@/lib/domain";
import * as React from "react";

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

interface NavUser {
  username?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  roles?: string[];
}

function UserNavTrigger({ user }: { user?: NavUser }) {
  const initial = (user?.username?.[0] || user?.name?.[0] || "U").toUpperCase();
  return (
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
        <Avatar className="h-8 w-8 border border-border">
          <AvatarImage
            src={user?.avatar_url || ""}
            alt={user?.username || ""}
          />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {initial}
          </AvatarFallback>
        </Avatar>
      </Button>
    </DropdownMenuTrigger>
  );
}

function UserNavHeader({ user }: { user?: NavUser }) {
  const displayName = user?.username || user?.name || "User";
  const subText = user?.email || (user?.name !== user?.username ? user?.name : "");

  return (
    <DropdownMenuLabel className="font-semibold">
      <div className="flex flex-col space-y-1">
        <p className="text-sm leading-none text-foreground font-bold">
          {displayName}
        </p>
        <p className="text-xs leading-none text-muted-foreground font-medium">
          {subText}
        </p>
      </div>
    </DropdownMenuLabel>
  );
}

function UserNavLinks() {
  const { t } = useTranslation();

  return (
    <DropdownMenuGroup>
      <DropdownMenuItem
        className="focus:bg-accent focus:text-accent-foreground text-xs font-medium cursor-pointer"
        onClick={() => window.location.assign("/account/preferences")}
      >
        {t("nav.account_preferences")}
      </DropdownMenuItem>
      <DropdownMenuItem className="focus:bg-accent focus:text-accent-foreground text-xs font-medium cursor-pointer">
        {t("nav.feature_previews")}
      </DropdownMenuItem>
      <DropdownMenuItem className="focus:bg-accent focus:text-accent-foreground text-xs font-medium cursor-pointer">
        {t("nav.changelog")}
      </DropdownMenuItem>
    </DropdownMenuGroup>
  );
}

function shouldShowSystemBackLink(user?: NavUser, isSystemSubdomain?: boolean): boolean {
  if (!user?.roles?.includes("super_admin")) return false;
  if (typeof window === "undefined") return false;
  if (isSystemSubdomain) return false;
  return !window.location.pathname.startsWith("/organizations");
}

export function UserNav() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme();

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const { isMono, toggleMono } = useMonoMode(mounted);
  const user = session?.user;

  const isSystemSubdomain = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    const { subdomain } = parseDomain(window.location.hostname);
    return subdomain === "system";
  }, []);

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }
    await signOut({
      redirectUri: `${window.location.origin}/login`,
    });
  };

  if (!mounted) return <div className="h-8 w-8 rounded-full bg-muted/50 animate-pulse border border-border" />;

  const showSystemBackLink = shouldShowSystemBackLink(user, isSystemSubdomain);

  return (
    <DropdownMenu>
      <UserNavTrigger user={user} />
      <DropdownMenuContent
        className="w-64 bg-popover border-border text-muted-foreground"
        side="bottom"
        align="end"
        forceMount
      >
        <UserNavHeader user={user} />
        <DropdownMenuSeparator className="bg-border" />
        <UserNavLinks />

        {showSystemBackLink && (
          <>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="focus:bg-primary/10 focus:text-primary text-xs font-bold cursor-pointer gap-2"
                onClick={() => window.location.assign(getSystemUrl())}
              >
                <ShieldCheck className="size-3.5" />
                {t("nav.back_to_system_admin")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}

        <UserNavThemeSection
          theme={theme}
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
          <AppVersionBadge portalName="Admin" />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
