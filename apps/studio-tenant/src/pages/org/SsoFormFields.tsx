import * as React from "react";
import { KeyRound } from "lucide-react";
import {
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

export interface SsoFormFieldsProps {
  isSsoAllowed: boolean;
  isLoading: boolean;
  providerType: string;
  displayName: string;
  clientId: string;
  clientSecret: string;
  hasExistingSecret: boolean;
  issuerUrl: string;
  singleSignOnUrl: string;
  entityId: string;
  signingCertificate: string;
  domainMappings: string;
  onProviderTypeChange: (val: string) => void;
  onDisplayNameChange: (val: string) => void;
  onClientIdChange: (val: string) => void;
  onClientSecretChange: (val: string) => void;
  onIssuerUrlChange: (val: string) => void;
  onSingleSignOnUrlChange: (val: string) => void;
  onEntityIdChange: (val: string) => void;
  onSigningCertificateChange: (val: string) => void;
  onDomainMappingsChange: (val: string) => void;
}

export function SsoFormFields({
  isSsoAllowed,
  isLoading,
  providerType,
  displayName,
  clientId,
  clientSecret,
  hasExistingSecret,
  issuerUrl,
  singleSignOnUrl,
  entityId,
  signingCertificate,
  domainMappings,
  onProviderTypeChange,
  onDisplayNameChange,
  onClientIdChange,
  onClientSecretChange,
  onIssuerUrlChange,
  onSingleSignOnUrlChange,
  onEntityIdChange,
  onSigningCertificateChange,
  onDomainMappingsChange,
}: SsoFormFieldsProps) {
  const { t } = useTranslation();
  const isSaml = providerType === "SAML_CUSTOM";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{t("settings.sso_provider_type")}</Label>
        <Select
          disabled={!isSsoAllowed || isLoading}
          value={providerType}
          onValueChange={onProviderTypeChange}
        >
          <SelectTrigger className="h-8.5 text-xs bg-background border-border/80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GOOGLE">{t("settings.sso_provider_google")}</SelectItem>
            <SelectItem value="GITHUB">{t("settings.sso_provider_github")}</SelectItem>
            <SelectItem value="MICROSOFT_ENTRA">{t("settings.sso_provider_microsoft")}</SelectItem>
            <SelectItem value="OKTA">{t("settings.sso_provider_okta")}</SelectItem>
            <SelectItem value="OIDC_CUSTOM">{t("settings.sso_provider_custom_oidc")}</SelectItem>
            <SelectItem value="SAML_CUSTOM">{t("settings.sso_provider_custom_saml")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{t("settings.sso_display_name_label")}</Label>
        <Input
          disabled={!isSsoAllowed || isLoading}
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder="e.g. Corporate SSO"
          className="h-8.5 text-xs bg-background border-border/80"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{t("settings.sso_client_id_label")}</Label>
        <Input
          disabled={!isSsoAllowed || isLoading}
          value={clientId}
          onChange={(e) => onClientIdChange(e.target.value)}
          placeholder="e.g. k2net-enterprise-client"
          className="h-8.5 text-xs font-mono bg-background border-border/80"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold flex items-center justify-between">
          <span>{t("settings.sso_client_secret_label")}</span>
          {hasExistingSecret && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <KeyRound className="size-3 text-primary" />
              {t("settings.sso_encrypted_badge")}
            </span>
          )}
        </Label>
        <Input
          type="password"
          disabled={!isSsoAllowed || isLoading}
          value={clientSecret}
          onChange={(e) => onClientSecretChange(e.target.value)}
          placeholder={hasExistingSecret ? t("settings.sso_client_secret_placeholder") : "••••••••••••••••"}
          className="h-8.5 text-xs font-mono bg-background border-border/80"
        />
      </div>

      {!isSaml ? (
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-xs font-semibold">{t("settings.sso_discovery_url_label")}</Label>
          <Input
            disabled={!isSsoAllowed || isLoading}
            value={issuerUrl}
            onChange={(e) => onIssuerUrlChange(e.target.value)}
            placeholder="https://login.microsoftonline.com/{tenant-id}/v2.0"
            className="h-8.5 text-xs font-mono bg-background border-border/80"
          />
        </div>
      ) : (
        <>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-semibold">{t("settings.sso_sso_url_label")}</Label>
            <Input
              disabled={!isSsoAllowed || isLoading}
              value={singleSignOnUrl}
              onChange={(e) => onSingleSignOnUrlChange(e.target.value)}
              placeholder="https://idp.example.com/saml2/idp/SSOService.php"
              className="h-8.5 text-xs font-mono bg-background border-border/80"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">{t("settings.sso_entity_id_label")}</Label>
            <Input
              disabled={!isSsoAllowed || isLoading}
              value={entityId}
              onChange={(e) => onEntityIdChange(e.target.value)}
              placeholder="https://idp.example.com/entity"
              className="h-8.5 text-xs font-mono bg-background border-border/80"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-semibold">{t("settings.sso_signing_cert_label")}</Label>
            <Textarea
              disabled={!isSsoAllowed || isLoading}
              value={signingCertificate}
              onChange={(e) => onSigningCertificateChange(e.target.value)}
              placeholder="-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----"
              className="min-h-24 text-xs font-mono bg-background border-border/80"
            />
          </div>
        </>
      )}

      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-xs font-semibold">{t("settings.sso_domains_label")}</Label>
        <Input
          disabled={!isSsoAllowed || isLoading}
          value={domainMappings}
          onChange={(e) => onDomainMappingsChange(e.target.value)}
          placeholder={t("settings.sso_domains_placeholder")}
          className="h-8.5 text-xs font-mono bg-background border-border/80"
        />
        <p className="text-[10px] text-muted-foreground">
          {t("settings.sso_domains_desc")}
        </p>
      </div>
    </div>
  );
}

