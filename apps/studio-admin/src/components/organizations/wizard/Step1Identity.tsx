import * as React from "react";
import { Building2, Globe, Network, RefreshCw, Lock, Shuffle, AlertCircle } from "lucide-react";
import { Input, Textarea, Button } from "@k2net/ui";
import { cn } from "@/lib/utils";
import type { WizardFormData } from "./types";

interface Step1IdentityProps {
  formData: WizardFormData;
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>;
  slugError: string | null;
  setSlugError: React.Dispatch<React.SetStateAction<string | null>>;
  onRegenerateRandomSlug: () => void;
}

export function Step1Identity({
  formData,
  setFormData,
  slugError,
  setSlugError,
  onRegenerateRandomSlug,
}: Step1IdentityProps) {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (formData.slugMode === "random") {
      setFormData((prev) => ({ ...prev, name }));
      return;
    }
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug === "" || prev.slug === slug.slice(0, -1) ? slug : prev.slug,
    }));
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground flex items-center gap-2">
          <Building2 className="size-3.5 text-primary" />
          <span>
            Nama Organisasi / ISP Mitra <span className="text-destructive">*</span>
          </span>
        </label>
        <Input
          value={formData.name}
          onChange={handleNameChange}
          placeholder="e.g. PT Nusantara Fiber Optik"
          className="bg-card border-border text-foreground text-xs h-9"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Globe className="size-3.5 text-primary" />
            <span>
              Slug Subdomain Portal <span className="text-destructive">*</span>
            </span>
          </label>
          {formData.plan !== "FREE" && (
            <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg border border-border text-[10px]">
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, slugMode: "custom" }));
                  setSlugError(null);
                }}
                className={cn(
                  "px-2 py-0.5 rounded font-medium transition-all",
                  formData.slugMode === "custom"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Custom
              </button>
              <button
                type="button"
                onClick={onRegenerateRandomSlug}
                className={cn(
                  "px-2 py-0.5 rounded font-medium transition-all flex items-center gap-1",
                  formData.slugMode === "random"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Shuffle className="size-2.5 text-primary" />
                Random (20 Alpha)
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center rounded-lg border border-border bg-card px-3 h-9 text-xs">
          <span className="text-muted-foreground font-mono">https://</span>
          <input
            value={formData.slug}
            disabled={formData.plan === "FREE" || formData.slugMode === "random"}
            onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }))}
            placeholder={formData.slugMode === "random" ? "mengenerate 20 huruf..." : "nusantara-fiber"}
            className="flex-1 bg-transparent border-none outline-none px-1 text-primary font-mono font-bold disabled:opacity-85"
          />
          <span className="text-muted-foreground font-mono">
            {typeof window !== "undefined" && window.location.hostname.includes("gis.kdua.net")
              ? "-gis.kdua.net"
              : ".gis.kdua.net"}
          </span>
          {(formData.slugMode === "random" || formData.plan === "FREE") && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRegenerateRandomSlug}
              className="h-6 w-6 p-0 ml-1 text-muted-foreground hover:text-primary"
              title="Acak ulang 20 huruf"
            >
              <RefreshCw className="size-3" />
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            {formData.plan === "FREE" ? (
              <span className="text-amber-500 font-medium flex items-center gap-1">
                <Lock className="size-2.5" /> Free Tier terkunci ke Random 20-Huruf
              </span>
            ) : formData.slugMode === "random" ? (
              "20 Karakter Alfabet Murni Kriptografis (Zero Friction)"
            ) : (
              "Subdomain kustom untuk identitas brand ISP mitra"
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
        <label className="text-xs font-semibold text-foreground flex items-center gap-2">
          <Network className="size-3.5 text-muted-foreground" />
          <span>Custom White-Label FQDN Domain (Opsional)</span>
        </label>
        <Input
          value={formData.customDomain}
          onChange={(e) => setFormData((prev) => ({ ...prev, customDomain: e.target.value }))}
          placeholder="e.g. gis.nusantara.net"
          className="bg-card border-border text-foreground font-mono text-xs h-9"
        />
        <p className="text-[10px] text-muted-foreground">
          Mendukung otomatisasi SSL Let&apos;s Encrypt melalui CNAME{" "}
          <code className="text-primary font-mono">cname.kdua.net</code>.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Website Resmi</label>
          <Input
            value={formData.website}
            onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
            placeholder="https://nusantara.net"
            className="bg-card border-border text-xs h-9"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Lokasi Kantor / Wilayah Operasi</label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="Jakarta, Indonesia"
            className="bg-card border-border text-xs h-9"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground">Deskripsi Singkat</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="ISP penyedia jaringan fiber optic FTTH regional..."
          className="bg-card border-border text-xs min-h-[60px] resize-none"
        />
      </div>
    </div>
  );
}
