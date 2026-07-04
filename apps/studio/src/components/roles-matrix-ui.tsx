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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
      <div className="flex items-center justify-center h-64 bg-zinc-950/20 rounded-xl border border-zinc-900">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 text-zinc-100">
      
      {/* HEADER CONTROL BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-100">Matrix Hak Akses Platform</h2>
          <p className="text-sm text-zinc-400">Konfigurasi pemetaan permission granular secara terpusat.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
          {/* Context Switcher (Hanya muncul jika diakses dari System/Control Plane) */}
          {context === "system" && (
            <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <button
                onClick={() => setSelectedScope("SYSTEM")}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  selectedScope === "SYSTEM"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "text-zinc-400 hover:text-zinc-200 border border-transparent"
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
                    : "text-zinc-400 hover:text-zinc-200 border border-transparent"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Tenant Templates
              </button>
            </div>
          )}

          {/* View Mode Switcher */}
          <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "table" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Table View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "grid" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Card Grid View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Master Save Button */}
          <button
            onClick={handleSaveAll}
            disabled={batchSaving || !hasAnyModifiedRoles || !canAccess('roles.update')}
            className={`flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-lg transition-all shadow-lg ${
              hasAnyModifiedRoles && canAccess('roles.update')
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20 cursor-pointer"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none"
            }`}
          >
            {batchSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Simpan Perubahan
          </button>
        </div>
      </div>

      {/* TAMPILAN UTAMA 1: MATRIX TABLE */}
      {viewMode === "table" && (
        <div className="w-full overflow-auto rounded-xl border border-zinc-800 bg-zinc-950/50 backdrop-blur-md shadow-2xl max-h-[calc(100vh-280px)] custom-scrollbar relative">
          <table className="w-full border-collapse text-left text-sm border-separate border-spacing-0">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="sticky left-0 top-0 z-40 bg-zinc-950 p-4 font-medium text-zinc-300 border-r border-b border-zinc-800 min-w-[280px] shadow-[2px_2px_5px_rgba(0,0,0,0.5)]">Modul & Hak Akses</th>
                {roles.map((role) => (
                  <th key={role.id} className="sticky top-0 z-30 p-4 font-medium text-center min-w-[150px] border-b border-zinc-800 bg-zinc-950 shadow-[0_2px_3px_rgba(0,0,0,0.3)]">
                    <span className="block text-zinc-200 font-semibold">{role.displayName || role.name}</span>
                    <span className="block text-[10px] font-mono font-bold text-emerald-400 mt-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 inline-block">
                      {role.code || (selectedScope === "SYSTEM" ? `SYS-${role.id}` : `TENT-${role.id}`)}
                    </span>
                    <span className="block text-[10px] text-zinc-500 font-mono mt-1">({role.name})</span>
                    
                    {/* Role Type Indicator Badge */}
                    <div className="mt-1 flex items-center justify-center gap-1">
                      {role.isSystemRole ? (
                        <span className="inline-flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase">
                          <Lock className="w-2 h-2" />
                          Template
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
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
            <tbody className="divide-y divide-zinc-900">
              {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                <React.Fragment key={moduleName}>
                  {/* Row Header untuk Sub-Modul */}
                  <tr className="bg-zinc-900/30 font-medium text-xs tracking-wider text-zinc-400">
                    <td className="sticky left-0 z-20 bg-zinc-900/80 px-4 py-2 text-emerald-500/90 font-mono uppercase border-r border-zinc-800">
                      📦 {moduleName}
                    </td>
                    <td colSpan={roles.length} className="px-4 py-2 bg-zinc-900/40 border-y border-zinc-900" />
                  </tr>
                  
                  {/* Baris Item Permission */}
                  {perms.map((perm) => (
                    <tr key={perm.id} className="hover:bg-zinc-900/40 transition-colors group">
                      <td className="sticky left-0 z-10 bg-[#0c0c0c] p-4 border-r border-zinc-800 shadow-[2px_0_5px_rgba(0,0,0,0.3)] group-hover:bg-zinc-800 transition-colors">
                        <div className="font-medium text-zinc-200 group-hover:text-white">
                          {perm.description || perm.code}
                        </div>
                        <div className="text-xs text-zinc-500 font-mono mt-0.5">{perm.code}</div>
                      </td>
                      {roles.map((role) => {
                        const isChecked = editedRoles[role.id]?.has(perm.id);
                        const canEdit = canAccess('roles.update');
                        return (
                          <td 
                            key={role.id} 
                            onClick={() => canEdit && togglePermission(role.id, perm.id)}
                            className={`p-4 text-center border-l border-zinc-900/50 transition-all ${
                              canEdit
                                ? "cursor-pointer hover:bg-zinc-800/20"
                                : "cursor-default"
                            }`}
                          >
                            <div className="flex items-center justify-center mx-auto">
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                isChecked 
                                  ? "bg-emerald-500 border-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/10" 
                                  : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
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
              className={`bg-zinc-950 border rounded-xl p-5 shadow-xl flex flex-col justify-between transition-all group ${
                isRoleModified(role.id) ? "border-amber-500/50" : "border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-zinc-900">
                  <div>
                    <h3 className="font-semibold text-zinc-100 text-base">{role.displayName || role.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                        {role.code || (selectedScope === "SYSTEM" ? `SYS-${role.id}` : `TENT-${role.id}`)}
                      </span>
                      <span className="text-xs font-mono text-zinc-500">({role.name})</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <div className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-400">
                      {selectedScope} ROLE
                    </div>
                    {role.isSystemRole ? (
                      <span className="text-[9px] text-blue-400 flex items-center gap-0.5 font-mono">
                        <Lock className="w-2.5 h-2.5" /> Template
                      </span>
                    ) : (
                      <span className="text-[9px] text-emerald-400 flex items-center gap-0.5 font-mono">
                        <ShieldCheck className="w-2.5 h-2.5" /> Custom
                      </span>
                    )}
                  </div>
                </div>
                
                {role.description && (
                  <p className="text-xs text-zinc-400 mt-2.5 bg-zinc-900/50 p-2 rounded border border-zinc-900">
                    {role.description}
                  </p>
                )}

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase block">Daftar Hak Akses:</span>
                    {isRoleModified(role.id) && (
                      <span className="text-[10px] text-amber-500 animate-pulse font-medium">Ada perubahan</span>
                    )}
                  </div>
                  
                  <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2 text-xs divide-y divide-zinc-900/50 custom-scrollbar">
                    {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                      <div key={moduleName} className="pt-2 first:pt-0">
                        <span className="text-[9px] text-emerald-500/80 font-semibold tracking-wide uppercase block mb-1">
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
                                  ? "cursor-pointer hover:bg-zinc-900/40"
                                  : "cursor-default"
                              }`}
                            >
                              <div className="pr-2">
                                <span className="block font-medium text-zinc-300">{perm.description || perm.code}</span>
                                <span className="block text-[10px] text-zinc-500 font-mono">{perm.code}</span>
                              </div>
                              <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-all ${
                                isChecked ? "bg-emerald-500 border-emerald-400 text-zinc-950" : "border-zinc-700 bg-zinc-900"
                              } ${!canEdit ? "opacity-60" : ""}`}>
                                {isChecked && <Check className="w-3 h-3 text-black stroke-[3]" />}
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
                <div className="mt-4 pt-3 border-t border-zinc-900">
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
                    className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all"
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
        <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-blue-500/10">
                <AlertTriangle className="w-6 h-6 text-blue-400" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight">Standard Template</DialogTitle>
            </div>
            <DialogDescription className="text-zinc-400 text-base leading-relaxed">
              Ini adalah template standar global untuk role <span className="text-blue-400 font-semibold uppercase">{pendingRoleToSave?.displayName || pendingRoleToSave?.name}</span>. 
              Menyimpan perubahan akan membuat <span className="text-emerald-400 font-semibold underline decoration-emerald-500/30 underline-offset-4">versi kustom</span> khusus untuk organisasi Anda.
              <br /><br />
              Seluruh anggota tim yang memiliki role ini akan otomatis dimigrasikan ke versi kustom yang baru.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              className="border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-all"
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
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all font-semibold"
            >
              Continue & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
