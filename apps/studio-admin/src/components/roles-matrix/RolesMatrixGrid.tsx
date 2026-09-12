import { Lock, ShieldCheck, Check, Loader2, Save } from "lucide-react";
import type { Role, Permission } from "./types";

interface RolesMatrixGridProps {
  roles: Role[];
  selectedScope: "SYSTEM" | "TENANT";
  filteredGroupedPermissions: Record<string, Permission[]>;
  editedRoles: Record<number, Set<number>>;
  saving: number | null;
  canEdit: boolean;
  isRoleModified: (roleId: number) => boolean;
  togglePermission: (roleId: number, permissionId: number) => void;
  onSaveRole: (role: Role) => void;
}

export function RolesMatrixGrid({
  roles,
  selectedScope,
  filteredGroupedPermissions,
  editedRoles,
  saving,
  canEdit,
  isRoleModified,
  togglePermission,
  onSaveRole,
}: RolesMatrixGridProps) {
  const moduleEntries = Object.entries(filteredGroupedPermissions);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {roles.map((role) => {
        const modified = isRoleModified(role.id);

        return (
          <div
            key={role.id}
            className={`flex flex-col justify-between p-5 rounded-xl border bg-card/60 backdrop-blur-md shadow-xl transition-all ${
              modified ? "border-amber-500/50 ring-1 ring-amber-500/20" : "border-border"
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground text-base">{role.displayName || role.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                      {role.code || (selectedScope === "SYSTEM" ? `SYS-${role.id}` : `TENT-${role.id}`)}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">({role.name})</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {role.isSystemRole ? (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase">
                      <Lock className="w-2.5 h-2.5" /> Template
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase">
                      <ShieldCheck className="w-2.5 h-2.5" /> Custom
                    </span>
                  )}
                </div>
              </div>

              {role.description && (
                <p className="text-xs text-muted-foreground mt-2.5 bg-muted/50 p-2 rounded border border-border">
                  {role.description}
                </p>
              )}

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase block">
                    Daftar Hak Akses:
                  </span>
                  {modified && (
                    <span className="text-[10px] text-amber-500 animate-pulse font-medium">Ada perubahan</span>
                  )}
                </div>

                <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2 text-xs divide-y divide-border custom-scrollbar">
                  {moduleEntries.map(([moduleName, perms]) => (
                    <div key={moduleName} className="pt-2 first:pt-0">
                      <span className="text-[9px] text-primary/80 font-semibold tracking-wide uppercase block mb-1">
                        📦 {moduleName}
                      </span>

                      {perms.map((perm) => {
                        const isChecked = editedRoles[role.id]?.has(perm.id);
                        return (
                          <div
                            key={perm.id}
                            onClick={() => canEdit && togglePermission(role.id, perm.id)}
                            className={`flex items-center justify-between py-1.5 px-1 rounded transition-colors ${
                              canEdit ? "cursor-pointer hover:bg-accent/40" : "cursor-default"
                            }`}
                          >
                            <div className="pr-2">
                              <span className="block font-medium text-foreground">
                                {perm.description || perm.code}
                              </span>
                              <span className="block text-[10px] text-muted-foreground font-mono">{perm.code}</span>
                            </div>
                            <div
                              className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-all ${
                                isChecked
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-border bg-muted"
                              } ${!canEdit ? "opacity-60" : ""}`}
                            >
                              {isChecked && <Check className="w-3 h-3 text-primary-foreground stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {modified && canEdit && (
              <div className="mt-4 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => onSaveRole(role)}
                  disabled={saving === role.id}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-all"
                >
                  {saving === role.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Simpan Perubahan Role Ini
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
