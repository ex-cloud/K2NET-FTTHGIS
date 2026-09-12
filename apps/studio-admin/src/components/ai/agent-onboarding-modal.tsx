import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  fetchAgentPermissionsCatalog, 
  fetchAgentRolePresets, 
  saveAgentAuthorization, 
  type PermissionCatalogData, 
  type RolePresetData, 
  type AgentAuthorizationData 
} from "@/lib/actions/gateways";
import { AgentOnboardingStep1 } from "./onboarding/AgentOnboardingStep1";
import { AgentOnboardingStep2 } from "./onboarding/AgentOnboardingStep2";

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
  const [step, setStep] = useState<1 | 2>(1);
  const [catalog, setCatalog] = useState<PermissionCatalogData | null>(null);
  const [presets, setPresets] = useState<RolePresetData[]>([]);
  const [loading, setLoading] = useState(true);

  const [accessTier, setAccessTier] = useState<"FULL" | "ROLE_PRESET" | "READ_ONLY" | "CUSTOM">("FULL");
  const [selectedPreset, setSelectedPreset] = useState<string>("SUPER_ADMIN");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [grantAllAccounts, setGrantAllAccounts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
        setExpandedDomains(new Set<string>(catRes.domains.map((d) => d.id)));
        setSelectedPermissions(new Set<string>(catRes.domains.flatMap((d) => d.permissions.map((p) => p.id))));
      } catch (err) {
        console.error("Gagal memuat katalog izin:", err);
        toast.error("Gagal memuat katalog izin K2 Agent");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isOpen, scope]);

  const handleTierChange = (tier: "FULL" | "ROLE_PRESET" | "READ_ONLY" | "CUSTOM") => {
    setAccessTier(tier);
    if (!catalog) return;

    if (tier === "FULL") {
      setSelectedPermissions(new Set(catalog.domains.flatMap((d) => d.permissions.map((p) => p.id))));
    } else if (tier === "READ_ONLY") {
      setSelectedPermissions(new Set(catalog.domains.flatMap((d) => d.permissions.filter((p) => p.scope === "Read").map((p) => p.id))));
    } else if (tier === "ROLE_PRESET") {
      const preset = presets.find((p) => p.id === selectedPreset);
      if (preset) setSelectedPermissions(new Set(preset.default_permissions));
    }
  };

  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    setAccessTier("ROLE_PRESET");
    const preset = presets.find((p) => p.id === presetId);
    if (preset) setSelectedPermissions(new Set(preset.default_permissions));
  };

  const handleTogglePermission = (permId: string) => {
    setAccessTier("CUSTOM");
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const handleToggleDomain = (domainId: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domainId)) next.delete(domainId);
      else next.add(domainId);
      return next;
    });
  };

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
        {step === 1 ? (
          <AgentOnboardingStep1
            scope={scope}
            currentAccountName={currentAccountName}
            grantAllAccounts={grantAllAccounts}
            setGrantAllAccounts={setGrantAllAccounts}
            loading={loading}
            onNext={() => setStep(2)}
            onClose={onClose}
          />
        ) : (
          <AgentOnboardingStep2
            totalGranted={totalGranted}
            totalAvailable={totalAvailable}
            accessTier={accessTier}
            onTierChange={handleTierChange}
            presets={presets}
            selectedPreset={selectedPreset}
            onSelectPreset={handleSelectPreset}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredDomains={filteredDomains}
            expandedDomains={expandedDomains}
            selectedPermissions={selectedPermissions}
            onToggleDomain={handleToggleDomain}
            onTogglePermission={handleTogglePermission}
            submitting={submitting}
            onBack={() => setStep(1)}
            onAuthorize={handleAuthorize}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
