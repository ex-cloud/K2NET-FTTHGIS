import React from "react";
import { Building2, ArrowRight, ShieldCheck, LogOut, Loader2, Check } from "lucide-react";
import { Button } from "../button";
import { Badge } from "../badge";
import { cn } from "../../utils";

export interface UserWorkspaceItem {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  canonicalDomain: string;
  roleName: string;
  status: string;
  isDefault?: boolean;
  isActiveContext?: boolean;
}

export interface AuthWorkspaceChooserProps {
  workspaces: UserWorkspaceItem[];
  userEmail?: string;
  onSelectWorkspace: (workspace: UserWorkspaceItem) => void;
  onSignOut?: () => void;
  loadingOrgId?: string;
  copy?: {
    title?: string;
    description?: string;
    enterWorkspace?: string;
    roleLabel?: string;
    activeBadge?: string;
    signOut?: string;
  };
}

export function AuthWorkspaceChooser({
  workspaces,
  userEmail,
  onSelectWorkspace,
  onSignOut,
  loadingOrgId,
  copy = {},
}: AuthWorkspaceChooserProps) {
  const title = copy.title || "Select ISP Workspace";
  const description =
    copy.description ||
    (userEmail
      ? `Your identity (${userEmail}) has access to multiple tenant environments. Choose a workspace to proceed:`
      : "Choose an organization workspace to enter:");

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="space-y-1 text-center sm:text-left">
        <h3 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
          <Building2 className="size-4 text-primary" />
          <span>{title}</span>
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {/* List of Workspaces */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {workspaces.map((ws) => {
          const isLoading = loadingOrgId === ws.organizationId;
          return (
            <div
              key={ws.organizationId}
              onClick={() => !isLoading && onSelectWorkspace(ws)}
              className={cn(
                "group relative flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer shadow-2xs",
                ws.isActiveContext
                  ? "border-primary/50 bg-primary/5 hover:bg-primary/10"
                  : "border-border/70 bg-background/50 hover:bg-accent/40 hover:border-primary/40"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                  <Building2 className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground truncate max-w-[180px] sm:max-w-[220px]">
                      {ws.organizationName}
                    </span>
                    {ws.isActiveContext && (
                      <Badge
                        variant="outline"
                        className="h-4 px-1 text-[9px] font-mono border-primary/40 bg-primary/15 text-primary gap-0.5"
                      >
                        <Check className="size-2.5" />
                        <span>{copy.activeBadge || "Current"}</span>
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono mt-0.5">
                    <span className="truncate">{ws.canonicalDomain}</span>
                    <span>•</span>
                    <span className="capitalize text-primary/90 flex items-center gap-0.5">
                      <ShieldCheck className="size-2.5" />
                      {ws.roleName}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                size="xs"
                variant={ws.isActiveContext ? "default" : "outline"}
                className="h-6 px-2 text-[11px] gap-1 shrink-0 font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <>
                    <span>{copy.enterWorkspace || "Enter"}</span>
                    <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {onSignOut && (
        <div className="pt-2 border-t border-border/50 flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onSignOut}
            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 font-medium"
          >
            <LogOut className="size-3.5" />
            <span>{copy.signOut || "Sign out"}</span>
          </Button>
        </div>
      )}
    </div>
  );
}

