"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Check, Loader2, Save, LayoutGrid, List, Lock, ShieldCheck, AlertTriangle, Server, Users } from "lucide-react";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/hooks/use-permissions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  ActionTooltip,
} from "@k2net/ui";

type Permission = {
  id: number;
  code: string;
  description: string;
  module: string;
};

type Role = {
  id: number;
  name: string;
  code?: string;
  displayName: string;
  description: string;
  isSystemRole: boolean;
  permissions: Permission[];
  scope?: "SYSTEM" | "TENANT";
};

export function RolesMatrixUI({ context }: { context: "system" | "tenant" }) {
  const { data: session } = useSession();
  const { canAccess } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  
  // Scope filter: SYSTEM (Control Plane) or TENANT (Data Plane)
  const [selectedScope, setSelectedScope] = useState<"SYSTEM" | "TENANT">(
    context === "system" ? "SYSTEM" : "TENANT"
  );

  // States for Custom Confirmation Dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingRoleToSave, setPendingRoleToSave] = useState<Role | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [batchSaving, setBatchSaving] = useState(false);

  // Track modified permissions locally before saving
  const [editedRoles, setEditedRoles] = useState<Record<number, Set<number>>>({});
  
  // Keep track of the original permissions to identify changes
  const [originalRoles, setOriginalRoles] = useState<Record<number, Set<number>>>({});

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      const baseUrl = getBackendBaseUrl();
      
      const [rolesRes, permsRes] = await Promise.all([
        httpClient(`${baseUrl}/roles?scope=${selectedScope}`, { token: session.accessToken }),
        httpClient(`${baseUrl}/roles/permissions?scope=${selectedScope}`, { token: session.accessToken }),
      ]);
      
      if (!rolesRes.ok || !permsRes.ok) throw new Error("Failed to fetch data");

      let rolesData = await rolesRes.json();
      const permsData = await permsRes.json();
      
      // EXTRA SAFETY: Filter out super_admin for non-system users even if backend accidentally returns it
      // Fix: Get roles array correctly from session.user.roles instead of session.roles
      const userRoles = session.user?.roles || [];
      const isSystemAdmin = userRoles.includes("super_admin");
      
      if (!isSystemAdmin) {
        rolesData = rolesData.filter((r: Role) => r.name.toLowerCase() !== "super_admin");
      }
      
      setRoles(rolesData);
      setPermissions(permsData);
      
      // Initialize states
      const initialEdits: Record<number, Set<number>> = {};
      const initialOriginals: Record<number, Set<number>> = {};
      rolesData.forEach((role: Role) => {
        const permIds = role.permissions?.map(p => p.id) || [];
        initialEdits[role.id] = new Set(permIds);
        initialOriginals[role.id] = new Set(permIds);
      });
      setEditedRoles(initialEdits);
      setOriginalRoles(initialOriginals);
      
    } catch (error) {
      console.error("Failed to load roles and permissions:", error);
      toast.error("Failed to load roles data.");
    } finally {
      setLoading(false);
    }
  }, [session, selectedScope]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const togglePermission = (roleId: number, permissionId: number) => {
    setEditedRoles(prev => {
      const rolePerms = new Set(prev[roleId]);
      if (rolePerms.has(permissionId)) {
        rolePerms.delete(permissionId);
      } else {
        rolePerms.add(permissionId);
      }
      return { ...prev, [roleId]: rolePerms };
    });
  };

  // Helper to determine if a specific role's permissions have changed
  const isRoleModified = useCallback((roleId: number) => {
    const current = editedRoles[roleId];
    const original = originalRoles[roleId];
    if (!current || !original) return false;
    if (current.size !== original.size) return true;
    for (const val of Array.from(current)) {
      if (!original.has(val)) return true;
    }
    return false;
  }, [editedRoles, originalRoles]);

  // Check if any role in the entire matrix has been modified
  const hasAnyModifiedRoles = useMemo(() => {
    return roles.some(role => isRoleModified(role.id));
  }, [roles, isRoleModified]);

  const handleSave = async (role: Role) => {
    if (!session?.accessToken) return;

    try {
      setSaving(role.id);
      const selectedPermIds = Array.from(editedRoles[role.id] || []);
      const baseUrl = getBackendBaseUrl();
      
      const res = await httpClient(`${baseUrl}/roles/${role.id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify(selectedPermIds),
        token: session.accessToken
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Failed to update" }));
        throw new Error(errorData.message || "Failed to update permissions");
      }

      toast.success(`${role.displayName || role.name} permissions updated successfully!`);
      
      // Update original state to remove modification flag
      setOriginalRoles(prev => ({
        ...prev,
        [role.id]: new Set(selectedPermIds)
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      console.error("Failed to save permissions:", error);
      toast.error(message);
    } finally {
      setSaving(null);
    }
  };

  // Save all modified roles globally
  const handleSaveAll = async () => {
    if (!session?.accessToken) return;

    const modifiedRoles = roles.filter(role => isRoleModified(role.id));
    if (modifiedRoles.length === 0) {
      toast.info("Tidak ada perubahan untuk disimpan.");
      return;
    }

    // If saving standard system template roles, show confirmation dialog first
    const hasSystemRoleModified = modifiedRoles.some(r => r.isSystemRole);
    if (hasSystemRoleModified && context !== "system") {
      // Find the first system role to display in warning, or customize the warning
      const firstSystemRole = modifiedRoles.find(r => r.isSystemRole);
      if (firstSystemRole) {
        setPendingRoleToSave(firstSystemRole);
        setShowConfirmDialog(true);
        return;
      }
    }

    try {
      setBatchSaving(true);
      const baseUrl = getBackendBaseUrl();

      for (const role of modifiedRoles) {
        const selectedPermIds = Array.from(editedRoles[role.id] || []);
        const res = await httpClient(`${baseUrl}/roles/${role.id}/permissions`, {
          method: 'PUT',
          body: JSON.stringify(selectedPermIds),
          token: session.accessToken
        });

        if (!res.ok) {
          throw new Error(`Failed to update ${role.displayName || role.name}`);
        }
      }

      toast.success("Semua perubahan hak akses berhasil disimpan!");
      await fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan perubahan";
      toast.error(message);
    } finally {
      setBatchSaving(false);
    }
  };

  // Group permissions by module for better UI organization
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const mod = perm.module || "General";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-card/20 rounded-xl border border-border">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      
      {/* HEADER CONTROL BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-border">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Matrix Hak Akses Platform</h2>
          <p className="text-sm text-muted-foreground">Konfigurasi pemetaan permission granular secara terpusat.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
          {/* Context Switcher (Hanya muncul jika diakses dari System/Control Plane) */}
          {context === "system" && (
            <div className="flex bg-muted p-1 rounded-lg border border-border">
              <button
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

          {/* View Mode Switcher */}
          <div className="flex bg-muted p-1 rounded-lg border border-border">
            <ActionTooltip label="Tampilan Tabel Matrix" shortcut="Alt+T">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "table" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </ActionTooltip>
            <ActionTooltip label="Tampilan Grid Card" shortcut="Alt+G">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "grid" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </ActionTooltip>
          </div>

          {/* Master Save Button */}
          <ActionTooltip label={hasAnyModifiedRoles ? "Simpan Seluruh Perubahan Matrix" : "Tidak Ada Perubahan"} shortcut="Ctrl+S">
            <button
              onClick={handleSaveAll}
              disabled={batchSaving || !hasAnyModifiedRoles || !canAccess('roles.update')}
              className={`flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-lg transition-all shadow-lg ${
                hasAnyModifiedRoles && canAccess('roles.update')
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

      {/* TAMPILAN UTAMA 1: MATRIX TABLE */}
      {viewMode === "table" && (
        <div className="w-full overflow-auto rounded-xl border border-border bg-card/50 backdrop-blur-md shadow-2xl max-h-[calc(100vh-280px)] custom-scrollbar relative">
          <table className="w-full border-collapse text-left text-sm border-separate border-spacing-0">
            <thead>
              <tr className="border-b border-border">
                <th className="sticky left-0 top-0 z-40 bg-card p-4 font-medium text-muted-foreground border-r border-b border-border min-w-[280px] shadow-[2px_2px_5px_rgba(0,0,0,0.08)]">Modul & Hak Akses</th>
                {roles.map((role) => (
                  <th key={role.id} className="sticky top-0 z-30 p-4 font-medium text-center min-w-[150px] border-b border-border bg-card shadow-[0_2px_3px_rgba(0,0,0,0.05)]">
                    <span className="block text-foreground font-semibold">{role.displayName || role.name}</span>
                    <span className="block text-[10px] font-mono font-bold text-primary mt-1 bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 inline-block">
                      {role.code || (selectedScope === "SYSTEM" ? `SYS-${role.id}` : `TENT-${role.id}`)}
                    </span>
                    <span className="block text-[10px] text-muted-foreground font-mono mt-1">({role.name})</span>
                    
                    {/* Role Type Indicator Badge */}
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
                      
                      {/* Individual Modified Indicator */}
                      {isRoleModified(role.id) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Ada perubahan belum disimpan" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                <React.Fragment key={moduleName}>
                  {/* Row Header untuk Sub-Modul */}
                  <tr className="bg-muted/30 font-medium text-xs tracking-wider text-muted-foreground">
                    <td className="sticky left-0 z-20 bg-muted/80 px-4 py-2 text-primary font-mono uppercase border-r border-border">
                      📦 {moduleName}
                    </td>
                    <td colSpan={roles.length} className="px-4 py-2 bg-muted/40 border-y border-border" />
                  </tr>
                  
                  {/* Baris Item Permission */}
                  {perms.map((perm) => (
                    <tr key={perm.id} className="hover:bg-accent/40 transition-colors group">
                      <td className="sticky left-0 z-10 bg-card p-4 border-r border-border shadow-[2px_0_5px_rgba(0,0,0,0.1)] group-hover:bg-accent transition-colors">
                        <div className="font-medium text-foreground">
                          {perm.description || perm.code}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">{perm.code}</div>
                      </td>
                      {roles.map((role) => {
                        const isChecked = editedRoles[role.id]?.has(perm.id);
                        const canEdit = canAccess('roles.update');
                        return (
                          <td 
                            key={role.id} 
                            onClick={() => canEdit && togglePermission(role.id, perm.id)}
                            className={`p-4 text-center border-l border-border transition-all ${
                              canEdit
                                ? "cursor-pointer hover:bg-accent/20"
                                : "cursor-default"
                            }`}
                          >
                            <div className="flex items-center justify-center mx-auto">
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                isChecked 
                                  ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/10" 
                                  : "border-border bg-muted hover:border-primary/50"
                              } ${!canEdit ? "opacity-60" : ""}`}>
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAMPILAN UTAMA 2: CARD GRID */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((role) => (
            <div 
              key={role.id} 
              className={`bg-card border rounded-xl p-5 shadow-sm flex flex-col justify-between transition-all group ${
                isRoleModified(role.id) ? "border-amber-500/50" : "border-border hover:border-primary/30"
              }`}
            >
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="font-semibold text-foreground text-base">{role.displayName || role.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                        {role.code || (selectedScope === "SYSTEM" ? `SYS-${role.id}` : `TENT-${role.id}`)}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">({role.name})</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <div className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-muted border border-border text-muted-foreground">
                      {selectedScope} ROLE
                    </div>
                    {role.isSystemRole ? (
                      <span className="text-[9px] text-blue-400 flex items-center gap-0.5 font-mono">
                        <Lock className="w-2.5 h-2.5" /> Template
                      </span>
                    ) : (
                      <span className="text-[9px] text-primary flex items-center gap-0.5 font-mono">
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
                    <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase block">Daftar Hak Akses:</span>
                    {isRoleModified(role.id) && (
                      <span className="text-[10px] text-amber-500 animate-pulse font-medium">Ada perubahan</span>
                    )}
                  </div>
                  
                  <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2 text-xs divide-y divide-border custom-scrollbar">
                    {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                      <div key={moduleName} className="pt-2 first:pt-0">
                        <span className="text-[9px] text-primary/80 font-semibold tracking-wide uppercase block mb-1">
                          📦 {moduleName}
                        </span>
                        
                        {perms.map((perm) => {
                          const isChecked = editedRoles[role.id]?.has(perm.id);
                          const canEdit = canAccess('roles.update');
                          return (
                            <div 
                              key={perm.id} 
                              onClick={() => canEdit && togglePermission(role.id, perm.id)}
                              className={`flex items-center justify-between py-1.5 px-1 rounded transition-colors ${
                                canEdit
                                  ? "cursor-pointer hover:bg-accent/40"
                                  : "cursor-default"
                              }`}
                            >
                              <div className="pr-2">
                                <span className="block font-medium text-foreground">{perm.description || perm.code}</span>
                                <span className="block text-[10px] text-muted-foreground font-mono">{perm.code}</span>
                              </div>
                              <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-all ${
                                isChecked ? "bg-primary border-primary text-primary-foreground" : "border-border bg-muted"
                              } ${!canEdit ? "opacity-60" : ""}`}>
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
              
              {/* Individual Save Button for Card — only shown if user can update roles */}
              {isRoleModified(role.id) && canAccess('roles.update') && (
                <div className="mt-4 pt-3 border-t border-border">
                  <button
                    onClick={() => {
                      if (role.isSystemRole && context !== "system") {
                        setPendingRoleToSave(role);
                        setShowConfirmDialog(true);
                      } else {
                        handleSave(role);
                      }
                    }}
                    disabled={saving === role.id}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-primary hover:bg-primary/90 text-foreground text-xs font-semibold rounded-lg transition-all"
                  >
                    {saving === role.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Simpan Perubahan Role Ini
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Premium Confirmation Dialog for Hybrid RBAC Lazy Cloning */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-blue-500/10">
                <AlertTriangle className="w-6 h-6 text-blue-400" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">Standard Template</DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground text-base leading-relaxed">
              Ini adalah template standar global untuk role <span className="text-blue-400 font-semibold uppercase">{pendingRoleToSave?.displayName || pendingRoleToSave?.name}</span>. 
              Menyimpan perubahan akan membuat <span className="text-primary font-semibold underline decoration-primary/30 underline-offset-4">versi kustom</span> khusus untuk organisasi Anda.
              <br /><br />
              Seluruh anggota tim yang memiliki role ini akan otomatis dimigrasikan ke versi kustom yang baru.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              className="border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
            >
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (pendingRoleToSave) {
                  setShowConfirmDialog(false);
                  await handleSave(pendingRoleToSave);
                  await fetchData();
                }
              }}
              className="bg-blue-600 hover:bg-blue-500 text-foreground shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all font-semibold"
            >
              Continue & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
