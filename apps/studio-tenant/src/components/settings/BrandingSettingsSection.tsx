import React, { useState, useEffect } from "react";
import { useTranslation } from "@k2net/i18n";
import { useNavigate } from "@tanstack/react-router";
import {
  Card,
  Button,
  Badge,
} from "@k2net/ui";
import { toast } from "sonner";
import {
  AlertCircle,
  Lock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useTenantBranding, type UpdateTenantBrandingPayload } from "../../hooks/useTenantBranding";
import { getApiAuthToken, getImpersonationSessionId } from "../../lib/api-client";
import { DnsConfigCard } from "./DnsConfigCard";
import { VisualIdentityCard } from "./VisualIdentityCard";
import { PortalInfoCard } from "./PortalInfoCard";

export function BrandingSettingsSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { branding, isLoading, isError, updateBranding, isUpdating, verifyDns, isVerifyingDns } = useTenantBranding();

  const [formData, setFormData] = useState<UpdateTenantBrandingPayload>({
    customDomain: "",
    appTitle: "",
    companyName: "",
    brandColorPrimary: "#2563EB",
    brandColorAccent: "#1D4ED8",
    logoUrl: "",
    faviconUrl: "",
    footerText: "",
    supportEmail: "",
    supportPhone: "",
  });

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);

  useEffect(() => {
    if (branding) {
      setFormData({
        customDomain: branding.customDomain || "",
        appTitle: branding.appTitle || "",
        companyName: branding.companyName || "",
        brandColorPrimary: branding.brandColorPrimary || "#2563EB",
        brandColorAccent: branding.brandColorAccent || "#1D4ED8",
        logoUrl: branding.logoUrl || "",
        faviconUrl: branding.faviconUrl || "",
        footerText: branding.footerText || "",
        supportEmail: branding.supportEmail || "",
        supportPhone: branding.supportPhone || "",
      });
    }
  }, [branding]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} ${t("settings.whitelabel.copied")}`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateBranding(formData);
      toast.success(t("settings.whitelabel.save_success"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("settings.whitelabel.save_error");
      toast.error(msg);
    }
  };

  const handleVerifyDns = async () => {
    try {
      const res = await verifyDns();
      if (res.verified) {
        toast.success(t("settings.whitelabel.verify_success"));
      } else {
        toast.error(res.message || t("settings.whitelabel.verify_failed"));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("settings.whitelabel.verify_failed");
      toast.error(msg);
    }
  };

  const handleFileUpload = async (file: File, type: "logo" | "favicon") => {
    const isLogo = type === "logo";
    if (isLogo) setIsUploadingLogo(true);
    else setIsUploadingFavicon(true);

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("folder", "branding");

      const reqHeaders: Record<string, string> = {};
      const token = getApiAuthToken();
      if (token) reqHeaders["Authorization"] = `Bearer ${token}`;
      const impersonationId = getImpersonationSessionId();
      if (impersonationId) reqHeaders["X-Impersonation-Session-Id"] = impersonationId;

      const res = await fetch("/api/v1/files/upload?folder=branding", {
        method: "POST",
        headers: reqHeaders,
        body: uploadData,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "Upload failed");
        throw new Error(errText || `Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      const uploadedUrl = data.url || data.fileUrl || data.path || "";
      if (isLogo) {
        setFormData((prev) => ({ ...prev, logoUrl: uploadedUrl }));
      } else {
        setFormData((prev) => ({ ...prev, faviconUrl: uploadedUrl }));
      }
      toast.success(`${isLogo ? "Logo" : "Favicon"} uploaded successfully!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "File upload failed";
      toast.error(msg);
    } finally {
      if (isLogo) setIsUploadingLogo(false);
      else setIsUploadingFavicon(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 border-border/60 bg-card space-y-4">
        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        <div className="h-24 w-full bg-muted animate-pulse rounded" />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-6 border-border/60 bg-card text-center space-y-3">
        <AlertCircle className="size-8 text-destructive mx-auto" />
        <p className="text-sm font-medium text-destructive">{t("settings.whitelabel.save_error")}</p>
      </Card>
    );
  }

  const isWhitelabelAllowed = branding?.isWhitelabelAllowed ?? false;

  return (
    <div className="space-y-6">
      {!isWhitelabelAllowed && (
        <Card className="border-amber-500/40 bg-amber-500/5 p-4 sm:p-5 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                <Lock className="size-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  {t("settings.whitelabel.locked_title")}
                  <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] px-1.5 py-0">
                    {t("settings.whitelabel.badge_locked")}
                  </Badge>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                  {t("settings.whitelabel.locked_desc")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs font-medium gap-1.5"
                onClick={() => navigate({ to: "/billing/marketplace" as unknown as string })}
              >
                <ExternalLink className="size-3.5" />
                {t("settings.whitelabel.marketplace_btn")}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-7 px-2.5 text-xs font-medium gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => navigate({ to: "/billing/license" as unknown as string })}
              >
                <Sparkles className="size-3.5" />
                {t("settings.whitelabel.upgrade_btn")}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <DnsConfigCard
          formData={formData}
          setFormData={setFormData}
          branding={branding}
          isWhitelabelAllowed={isWhitelabelAllowed}
          isVerifyingDns={isVerifyingDns}
          onVerifyDns={handleVerifyDns}
          onCopy={handleCopy}
        />

        <VisualIdentityCard
          formData={formData}
          setFormData={setFormData}
          isWhitelabelAllowed={isWhitelabelAllowed}
          onFileUpload={handleFileUpload}
          isUploadingLogo={isUploadingLogo}
          isUploadingFavicon={isUploadingFavicon}
        />

        <PortalInfoCard
          formData={formData}
          setFormData={setFormData}
          isWhitelabelAllowed={isWhitelabelAllowed}
        />

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={!isWhitelabelAllowed || isUpdating}
            className="h-7 px-3 text-xs font-medium gap-1.5"
          >
            <Sparkles className="size-3.5" />
            {isUpdating ? t("settings.whitelabel.saving") : t("settings.whitelabel.save_branding_btn")}
          </Button>
        </div>
      </form>
    </div>
  );
}
