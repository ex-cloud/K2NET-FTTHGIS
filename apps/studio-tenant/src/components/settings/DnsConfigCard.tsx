import React from "react";
import { useTranslation } from "@k2net/i18n";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Label,
  Badge,
} from "@k2net/ui";
import {
  Globe,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { UpdateTenantBrandingPayload, TenantBrandingData } from "../../hooks/useTenantBranding";

export interface DnsConfigCardProps {
  formData: UpdateTenantBrandingPayload;
  setFormData: React.Dispatch<React.SetStateAction<UpdateTenantBrandingPayload>>;
  branding: TenantBrandingData | undefined;
  isWhitelabelAllowed: boolean;
  isVerifyingDns: boolean;
  onVerifyDns: () => void;
  onResetDomain: () => void;
  onCopy: (text: string, label: string) => void;
}

export function DnsConfigCard({
  formData,
  setFormData,
  branding,
  isWhitelabelAllowed,
  isVerifyingDns,
  onVerifyDns,
  onResetDomain,
  onCopy,
}: DnsConfigCardProps) {
  const { t } = useTranslation();
  const domainStatus = branding?.domainStatus || "PENDING_DNS";
  const cnameTarget = branding?.cnameTarget || "edge.kdua.net";
  const verificationToken = branding?.verificationToken || "";

  return (
    <Card className="border-border/60 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="size-4 text-primary" />
              {t("settings.whitelabel.custom_domain_label")}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {t("settings.whitelabel.subtitle")}
            </CardDescription>
          </div>
          <div>
            {!branding?.customDomain && !formData.customDomain ? (
              <Badge variant="outline" className="border-border/60 bg-muted/40 text-muted-foreground gap-1.5 text-xs py-1">
                <Globe className="size-3.5 text-muted-foreground" />
                {t("settings.whitelabel.domain_status_unconfigured")}
              </Badge>
            ) : domainStatus === "ACTIVE" ? (
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1.5 text-xs py-1">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                {t("settings.whitelabel.domain_status_active")}
              </Badge>
            ) : domainStatus === "FAILED" ? (
              <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 gap-1.5 text-xs py-1">
                <AlertCircle className="size-3.5 text-rose-500" />
                {t("settings.whitelabel.domain_status_failed")}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1.5 text-xs py-1">
                <Clock className="size-3.5 text-amber-500" />
                {t("settings.whitelabel.domain_status_pending")}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="customDomainInput" className="text-xs font-semibold">
            {t("settings.whitelabel.custom_domain_label")}
          </Label>
          <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
            <Input
              id="customDomainInput"
              disabled={!isWhitelabelAllowed}
              placeholder={t("settings.whitelabel.custom_domain_placeholder")}
              value={formData.customDomain || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, customDomain: e.target.value }))}
              className="h-8 text-xs font-mono"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!isWhitelabelAllowed || isVerifyingDns || !formData.customDomain}
              onClick={onVerifyDns}
              className="h-8 px-3 text-xs font-medium gap-1.5 shrink-0"
            >
              <RefreshCw className={`size-3.5 ${isVerifyingDns ? "animate-spin" : ""}`} />
              {isVerifyingDns ? t("settings.whitelabel.verifying_dns") : t("settings.whitelabel.verify_dns_btn")}
            </Button>
            {(Boolean(branding?.customDomain) || Boolean(formData.customDomain)) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!isWhitelabelAllowed || isVerifyingDns}
                onClick={onResetDomain}
                className="h-8 px-2.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 dark:text-rose-400 gap-1.5 shrink-0 border-rose-500/30"
                title={t("settings.whitelabel.reset_domain_btn")}
              >
                <Trash2 className="size-3.5" />
                {t("settings.whitelabel.reset_domain_btn")}
              </Button>
            )}
          </div>
        </div>

        {formData.customDomain || branding?.customDomain ? (
          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <ShieldCheck className="size-4 text-primary" />
              {t("settings.whitelabel.dns_instructions_title")}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("settings.whitelabel.dns_instructions_desc")}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg border border-border/50 bg-background space-y-1">
                <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>{t("settings.whitelabel.cname_target_label")}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopy(cnameTarget, "CNAME Target")}
                    className="h-5 px-1.5 text-[10px] gap-1"
                  >
                    <Copy className="size-3" />
                    {t("settings.whitelabel.copy_btn")}
                  </Button>
                </div>
                <div className="font-mono text-xs font-medium text-foreground select-all">
                  {cnameTarget}
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-border/50 bg-background space-y-1">
                <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>{t("settings.whitelabel.verification_token_label")}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopy(verificationToken, "Token")}
                    className="h-5 px-1.5 text-[10px] gap-1"
                  >
                    <Copy className="size-3" />
                    {t("settings.whitelabel.copy_btn")}
                  </Button>
                </div>
                <div className="font-mono text-xs font-medium text-foreground select-all truncate">
                  {verificationToken || "k2_pending_token"}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-lg border border-dashed border-border/70 bg-muted/10 text-xs text-muted-foreground flex items-center gap-2.5">
            <Globe className="size-4 text-muted-foreground/60 shrink-0" />
            <span>{t("settings.dns_enter_domain_hint", { defaultValue: "Enter your custom domain above and click 'Verify DNS Record' to generate CNAME routing instructions." })}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
