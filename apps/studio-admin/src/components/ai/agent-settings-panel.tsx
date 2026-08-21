"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Cpu, 
  Activity, 
  MapPin, 
  Database, 
  GitPullRequest, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Check, 
  X, 
  AlertCircle, 
  Loader2,
  ArrowLeft,
  Trash2,
  Save,
  Sparkles
} from "lucide-react";
import { 
  Button, 
  Input, 
  Badge 
} from "@k2net/ui";
import { toast } from "sonner";
import { 
  fetchAgentPermissionsCatalog, 
  fetchAgentRolePresets, 
  saveAgentAuthorization,
  revokeAgentAuthorization,
  PermissionCatalogData,
  RolePresetData,
  AgentAuthorizationData
} from "@/lib/actions/gateways";
import { cn } from "@/lib/utils";

const DOMAIN_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Cpu,
  Activity,
  MapPin,
  Database,
  ShieldCheck,
  GitPullRequest,
  Sparkles,
};

interface AgentSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentAuth: AgentAuthorizationData;
  onAuthUpdated: (auth: AgentAuthorizationData) => void;
  onAuthRevoked: () => void;
  scope?: "PLATFORM_INTERNAL" | "TENANT";
}

export function AgentSettingsPanel({
  isOpen,
  onClose,
  currentAuth,
  onAuthUpdated,
  onAuthRevoked,
  scope = "PLATFORM_INTERNAL",
}: AgentSettingsPanelProps) {
  const [catalog, setCatalog] = useState<PermissionCatalogData | null>(null);
  const [presets, setPresets] = useState<RolePresetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState(false);

  // Form State
  const [accessTier, setAccessTier] = useState<"FULL" | "ROLE_PRESET" | "READ_ONLY" | "CUSTOM">(
    (currentAuth.access_tier as any) || "FULL"
  );
  const [selectedPreset, setSelectedPreset] = useState<string>(
    currentAuth.role_preset || "SUPER_ADMIN"
  );
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(currentAuth.granted_permissions || [])
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());

  // ── Load Catalog & Presets on open ────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      if (!isOpen) return;
      try {
        setLoading(true);
        const [catRes, preRes] = await Promise.all([
          fetchAgentPermissionsCatalog(scope),
          fetchAgentRolePresets(scope),
        ]);
        setCatalog(catRes);
        setPresets(preRes.presets);

        // Expand all domains by default
        setExpandedDomains(new Set(catRes.domains.map((d) => d.id)));

        // Sync with current auth
        setAccessTier((currentAuth.access_tier as any) || "FULL");
        setSelectedPreset(currentAuth.role_preset || "SUPER_ADMIN");
        setSelectedPermissions(new Set(currentAuth.granted_permissions || []));
      } catch (err) {
        console.error("Gagal memuat katalog settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isOpen, scope, currentAuth]);

  // ── Handle Tier Change ────────────────────────────────────────────────────
  const handleTierChange = (tier: "FULL" | "ROLE_PRESET" | "READ_ONLY" | "CUSTOM") => {
    setAccessTier(tier);
    if (!catalog) return;

    if (tier === "FULL") {
      const allPerms = new Set(
        catalog.domains.flatMap((d) => d.permissions.map((p) => p.id))
      );
      setSelectedPermissions(allPerms);
    } else if (tier === "READ_ONLY") {
      const readOnlyPerms = new Set(
        catalog.domains.flatMap((d) =>
          d.permissions.filter((p) => p.scope === "Read").map((p) => p.id)
        )
      );
      setSelectedPermissions(readOnlyPerms);
    } else if (tier === "ROLE_PRESET") {
      const preset = presets.find((p) => p.id === selectedPreset);
      if (preset) {
        setSelectedPermissions(new Set(preset.default_permissions));
      }
    }
  };

  // ── Handle Preset Selection ───────────────────────────────────────────────
  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    setAccessTier("ROLE_PRESET");
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      setSelectedPermissions(new Set(preset.default_permissions));
    }
  };

  // ── Toggle Individual Permission ──────────────────────────────────────────
  const handleTogglePermission = (permId: string) => {
    setAccessTier("CUSTOM");
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
  };

  // ── Toggle Domain Accordion ───────────────────────────────────────────────
  const handleToggleDomain = (domainId: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domainId)) {
        next.delete(domainId);
      } else {
        next.add(domainId);
      }
      return next;
    });
  };

  // ── Save Changes ──────────────────────────────────────────────────────────
  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      const payload = {
        agent_name: currentAuth.agent_name || "K2 Agent",
        user_scope: scope,
        access_tier: accessTier,
        role_preset: accessTier === "ROLE_PRESET" ? selectedPreset : undefined,
        granted_permissions: Array.from(selectedPermissions),
      };

      const res = await saveAgentAuthorization(payload);
      toast.success("Pengaturan izin K2 Agent berhasil diperbarui!");
      onAuthUpdated(res);
      onClose();
    } catch (err) {
      toast.error("Gagal menyimpan perubahan izin.");
    } finally {
      setSaving(false);
    }
  };

  // ── Revoke Authorization ──────────────────────────────────────────────────
  const handleRevoke = async () => {
    if (!confirm("Apakah Anda yakin ingin mencabut seluruh akses K2 Agent?")) return;
    try {
      setRevoking(true);
      await revokeAgentAuthorization();
      toast.success("Otorisasi K2 Agent berhasil dicabut.");
      onAuthRevoked();
      onClose();
    } catch (err) {
      toast.error("Gagal mencabut otorisasi.");
    } finally {
      setRevoking(false);
    }
  };

  if (!isOpen) return null;

  const filteredDomains = catalog
    ? catalog.domains
        .map((d) => ({
          ...d,
          permissions: d.permissions.filter(
            (p) =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.id.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((d) => d.permissions.length > 0)
    : [];

  const totalGranted = selectedPermissions.size;
  const totalAvailable = catalog ? catalog.total_permissions : 0;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        
        {/* Header (Matching Screenshot 5) */}
        <div className="p-4 border-b border-border/80 bg-muted/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Tutup Pengaturan"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h3 className="text-sm font-bold text-foreground">K2 Agent Settings</h3>
              <p className="text-[10px] font-mono text-muted-foreground">
                Scope: {scope} • {currentAuth.agent_name || "K2 Agent"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Account Status Card */}
          <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs font-bold text-foreground">
                {scope === "PLATFORM_INTERNAL" ? "K2NET Core Platform (Root HQ)" : "Tenant Regional Workspace"}
              </p>
              <p className="text-[10px] text-primary flex items-center gap-1 font-mono mt-0.5">
                <ShieldCheck className="w-3 h-3" /> API Token Active
              </p>
            </div>
            <Badge variant="outline" className="text-[9px] font-mono border-primary/30 text-primary bg-primary/10">
              Current
            </Badge>
          </div>

          {/* Segmented Controls / Access Tier Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-background rounded-xl border border-border text-xs font-semibold text-center">
            <button
              type="button"
              onClick={() => handleTierChange("FULL")}
              className={cn(
                "py-1.5 px-1.5 rounded-lg transition-all cursor-pointer",
                accessTier === "FULL"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Full access
            </button>
            <button
              type="button"
              onClick={() => handleTierChange("ROLE_PRESET")}
              className={cn(
                "py-1.5 px-1.5 rounded-lg transition-all cursor-pointer",
                accessTier === "ROLE_PRESET"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Role Preset
            </button>
            <button
              type="button"
              onClick={() => handleTierChange("READ_ONLY")}
              className={cn(
                "py-1.5 px-1.5 rounded-lg transition-all cursor-pointer",
                accessTier === "READ_ONLY"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Read only
            </button>
            <button
              type="button"
              onClick={() => handleTierChange("CUSTOM")}
              className={cn(
                "py-1.5 px-1.5 rounded-lg transition-all cursor-pointer",
                accessTier === "CUSTOM"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Custom
            </button>
          </div>

          {/* Role Presets Pills (if ROLE_PRESET chosen) */}
          {accessTier === "ROLE_PRESET" && (
            <div className="space-y-1.5 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <div className="text-[10px] font-bold tracking-wider text-primary uppercase">
                PILIH PRESET SESUAI PERAN ANDA:
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={cn(
                      "px-2 py-0.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1",
                      selectedPreset === preset.id
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-background border-border text-foreground hover:border-primary/40"
                    )}
                  >
                    <span>{preset.name}</span>
                    <span className="text-[9px] opacity-75 font-mono">({preset.default_permissions.length})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari permission..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs h-8 pl-8 font-mono bg-background border-border"
            />
          </div>

          {/* Granular Permission Domains List (Matching Screenshot 5) */}
          <div className="space-y-2">
            {loading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-primary" />
                Memuat katalog izin...
              </div>
            ) : (
              filteredDomains.map((domain) => {
                const IconComp = DOMAIN_ICON_MAP[domain.icon] || ShieldCheck;
                const isExpanded = expandedDomains.has(domain.id);
                const domainGrantedCount = domain.permissions.filter((p) =>
                  selectedPermissions.has(p.id)
                ).length;

                return (
                  <div
                    key={domain.id}
                    className="rounded-xl border border-border/80 bg-background overflow-hidden shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleDomain(domain.id)}
                      className="w-full p-2.5 px-3 flex items-center justify-between text-left hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <IconComp className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-bold text-foreground">
                          {domain.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-mono px-1 py-0 border",
                            domainGrantedCount > 0
                              ? "border-primary/40 text-primary bg-primary/10 font-bold"
                              : "border-border text-muted-foreground"
                          )}
                        >
                          {domainGrantedCount}
                        </Badge>
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border/70 divide-y divide-border/40 bg-muted/10">
                        {domain.permissions.map((perm) => {
                          const isChecked = selectedPermissions.has(perm.id);
                          return (
                            <div
                              key={perm.id}
                              onClick={() => handleTogglePermission(perm.id)}
                              className="p-2 px-3 flex items-center justify-between gap-2 hover:bg-muted/40 transition-colors cursor-pointer text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <p className="font-semibold text-foreground truncate">
                                  {perm.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {perm.description}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[9px] font-mono px-1 py-0 border",
                                    isChecked
                                      ? perm.scope === "Write"
                                        ? "text-amber-500 border-amber-500/40 bg-amber-500/10 font-bold"
                                        : "text-primary border-primary/40 bg-primary/10 font-bold"
                                      : "text-muted-foreground border-border opacity-60"
                                  )}
                                >
                                  {perm.scope}
                                </Badge>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="rounded border-border text-primary focus:ring-0 h-3.5 w-3.5 cursor-pointer"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Footer Actions (Matching Screenshot 5) */}
        <div className="p-4 border-t border-border/80 bg-muted/20 space-y-2 shrink-0">
          <Button
            onClick={handleSaveChanges}
            disabled={saving}
            className="w-full text-xs font-bold h-9 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save changes ({totalGranted} permissions)</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRevoke}
            disabled={revoking}
            className="w-full text-xs gap-1.5 text-destructive hover:bg-destructive/10 border-border cursor-pointer"
          >
            {revoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>Revoke K2 Agent Access</span>
          </Button>
        </div>

      </div>
    </div>
  );
}
