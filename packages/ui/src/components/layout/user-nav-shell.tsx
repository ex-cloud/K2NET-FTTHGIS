import * as React from "react";
import { Dot, LogOut, Globe, Clock, Check, Search } from "lucide-react";
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "../dropdown-menu";
import { AppVersionBadge } from "./app-version-badge";
import {
  COMMON_TIMEZONES,
  getBrowserTimezone,
} from "../../lib/timezone";

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
  languageTitle?: string;
  timezoneTitle?: string;
  autoDetect?: string;
  searchTimezone?: string;
  signOut?: string;
}

export interface UserNavShellProps extends React.HTMLAttributes<HTMLDivElement> {
  user?: UserNavUser;
  theme?: string;
  onSetTheme?: (theme: "system" | "dark" | "light") => void;
  isMono?: boolean;
  onToggleMono?: () => void;
  locale?: string;
  onSetLocale?: (locale: "en" | "id") => void;
  selectedTimezone?: string;
  onTimezoneChange?: (tz: string) => void;
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

function UserNavLanguageSection({
  locale,
  onSetLocale,
  labels,
}: {
  locale?: string;
  onSetLocale?: (locale: "en" | "id") => void;
  labels?: UserNavLabels;
}) {
  if (!onSetLocale) return null;
  const current = locale === "id" ? "ID" : "EN";

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="text-xs focus:bg-accent focus:text-accent-foreground cursor-pointer font-medium">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Globe className="size-3.5 text-muted-foreground shrink-0" />
          <span>{labels?.languageTitle || "Language"}</span>
        </div>
        <span className="text-[11px] text-muted-foreground/80 font-mono font-semibold mr-1 uppercase">
          {current}
        </span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-48 bg-popover border-border p-1">
        <DropdownMenuItem
          className="text-xs focus:bg-accent cursor-pointer flex items-center justify-between"
          onClick={() => onSetLocale("en")}
        >
          <div className="flex items-center gap-2">
            <span>🇬🇧</span>
            <span>English (EN)</span>
          </div>
          {locale === "en" && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs focus:bg-accent cursor-pointer flex items-center justify-between"
          onClick={() => onSetLocale("id")}
        >
          <div className="flex items-center gap-2">
            <span>🇮🇩</span>
            <span>Bahasa Indonesia (ID)</span>
          </div>
          {locale === "id" && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

function UserNavTimezoneSection({
  selectedTimezone = "auto",
  onTimezoneChange,
  labels,
}: {
  selectedTimezone?: string;
  onTimezoneChange?: (tz: string) => void;
  labels?: UserNavLabels;
}) {
  if (!onTimezoneChange) return null;
  const [search, setSearch] = React.useState("");
  const detectedTz = React.useMemo(() => getBrowserTimezone(), []);

  const filteredTimezones = React.useMemo(() => {
    if (!search.trim()) return COMMON_TIMEZONES;
    const q = search.toLowerCase();
    return COMMON_TIMEZONES.filter(
      (tz) =>
        tz.label.toLowerCase().includes(q) ||
        tz.value.toLowerCase().includes(q) ||
        tz.region.toLowerCase().includes(q) ||
        tz.offset.toLowerCase().includes(q)
    );
  }, [search]);

  const displayValue = selectedTimezone === "auto" ? `Auto (${detectedTz})` : selectedTimezone;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="text-xs focus:bg-accent focus:text-accent-foreground cursor-pointer font-medium">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Clock className="size-3.5 text-muted-foreground shrink-0" />
          <span>{labels?.timezoneTitle || "Timezone"}</span>
        </div>
        <span className="text-[11px] text-muted-foreground/80 truncate max-w-[100px] mr-1 text-right">
          {displayValue}
        </span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-72 bg-popover border-border p-1.5 space-y-1">
        {/* Search Input */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/40 border border-border/60 text-xs">
          <Search className="size-3 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={labels?.searchTimezone || "Search timezone..."}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 outline-none text-xs"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>

        {/* Auto Detect Option */}
        {!search && (
          <>
            <DropdownMenuItem
              className="text-xs focus:bg-accent cursor-pointer flex items-center justify-between py-1.5"
              onClick={() => onTimezoneChange("auto")}
            >
              <div className="flex flex-col text-left">
                <span className="font-semibold text-foreground">
                  {labels?.autoDetect || "Auto detect"}
                </span>
                <span className="text-[10px] text-muted-foreground">{detectedTz}</span>
              </div>
              {selectedTimezone === "auto" && <Check className="size-3.5 text-primary shrink-0" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/60" />
          </>
        )}

        {/* List of Timezones */}
        <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
          {filteredTimezones.map((tz) => {
            const isSelected = selectedTimezone === tz.value;
            return (
              <DropdownMenuItem
                key={tz.value}
                className="text-xs focus:bg-accent cursor-pointer flex items-center justify-between py-1 px-2"
                onClick={() => onTimezoneChange(tz.value)}
              >
                <div className="flex flex-col text-left min-w-0 pr-2">
                  <span className="text-foreground truncate font-medium">{tz.label}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{tz.offset} • {tz.value}</span>
                </div>
                {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
              </DropdownMenuItem>
            );
          })}
          {filteredTimezones.length === 0 && (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              No timezone found
            </div>
          )}
        </div>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
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
  locale,
  onSetLocale,
  selectedTimezone,
  onTimezoneChange,
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

        {/* Preferences Section: Language & Timezone */}
        {(onSetLocale || onTimezoneChange) && (
          <>
            <DropdownMenuSeparator className="bg-border" />
            <UserNavLanguageSection locale={locale} onSetLocale={onSetLocale} labels={labels} />
            <UserNavTimezoneSection
              selectedTimezone={selectedTimezone}
              onTimezoneChange={onTimezoneChange}
              labels={labels}
            />
          </>
        )}

        {/* Appearance Section: Theme & Mode */}
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
