"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dot, ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { getSystemUrl } from "@/lib/domain";
import * as React from "react";

export function UserNav() {
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme();
  
  // Modern way to handle hydration/mounting safely by Next.js Standards
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [isMono, setIsMono] = React.useState(false);
  const user = session?.user;

  // Modern way to handle hydration/mounting safely and sync state
  React.useEffect(() => {
    if (!mounted) return;
    
    // Initial sync from localStorage
    const savedMono = localStorage.getItem("theme-mono") === "true";
    setIsMono(savedMono);

    if (savedMono) {
      document.documentElement.classList.add("mono");
    } else {
      document.documentElement.classList.remove("mono");
    }
  }, [mounted]);

  // Sync subsequent changes
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

  const handleLogout = async () => {
    const isSystem = window.location.pathname.startsWith("/system");
    const issuer = (session as { issuer?: string } | null)?.issuer || process.env.NEXT_PUBLIC_AUTH_KEYCLOAK_ISSUER;
    const idToken = (session as { idToken?: string } | null)?.idToken;

    // 1. Clear ALL browser storage for a truly clean slate
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }

    // 2. Sign out locally from NextAuth
    await signOut({ redirect: false });

    // 3. Redirect to Keycloak for federated logout if possible
    if (issuer && idToken) {
      const postLogoutRedirect = window.location.origin + (isSystem ? "/system/login" : "/login");
      const keycloakLogoutUrl = `${issuer}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(
        postLogoutRedirect,
      )}&id_token_hint=${idToken}`;
      window.location.href = keycloakLogoutUrl;
    } else {
      // Fallback: just go to appropriate login page
      window.location.href = isSystem ? "/system/login" : "/login";
    }
  };

  if (!mounted) return <div className="h-8 w-8 rounded-full bg-zinc-900/50 animate-pulse border border-white/5" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage
              src={user?.avatar_url || ""}
              alt={user?.username || ""}
            />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {(user?.username?.[0] || user?.name?.[0] || "U").toUpperCase()}
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
            <p className="text-sm leading-none text-foreground font-bold">
              {user?.username || user?.name || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground font-medium">
              {user?.email || (user?.name !== user?.username ? user?.name : "")}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
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
        <DropdownMenuSeparator className="bg-border" />
        
        {/* Impersonation Back Link */}
        {user?.roles?.includes("super_admin") && !(window.location.hostname.startsWith("system.") || window.location.hostname.startsWith("system-")) && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem 
                className="focus:bg-primary/10 focus:text-primary text-xs font-bold cursor-pointer gap-2"
                onClick={() => window.location.assign(getSystemUrl())}
              >
                <ShieldCheck className="size-3.5" />
                Back to System Admin
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-border" />
          </>
        )}
        
        <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold tracking-tight">
          Theme
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="text-xs focus:bg-accent focus:text-accent-foreground cursor-pointer font-medium"
          onClick={() => setTheme("system")}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-3.5 w-3.5 items-center justify-center">
              {theme === "system" && (
                <Dot className="size-8 text-emerald-500" />
              )}
            </div>
            <span>System</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs focus:bg-accent focus:text-accent-foreground cursor-pointer font-medium"
          onClick={() => setTheme("dark")}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-3.5 w-3.5 items-center justify-center">
              {theme === "dark" && <Dot className="size-8 text-emerald-500" />}
            </div>
            <span>Dark</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs focus:bg-accent focus:text-accent-foreground cursor-pointer font-medium"
          onClick={() => setTheme("light")}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-3.5 w-3.5 items-center justify-center">
              {theme === "light" && <Dot className="size-8 text-emerald-500" />}
            </div>
            <span>Light</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold tracking-tight">
          Mode
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="text-xs focus:bg-accent focus:text-accent-foreground cursor-pointer font-medium"
          onClick={toggleMono}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-3.5 w-3.5 items-center justify-center">
              {isMono && <Dot className="size-8 text-emerald-500" />}
            </div>
            <span>Mono</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          className="text-xs focus:bg-accent cursor-pointer text-red-500 focus:text-red-500 font-semibold"
          onClick={handleLogout}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
