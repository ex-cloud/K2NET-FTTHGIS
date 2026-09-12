import { Server, Users, LayoutGrid, List, Save, Loader2 } from "lucide-react";
import { ActionTooltip } from "@k2net/ui";
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
    <>
      <GovernanceHealthBanner />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-border">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Matrix Hak Akses Platform
          </h2>
          <p className="text-sm text-muted-foreground">
            Konfigurasi pemetaan permission granular secara terpusat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
          {context === "system" && (
            <div className="flex bg-muted p-1 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setSelectedScope("SYSTEM")}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  selectedScope === "SYSTEM"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                System Plane
              </button>
              <button
                type="button"
                onClick={() => setSelectedScope("TENANT")}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  selectedScope === "TENANT"
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Tenant Templates
              </button>
            </div>
          )}

          <div className="flex bg-muted p-1 rounded-lg border border-border">
            <ActionTooltip label="Tampilan Tabel Matrix" shortcut="Alt+T">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "table"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </ActionTooltip>
            <ActionTooltip label="Tampilan Grid Card" shortcut="Alt+G">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "grid"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </ActionTooltip>
          </div>

          <ActionTooltip
            label={hasAnyModifiedRoles ? "Simpan Seluruh Perubahan Matrix" : "Tidak Ada Perubahan"}
            shortcut="Ctrl+S"
          >
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={batchSaving || !hasAnyModifiedRoles || !canUpdateRoles}
              className={`flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-lg transition-all shadow-lg ${
                hasAnyModifiedRoles && canUpdateRoles
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                  : "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
              }`}
            >
              {batchSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Simpan Perubahan
            </button>
          </ActionTooltip>
        </div>
      </div>
    </>
  );
}
