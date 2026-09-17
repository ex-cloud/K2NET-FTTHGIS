import React from "react";
import { Check, Layers } from "lucide-react";
import { Badge } from "@k2net/ui";
import { cn } from "@/lib/utils";
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
    <div className="w-full rounded-xl border border-border bg-card overflow-hidden flex flex-col">
      <div className="max-h-[calc(100vh-320px)] overflow-auto custom-scrollbar relative">
        <table className="w-full border-collapse text-left text-xs border-separate border-spacing-0">
          <thead>
            <tr>
              {/* Sticky Top-Left Corner (Intersection) - Solid Opaque */}
              <th className="sticky left-0 top-0 z-40 bg-muted px-4 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-b border-r border-border min-w-[300px] max-w-[380px]">
                Modul &amp; Hak Akses
              </th>

              {/* Sticky Top Column Headers (Roles) - Solid Opaque */}
              {roles.map((role) => (
                <th
                  key={role.id}
                  className="sticky top-0 z-30 px-3 py-3 font-medium text-center min-w-[130px] max-w-[170px] border-b border-r border-border last:border-r-0 bg-muted"
                >
                  <span className="block text-xs font-semibold text-foreground truncate" title={role.displayName || role.name}>
                    {role.displayName || role.name}
                  </span>

                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <Badge
                      variant="outline"
                      className="text-[9px] font-mono font-bold px-1.5 py-0 h-4 border-primary/30 bg-primary/10 text-primary"
                    >
                      {role.code || (selectedScope === "SYSTEM" ? `SYS-${role.id}` : `TENT-${role.id}`)}
                    </Badge>

                    {isRoleModified(role.id) && (
                      <span
                        className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"
                        title="Ada perubahan belum disimpan"
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {moduleEntries.length === 0 ? (
              <tr>
                <td colSpan={roles.length + 1} className="p-12 text-center text-xs text-muted-foreground">
                  Tidak ditemukan hak akses yang sesuai filter.
                </td>
              </tr>
            ) : (
              moduleEntries.map(([moduleName, perms]) => (
                <React.Fragment key={moduleName}>
                  {/* Module Divider Row - Solid Opaque */}
                  <tr>
                    <td className="sticky left-0 z-20 bg-muted px-4 py-2 border-r border-b border-border text-primary font-mono text-[11px] font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        <span>{moduleName}</span>
                      </div>
                    </td>
                    <td colSpan={roles.length} className="bg-muted/50 px-4 py-2 border-b border-border" />
                  </tr>

                  {/* Permission Rows */}
                  {perms.map((perm) => (
                    <tr key={perm.id} className="hover:bg-muted/40 transition-colors group">
                      {/* Sticky Left Column (Permission Info) - Solid Opaque */}
                      <td className="sticky left-0 z-10 bg-card px-4 py-2.5 border-r border-b border-border group-hover:bg-muted/80 transition-colors">
                        <div className="font-medium text-foreground text-xs leading-snug">
                          {perm.description || perm.code}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          {perm.code}
                        </div>
                      </td>

                      {/* Checkbox Cells */}
                      {roles.map((role) => {
                        const isChecked = editedRoles[role.id]?.has(perm.id);

                        return (
                          <td key={role.id} className="p-2.5 text-center border-b border-border/60 border-r border-border/40 last:border-r-0">
                            <button
                              type="button"
                              disabled={!canEdit}
                              onClick={() => togglePermission(role.id, perm.id)}
                              className={cn(
                                "inline-flex items-center justify-center w-5 h-5 rounded-md border transition-all select-none",
                                isChecked
                                  ? "bg-primary border-primary text-primary-foreground shadow-xs"
                                  : "border-border bg-background hover:border-primary/50 text-transparent hover:bg-muted",
                                !canEdit ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                              )}
                              title={
                                canEdit
                                  ? isChecked
                                    ? `Cabut ${perm.code} dari ${role.name}`
                                    : `Berikan ${perm.code} ke ${role.name}`
                                  : "Akses Read-Only: Memerlukan izin roles.update"
                              }
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
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
    </div>
  );
}
