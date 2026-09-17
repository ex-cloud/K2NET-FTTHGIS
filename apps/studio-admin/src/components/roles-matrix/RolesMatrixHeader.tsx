import React from "react";
import { Server, Users, LayoutGrid, List, Save, Loader2, Shield } from "lucide-react";
import { ActionTooltip, Button, Badge } from "@k2net/ui";
import { cn } from "@/lib/utils";
import { GovernanceHealthBanner } from "@/components/governance-health-banner";

interface RolesMatrixHeaderProps {
  context: "system" | "tenant";
  selectedScope: "SYSTEM" | "TENANT";
  setSelectedScope: (scope: "SYSTEM" | "TENANT") => void;
  viewMode: "table" | "grid";
  setViewMode: (mode: "table" | "grid") => void;
  hasAnyModifiedRoles: boolean;
  batchSaving: boolean;
  canUpdateRoles: boolean;
  handleSaveAll: () => void;
}

export function RolesMatrixHeader({
  context,
  selectedScope,
  setSelectedScope,
  viewMode,
  setViewMode,
  hasAnyModifiedRoles,
  batchSaving,
  canUpdateRoles,
  handleSaveAll,
}: RolesMatrixHeaderProps) {
  return (
    <div className="space-y-4">
      <GovernanceHealthBanner />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              Access Control & PBAC
            </Badge>
            <span className="text-xs text-muted-foreground">• Centralized Permission Mapping</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Matrix Hak Akses Platform
          </h2>
          <p className="text-xs text-muted-foreground">
            Konfigurasi pemetaan permission granular secara terpusat untuk peran System Plane dan template Tenant.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto shrink-0">
          {context === "system" && (
            <div className="flex bg-muted/40 p-1 rounded-lg border border-border/80 gap-1">
              <button
                type="button"
                onClick={() => setSelectedScope("SYSTEM")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                  selectedScope === "SYSTEM"
                    ? "bg-primary/15 text-primary border border-primary/30 shadow-xs"
                    : "text-muted-foreground hover:text-foreground border border-transparent hover:bg-muted/60"
                )}
              >
                <Server className="w-3.5 h-3.5" />
                <span>System Plane</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedScope("TENANT")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                  selectedScope === "TENANT"
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-xs"
                    : "text-muted-foreground hover:text-foreground border border-transparent hover:bg-muted/60"
                )}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Tenant Templates</span>
              </button>
            </div>
          )}

          <div className="flex bg-muted/40 p-1 rounded-lg border border-border/80 gap-1">
            <ActionTooltip label="Tampilan Tabel Matrix" shortcut="Alt+T">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1.5 rounded-md transition-all cursor-pointer",
                  viewMode === "table"
                    ? "bg-background text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </ActionTooltip>
            <ActionTooltip label="Tampilan Grid Card" shortcut="Alt+G">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-md transition-all cursor-pointer",
                  viewMode === "grid"
                    ? "bg-background text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </ActionTooltip>
          </div>

          <ActionTooltip
            label={hasAnyModifiedRoles ? "Simpan Seluruh Perubahan Matrix" : "Tidak Ada Perubahan"}
            shortcut="Ctrl+S"
          >
            <Button
              type="button"
              onClick={handleSaveAll}
              disabled={batchSaving || !hasAnyModifiedRoles || !canUpdateRoles}
              className={cn(
                "h-8 px-3.5 text-xs font-medium gap-1.5 rounded-lg transition-all",
                hasAnyModifiedRoles && canUpdateRoles
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm cursor-pointer"
                  : "bg-muted/60 text-muted-foreground cursor-not-allowed border border-border/50"
              )}
            >
              {batchSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Simpan Perubahan</span>
            </Button>
          </ActionTooltip>
        </div>
      </div>
    </div>
  );
}
