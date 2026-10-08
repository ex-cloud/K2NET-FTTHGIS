import * as React from "react";
import { Search, Sparkles, HelpCircle, MessageSquare } from "lucide-react";
import { cn } from "../../utils";
import { Button } from "../button";
import { Separator } from "../separator";
import { ActionTooltip } from "../tooltip";

export interface AppHeaderActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Search / Command Palette trigger handler */
  onOpenSearch?: () => void;
  searchLabel?: string;
  searchShortcut?: string;
  searchWidthClass?: string;
  showSearch?: boolean;

  /** AI Copilot trigger handler */
  onOpenAi?: () => void;
  aiLabel?: string;
  aiShortcut?: string;
  showAi?: boolean;

  /** Help & Support trigger handler */
  onOpenHelp?: () => void;
  helpLabel?: string;
  helpShortcut?: string;
  showHelp?: boolean;

  /** Notifications / System Messages trigger handler */
  onOpenNotifications?: () => void;
  notificationsLabel?: string;
  notificationsShortcut?: string;
  showNotifications?: boolean;

  /** Slot for extra actions before separator */
  extraActions?: React.ReactNode;

  /** User profile avatar navigation slot */
  userNavSlot?: React.ReactNode;

  /** Fallback children slot (rendered in place of or alongside userNavSlot) */
  children?: React.ReactNode;
}

export function AppHeaderActions({
  onOpenSearch,
  searchLabel = "Search or jump to...",
  searchShortcut = "⌘K",
  searchWidthClass = "w-48 lg:w-56",
  showSearch = true,

  onOpenAi,
  aiLabel = "Ask AI Copilot",
  aiShortcut = "Ctrl+J",
  showAi = true,

  onOpenHelp,
  helpLabel = "Help & Support",
  helpShortcut = "?",
  showHelp = true,

  onOpenNotifications,
  notificationsLabel = "Notifications",
  notificationsShortcut = "M",
  showNotifications = true,

  extraActions,
  userNavSlot,
  children,
  className,
  ...props
}: AppHeaderActionsProps) {
  return (
    <div
      className={cn("flex items-center gap-1 sm:gap-1.5 shrink-0 select-none", className)}
      {...props}
    >
      {/* 1. Desktop Search / Command Palette Trigger */}
      {showSearch && (
        <ActionTooltip label={searchLabel} shortcut={searchShortcut} side="bottom">
          <button
            type="button"
            onClick={onOpenSearch}
            className={cn(
              "hidden md:flex items-center justify-between h-7 px-2.5 text-xs rounded-md border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-muted-foreground shadow-xs cursor-pointer mr-1",
              searchWidthClass
            )}
            aria-label={searchLabel}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{searchLabel}</span>
            </div>
            {searchShortcut && (
              <kbd className="pointer-events-none inline-flex h-4.5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[9px] font-medium text-muted-foreground shrink-0 ml-1">
                {searchShortcut}
              </kbd>
            )}
          </button>
        </ActionTooltip>
      )}

      {/* 2. Ask AI Copilot Button */}
      {showAi && (
        <ActionTooltip label={aiLabel} shortcut={aiShortcut} side="bottom">
          <button
            type="button"
            onClick={onOpenAi}
            className="hidden md:flex items-center justify-center h-7 w-7 rounded-md border border-border/80 bg-muted/30 hover:bg-muted/60 text-primary hover:text-primary transition-all shadow-xs cursor-pointer mr-0.5"
            aria-label={aiLabel}
          >
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
          </button>
        </ActionTooltip>
      )}

      {/* 3. Desktop Help & Notifications Buttons */}
      {(showHelp || showNotifications) && (
        <div className="hidden md:flex items-center gap-0.5">
          {showHelp && (
            <ActionTooltip label={helpLabel} shortcut={helpShortcut} side="bottom">
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenHelp}
                className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={helpLabel}
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </Button>
            </ActionTooltip>
          )}

          {showNotifications && (
            <ActionTooltip
              label={notificationsLabel}
              shortcut={notificationsShortcut}
              side="bottom"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenNotifications}
                className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={notificationsLabel}
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>
            </ActionTooltip>
          )}
        </div>
      )}

      {/* 4. Extra Actions Slot */}
      {extraActions}

      {/* 5. Separator before UserNav */}
      <Separator
        orientation="vertical"
        className="hidden md:block mx-0.5 h-4 bg-border/60 shrink-0"
      />

      {/* 6. User Profile Avatar Nav */}
      {userNavSlot || children}
    </div>
  );
}
