"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Check, Loader2, Save, LayoutGrid, List } from "lucide-react";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "next-auth/react";
import { toast } from "sonner"; // Assuming you use sonner for toasts

type Permission = {
  id: number;
  code: string;
  description: string;
  module: string;
};

type Role = {
  id: number;
  name: string;
  displayName: string;
  description: string;
  isSystemRole: boolean;
  permissions: Permission[];
};

export function RolesMatrixUI() {
  const { data: session } = useSession();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "list">("table");

  // Track modified permissions locally before saving
  const [editedRoles, setEditedRoles] = useState<Record<number, Set<number>>>({});

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      const baseUrl = getBackendBaseUrl();
      
      const [rolesRes, permsRes] = await Promise.all([
        httpClient(`${baseUrl}/roles`, { token: session.accessToken }),
        httpClient(`${baseUrl}/roles/permissions`, { token: session.accessToken }),
      ]);
      
      if (!rolesRes.ok || !permsRes.ok) throw new Error("Failed to fetch data");

      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();
      
      setRoles(rolesData);
      setPermissions(permsData);
      
      // Initialize editedRoles state
      const initialEdits: Record<number, Set<number>> = {};
      rolesData.forEach((role: Role) => {
        initialEdits[role.id] = new Set(role.permissions?.map(p => p.id) || []);
      });
      setEditedRoles(initialEdits);
      
    } catch (error) {
      console.error("Failed to load roles and permissions:", error);
      toast.error("Failed to load roles data.");
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

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

  const handleSave = async (role: Role) => {
    if (!session?.accessToken) return;

    try {
      setLoading(false); // Ensure we don't block the whole UI if not needed, or use a specific state
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
      
      // Refresh to ensure sync
      await fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      console.error("Failed to save permissions:", error);
      toast.error(message);
    } finally {
      setSaving(null);
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">Roles & Permissions</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Manage access controls and permissions for your team members.
          </p>
        </div>
        
        {/* View Toggle */}
        <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${viewMode === "table" ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-300"}`}
          >
            <LayoutGrid className="w-4 h-4" />
            Table
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${viewMode === "list" ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-300"}`}
          >
            <List className="w-4 h-4" />
            List
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="border border-zinc-800 rounded-lg overflow-auto bg-[#0c0c0c] max-h-[calc(100vh-280px)] custom-scrollbar relative">
          <table className="w-full text-sm text-left border-separate border-spacing-0">
            <thead className="bg-zinc-950 text-xs uppercase text-zinc-400">
              <tr>
                <th className="sticky left-0 top-0 z-40 bg-zinc-950 px-4 py-4 font-medium border-r border-b border-zinc-800 min-w-[220px] shadow-[2px_2px_5px_rgba(0,0,0,0.5)]">
                  Modules / Permissions
                </th>
                {roles.map(role => (
                  <th key={role.id} className="sticky top-0 z-30 px-2 py-4 font-medium text-center min-w-[110px] border-b border-zinc-800 bg-zinc-950 shadow-[0_2px_3px_rgba(0,0,0,0.3)]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-zinc-100 uppercase tracking-wider">{role.displayName || role.name}</span>
                      {role.isSystemRole && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/10 text-blue-400">System</span>
                      )}
                      <button
                        onClick={() => handleSave(role)}
                        disabled={saving === role.id}
                        className="mt-2 flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded text-[10px] transition-colors disabled:opacity-50"
                      >
                        {saving === role.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Save className="w-2.5 h-2.5" />}
                        Save
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                <React.Fragment key={moduleName}>
                  {/* Module Header Row */}
                  <tr className="bg-zinc-900/30 border-b border-zinc-800">
                    <td className="sticky left-0 z-10 bg-zinc-900/80 px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-r border-zinc-800">
                      {moduleName}
                    </td>
                    <td colSpan={roles.length} className="bg-zinc-900/30"></td>
                  </tr>
                  
                  {/* Permission Rows */}
                  {perms.map(perm => (
                    <tr key={perm.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group">
                      <td className="sticky left-0 z-10 bg-[#0c0c0c] px-4 py-2 border-r border-zinc-800 shadow-[2px_0_5px_rgba(0,0,0,0.3)] group-hover:bg-zinc-800 transition-colors">
                        <div className="text-xs font-medium text-zinc-300">{perm.description || perm.code}</div>
                        <div className="text-[10px] text-zinc-600 font-mono mt-0.5">{perm.code}</div>
                      </td>
                      {roles.map(role => {
                        const isChecked = editedRoles[role.id]?.has(perm.id);
                        return (
                          <td key={role.id} className="px-2 py-2 text-center" onClick={() => togglePermission(role.id, perm.id)}>
                            <div className="flex justify-center cursor-pointer">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'bg-zinc-900 border-zinc-700'}`}>
                                {isChecked && <Check className="w-3 h-3 text-black" />}
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {roles.map(role => (
            <div key={role.id} className="border border-zinc-800 rounded-lg bg-[#0c0c0c] overflow-hidden flex flex-col">
              <div className="p-5 border-b border-zinc-800 flex items-start justify-between bg-zinc-900/30">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100">{role.displayName || role.name}</h3>
                  <p className="text-sm text-zinc-500 mt-1">{role.description || "No description provided."}</p>
                  {role.isSystemRole && (
                    <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 uppercase font-bold tracking-wider">System Template</span>
                  )}
                </div>
                <button
                  onClick={() => handleSave(role)}
                  disabled={saving === role.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {saving === role.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto max-h-[500px] custom-scrollbar space-y-6">
                {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                  <div key={moduleName}>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">{moduleName}</h4>
                    <div className="space-y-2">
                      {perms.map(perm => {
                        const isChecked = editedRoles[role.id]?.has(perm.id);
                        return (
                          <div 
                            key={perm.id} 
                            onClick={() => togglePermission(role.id, perm.id)}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800/50 cursor-pointer transition-colors"
                          >
                            <div className={`w-5 h-5 shrink-0 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'bg-zinc-900 border-zinc-700'}`}>
                              {isChecked && <Check className="w-3.5 h-3.5 text-black" />}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-zinc-300">{perm.description || perm.code}</div>
                              <div className="text-xs text-zinc-600 font-mono">{perm.code}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
