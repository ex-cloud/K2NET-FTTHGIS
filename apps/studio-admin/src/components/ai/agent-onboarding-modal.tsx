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
  Sparkles, 
  AlertCircle, 
  Loader2,
  Lock,
  ArrowRight,
  ArrowLeft
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
  PermissionCatalogData,
  PermissionDomainData,
  RolePresetData,
  AgentAuthorizationData
} from "@/lib/actions/gateways";
import { cn } from "@/lib/utils";

// ─── Visual Icon Map for Domains ────────────────────────────────────────────
const DOMAIN_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Cpu,
  Activity,
  MapPin,
  Database,
  ShieldCheck,
  GitPullRequest,
  Sparkles,
};

interface AgentOnboardingModalProps {
  isOpen: boolean;
  onAuthorized: (auth: AgentAuthorizationData) => void;
  onClose?: () => void;
  scope?: "PLATFORM_INTERNAL" | "TENANT";
  currentAccountName?: string;
}

export function AgentOnboardingModal({
  isOpen,
  onAuthorized,
  onClose,
  scope = "PLATFORM_INTERNAL",
  currentAccountName = "K2NET Core Platform (Root HQ)",
}: AgentOnboardingModalProps) {
  // Step State: 1 = Activation Screen, 2 = Permissions Review
  const [step, setStep] = useState<1 | 2>(1);

  // Catalog & Presets Data
  const [catalog, setCatalog] = useState<PermissionCatalogData | null>(null);
  const [presets, setPresets] = useState<RolePresetData[]>([]);
  const [loading, setLoading] = useState(true);

  // Authorization Form State
  const [accessTier, setAccessTier] = useState<"FULL" | "ROLE_PRESET" | "READ_ONLY" | "CUSTOM">("FULL");
  const [selectedPreset, setSelectedPreset] = useState<string>("SUPER_ADMIN");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [grantAllAccounts, setGrantAllAccounts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Load Catalog & Presets on mount ───────────────────────────────────────
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

        // Default: expand all domains and select all permissions for Full Access
        const allDomainIds = new Set(catRes.domains.map((d) => d.id));
        setExpandedDomains(allDomainIds);

        const allPermIds = new Set(
          catRes.domains.flatMap((d) => d.permissions.map((p) => p.id))
        );
        setSelectedPermissions(allPermIds);
      } catch (err) {
        console.error("Gagal memuat katalog izin:", err);
        toast.error("Gagal memuat katalog izin K2 Agent");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isOpen, scope]);

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

  // ── Handle Individual Permission Toggle ───────────────────────────────────
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

  // ── Authorize Action ──────────────────────────────────────────────────────
  const handleAuthorize = async () => {
    try {
      setSubmitting(true);
      const payload = {
        agent_name: "K2 Agent",
        user_scope: scope,
        access_tier: accessTier,
        role_preset: accessTier === "ROLE_PRESET" ? selectedPreset : undefined,
        granted_permissions: Array.from(selectedPermissions),
      };

      const res = await saveAgentAuthorization(payload);
      toast.success("Otorisasi K2 Agent berhasil diaktifkan!");
      onAuthorized(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengotorisasi K2 Agent";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Filter domains by search query
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
    <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* STEP 1: ACTIVATION SCREEN (Enable K2 Agent Access)               */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="p-6 md:p-8 space-y-6 flex flex-col items-center text-center">
            
            {/* 3D Gradient Avatar Hero */}
            <div className="relative mt-2">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary/30 via-primary/15 to-amber-500/20 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl bg-background border border-border flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1.5 max-w-sm">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Enable K2 Agent access
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Token API aman akan dibuat untuk mengizinkan K2 Agent mengakses sumber daya {scope === "PLATFORM_INTERNAL" ? "platform internal K2NET" : "operasional tenant Anda"}.
              </p>
            </div>

            {/* Account & Scope Selector Card */}
            <div className="w-full text-left p-4 rounded-xl bg-background border border-border space-y-3.5 shadow-xs">
              
              {/* Grant All Accounts Toggle */}
              <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {scope === "PLATFORM_INTERNAL" ? "Akses Seluruh Modul Internal" : "Akses Seluruh Modul Tenant"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Termasuk modul baru yang ditambahkan di masa mendatang
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={grantAllAccounts}
                  onChange={(e) => setGrantAllAccounts(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-0 cursor-pointer h-4 w-4"
                />
              </div>

              {/* Current Account Selection */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-medium text-foreground/75 dark:text-muted-foreground mb-1.5">
                  <span>Pilih Workspace / Akun:</span>
                  <span className="font-mono text-primary text-[10px]">1 terpilih</span>
                </div>
                
                <div className="p-3 rounded-lg border border-primary/40 bg-primary/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={true}
                      readOnly
                      className="rounded border-primary text-primary focus:ring-0 h-4 w-4"
                    />
                    <div>
                      <p className="text-xs font-bold text-foreground">{currentAccountName}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">Scope: {scope}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 border-primary/30 text-primary bg-primary/10">
                    Current
                  </Badge>
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-2 pt-2">
              <Button
                onClick={() => setStep(2)}
                disabled={loading}
                className="w-full text-xs font-bold h-10 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Review permissions</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer pt-1"
                >
                  Batal
                </button>
              )}
            </div>

          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* STEP 2: PERMISSIONS REVIEW & AUTHORIZE SCREEN                     */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <>
            {/* Modal Header */}
            <div className="p-4 border-b border-border/80 bg-muted/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Kembali ke layar sebelumnya"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Review & Grant Permissions</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {totalGranted} dari {totalAvailable} izin aktif • {accessTier.replace("_", " ")}
                  </p>
                </div>
              </div>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              
              {/* Segmented Controls / Access Tier Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-background rounded-xl border border-border text-xs font-semibold text-center">
                <button
                  type="button"
                  onClick={() => handleTierChange("FULL")}
                  className={cn(
                    "py-1.5 px-2 rounded-lg transition-all cursor-pointer",
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
                    "py-1.5 px-2 rounded-lg transition-all cursor-pointer",
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
                    "py-1.5 px-2 rounded-lg transition-all cursor-pointer",
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
                    "py-1.5 px-2 rounded-lg transition-all cursor-pointer",
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
                          "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5",
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
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {presets.find((p) => p.id === selectedPreset)?.description}
                  </p>
                </div>
              )}

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari nama atau kode permission..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs h-8 pl-8 font-mono bg-background border-border"
                />
              </div>

              {/* Permissions Accordion by Domains */}
              <div className="space-y-2">
                {filteredDomains.map((domain) => {
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
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() => handleToggleDomain(domain.id)}
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-foreground">
                              {domain.title}
                            </span>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">
                              {domain.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-mono px-1.5 py-0 border",
                              domainGrantedCount > 0
                                ? "border-primary/40 text-primary bg-primary/10 font-bold"
                                : "border-border text-muted-foreground"
                            )}
                          >
                            {domainGrantedCount} / {domain.permissions.length}
                          </Badge>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {/* Accordion Body: Granular Permission Rows */}
                      {isExpanded && (
                        <div className="border-t border-border/70 divide-y divide-border/50 bg-muted/10">
                          {domain.permissions.map((perm) => {
                            const isChecked = selectedPermissions.has(perm.id);
                            return (
                              <div
                                key={perm.id}
                                onClick={() => handleTogglePermission(perm.id)}
                                className="p-2.5 px-3.5 flex items-start justify-between gap-3 hover:bg-muted/40 transition-colors cursor-pointer"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-foreground">
                                      {perm.name}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-[9px] font-mono px-1 py-0 border",
                                        perm.scope === "Write"
                                          ? "text-amber-500 border-amber-500/30 bg-amber-500/10"
                                          : "text-foreground/75 dark:text-muted-foreground border-border"
                                      )}
                                    >
                                      {perm.scope}
                                    </Badge>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground">
                                    {perm.description}
                                  </p>
                                  <p className="text-[9px] font-mono text-muted-foreground/60">
                                    {perm.id}
                                  </p>
                                </div>

                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="mt-1 rounded border-border text-primary focus:ring-0 h-4 w-4 cursor-pointer"
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border/80 bg-muted/20 flex flex-col space-y-2 shrink-0">
              <p className="text-[10px] text-center text-muted-foreground">
                Anda dapat mengubah atau mencabut izin kapan saja dari pengaturan K2 Agent.
              </p>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(1)}
                  disabled={submitting}
                  className="text-xs cursor-pointer"
                >
                  Kembali
                </Button>
                <Button
                  size="sm"
                  onClick={handleAuthorize}
                  disabled={submitting || totalGranted === 0}
                  className="text-xs font-bold gap-1.5 px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Authorize K2 Agent ({totalGranted})</span>
                </Button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
