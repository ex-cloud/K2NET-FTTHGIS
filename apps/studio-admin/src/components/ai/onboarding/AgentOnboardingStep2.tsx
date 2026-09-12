import React from "react";
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
  Loader2, 
  ArrowLeft 
} from "lucide-react";
import { 
  Button, 
  Input, 
  Badge 
} from "@k2net/ui";
import { 
  type PermissionCatalogData, 
  type RolePresetData 
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

interface Step2DomainAccordionProps {
  domain: PermissionCatalogData["domains"][number];
  isExpanded: boolean;
  selectedPermissions: Set<string>;
  onToggleDomain: (id: string) => void;
  onTogglePermission: (id: string) => void;
}

function Step2DomainAccordion({
  domain,
  isExpanded,
  selectedPermissions,
  onToggleDomain,
  onTogglePermission,
}: Step2DomainAccordionProps) {
  const IconComp = DOMAIN_ICON_MAP[domain.icon] || ShieldCheck;
  const domainGrantedCount = domain.permissions.filter((p) => selectedPermissions.has(p.id)).length;

  return (
    <div className="rounded-xl border border-border/80 bg-background overflow-hidden shadow-xs">
      <button
        type="button"
        onClick={() => onToggleDomain(domain.id)}
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
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border/70 divide-y divide-border/50 bg-muted/10">
          {domain.permissions.map((perm) => {
            const isChecked = selectedPermissions.has(perm.id);
            return (
              <div
                key={perm.id}
                onClick={() => onTogglePermission(perm.id)}
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
}

export interface Step2Props {
  totalGranted: number;
  totalAvailable: number;
  accessTier: "FULL" | "ROLE_PRESET" | "READ_ONLY" | "CUSTOM";
  onTierChange: (tier: "FULL" | "ROLE_PRESET" | "READ_ONLY" | "CUSTOM") => void;
  presets: RolePresetData[];
  selectedPreset: string;
  onSelectPreset: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredDomains: PermissionCatalogData["domains"];
  expandedDomains: Set<string>;
  selectedPermissions: Set<string>;
  onToggleDomain: (id: string) => void;
  onTogglePermission: (id: string) => void;
  submitting: boolean;
  onBack: () => void;
  onAuthorize: () => void;
  onClose?: () => void;
}

export function AgentOnboardingStep2({
  totalGranted,
  totalAvailable,
  accessTier,
  onTierChange,
  presets,
  selectedPreset,
  onSelectPreset,
  searchQuery,
  setSearchQuery,
  filteredDomains,
  expandedDomains,
  selectedPermissions,
  onToggleDomain,
  onTogglePermission,
  submitting,
  onBack,
  onAuthorize,
  onClose,
}: Step2Props) {
  return (
    <>
      <div className="p-4 border-b border-border/80 bg-muted/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
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

      <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
        <div className="grid grid-cols-4 gap-1 p-1 bg-background rounded-xl border border-border text-xs font-semibold text-center">
          {(["FULL", "ROLE_PRESET", "READ_ONLY", "CUSTOM"] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => onTierChange(tier)}
              className={cn(
                "py-1.5 px-2 rounded-lg transition-all cursor-pointer",
                accessTier === tier
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tier === "FULL" && "Full access"}
              {tier === "ROLE_PRESET" && "Role Preset"}
              {tier === "READ_ONLY" && "Read only"}
              {tier === "CUSTOM" && "Custom"}
            </button>
          ))}
        </div>

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
                  onClick={() => onSelectPreset(preset.id)}
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

        <div className="space-y-2">
          {filteredDomains.map((domain) => (
            <Step2DomainAccordion
              key={domain.id}
              domain={domain}
              isExpanded={expandedDomains.has(domain.id)}
              selectedPermissions={selectedPermissions}
              onToggleDomain={onToggleDomain}
              onTogglePermission={onTogglePermission}
            />
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-border/80 bg-muted/20 flex flex-col space-y-2 shrink-0">
        <p className="text-[10px] text-center text-muted-foreground">
          Anda dapat mengubah atau mencabut izin kapan saja dari pengaturan K2 Agent.
        </p>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            disabled={submitting}
            className="text-xs cursor-pointer"
          >
            Kembali
          </Button>
          <Button
            size="sm"
            onClick={onAuthorize}
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
  );
}
