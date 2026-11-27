import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Globe,
  Loader2,
  Plus,
  ShieldAlert,
} from "lucide-react";
import { Badge, Button, Input, Label, Switch } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";

export type IpPolicyMode = "DISABLED" | "MONITOR_ONLY" | "ENFORCE";

interface DryRunResult {
  allowed: boolean;
  wouldBlockInEnforce: boolean;
  mode: string;
  reason: string;
  evaluatedIp?: string | null;
  evaluatedCountry?: string | null;
}

const PRESET_COUNTRIES = ["ID", "SG", "MY", "AU", "US", "JP", "GB", "DE"];

export interface TenantIpGeofencingCardProps {
  slug?: string;
  callerIp?: string | null;
  callerCountry?: string | null;
  platformAllowed: boolean;
  ipAllowlistCidrs: string;
  onChangeIpAllowlistCidrs: (value: string) => void;
  ipPolicyMode: IpPolicyMode;
  onChangeIpPolicyMode: (mode: IpPolicyMode) => void;
  allowedCountries: string[];
  onChangeAllowedCountries: (countries: string[]) => void;
  allowBreakGlassIpBypass: boolean;
  onChangeAllowBreakGlassIpBypass: (value: boolean) => void;
  disabled: boolean;
  canManage: boolean;
}

