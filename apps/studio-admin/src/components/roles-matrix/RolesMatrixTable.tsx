import React from "react";
import { Lock, ShieldCheck, Check } from "lucide-react";
import type { Role, Permission } from "./types";

interface RolesMatrixTableProps {
  roles: Role[];
  selectedScope: "SYSTEM" | "TENANT";
  filteredGroupedPermissions: Record<string, Permission[]>;
  editedRoles: Record<number, Set<number>>;
  isRoleModified: (roleId: number) => boolean;
  togglePermission: (roleId: number, permissionId: number) => void;
  canEdit: boolean;
}

export function RolesMatrixTable({
  roles,
  selectedScope,
  filteredGroupedPermissions,
  editedRoles,
  isRoleModified,
  togglePermission,
  canEdit,
}: RolesMatrixTableProps) {
  const moduleEntries = Object.entries(filteredGroupedPermissions);

  return (
    <div className="w-full overflow-auto rounded-xl border border-border bg-card/50 backdrop-blur-md shadow-2xl max-h-[calc(100vh-320px)] custom-scrollbar relative">
      <table className="w-full border-collapse text-left text-sm border-separate border-spacing-0">
        <thead>
          <tr className="border-b border-border">
            <th className="sticky left-0 top-0 z-40 bg-card p-4 font-medium text-muted-foreground border-r border-b border-border min-w-[280px] shadow-[2px_2px_5px_rgba(0,0,0,0.08)]">
              Modul &amp; Hak Akses
            </th>
            {roles.map((role) => (
              <th
                key={role.id}
                className="sticky top-0 z-30 p-4 font-medium text-center min-w-[150px] border-b border-border bg-card shadow-[0_2px_3px_rgba(0,0,0,0.05)]"
              >
                <span className="block text-foreground font-semibold">{role.displayName || role.name}</span>
                <span className="block text-[10px] font-mono font-bold text-primary mt-1 bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 inline-block">
                  {role.code || (selectedScope === "SYSTEM" ? `SYS-${role.id}` : `TENT-${role.id}`)}
                </span>
                <span className="block text-[10px] text-muted-foreground font-mono mt-1">({role.name})</span>

                <div className="mt-1 flex items-center justify-center gap-1">
                  {role.isSystemRole ? (
                    <span className="inline-flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase">
                      <Lock className="w-2 h-2" />
                      Template
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase">
                      <ShieldCheck className="w-2 h-2" />
                      Custom
                    </span>
                  )}

                  {isRoleModified(role.id) && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"
                      title="Ada perubahan belum disimpan"
                    />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {moduleEntries.length === 0 ? (
            <tr>
              <td colSpan={roles.length + 1} className="p-8 text-center text-xs text-muted-foreground">
                Tidak ditemukan hak akses yang sesuai filter.
              </td>
            </tr>
          ) : (
            moduleEntries.map(([moduleName, perms]) => (
              <React.Fragment key={moduleName}>
                <tr className="bg-muted/30 font-medium text-xs tracking-wider text-muted-foreground">
                  <td className="sticky left-0 z-20 bg-muted/80 px-4 py-2 text-primary font-mono uppercase border-r border-border">
                    📦 {moduleName}
                  </td>
                  <td colSpan={roles.length} className="px-4 py-2 bg-muted/40 border-y border-border" />
                </tr>

                {perms.map((perm) => (
                  <tr key={perm.id} className="hover:bg-accent/40 transition-colors group">
                    <td className="sticky left-0 z-10 bg-card p-4 border-r border-border shadow-[2px_0_5px_rgba(0,0,0,0.1)] group-hover:bg-accent transition-colors">
                      <div className="font-medium text-foreground">
                        {perm.description || perm.code}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        {perm.code}
                      </div>
                    </td>

                    {roles.map((role) => {
                      const isChecked = editedRoles[role.id]?.has(perm.id);

                      return (
                        <td key={role.id} className="p-4 text-center">
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => togglePermission(role.id, perm.id)}
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-md border transition-all ${
                              isChecked
                                ? "bg-primary border-primary text-primary-foreground shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                : "border-border bg-card/40 hover:border-primary/50 text-transparent"
                            } ${!canEdit ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
