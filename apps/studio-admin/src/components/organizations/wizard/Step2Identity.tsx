import * as React from "react";
import { Building2, Globe, Network, RefreshCw, Lock, AlertCircle, RotateCcw } from "lucide-react";
import { Input, Textarea, Button } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { generateSmartSuffix, sanitizeOrgNameToSlug } from "./useOrganizationWizardState";
import type { WizardFormData } from "./types";

interface Step2IdentityProps {
  formData: WizardFormData;
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>;
  slugError: string | null;
  setSlugError: React.Dispatch<React.SetStateAction<string | null>>;
  onRegenerateRandomSlug: () => void;
}

export function Step2Identity({
  formData,
  setFormData,
  slugError,
  setSlugError,
  onRegenerateRandomSlug,
}: Step2IdentityProps) {
  const { t } = useTranslation();

  const [freeSuffix, setFreeSuffix] = React.useState<string>(() => {
    // If slug already has suffix, extract it; otherwise generate 4-char suffix
    const parts = (formData.slug || "").split("-");
    const lastPart = parts[parts.length - 1];
    return lastPart && lastPart.length === 4 ? lastPart : generateSmartSuffix(4);
  });

  const [isManualSlug, setIsManualSlug] = React.useState<boolean>(() => {
    if (formData.plan === "FREE") return false;
    if (!formData.slug || !formData.name) return false;
    return formData.slug !== sanitizeOrgNameToSlug(formData.name);
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setSlugError(null);

    if (formData.plan === "FREE") {
      const base = sanitizeOrgNameToSlug(name);
      const smartSlug = name.trim() ? `${base}-${freeSuffix}` : "";
      setFormData((prev) => ({ ...prev, name, slug: smartSlug }));
      return;
    }

    if (!isManualSlug) {
      const autoSlug = sanitizeOrgNameToSlug(name);
      setFormData((prev) => ({ ...prev, name, slug: autoSlug }));
    } else {
      setFormData((prev) => ({ ...prev, name }));
    }
  };

  const handleRerollFreeSuffix = () => {
    const newSuffix = generateSmartSuffix(4);
    setFreeSuffix(newSuffix);
    setSlugError(null);
    const base = sanitizeOrgNameToSlug(formData.name);
    const newSlug = formData.name.trim() ? `${base}-${newSuffix}` : "";
    setFormData((prev) => ({ ...prev, slug: newSlug }));
    onRegenerateRandomSlug();
  };

  const handleResetSlugToName = () => {
    setIsManualSlug(false);
    setSlugError(null);
    const autoSlug = sanitizeOrgNameToSlug(formData.name);
    setFormData((prev) => ({ ...prev, slug: autoSlug }));
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground flex items-center gap-2">
          <Building2 className="size-3.5 text-primary" />
          <span>
            {t("organizations.wizard_org_name_label")} <span className="text-destructive">*</span>
          </span>
        </label>
        <Input
          value={formData.name}
          onChange={handleNameChange}
          placeholder={t("organizations.wizard_org_name_placeholder")}
          className="bg-card border-border text-foreground text-xs h-9"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Globe className="size-3.5 text-primary" />
            <span>
              {t("organizations.wizard_slug_label")} <span className="text-destructive">*</span>
            </span>
          </label>
          {formData.plan !== "FREE" && isManualSlug && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetSlugToName}
              className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1"
              title={t("organizations.wizard_slug_sync_title")}
            >
              <RotateCcw className="size-2.5" />
              <span>{t("organizations.wizard_slug_sync_name")}</span>
            </Button>
          )}
        </div>

        <div className="flex items-center rounded-lg border border-border bg-card px-3 h-9 text-xs">
          <span className="text-muted-foreground font-mono">https://</span>
          <input
            value={formData.slug}
            disabled={formData.plan === "FREE"}
            onChange={(e) => {
              setIsManualSlug(true);
              setSlugError(null);
              setFormData((prev) => ({
                ...prev,
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
              }));
            }}
            placeholder={formData.plan === "FREE" ? "nama-mitra-4chr" : "nusantara-fiber"}
            className="flex-1 bg-transparent border-none outline-none px-1 text-primary font-mono font-bold disabled:opacity-85"
          />
          <span className="text-muted-foreground font-mono">
            {typeof window !== "undefined" && window.location.hostname.endsWith(".localhost")
              ? ".localhost:3002"
              : ".kdua.net"}
          </span>
          {formData.plan === "FREE" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRerollFreeSuffix}
              className="h-6 w-6 p-0 ml-1 text-muted-foreground hover:text-primary transition-colors"
              title={t("organizations.wizard_slug_reroll_title")}
            >
              <RefreshCw className="size-3" />
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            {formData.plan === "FREE" ? (
              <span className="text-amber-500 font-medium flex items-center gap-1">
                <Lock className="size-2.5 shrink-0" /> {t("organizations.wizard_slug_free_hint")}
              </span>
            ) : (
              t("organizations.wizard_slug_custom_hint")
            )}
          </span>
          {formData.slug && (
            <span className="font-mono text-[10px] text-primary/80">
              {formData.slug.length} chars
            </span>
          )}
        </div>

        {slugError && (
          <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-mono">
            <AlertCircle className="size-3" /> {slugError}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Network className="size-3.5 text-muted-foreground" />
            <span>{t("organizations.wizard_custom_domain_label")}</span>
          </label>
          {formData.plan !== "ENTERPRISE" && (
            <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-mono">
              {t("organizations.wizard_enterprise_exclusive")}
            </span>
          )}
        </div>
        <Input
          value={formData.customDomain}
          disabled={formData.plan !== "ENTERPRISE"}
          onChange={(e) => setFormData((prev) => ({ ...prev, customDomain: e.target.value }))}
          placeholder={formData.plan === "ENTERPRISE" ? t("organizations.wizard_custom_domain_placeholder") : t("organizations.wizard_custom_domain_disabled_placeholder")}
          className="bg-card border-border text-foreground font-mono text-xs h-9 disabled:opacity-60"
        />
        <p className="text-[10px] text-muted-foreground">
          {formData.plan === "ENTERPRISE" ? (
            <>
              {t("organizations.wizard_custom_domain_desc")}
            </>
          ) : (
            t("organizations.wizard_custom_domain_upgrade_hint")
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">{t("organizations.wizard_website_label")}</label>
          <Input
            value={formData.website}
            onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
            placeholder="https://nusantara.net"
            className="bg-card border-border text-xs h-9"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">{t("organizations.wizard_address_label")}</label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="Jakarta, Indonesia"
            className="bg-card border-border text-xs h-9"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground">{t("organizations.wizard_description_label")}</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder={t("organizations.wizard_description_placeholder")}
          className="bg-card border-border text-xs min-h-[60px] resize-none"
        />
      </div>
    </div>
  );
}
