import React from "react";
import { X, ArrowLeft, Settings, Check, SlidersHorizontal } from "lucide-react";
import { Badge, ScrollArea, Button } from "@k2net/ui";
import { AiDrawerSettings, type PermTier } from "../ai-drawer-permissions";
import type { AgentAuthorizationData, PermissionCatalogData } from "@/lib/actions/gateways";

interface FullscreenRightPanelProps {
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
  rightPanelView: "summary" | "permissions";
  setRightPanelView: (view: "summary" | "permissions") => void;
  agentAuth: AgentAuthorizationData | null;
  activeModelLabel: string;
  permCatalog: PermissionCatalogData | null;
  permLoading: boolean;
  permSaving: boolean;
  permRevoking: boolean;
  permTier: PermTier;
  setPermTier: (t: PermTier) => void;
  permSelected: Set<string>;
  setPermSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
  permSearch: string;
  setPermSearch: (s: string) => void;
  permExpandedDomains: Set<string>;
  setPermExpandedDomains: React.Dispatch<React.SetStateAction<Set<string>>>;
  onSavePermissions: () => void;
  onRevokePermissions: () => void;
}

export function FullscreenRightPanel({
  rightPanelOpen,
  setRightPanelOpen,
  rightPanelView,
  setRightPanelView,
  agentAuth,
  activeModelLabel,
  permCatalog,
  permLoading,
  permSaving,
  permRevoking,
  permTier,
  setPermTier,
  permSelected,
  setPermSelected,
  permSearch,
  setPermSearch,
  permExpandedDomains,
  setPermExpandedDomains,
  onSavePermissions,
  onRevokePermissions,
}: FullscreenRightPanelProps) {
  if (!rightPanelOpen) return null;

  return (
    <aside className="w-88 flex-shrink-0 flex flex-col border-l border-border/60 bg-card/90 backdrop-blur-md animate-in slide-in-from-right-2 duration-200 overflow-hidden z-20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-background/50">
        <div className="flex items-center gap-2">
          {rightPanelView === "permissions" ? (
            <button
              type="button"
              onClick={() => setRightPanelView("summary")}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1 text-xs font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <>
              <Settings className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">K2 Agent Config</span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setRightPanelOpen(false)}
          className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {rightPanelView === "summary" && (
        <ScrollArea className="flex-1 p-4 space-y-4">
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-primary text-xs">
              <Check className="w-3.5 h-3.5" />
              <span>API Token Active</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Scope:{" "}
              <span className="font-semibold text-foreground">
                {agentAuth?.user_scope || "PLATFORM_INTERNAL"}
              </span>
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              Access Tier:{" "}
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                {agentAuth?.access_tier || "FULL"}
              </Badge>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-1.5">
            <p className="text-xs font-semibold text-foreground">Active Model Engine</p>
            <p className="text-xs text-primary font-mono font-semibold">{activeModelLabel}</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Model default dikonfigurasi terpusat oleh Super Admin untuk efisiensi kuota tenant.
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => setRightPanelView("permissions")}
              className="w-full text-xs font-semibold flex items-center justify-center gap-2 py-2 rounded-xl"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
              <span>Manage Permissions</span>
            </Button>
          </div>
        </ScrollArea>
      )}

      {rightPanelView === "permissions" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <AiDrawerSettings
            catalog={permCatalog}
            loading={permLoading}
            tier={permTier}
            selected={permSelected}
            search={permSearch}
            expandedDomains={permExpandedDomains}
            onSetTier={(t) => {
              setPermTier(t);
              if (t === "FULL" && permCatalog) {
                setPermSelected(
                  new Set(permCatalog.domains.flatMap((d) => d.permissions.map((p) => p.id)))
                );
              } else if (t === "READ_ONLY" && permCatalog) {
                setPermSelected(
                  new Set(
                    permCatalog.domains
                      .flatMap((d) => d.permissions.filter((p) => p.scope === "Read").map((p) => p.id))
                  )
                );
              }
            }}
            onTogglePermission={(id) => {
              const next = new Set(permSelected);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              setPermSelected(next);
              if (permTier !== "CUSTOM") setPermTier("CUSTOM");
            }}
            onToggleDomain={(id) => {
              const next = new Set(permExpandedDomains);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              setPermExpandedDomains(next);
            }}
            onSearchChange={setPermSearch}
            accessTier={
              permTier === "FULL"
                ? "Full access"
                : permTier === "READ_ONLY"
                ? "Read only"
                : "Custom"
            }
            saving={permSaving}
            revoking={permRevoking}
            onSave={onSavePermissions}
            onRevoke={onRevokePermissions}
          />
        </div>
      )}
    </aside>
  );
}
