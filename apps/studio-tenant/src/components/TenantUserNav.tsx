import * as React from "react";
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
} from "@k2net/ui";
import { Dot, ShieldCheck } from "lucide-react";
import { useAuth } from "@k2net/auth/client";

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

export function TenantUserNav() {
  const { user, logout, isSuperAdmin } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();

  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const { isMono, brandTheme, toggleMono, handleBrandChange } = useThemeCustomizations(mounted);

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

  const displayName = user?.name || user?.username || "Tenant Admin";
  const subText = user?.email || (user?.tenantSlug ? `${user.tenantSlug.toUpperCase()} WORKSPACE` : "admin@isp.net");
  const initial = (user?.username?.[0] || user?.name?.[0] || "U").toUpperCase();

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
        className="w-64 bg-popover border-border text-muted-foreground shadow-lg"
        side="bottom"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-semibold p-2">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm leading-none text-foreground font-bold">
                {displayName}
              </p>
              {isSuperAdmin() && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary">
                  SUPER
                </span>
              )}
            </div>
            <p className="text-xs leading-none text-muted-foreground font-medium">
              {subText}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="focus:bg-accent focus:text-accent-foreground text-xs font-medium cursor-pointer"
            onClick={() => window.location.assign("/settings")}
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

        {isSuperAdmin() && (
          <>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="focus:bg-primary/10 focus:text-primary text-xs font-bold cursor-pointer gap-2"
                onClick={() => window.location.assign("https://system-gis.kdua.net/organizations")}
              >
                <ShieldCheck className="size-3.5" />
                Back to System Admin
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}

        <UserNavBrandSection brandTheme={brandTheme} onBrandChange={handleBrandChange} />
        <UserNavThemeSection
          theme={resolvedTheme}
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
