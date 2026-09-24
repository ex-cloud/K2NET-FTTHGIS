import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from "@k2net/ui";
import { Sparkles, HelpCircle, ArrowLeft } from "lucide-react";
import { useSidebarMode } from "../sidebar-mode-context";
import { TenantSidebarControl } from "../TenantSidebarControl";
import { getProjectNavItems, type NavItem } from "../../config/tenant-sidebar-navigation";

interface TenantProjectSidebarProps {
  projectId: string;
  onOpenAi: () => void;
  onOpenHelp: () => void;
}

export function TenantProjectSidebar({
  projectId,
  onOpenAi,
  onOpenHelp,
}: TenantProjectSidebarProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { sidebarMode } = useSidebarMode();
  const [isHovering, setIsHovering] = React.useState(false);

  const isExpanded =
    sidebarMode === "expanded" || (sidebarMode === "hover" && isHovering);
  const isFloating = sidebarMode === "hover";

  const navItems = React.useMemo(() => getProjectNavItems(projectId), [projectId]);

  const checkIsActive = (item: NavItem) => {
    if (item.id === "overview") {
      return currentPath === `/project/${projectId}/overview` || currentPath === `/project/${projectId}`;
    }
    return currentPath.includes(`/project/${projectId}/${item.id}`);
  };

  const renderNavButton = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = checkIsActive(item);

    const button = (
      <div
        className={cn(
          "flex items-center rounded-lg h-8 cursor-pointer justify-start w-full pl-[9px] pr-2.5 transition-colors duration-200 group relative select-none",
          isActive
            ? "text-sidebar-foreground bg-sidebar-accent font-semibold shadow-xs"
            : "text-sidebar-foreground/90 dark:text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent font-medium"
        )}
      >
        <div className="relative flex items-center justify-center shrink-0">
          <Icon
            className={cn(
              "h-4 w-4",
              isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )}
          />
        </div>
        <span
          className={cn(
            "text-sm whitespace-nowrap transition-all duration-300 flex-1 truncate",
            isActive ? "font-semibold text-sidebar-foreground" : "font-medium",
            isExpanded ? "opacity-100 w-auto ml-3" : "opacity-0 w-0 overflow-hidden ml-0"
          )}
        >
          {item.title}
        </span>
      </div>
    );

    const wrapped = (
      <Link key={item.id} to={item.href}>
        {button}
      </Link>
    );

    if (!isExpanded) {
      return (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>{wrapped}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <React.Fragment key={item.id}>{wrapped}</React.Fragment>;
  };

  return (
    <>
      {isFloating && (
        <div className="hidden md:block w-[50px] shrink-0 h-full" />
      )}

      <aside
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={
          isFloating
            ? {
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                zIndex: 50,
                boxShadow: "none",
              }
            : undefined
        }
        className={`hidden md:flex border-r border-border/40 flex-col bg-sidebar shrink-0 h-full transition-all duration-300 ease-in-out overflow-hidden ${
          isFloating ? "" : "z-50"
        } ${isExpanded ? "w-[200px]" : "w-[50px]"}`}
      >
        <div className="flex flex-col h-full py-3">
          <TooltipProvider delayDuration={0}>
            {/* Top Back to Org Level Button */}
            <div className="px-2 mb-2 pb-2 border-b border-border/40">
              <Link to="/projects">
                <div
                  className={cn(
                    "flex items-center rounded-lg h-8 cursor-pointer justify-start w-full pl-[9px] pr-2.5 transition-colors duration-200 group relative text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium select-none"
                  )}
                >
                  <div className="relative flex items-center justify-center shrink-0">
                    <ArrowLeft className="h-4 w-4" />
                  </div>
                  <span
                    className={cn(
                      "text-sm whitespace-nowrap transition-all duration-300 flex-1 truncate",
                      isExpanded ? "opacity-100 w-auto ml-3" : "opacity-0 w-0 overflow-hidden ml-0"
                    )}
                  >
                    Semua Proyek
                  </span>
                </div>
              </Link>
            </div>

            {/* Primary Project Navigation Items */}
            <nav className="flex flex-col gap-1 px-2">
              <div className="flex flex-col gap-1">
                {navItems.map(renderNavButton)}
              </div>
            </nav>

            <div className="flex-1" />

            {/* Bottom Actions: AI & SOP */}
            <nav className="flex flex-col gap-1 px-2 border-t border-border/40 pt-2 mb-2">
              <div
                onClick={onOpenAi}
                className={cn(
                  "flex items-center rounded-lg h-8 cursor-pointer justify-start w-full pl-[9px] pr-2.5 transition-colors duration-200 group relative text-sidebar-foreground/85 hover:text-sidebar-foreground hover:bg-sidebar-accent font-medium select-none"
                )}
              >
                <div className="relative flex items-center justify-center shrink-0 text-amber-500">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span
                  className={cn(
                    "text-sm whitespace-nowrap transition-all duration-300 flex-1 truncate",
                    isExpanded ? "opacity-100 w-auto ml-3 font-semibold text-amber-600 dark:text-amber-400" : "opacity-0 w-0 overflow-hidden ml-0"
                  )}
                >
                  K2 AI Assistant
                </span>
              </div>

              <div
                onClick={onOpenHelp}
                className={cn(
                  "flex items-center rounded-lg h-8 cursor-pointer justify-start w-full pl-[9px] pr-2.5 transition-colors duration-200 group relative text-sidebar-foreground/85 hover:text-sidebar-foreground hover:bg-sidebar-accent font-medium select-none"
                )}
              >
                <div className="relative flex items-center justify-center shrink-0 text-muted-foreground group-hover:text-foreground">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <span
                  className={cn(
                    "text-sm whitespace-nowrap transition-all duration-300 flex-1 truncate",
                    isExpanded ? "opacity-100 w-auto ml-3" : "opacity-0 w-0 overflow-hidden ml-0"
                  )}
                >
                  Panduan & SOP
                </span>
              </div>
            </nav>
          </TooltipProvider>

          {/* Bottom Sidebar Collapse Control */}
          <div className="flex flex-col gap-2 px-2">
            <div className="flex items-center rounded-lg h-8 w-full pl-[5px] pr-2.5 justify-start">
              <TenantSidebarControl isExpanded={isExpanded} />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
