

import * as React from "react";
import { usePathname, useSearchParams, Link } from "@/lib/navigation-compat";
import {
  Users,
  ShieldCheck,
  History,
  UserCog,
  KeyRound,
  Fingerprint,
  FileText,
  ScrollText,
  ShieldAlert,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart3,
  MessageSquare,
  CreditCard,
  Map,
  Database,
  MessageCircle,
  Clock,
  Download,
  Network,
  Activity,
  LayoutDashboard,
  DatabaseZap,
  Globe,
  Server,
  Radio,
  Wrench,
  Sliders,
  MapPin,
  Palette,
  Mail,
  CalendarClock,
  ClipboardList,
  Inbox,
  UserX,
  CheckCircle,
  Plus,
  FolderKanban,
  Cpu,
  Building2,
  Sparkles,
  Bot,
  UploadCloud,
  FlaskConical,
  FileCode,
  UserCheck,
  Trash2,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@k2net/ui";
import { SYSTEM_SIDEBAR_NAVIGATION } from "@/config/system-sidebar-navigation";
import { LogsFilterSidebar } from "@/components/logs/logs-filter-sidebar";
import { useLogsFilter } from "@/components/logs/logs-filter-context";
import { useTaskStore } from "@/store/task-store";
import { useOrganizations } from "@/hooks/useOrganizations";
import { usePermissions } from "@/hooks/use-permissions";

const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  ShieldCheck,
  History,
  UserCog,
  KeyRound,
  Fingerprint,
  FileText,
  ScrollText,
  ShieldAlert,
  BarChart3,
  MessageSquare,
  CreditCard,
  Map,
  Database,
  MessageCircle,
  Clock,
  Download,
  Network,
  Activity,
  LayoutDashboard,
  DatabaseZap,
  Globe,
  Server,
  Radio,
  Wrench,
  Sliders,
  MapPin,
  Palette,
  Mail,
  CalendarClock,
  ClipboardList,
  Inbox,
  UserX,
  CheckCircle,
  Plus,
  FolderKanban,
  Cpu,
  Building2,
  Sparkles,
  Bot,
  UploadCloud,
  FlaskConical,
  FileCode,
  UserCheck,
  Trash2,
};

interface OrgCounts {
  active: number;
  trial: number;
  provisioning: number;
  suspended: number;
}

function getActiveSidebarKey(pathname: string | null): string | null {
  if (!pathname) return null;
  if (pathname.startsWith("/ai")) return "ai";
  if (pathname.startsWith("/tasks")) return "tasks";
  if (pathname.startsWith("/system")) return "system";

  const includes = ["users", "security", "gateways", "observability", "settings", "logs", "organizations"];
  for (const key of includes) {
    if (pathname.includes(`/${key}`)) return key;
  }
  return null;
}

function isSidebarItemActive(
  itemUrl: string,
  pathname: string | null,
  searchParams: { get: (key: string) => string | null; has: (key: string) => boolean }
): boolean {
  if (!pathname) return false;
  if (itemUrl.includes("?")) {
    const [itemPath, itemSearch] = itemUrl.split("?");
    const itemParams = new URLSearchParams(itemSearch);
    const pathMatch = pathname === itemPath || pathname === `/system${itemPath}`;
    return pathMatch && Array.from(itemParams.keys()).every((k) => searchParams.get(k) === itemParams.get(k));
  }

  const isProjectsRoute =
    itemUrl === "/tasks/projects" &&
    (pathname.startsWith("/tasks/projects") || pathname.startsWith("/system/tasks/projects"));
  const pathMatch = pathname === itemUrl || pathname === `/system${itemUrl}` || isProjectsRoute;

  const hasTaskFilter =
    searchParams.has("quick") ||
    searchParams.has("scope") ||
    searchParams.has("type") ||
    searchParams.has("project");

  const hasOrgFilter = searchParams.has("status") || searchParams.has("view");

  if (itemUrl === "/organizations") {
    return (pathname === "/organizations" || pathname === "/system/organizations") && !hasOrgFilter;
  }
  if (itemUrl === "/tasks") {
    return (pathname === "/tasks" || pathname === "/system/tasks") && !hasTaskFilter;
  }
  return pathMatch;
}

function getOrgBadgeCount(url: string, orgCounts: OrgCounts): number | null {
  if (url === "/organizations?status=ACTIVE") return orgCounts.active;
  if (url === "/organizations?status=TRIAL" && orgCounts.trial > 0) return orgCounts.trial;
  if (url === "/organizations?status=PROVISIONING" && orgCounts.provisioning > 0) return orgCounts.provisioning;
  if (url === "/organizations?status=SUSPENDED" && orgCounts.suspended > 0) return orgCounts.suspended;
  return null;
}

