import * as React from "react";
import { Dot, LogOut } from "lucide-react";
import { cn } from "../../utils";
import { Avatar, AvatarFallback, AvatarImage } from "../avatar";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { AppVersionBadge } from "./app-version-badge";

export interface UserNavUser {
  name?: string | null;
  username?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  badgeText?: string | null;
  badgeVariant?: "default" | "assist";
}

export interface UserNavLabels {
  themeTitle?: string;
  themeSystem?: string;
  themeDark?: string;
  themeLight?: string;
  modeTitle?: string;
  modeMono?: string;
  signOut?: string;
}

export interface UserNavShellProps extends React.HTMLAttributes<HTMLDivElement> {
  user?: UserNavUser;
  theme?: string;
  onSetTheme?: (theme: "system" | "dark" | "light") => void;
  isMono?: boolean;
  onToggleMono?: () => void;
  onLogout?: () => void | Promise<void>;
  portalName?: string;
  labels?: UserNavLabels;
  navigationSlot?: React.ReactNode;
  impersonationSlot?: React.ReactNode;
  systemBackSlot?: React.ReactNode;
  customTrigger?: React.ReactNode;
  isLoading?: boolean;
  contentClassName?: string;
}

function UserNavTrigger({ user }: { user?: UserNavUser }) {
  const initial = (user?.username?.[0] || user?.name?.[0] || "U").toUpperCase();
  return (
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 cursor-pointer select-none">
        <Avatar className="h-8 w-8 border border-border">
          <AvatarImage src={user?.avatarUrl || ""} alt={user?.name || user?.username || "User"} />
          <AvatarFallback className="bg-muted text-muted-foreground font-bold text-xs">
            {initial}
          </AvatarFallback>
        </Avatar>
      </Button>
    </DropdownMenuTrigger>
  );
}

function UserNavHeader({ user }: { user?: UserNavUser }) {
  const displayName = user?.name || user?.username || "User";
  const subText = user?.email || (user?.name !== user?.username ? user?.username : "");
  const isAssist = user?.badgeText === "ASSIST" || user?.badgeVariant === "assist";

  return (
    <DropdownMenuLabel className="font-semibold">
      <div className="flex flex-col space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm leading-none text-foreground font-bold truncate">
            {displayName}
          </p>
          {user?.badgeText && (
            <span
              className={cn(
                "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0",
                isAssist
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                  : "border-primary/40 bg-primary/10 text-primary"
              )}
            >
              {user.badgeText}
            </span>
          )}
        </div>
        {subText && (
          <p className="text-xs leading-none text-muted-foreground font-medium truncate">
            {subText}
          </p>
        )}
      </div>
    </DropdownMenuLabel>
  );
}

function UserNavThemeSection({
  theme,
  onSetTheme,
  labels,
}: {
  theme?: string;
  onSetTheme?: (theme: "system" | "dark" | "light") => void;
  labels?: UserNavLabels;
}) {
  if (!onSetTheme) return null;

  const themeLabels: Record<string, string> = {
    system: labels?.themeSystem || "System",
    dark: labels?.themeDark || "Dark",
    light: labels?.themeLight || "Light",
  };

  return (
    <>
      <DropdownMenuSeparator className="bg-border" />
      <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold tracking-tight">
        {labels?.themeTitle || "Theme"}
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
  labels,
}: {
  isMono?: boolean;
  onToggleMono?: () => void;
  labels?: UserNavLabels;
}) {
  if (typeof isMono === "undefined" || !onToggleMono) return null;

  return (
    <>
      <DropdownMenuSeparator className="bg-border" />
      <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold tracking-tight">
        {labels?.modeTitle || "Mode"}
      </DropdownMenuLabel>
      <DropdownMenuItem
        className="text-xs focus:bg-accent focus:text-accent-foreground cursor-pointer font-medium"
        onClick={onToggleMono}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-3.5 w-3.5 items-center justify-center">
            {isMono && <Dot className="size-8 text-primary" />}
          </div>
          <span>{labels?.modeMono || "Monochrome Slate (Neutral Accent)"}</span>
        </div>
      </DropdownMenuItem>
    </>
  );
}

export function UserNavShell({
  user,
  theme,
  onSetTheme,
  isMono,
  onToggleMono,
  onLogout,
  portalName = "Portal",
  labels,
  navigationSlot,
  impersonationSlot,
  systemBackSlot,
  customTrigger,
  isLoading = false,
  contentClassName,
  className: _className,
  ..._props
}: UserNavShellProps) {
  if (isLoading) {
    return <div className="h-8 w-8 rounded-full bg-muted/50 animate-pulse border border-border" />;
  }

  return (
    <DropdownMenu>
      {customTrigger ?? <UserNavTrigger user={user} />}
      <DropdownMenuContent
        className={cn(
          "w-64 bg-popover border-border text-muted-foreground",
          contentClassName
        )}
        side="bottom"
        align="end"
        forceMount
      >
        <UserNavHeader user={user} />

        {navigationSlot && (
          <>
            <DropdownMenuSeparator className="bg-border" />
            {navigationSlot}
          </>
        )}

        {impersonationSlot && (
          <>
            <DropdownMenuSeparator className="bg-border" />
            {impersonationSlot}
          </>
        )}

        {systemBackSlot && (
          <>
            <DropdownMenuSeparator className="bg-border" />
            {systemBackSlot}
          </>
        )}

        <UserNavThemeSection theme={theme} onSetTheme={onSetTheme} labels={labels} />
        <UserNavModeSection isMono={isMono} onToggleMono={onToggleMono} labels={labels} />

        {onLogout && (
          <>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="text-xs focus:bg-accent cursor-pointer text-destructive focus:text-destructive font-semibold gap-2"
              onClick={onLogout}
            >
              <LogOut className="size-3.5" />
              <span>{labels?.signOut || "Sign Out"}</span>
            </DropdownMenuItem>
          </>
        )}

        {/* Standardized App Version Badge Footer */}
        <div className="pt-2 mt-1 border-t border-border/80 px-2.5 pb-1 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/60 font-mono select-none">Platform</span>
          <AppVersionBadge portalName={portalName} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
