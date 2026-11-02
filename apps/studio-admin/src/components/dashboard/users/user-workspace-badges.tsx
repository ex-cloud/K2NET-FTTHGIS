import React from "react";
import { Building2, ChevronDown, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import {
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@k2net/ui";
import type { User, UserMembership } from "@/types/user";
import { Link } from "@/lib/navigation-compat";
import { cn } from "@/lib/utils";
import { useTranslation } from "@k2net/i18n";

interface UserWorkspaceBadgesProps {
  user: User;
}

export function UserWorkspaceBadges({ user }: UserWorkspaceBadgesProps) {
  const { t } = useTranslation();
  const memberships: UserMembership[] = user.memberships || [];

  // Case 1: No explicit multi-tenant memberships returned, fallback to primary org
  if (memberships.length === 0) {
    return (
      <div className="text-[12px] text-muted-foreground flex items-center gap-1.5">
        <Building2 className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
        {user.organizationId ? (
          <Link
            href={`/org/${user.organizationId}`}
            className="hover:text-primary hover:underline font-medium transition-colors text-foreground"
          >
            {user.organizationName}
          </Link>
        ) : (
          <span>{user.organizationName || "System"}</span>
        )}
      </div>
    );
  }

  // Case 2: Exactly 1 workspace membership
  if (memberships.length === 1) {
    const m = memberships[0];
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
          <Link
            href={`/org/${m.organizationId}`}
            className="text-[12px] hover:text-primary hover:underline font-medium transition-colors text-foreground truncate max-w-[140px]"
            title={m.organizationName}
          >
            {m.organizationName}
          </Link>
        </div>

        <Badge
          variant="outline"
          className={cn(
            "text-[9px] px-1 py-0 h-4 uppercase font-mono tracking-wider shrink-0",
            m.status === "ACTIVE" && "bg-primary/10 text-primary border-primary/20",
            m.status === "INVITED" && "bg-amber-500/10 text-amber-500 border-amber-500/20",
            m.status === "SUSPENDED" && "bg-destructive/10 text-destructive border-destructive/20"
          )}
        >
          {m.roleName}
        </Badge>
      </div>
    );
  }

  // Case 3: Multi-tenant member (> 1 workspaces)
  const primary = memberships.find((m) => m.isDefault) || memberships[0];
  const moreCount = memberships.length - 1;

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-1.5 min-w-0">
        <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
        <Link
          href={`/org/${primary.organizationId}`}
          className="text-[12px] hover:text-primary hover:underline font-medium transition-colors text-foreground truncate max-w-[130px]"
          title={primary.organizationName}
        >
          {primary.organizationName}
        </Link>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-0.5 text-[10px] font-medium h-4 px-1.5 rounded-full bg-accent/60 hover:bg-accent text-accent-foreground border border-border/80 cursor-pointer transition-colors shrink-0"
            title={t("users.workspace_total_count", { count: memberships.length })}
          >
            <span>+{moreCount}</span>
            <ChevronDown className="w-2.5 h-2.5 opacity-70" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-72 p-2 bg-card border border-border shadow-xl rounded-lg space-y-1 z-50"
        >
          <div className="px-2 py-1.5 flex items-center justify-between border-b border-border/50">
            <span className="text-xs font-semibold text-foreground">
              {t("users.workspace_all_header")}
            </span>
            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 h-4">
              {memberships.length}
            </Badge>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pt-1 pr-0.5">
            {memberships.map((m) => {
              const isActive = m.status === "ACTIVE";
              const isInvited = m.status === "INVITED";
              const isSuspended = m.status === "SUSPENDED";

              return (
                <div
                  key={m.organizationId}
                  className="rounded-md border border-border/50 bg-background/50 hover:bg-accent/40 p-2 space-y-1.5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/org/${m.organizationId}`}
                      className="text-xs font-medium text-foreground hover:text-primary hover:underline truncate max-w-[160px]"
                    >
                      {m.organizationName}
                    </Link>
                    {m.isDefault && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 bg-primary/10 text-primary border-primary/20">
                        {t("users.workspace_primary")}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-mono text-[10px] text-muted-foreground/80">
                      {m.organizationSlug}.kdua.net
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 uppercase font-mono">
                      {m.roleName}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {isActive && <CheckCircle2 className="w-3 h-3 text-primary" />}
                      {isInvited && <Clock className="w-3 h-3 text-amber-500" />}
                      {isSuspended && <AlertTriangle className="w-3 h-3 text-destructive" />}
                      <span className={cn(
                        isActive && "text-primary font-medium",
                        isInvited && "text-amber-500 font-medium",
                        isSuspended && "text-destructive font-medium"
                      )}>
                        {isActive && t("users.workspace_status_active")}
                        {isInvited && t("users.workspace_status_invited")}
                        {isSuspended && t("users.workspace_status_suspended")}
                      </span>
                    </div>

                    {m.joinedAt && (
                      <span className="text-[10px] text-muted-foreground/70 font-mono">
                        {new Date(m.joinedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