interface SidebarNavItemProps {
  item: {
    title: string;
    url: string;
    icon: string;
    requiredPermission?: string | string[];
  };
  pathname: string | null;
  searchParams: { get: (key: string) => string | null; has: (key: string) => boolean };
  unreadB2BCount: number;
  orgCounts: OrgCounts;
}

function SidebarNavItem({
  item,
  pathname,
  searchParams,
  unreadB2BCount,
  orgCounts,
}: SidebarNavItemProps) {
  const isActive = isSidebarItemActive(item.url, pathname, searchParams);
  const Icon = ICON_MAP[item.icon] || FileText;
  const isB2BLink = item.url.includes("scope=TENANT_TO_PLATFORM");
  const orgBadgeCount = getOrgBadgeCount(item.url, orgCounts);

  const orgBadgeStyle = item.url.includes("status=ACTIVE")
    ? "bg-primary/10 text-primary border border-primary/20"
    : item.url.includes("status=SUSPENDED")
    ? "bg-destructive/10 text-destructive border border-destructive/20"
    : "bg-muted text-muted-foreground border border-border";

  return (
    <Link
      href={item.url}
      className={`px-2.5 py-1.5 text-xs rounded-md transition-all flex items-center gap-2.5 ${
        isActive
          ? "bg-sidebar-accent text-foreground font-semibold border border-border/40"
          : "text-foreground/85 dark:text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium"
      }`}
    >
      <Icon className={`w-3.5 h-3.5 ${isActive ? "text-foreground" : "text-foreground/70 dark:text-muted-foreground"}`} />
      <span className="truncate flex-1">{item.title}</span>

      {isB2BLink && unreadB2BCount > 0 && (
        <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] h-4 flex items-center justify-center animate-pulse shrink-0">
          {unreadB2BCount}
        </span>
      )}

      {orgBadgeCount !== null && (
        <span className={`ml-auto text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${orgBadgeStyle}`}>
          {orgBadgeCount}
        </span>
      )}
    </Link>
  );
}

export function SystemSecondarySidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const unreadB2BCount = useTaskStore((s) => s.unreadB2BCount);

  const { isSidebarCollapsed: ctxCollapsed, setIsSidebarCollapsed: ctxSetCollapsed } =
    useLogsFilter();

  const { organizations } = useOrganizations();
  const { canAccess } = usePermissions();

  const orgCounts = React.useMemo<OrgCounts>(() => {
    if (!organizations) return { active: 0, trial: 0, provisioning: 0, suspended: 0 };
    return {
      active: organizations.filter((o) => o.status === "ACTIVE").length,
      trial: organizations.filter((o) => o.status === "TRIAL").length,
      provisioning: organizations.filter((o) => o.status === "PROVISIONING").length,
      suspended: organizations.filter((o) => o.status === "SUSPENDED" || o.status === "OVERDUE").length,
    };
  }, [organizations]);

  const activeKey = getActiveSidebarKey(pathname);
  if (!activeKey) return null;

  const isLogsPage = activeKey === "logs";
  const currentConfig = SYSTEM_SIDEBAR_NAVIGATION[activeKey];
  if (!currentConfig && !isLogsPage) return null;

  const effectiveCollapsed = isLogsPage ? ctxCollapsed : isCollapsed;
  const handleCollapse = isLogsPage
    ? () => ctxSetCollapsed((prev) => !prev)
    : () => setIsCollapsed(!isCollapsed);

  return (
    <div className="relative h-full flex shrink-0">
      <aside
        className={`${effectiveCollapsed ? "w-0 border-r-0" : "w-[240px] border-r"} transition-all duration-300 ease-in-out shrink-0 border-border bg-sidebar h-full hidden md:flex flex-col overflow-hidden`}
      >
        {isLogsPage ? (
          <LogsFilterSidebar onCollapse={handleCollapse} />
        ) : (
          <>
            <div className="py-5 border-b border-border/40 shrink-0 flex items-center justify-between px-5 min-w-[240px]">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                {currentConfig?.title}
              </h3>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6 min-w-[240px]">
              {currentConfig?.sections.map((section, sIdx) => {
                const visibleItems = section.items.filter((item) =>
                  canAccess(item.requiredPermission)
                );
                if (visibleItems.length === 0) return null;

                return (
                  <Collapsible key={sIdx} defaultOpen className="w-full">
                    <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 text-[10px] font-bold text-foreground/70 dark:text-muted-foreground/60 uppercase tracking-widest hover:text-foreground group">
                      <span>{section.title}</span>
                      <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-0.5 mt-2">
                      {visibleItems.map((item, idx) => (
                        <SidebarNavItem
                          key={idx}
                          item={item}
                          pathname={pathname}
                          searchParams={searchParams}
                          unreadB2BCount={unreadB2BCount}
                          orgCounts={orgCounts}
                        />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </>
        )}
      </aside>

      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="absolute top-4 left-3 z-40 p-1.5 rounded-md bg-muted border border-border shadow-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-300"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
