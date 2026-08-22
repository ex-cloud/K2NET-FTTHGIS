"use client";

import { ChevronDown, Check, Loader2, Search, ShieldCheck, Cpu, Activity, MapPin, Database, GitPullRequest, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PermissionCatalogData } from "@/lib/actions/gateways";

// ─── Domain icon map ─────────────────────────────────────────────────────────
const DOMAIN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Cpu, Activity, MapPin, Database, ShieldCheck, GitPullRequest, Sparkles,
};

export type PermTier = "FULL" | "READ_ONLY" | "CUSTOM";

interface AiPermissionsDomainListProps {
  catalog: PermissionCatalogData | null;
  loading: boolean;
  tier: PermTier;
  selected: Set<string>;
  search: string;
  expandedDomains: Set<string>;
  onSetTier: (tier: PermTier) => void;
  onTogglePermission: (id: string) => void;
  onToggleDomain: (id: string) => void;
  onSearchChange: (q: string) => void;
}

/**
 * Reusable permissions domain accordion — used in both Onboarding Step 2
 * and Settings view. Renders tier tabs + search + domain list.
 */
export function AiPermissionsDomainList({
  catalog,
  loading,
  tier,
  selected,
  search,
  expandedDomains,
  onSetTier,
  onTogglePermission,
  onToggleDomain,
  onSearchChange,
}: AiPermissionsDomainListProps) {
  const filteredDomains = catalog
    ? catalog.domains
        .map((d) => ({
          ...d,
          permissions: d.permissions.filter(
            (p) =>
              !search ||
              p.name.toLowerCase().includes(search.toLowerCase()) ||
              p.id.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((d) => d.permissions.length > 0)
    : [];

  return (
    <>
      {/* Tier tabs */}
      <div className="px-4 pt-3 pb-2 border-b border-border/60 shrink-0">
        <div className="flex gap-1 p-1 bg-muted rounded-xl text-xs font-semibold">
          {(["FULL", "READ_ONLY", "CUSTOM"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onSetTier(t)}
              className={cn(
                "flex-1 py-1.5 rounded-lg transition-all cursor-pointer",
                tier === t ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "FULL" ? "Full access" : t === "READ_ONLY" ? "Read only" : "Custom"}
            </button>
          ))}
        </div>
        {catalog && (
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {selected.size} permissions • read + write
          </p>
        )}
      </div>

      {/* Search */}
      <div className="px-4 py-2 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Domain accordion */}
      <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-1.5">
        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-primary" />
            Loading permissions...
          </div>
        ) : (
          filteredDomains.map((domain) => {
            const IconComp = DOMAIN_ICONS[domain.icon] || ShieldCheck;
            const isExpanded = expandedDomains.has(domain.id);
            const grantedCount = domain.permissions.filter((p) => selected.has(p.id)).length;

            return (
              <div key={domain.id} className="rounded-xl border border-border/70 bg-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => onToggleDomain(domain.id)}
                  className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <IconComp className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-xs font-semibold text-foreground">{domain.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-[10px] font-mono font-bold", grantedCount > 0 ? "text-primary" : "text-muted-foreground")}>
                      {grantedCount}
                    </span>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", !isExpanded && "-rotate-90")} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border/50 divide-y divide-border/40">
                    {domain.permissions.map((perm) => {
                      const isChecked = selected.has(perm.id);
                      return (
                        <div
                          key={perm.id}
                          onClick={() => onTogglePermission(perm.id)}
                          className="px-3 py-2 flex items-center justify-between gap-3 hover:bg-muted/30 cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground">{perm.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{perm.description}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={cn("text-[9px] font-mono", perm.scope === "Write" ? "text-amber-500" : "text-foreground/75 dark:text-muted-foreground")}>
                              {perm.scope}
                            </span>
                            <div className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0", isChecked ? "bg-primary border-primary" : "border-border")}>
                              {isChecked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                            </div>
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
    </>
  );
}

// ── Permissions Review View (Onboarding Step 2) ──────────────────────────────

interface AiDrawerPermissionsProps extends AiPermissionsDomainListProps {
  saving: boolean;
  onCancel: () => void;
  onAuthorize: () => void;
}

export function AiDrawerPermissions({ saving, onCancel, onAuthorize, selected, ...rest }: AiDrawerPermissionsProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <AiPermissionsDomainList selected={selected} {...rest} />

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/60 bg-background/95 shrink-0 space-y-2">
        <p className="text-[10px] text-center text-muted-foreground">
          You can revoke anytime from the AI settings icon.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-none px-4 py-2 rounded-xl text-xs font-semibold border border-border text-foreground hover:bg-muted cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onAuthorize}
            disabled={saving || selected.size === 0}
            className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer shadow-md shadow-primary/20 disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Authorize K2 Agent ({selected.size})
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Settings View (Manage Permissions + Revoke) ──────────────────────────────

interface AiDrawerSettingsProps extends AiPermissionsDomainListProps {
  accessTier: string;
  saving: boolean;
  revoking: boolean;
  onSave: () => void;
  onRevoke: () => void;
  selected: Set<string>;
}

export function AiDrawerSettings({ accessTier, saving, revoking, onSave, onRevoke, selected, ...rest }: AiDrawerSettingsProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Account status card */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-foreground">K2NET Core Platform (Root HQ)</p>
            <p className="text-[10px] text-primary flex items-center gap-1 font-mono mt-0.5">
              <Check className="w-3 h-3" /> API Token Active — {accessTier}
            </p>
          </div>
          <span className="text-[9px] font-mono border border-primary/30 text-primary bg-primary/10 rounded px-1.5 py-0.5">
            Current
          </span>
        </div>
      </div>

      <AiPermissionsDomainList selected={selected} {...rest} />

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/60 bg-background/95 shrink-0 space-y-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer shadow-md shadow-primary/20 disabled:opacity-60 flex items-center justify-center gap-1.5"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Save changes ({selected.size} permissions)
        </button>
        <button
          type="button"
          onClick={onRevoke}
          disabled={revoking}
          className="w-full py-2 rounded-xl border border-border text-destructive hover:bg-destructive/10 text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
        >
          {revoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "✕"}
          Revoke K2 Agent Access
        </button>
      </div>
    </div>
  );
}
