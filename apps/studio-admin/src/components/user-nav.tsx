

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
} from "@k2net/ui";
import { Dot, ShieldCheck } from "lucide-react";
import { useTheme } from "@/lib/navigation-compat";
import { signOut, useSession } from "@/lib/auth-compat";
import { getSystemUrl, parseDomain } from "@/lib/domain";
import * as React from "react";

function useThemeCustomizations(mounted: boolean) {
  const [isMono, setIsMono] = React.useState(false);
  const [brandTheme, setBrandTheme] = React.useState<"green" | "blue">("green");

  React.useEffect(() => {
    if (!mounted) return;
    const savedMono = localStorage.getItem("theme-mono") === "true";
    setIsMono(savedMono);

    const savedBrand = (localStorage.getItem("brand-theme") as "green" | "blue") || "green";
    setBrandTheme(savedBrand);

    if (savedMono) {
      document.documentElement.classList.add("mono");
    } else {
      document.documentElement.classList.remove("mono");
    }

    document.documentElement.classList.remove("brand-green", "brand-blue");
    document.documentElement.classList.add(`brand-${savedBrand}`);
  }, [mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    if (isMono) {
      document.documentElement.classList.add("mono");
    } else {
      document.documentElement.classList.remove("mono");
    }
  }, [isMono, mounted]);

  React.useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.remove("brand-green", "brand-blue");
    document.documentElement.classList.add(`brand-${brandTheme}`);
  }, [brandTheme, mounted]);

  const toggleMono = () => {
    const newState = !isMono;
    setIsMono(newState);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme-mono", newState.toString());
    }
  };

  const handleBrandChange = (newBrand: "green" | "blue") => {
    setBrandTheme(newBrand);
    if (typeof window !== "undefined") {
      localStorage.setItem("brand-theme", newBrand);
    }
  };

  return { isMono, brandTheme, toggleMono, handleBrandChange };
}

function UserNavBrandSection({
  brandTheme,
  onBrandChange,
}: {
  brandTheme: "green" | "blue";
  onBrandChange: (brand: "green" | "blue") => void;
}) {
  return (
    <>
      <DropdownMenuSeparator className="bg-border" />
      <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold tracking-tight">
        Brand Style
      </DropdownMenuLabel>
      <DropdownMenuItem
        className="text-xs focus:bg-accent focus:text-accent-foreground cursor-pointer font-medium"
        onClick={() => onBrandChange("green")}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-3.5 w-3.5 items-center justify-center">
            {brandTheme === "green" && <Dot className="size-8 text-primary" />}
          </div>
          <span>Version 1 (Green)</span>
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem
        className="text-xs focus:bg-accent focus:text-accent-foreground cursor-pointer font-medium"
        onClick={() => onBrandChange("blue")}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-3.5 w-3.5 items-center justify-center">
            {brandTheme === "blue" && <Dot className="size-8 text-primary" />}
          </div>
          <span>Version 2 (Blue)</span>
        </div>
      </DropdownMenuItem>
    </>
  );
}

function UserNavThemeSection({
  theme,
  isMono,
  onSetTheme,
  onToggleMono,
}: {
  theme?: string;
  isMono: boolean;
  onSetTheme: (theme: "system" | "dark" | "light") => void;
  onToggleMono: () => void;
}) {
  return (
    <>
      <DropdownMenuSeparator className="bg-border" />
      <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold tracking-tight">
        Theme
      </DropdownMenuLabel>
      {(["system", "dark", "light"] as const).map((t) => (
        <DropdownMenuItem
          key={t}
          className="text-xs focus:bg-accent focus:text-accent-foreground cursor-pointer font-medium capitalize"
          onClick={() => onSetTheme(t)}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-3.5 w-3.5 items-center justify-center">
              {theme === t && <Dot className="size-8 text-primary" />}
            </div>
            <span>{t}</span>
          </div>
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator className="bg-border" />
      <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold tracking-tight">
        Mode
      </DropdownMenuLabel>
      <DropdownMenuItem
        className="text-xs focus:bg-accent focus:text-accent-foreground cursor-pointer font-medium"
        onClick={onToggleMono}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-3.5 w-3.5 items-center justify-center">
            {isMono && <Dot className="size-8 text-primary" />}
          </div>
          <span>Mono</span>
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
  return (
    <DropdownMenuGroup>
      <DropdownMenuItem
        className="focus:bg-accent focus:text-accent-foreground text-xs font-medium cursor-pointer"
        onClick={() => window.location.assign("/account/preferences")}
      >
        Account preferences
      </DropdownMenuItem>
      <DropdownMenuItem className="focus:bg-accent focus:text-accent-foreground text-xs font-medium cursor-pointer">
        Feature previews
      </DropdownMenuItem>
      <DropdownMenuItem className="focus:bg-accent focus:text-accent-foreground text-xs font-medium cursor-pointer">
        Changelog
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
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme();

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const { isMono, brandTheme, toggleMono, handleBrandChange } = useThemeCustomizations(mounted);
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
                Back to System Admin
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}

        <UserNavBrandSection brandTheme={brandTheme} onBrandChange={handleBrandChange} />
        <UserNavThemeSection
          theme={theme}
          isMono={isMono}
          onSetTheme={setTheme}
          onToggleMono={toggleMono}
        />

        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          className="text-xs focus:bg-accent cursor-pointer text-destructive focus:text-destructive font-semibold"
          onClick={handleLogout}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
