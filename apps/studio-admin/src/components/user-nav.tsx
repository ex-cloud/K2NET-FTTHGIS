import * as React from "react";
import { UserNavShell, DropdownMenuGroup, DropdownMenuItem } from "@k2net/ui";
import { ShieldCheck } from "lucide-react";
import { useTranslation, type SupportedLocale } from "@k2net/i18n";
import { useTheme } from "@/lib/navigation-compat";
import { signOut, useSession } from "@/lib/auth-compat";
import { getSystemUrl, parseDomain } from "@/lib/domain";

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

function shouldShowSystemBackLink(roles?: string[], isSystemSubdomain?: boolean): boolean {
  if (!roles?.includes("super_admin")) return false;
  if (typeof window === "undefined") return false;
  if (isSystemSubdomain) return false;
  return !window.location.pathname.startsWith("/organizations");
}

export function UserNav() {
  const { t, locale, setLocale } = useTranslation();
  const { data: session, status } = useSession();
  const { setTheme, theme } = useTheme();

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const { isMono, toggleMono } = useMonoMode(mounted);
  const { selectedTimezone, setTimezone } = useTimezonePreference(mounted);
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

  const showSystemBackLink = shouldShowSystemBackLink(user?.roles, isSystemSubdomain);

  return (
    <UserNavShell
      isLoading={!mounted || status === "loading"}
      portalName="Admin"
      user={{
        name: user?.name || user?.username,
        username: user?.username,
        email: user?.email,
        avatarUrl: user?.avatar_url,
      }}
      theme={theme}
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
      }
      systemBackSlot={
        showSystemBackLink ? (
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="focus:bg-primary/10 focus:text-primary text-xs font-bold cursor-pointer gap-2"
              onClick={() => window.location.assign(getSystemUrl())}
            >
              <ShieldCheck className="size-3.5" />
              {t("nav.back_to_system_admin")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        ) : undefined
      }
    />
  );
}