function CountryGeofencingSelector({
  allowedCountries,
  effectiveDisabled,
  canManage,
  onToggleCountry,
  onAddCustomCountry,
}: {
  allowedCountries: string[];
  effectiveDisabled: boolean;
  canManage: boolean;
  onToggleCountry: (code: string) => void;
  onAddCustomCountry: (code: string) => void;
}) {
  const { t } = useTranslation();
  const [customCountry, setCustomCountry] = React.useState("");
  const allCountries = React.useMemo(
    () => Array.from(new Set([...PRESET_COUNTRIES, ...allowedCountries])),
    [allowedCountries]
  );

  const handleAdd = () => {
    const clean = customCountry.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(clean)) return;
    onAddCustomCountry(clean);
    setCustomCountry("");
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{t("settings.ip_policy.countries_label")}</Label>
      <div className="flex flex-wrap items-center gap-1.5">
        {allCountries.map((cc) => (
          <Button
            key={cc}
            type="button"
            size="xs"
            variant={allowedCountries.includes(cc) ? "default" : "outline"}
            disabled={effectiveDisabled}
            onClick={() => onToggleCountry(cc)}
            className="font-mono"
          >
            {cc}
          </Button>
        ))}
        {canManage && !effectiveDisabled && (
          <div className="flex items-center gap-1 ml-1">
            <Input
              value={customCountry}
              onChange={(e) => setCustomCountry(e.target.value.toUpperCase())}
              maxLength={2}
              placeholder={t("settings.ip_policy.country_input_placeholder")}
              className="h-6 w-28 text-[11px] font-mono"
            />
            <Button type="button" size="xs" variant="outline" onClick={handleAdd}>
              {t("settings.ip_policy.country_add_btn")}
            </Button>
          </div>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">{t("settings.ip_policy.countries_desc")}</p>
    </div>
  );
}

function IpPolicyDryRunPanel({
  slug,
  ipAllowlistCidrs,
  allowedCountries,
  ipPolicyMode,
}: {
  slug?: string;
  ipAllowlistCidrs: string;
  allowedCountries: string[];
  ipPolicyMode: IpPolicyMode;
}) {
  const { t } = useTranslation();
  const [testIp, setTestIp] = React.useState("");
  const [testCountry, setTestCountry] = React.useState("");
  const [testing, setTesting] = React.useState(false);
  const [dryRunResult, setDryRunResult] = React.useState<DryRunResult | null>(null);

  const handleDryRun = async () => {
    if (!slug) return;
    try {
      setTesting(true);
      const { apiClient } = await import("../../lib/api-client");
      const res = await apiClient<DryRunResult>(
        `/api/v1/organizations/${encodeURIComponent(slug)}/security-policy/ip-policy/dry-run`,
        {
          method: "POST",
          body: JSON.stringify({
            ipAllowlistCidrs: ipAllowlistCidrs.trim(),
            allowedCountries,
            ipPolicyMode,
            testIp: testIp.trim() || undefined,
            testCountry: testCountry.trim() || undefined,
          }),
        }
      );
      setDryRunResult(res);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold">
        <FlaskConical className="size-3.5 text-primary" />
        {t("settings.ip_policy.dry_run_title")}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={testIp}
          onChange={(e) => setTestIp(e.target.value)}
          placeholder={t("settings.ip_policy.dry_run_ip_placeholder")}
          className="h-7 text-xs font-mono sm:max-w-[220px]"
        />
        <Input
          value={testCountry}
          onChange={(e) => setTestCountry(e.target.value.toUpperCase())}
          maxLength={2}
          placeholder={t("settings.ip_policy.dry_run_country_placeholder")}
          className="h-7 text-xs font-mono sm:max-w-[140px]"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={testing || !slug}
          onClick={handleDryRun}
          className="gap-1.5 shrink-0"
        >
          {testing ? <Loader2 className="size-3.5 animate-spin" /> : <FlaskConical className="size-3.5" />}
          {testing ? t("settings.ip_policy.dry_run_testing") : t("settings.ip_policy.dry_run_btn")}
        </Button>
      </div>

      {dryRunResult && (
        <div
          className={`flex items-center gap-2 rounded-md border p-2 text-xs font-mono ${
            dryRunResult.wouldBlockInEnforce
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-primary/40 bg-primary/10 text-primary"
          }`}
        >
          {dryRunResult.wouldBlockInEnforce ? (
            <ShieldAlert className="size-3.5 shrink-0" />
          ) : (
            <CheckCircle2 className="size-3.5 shrink-0" />
          )}
          <span>
            {dryRunResult.evaluatedIp || "-"} ({dryRunResult.evaluatedCountry || "-"}) —{" "}
            {!dryRunResult.wouldBlockInEnforce
              ? t("settings.ip_policy.dry_run_allowed", { reason: dryRunResult.reason })
              : dryRunResult.mode === "MONITOR_ONLY"
              ? t("settings.ip_policy.dry_run_shadow", { reason: dryRunResult.reason })
              : t("settings.ip_policy.dry_run_blocked", { reason: dryRunResult.reason })}
          </span>
        </div>
      )}
    </div>
  );
}

const MODE_OPTIONS: Array<{ mode: IpPolicyMode; labelKey: string; hintKey: string }> = [
  { mode: "DISABLED", labelKey: "settings.ip_policy.mode_disabled", hintKey: "settings.ip_policy.mode_disabled_hint" },
  { mode: "MONITOR_ONLY", labelKey: "settings.ip_policy.mode_monitor", hintKey: "settings.ip_policy.mode_monitor_hint" },
  { mode: "ENFORCE", labelKey: "settings.ip_policy.mode_enforce", hintKey: "settings.ip_policy.mode_enforce_hint" },
];

export function TenantIpGeofencingCard({
  slug,
  callerIp,
  callerCountry,
  platformAllowed,
  ipAllowlistCidrs,
  onChangeIpAllowlistCidrs,
  ipPolicyMode,
  onChangeIpPolicyMode,
  allowedCountries,
  onChangeAllowedCountries,
  allowBreakGlassIpBypass,
  onChangeAllowBreakGlassIpBypass,
  disabled,
  canManage,
}: TenantIpGeofencingCardProps) {
  const { t } = useTranslation();
  const effectiveDisabled = disabled || !platformAllowed;

  const handleAddCurrentIp = () => {
    if (!callerIp) return;
    const entry = callerIp.includes("/") ? callerIp : `${callerIp}${callerIp.includes(":") ? "/128" : "/32"}`;
    const existing = ipAllowlistCidrs.split(/[,\s\n\r;]+/).map((s) => s.trim()).filter(Boolean);
    if (!existing.includes(entry) && !existing.includes(callerIp)) {
      onChangeIpAllowlistCidrs(existing.length > 0 ? `${existing.join(", ")}, ${entry}` : entry);
      toast.success(t("settings.ip_policy.ip_added_toast", { ip: callerIp }));
    }
  };

  const toggleCountry = (code: string) => {
    const up = code.trim().toUpperCase();
    if (!up) return;
    onChangeAllowedCountries(
      allowedCountries.includes(up) ? allowedCountries.filter((c) => c !== up) : [...allowedCountries, up]
    );
  };

  const addCountry = (clean: string) => {
    if (!allowedCountries.includes(clean)) {
      onChangeAllowedCountries([...allowedCountries, clean]);
      toast.success(t("settings.ip_policy.country_added_toast", { country: clean }));
    }
  };

  const activeModeMeta = MODE_OPTIONS.find((m) => m.mode === ipPolicyMode) || MODE_OPTIONS[2];

  return (
    <div className="space-y-4 pt-3 border-t border-border/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-primary" />
          <Label className="text-xs font-semibold">{t("settings.ip_policy.title")}</Label>
          <span className="text-[10px] text-muted-foreground font-mono">IPv4 / IPv6 / ISO-2</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] font-mono">
            {t("settings.ip_policy.caller_context_label")}: {callerIp || "-"} ({callerCountry || t("settings.ip_policy.caller_country_unknown")})
          </Badge>
          {canManage && callerIp && !effectiveDisabled && (
            <Button type="button" size="xs" variant="outline" onClick={handleAddCurrentIp} className="gap-1">
              <Plus className="size-3" />
              {t("settings.ip_policy.add_current_ip_btn", { ip: callerIp })}
            </Button>
          )}
          {canManage && callerCountry && !allowedCountries.includes(callerCountry) && !effectiveDisabled && (
            <Button type="button" size="xs" variant="outline" onClick={() => addCountry(callerCountry)} className="gap-1">
              <Plus className="size-3" />
              {t("settings.ip_policy.add_current_country_btn", { country: callerCountry })}
            </Button>
          )}
        </div>
      </div>

      {!platformAllowed && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-destructive text-xs">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>{t("settings.ip_policy.platform_disabled_banner")}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{t("settings.ip_policy.mode_label")}</Label>
        <div className="flex flex-wrap gap-1.5">
          {MODE_OPTIONS.map((opt) => (
            <Button
              key={opt.mode}
              type="button"
              size="sm"
              variant={ipPolicyMode === opt.mode ? "default" : "outline"}
              disabled={effectiveDisabled}
              onClick={() => onChangeIpPolicyMode(opt.mode)}
              className="font-mono"
            >
              {t(opt.labelKey)}
            </Button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">{t(activeModeMeta.hintKey)}</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{t("settings.ip_allowlist_label")}</Label>
        <textarea
          rows={3}
          value={ipAllowlistCidrs}
          onChange={(e) => onChangeIpAllowlistCidrs(e.target.value)}
          disabled={effectiveDisabled}
          placeholder={t("settings.ip_allowlist_placeholder")}
          className="w-full rounded-md border border-border/60 bg-background/50 px-3 py-2 text-xs font-mono placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        />
        <p className="text-[10px] text-muted-foreground leading-relaxed">{t("settings.ip_allowlist_desc")}</p>
      </div>

      <CountryGeofencingSelector
        allowedCountries={allowedCountries}
        effectiveDisabled={effectiveDisabled}
        canManage={canManage}
        onToggleCountry={toggleCountry}
        onAddCustomCountry={addCountry}
      />

      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
        <div className="space-y-0.5 max-w-lg">
          <Label className="text-xs font-semibold">{t("settings.ip_policy.break_glass_label")}</Label>
          <p className="text-[11px] text-muted-foreground">{t("settings.ip_policy.break_glass_desc")}</p>
        </div>
        <Switch
          checked={allowBreakGlassIpBypass}
          disabled={effectiveDisabled}
          onCheckedChange={onChangeAllowBreakGlassIpBypass}
        />
      </div>

      <IpPolicyDryRunPanel
        slug={slug}
        ipAllowlistCidrs={ipAllowlistCidrs}
        allowedCountries={allowedCountries}
        ipPolicyMode={ipPolicyMode}
      />
    </div>
  );
}
