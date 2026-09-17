import * as React from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  Users,
  ShieldAlert,
  Sliders,
  Globe,
  ShieldCheck,
  Terminal,
  History,
  UserCog,
  KeyRound,
  Fingerprint,
  FileText,
  Sparkles,
  Server,
  Radio,
  MapPin,
  Palette,
  Mail,
  ClipboardList,
  Trash2,
  LayoutDashboard,
  CreditCard,
  MessageSquare,
  Cpu,
  BarChart3,
  MessageCircle,
  Database,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS, ADMIN_BOTTOM_NAV_ITEMS, checkIsActive } from "../admin-sidebar";
import { SYSTEM_SIDEBAR_NAVIGATION } from "@/config/system-sidebar-navigation";
import { getLogoUrl } from "@/lib/domain";

const ICON_MAP: Record<string, React.ElementType> = {
  Building2,
  CheckCircle: CheckCircle2,
  Clock,
  UserX: Users,
  ShieldAlert,
  Sliders,
  Network: Globe,
  Globe,
  ShieldCheck,
  Terminal,
  History,
  Users,
  UserCog,
  KeyRound,
  Fingerprint,
  FileText,
  Activity: Sparkles,
  Server,
  Radio,
  MapPin,
  Palette,
  Mail,
  CalendarClock: Clock,
  ClipboardList,
  Trash2,
  LayoutDashboard,
  CreditCard,
  MessageSquare,
  Sparkles,
  Cpu,
  BarChart3,
  MessageCircle,
  Database,
  Map: MapPin,
  Download: ClipboardList,
  ScrollText: FileText,
  FolderKanban: ClipboardList,
  UserCheck: Users,
  DatabaseZap: Database,
};

export function getSecondaryKey(href: string): string | null {
  if (href.startsWith("/observability")) return "observability";
  if (href.startsWith("/security")) return "security";
  if (href.startsWith("/gateways")) return "gateways";
  if (href.startsWith("/settings")) return "settings";
  if (href.startsWith("/tasks")) return "tasks";
  if (href.startsWith("/organizations")) return "organizations";
  if (href.startsWith("/users")) return "users";
  if (href.startsWith("/logs")) return "logs";
  if (href.startsWith("/ai")) return "ai";
  if (href.startsWith("/system/trash")) return "system";
  return null;
}

interface MobileMenu2TierProps {
  activeSecondaryKey: string | null;
  onSelectSecondaryKey: (key: string | null) => void;
  onNavigate: (url: string) => void;
  pathname: string;
  appName: string;
  logoUrl?: string;
  unreadB2BCount: number;
  canAccess: (permission?: string | string[]) => boolean;
}

export function MobileMenu2Tier({
  activeSecondaryKey,
  onSelectSecondaryKey,
  onNavigate,
  pathname,
  appName,
  logoUrl,
  unreadB2BCount,
  canAccess,
}: MobileMenu2TierProps) {
  const activeSecondaryConfig = activeSecondaryKey ? SYSTEM_SIDEBAR_NAVIGATION[activeSecondaryKey] : null;

  if (activeSecondaryConfig) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden animate-in fade-in-0 duration-200 slide-in-from-right-3">
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60 bg-muted/20 shrink-0">
          <button
            type="button"
            onClick={() => onSelectSecondaryKey(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer group py-0.5"
          >
            <ChevronLeft className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="truncate">{activeSecondaryConfig.title}</span>
          </button>
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Sub-menu</span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {activeSecondaryConfig.sections.map((section) => {
            if (!canAccess(section.requiredPermission)) return null;

            return (
              <div key={section.title} className="space-y-1">
                <p className="px-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 font-semibold">
                  {section.title}
                </p>

                <div className="space-y-0.5">
                  {section.items.map((subItem) => {
                    if (!canAccess(subItem.requiredPermission)) return null;
                    const SubIcon = ICON_MAP[subItem.icon] || LayoutDashboard;
                    const isSubActive =
                      pathname === subItem.url ||
                      (subItem.url !== "/tasks" &&
                        subItem.url !== "/observability" &&
                        pathname.startsWith(subItem.url));

                    return (
                      <button
                        key={subItem.title + subItem.url}
                        type="button"
                        onClick={() => onNavigate(subItem.url)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors text-left cursor-pointer",
                          isSubActive
                            ? "bg-primary/10 text-primary font-semibold border border-primary/20 shadow-xs"
                            : "text-foreground/80 hover:bg-muted/60 hover:text-foreground"
                        )}
                      >
                        <SubIcon className="size-3.5 shrink-0" />
                        <span className="truncate">{subItem.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-border/60 bg-muted/20 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => onSelectSecondaryKey(null)}
            className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
          >
            <ChevronLeft className="size-3" /> Kembali ke Menu Utama
          </button>
          <span className="text-[10px] text-muted-foreground font-mono">
            {activeSecondaryConfig.title}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden animate-in fade-in-0 duration-200 slide-in-from-left-3">
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border/60 bg-muted/20 shrink-0">
        <div className="size-5 rounded bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shrink-0">
          {logoUrl ? (
            <img src={getLogoUrl(logoUrl)} alt="Logo" className="size-4 object-contain" />
          ) : (
            <ShieldCheck className="size-3 text-primary" />
          )}
        </div>
        <span className="text-xs font-bold text-foreground truncate">{appName}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Core Platform */}
        <div className="space-y-1">
          <p className="px-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
            Core Platform
          </p>

          {ADMIN_NAV_ITEMS.map((item) => {
            if (!canAccess(item.requiredPermission)) return null;
            const Icon = item.icon;
            const isActive = checkIsActive(item.href, pathname);
            const key = getSecondaryKey(item.href);
            const hasSecondary = key && SYSTEM_SIDEBAR_NAVIGATION[key]?.sections.length > 0;

            if (hasSecondary) {
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => onSelectSecondaryKey(key)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer text-left group",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-foreground/85 hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                    <span className="truncate">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.href === "/tasks" && unreadB2BCount > 0 && (
                      <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        {unreadB2BCount}
                      </span>
                    )}
                    <ChevronRight className="size-3.5 text-muted-foreground/60 group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              );
            }

            return (
              <button
                key={item.title}
                type="button"
                onClick={() => onNavigate(item.href)}
                className={cn(
                  "w-full flex items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium transition-colors text-left cursor-pointer",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-foreground/85 hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* System Settings & Management */}
        <div className="space-y-1 pt-2 border-t border-border/40">
          <p className="px-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
            Configuration &amp; System
          </p>

          {ADMIN_BOTTOM_NAV_ITEMS.map((item) => {
            if (!canAccess(item.requiredPermission)) return null;
            const Icon = item.icon;
            const isActive = checkIsActive(item.href, pathname);
            const key = getSecondaryKey(item.href);
            const hasSecondary = key && SYSTEM_SIDEBAR_NAVIGATION[key]?.sections.length > 0;

            if (hasSecondary) {
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => onSelectSecondaryKey(key)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer text-left group",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-foreground/85 hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                    <span className="truncate">{item.title}</span>
                  </div>

                  <ChevronRight className="size-3.5 text-muted-foreground/60 group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
              );
            }

            return (
              <button
                key={item.title}
                type="button"
                onClick={() => onNavigate(item.href)}
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors text-left cursor-pointer",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-foreground/85 hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
