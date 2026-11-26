import * as React from "react";
import {
  Save,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  Card,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import { useTenantLicense } from "../../hooks/useTenantLicense";
import { useTenantSubscription } from "../../hooks/useTenantSubscription";
import { usePermissions } from "../../hooks/use-permissions";
import { SsoFormFields } from "./SsoFormFields";
import { SsoHealthStatusCard } from "./SsoHealthStatusCard";
import {
  SsoEnforcementSwitches,
  SsoLockedNoticeCard,
  SsoProbeHeader,
} from "./SsoSettingsParts";
import { SsoVerifiedDomainsCard } from "./SsoVerifiedDomainsCard";
import { SsoScimProvisioningCard } from "./SsoScimProvisioningCard";

export interface SsoConfigResponse {
  providerType: string;
  displayName?: string;
  clientId: string;
  hasClientSecret?: boolean;
  issuerUrl?: string;
  metadataUrl?: string;
  entityId?: string;
  singleSignOnUrl?: string;
  signingCertificate?: string;
  enforceSso: boolean;
  allowBreakGlassBypass: boolean;
  domainMappings?: string[];
  status: string;
  lastTestStatus?: string;
  lastTestAt?: string;
  lastTestErrorMessage?: string;
  healthStatus?: string;
  lastHealthCheckAt?: string;
  lastHealthLatencyMs?: number;
  consecutiveProbeFailures?: number;
  lastHealthError?: string | null;
  tlsCertExpiresAt?: string | null;
  tlsCertSubject?: string | null;
  tlsCertDaysRemaining?: number | null;
  samlCertExpiresAt?: string | null;
  samlCertSubject?: string | null;
  samlCertDaysRemaining?: number | null;
  clientSecretExpiresAt?: string | null;
  clientSecretDaysRemaining?: number | null;
  lastAlertStage?: string | null;
  version?: number;
}

export function SsoSettingsSection({ slug }: { slug?: string }) {
  const { t } = useTranslation();
  const { license, isLoading: isLicenseLoading } = useTenantLicense();
  const { tier, canAccessSso, isLoading: isSubLoading } = useTenantSubscription();
  const { canAccess } = usePermissions();
  const canManageSso = canAccess(["security.sso.manage", "organizations.update"]);

  const isSsoAllowed = Boolean(
    license?.entitlements?.ssoEnabled || tier === "enterprise" || canAccessSso
  );
  const isSsoInteractive = isSsoAllowed && canManageSso;

  const [providerType, setProviderType] = React.useState<string>("GOOGLE");
  const [displayName, setDisplayName] = React.useState<string>("");
  const [clientId, setClientId] = React.useState<string>("");
  const [clientSecret, setClientSecret] = React.useState<string>("");
  const [hasExistingSecret, setHasExistingSecret] = React.useState<boolean>(false);
  const [issuerUrl, setIssuerUrl] = React.useState<string>("");
  const [metadataUrl, setMetadataUrl] = React.useState<string>("");
  const [singleSignOnUrl, setSingleSignOnUrl] = React.useState<string>("");
  const [entityId, setEntityId] = React.useState<string>("");
  const [signingCertificate, setSigningCertificate] = React.useState<string>("");
  const [enforceSso, setEnforceSso] = React.useState<boolean>(false);
  const [allowBreakGlassBypass, setAllowBreakGlassBypass] = React.useState<boolean>(true);
  const [lastTestStatus, setLastTestStatus] = React.useState<string | undefined>(undefined);
  const [lastTestAt, setLastTestAt] = React.useState<string | undefined>(undefined);
  const [clientSecretExpiresAt, setClientSecretExpiresAt] = React.useState<string>("");
  const [healthTelemetry, setHealthTelemetry] = React.useState<Partial<SsoConfigResponse>>({});
  const [version, setVersion] = React.useState<number | undefined>(undefined);

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [isTesting, setIsTesting] = React.useState<boolean>(false);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState<boolean>(false);

  const handleProviderTypeChange = (nextType: string) => {
    setProviderType(nextType);
    if (nextType !== "SAML_CUSTOM") {
      setMetadataUrl("");
    }
  };

  const handleIssuerUrlChange = (nextUrl: string) => {
    setIssuerUrl(nextUrl);
    if (providerType !== "SAML_CUSTOM") {
      setMetadataUrl("");
    }
  };

  const loadSsoConfig = React.useCallback(async () => {
    if (!slug || !isSsoAllowed) return;
    setIsLoading(true);
    try {
      const { apiClient } = await import("../../lib/api-client");
      const res = await apiClient<SsoConfigResponse>(`/api/v1/organizations/${encodeURIComponent(slug)}/sso`);
      if (res && res.providerType) {
        const loadedIsSaml = res.providerType === "SAML_CUSTOM";
        setProviderType(res.providerType);
        setDisplayName(res.displayName || "");
        setClientId(res.clientId || "");
        setHasExistingSecret(Boolean(res.hasClientSecret));
        setIssuerUrl(res.issuerUrl || (!loadedIsSaml ? res.metadataUrl || "" : ""));
        setMetadataUrl(loadedIsSaml ? res.metadataUrl || "" : "");
        setSingleSignOnUrl(res.singleSignOnUrl || "");
        setEntityId(res.entityId || "");
        setSigningCertificate(res.signingCertificate || "");
        setEnforceSso(Boolean(res.enforceSso));
        setAllowBreakGlassBypass(res.allowBreakGlassBypass !== false);
        setLastTestStatus(res.lastTestStatus);
        setLastTestAt(res.lastTestAt);
        setClientSecretExpiresAt(res.clientSecretExpiresAt ? res.clientSecretExpiresAt.slice(0, 10) : "");
        setHealthTelemetry(res);
        setVersion(res.version);
      }
    } catch {
      // 204 No Content or not configured yet
    } finally {
      setIsLoading(false);
    }
  }, [slug, isSsoAllowed]);

  React.useEffect(() => {
    loadSsoConfig();
  }, [loadSsoConfig]);

  const handleTestProbe = async () => {
    if (!slug) return;
    setIsTesting(true);
    try {
      const { apiClient } = await import("../../lib/api-client");
      const res = await apiClient<{
        success: boolean;
        message: string;
        latencyMs?: number;
        testedAt?: string;
        healthStatus?: string;
        tlsCertExpiresAt?: string | null;
        tlsCertDaysRemaining?: number | null;
        samlCertExpiresAt?: string | null;
        samlCertDaysRemaining?: number | null;
        warnings?: string[];
      }>(
        `/api/v1/organizations/${encodeURIComponent(slug)}/sso/test-probe`,
        {
          method: "POST",
          body: JSON.stringify({
            providerType,
            issuerUrl: issuerUrl || undefined,
            metadataUrl: providerType === "SAML_CUSTOM" ? (metadataUrl.trim() || undefined) : undefined,
            singleSignOnUrl: singleSignOnUrl || undefined,
            signingCertificate: signingCertificate || undefined,
            clientId,
            clientSecret: clientSecret || undefined,
          }),
        }
      );

      if (res.success) {
        setLastTestStatus("SUCCESS");
        setLastTestAt(res.testedAt || new Date().toISOString());
        setHealthTelemetry((prev) => ({
          ...prev,
          healthStatus: res.healthStatus || prev.healthStatus || "HEALTHY",
          lastHealthCheckAt: res.testedAt || new Date().toISOString(),
          lastHealthLatencyMs: res.latencyMs,
          consecutiveProbeFailures: 0,
          lastHealthError: res.warnings?.length ? res.warnings.join("; ") : null,
          tlsCertExpiresAt: res.tlsCertExpiresAt ?? prev.tlsCertExpiresAt,
          tlsCertDaysRemaining: res.tlsCertDaysRemaining ?? prev.tlsCertDaysRemaining,
          samlCertExpiresAt: res.samlCertExpiresAt ?? prev.samlCertExpiresAt,
          samlCertDaysRemaining: res.samlCertDaysRemaining ?? prev.samlCertDaysRemaining,
        }));
        toast.success(t("settings.sso_test_probe_success", { ms: res.latencyMs || 45 }));
        if (res.warnings && res.warnings.length > 0) {
          toast.warning(t("settings.sso_health_probe_warnings", { warnings: res.warnings.join("; ") }));
        }
      } else {
        setLastTestStatus("FAILED");
        toast.error(t("settings.sso_test_probe_failed", { error: res.message }));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setLastTestStatus("FAILED");
      toast.error(t("settings.sso_test_probe_failed", { error: message }));
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!slug) return;
    if (!clientId.trim()) {
      toast.error(t("settings.sso_client_id_required"));
      return;
    }

    setIsSaving(true);
    try {
      const { apiClient } = await import("../../lib/api-client");

      if (enforceSso && lastTestStatus !== "SUCCESS") {
        const probeRes = await apiClient<{ success: boolean; message: string; latencyMs?: number }>(
          `/api/v1/organizations/${encodeURIComponent(slug)}/sso/test-probe`,
          {
            method: "POST",
            body: JSON.stringify({
              providerType,
              issuerUrl: issuerUrl.trim() || undefined,
              metadataUrl: providerType === "SAML_CUSTOM" ? (metadataUrl.trim() || undefined) : undefined,
              singleSignOnUrl: singleSignOnUrl.trim() || undefined,
              signingCertificate: signingCertificate.trim() || undefined,
              clientId: clientId.trim(),
              clientSecret: clientSecret.trim() || undefined,
            }),
          }
        );
        if (!probeRes.success) {
          setLastTestStatus("FAILED");
          toast.error(t("settings.sso_test_probe_failed", { error: probeRes.message }));
          return;
        }
        setLastTestStatus("SUCCESS");
        setLastTestAt(new Date().toISOString());
      }

      const payload = {
        providerType,
        displayName: displayName || undefined,
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim() || undefined,
        issuerUrl: issuerUrl.trim() || undefined,
        metadataUrl: providerType === "SAML_CUSTOM" ? (metadataUrl.trim() || undefined) : undefined,
        singleSignOnUrl: singleSignOnUrl.trim() || undefined,
        entityId: entityId.trim() || undefined,
        signingCertificate: signingCertificate.trim() || undefined,
        clientSecretExpiresAt: clientSecretExpiresAt ? `${clientSecretExpiresAt}T23:59:59` : undefined,
        enforceSso,
        allowBreakGlassBypass,
        status: "ACTIVE",
        version,
      };

      const updated = await apiClient<SsoConfigResponse>(
        `/api/v1/organizations/${encodeURIComponent(slug)}/sso`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      setVersion(updated.version);
      setHealthTelemetry(updated);
      setClientSecretExpiresAt(updated.clientSecretExpiresAt ? updated.clientSecretExpiresAt.slice(0, 10) : "");
      if (updated.hasClientSecret) {
        setHasExistingSecret(true);
        setClientSecret("");
      }
      toast.success(t("settings.sso_saved_success"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!slug) return;
    setConfirmDeleteOpen(false);
    setIsDeleting(true);
    try {
      const { apiClient } = await import("../../lib/api-client");
      await apiClient(`/api/v1/organizations/${encodeURIComponent(slug)}/sso`, {
        method: "DELETE",
      });

      setClientId("");
      setClientSecret("");
      setHasExistingSecret(false);
      setIssuerUrl("");
      setMetadataUrl("");
      setSingleSignOnUrl("");
      setEntityId("");
      setSigningCertificate("");
      setEnforceSso(false);
      setLastTestStatus(undefined);
      setLastTestAt(undefined);
      setClientSecretExpiresAt("");
      setHealthTelemetry({});
      setVersion(undefined);
      toast.success(t("settings.sso_deleted_success"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {!isSsoAllowed && !isLicenseLoading && !isSubLoading && <SsoLockedNoticeCard />}

      {isSsoAllowed && (clientId || healthTelemetry.lastHealthCheckAt) && (
        <SsoHealthStatusCard
          healthStatus={healthTelemetry.healthStatus}
          lastHealthCheckAt={healthTelemetry.lastHealthCheckAt}
          lastHealthLatencyMs={healthTelemetry.lastHealthLatencyMs}
          consecutiveProbeFailures={healthTelemetry.consecutiveProbeFailures}
          lastHealthError={healthTelemetry.lastHealthError}
          tlsCertExpiresAt={healthTelemetry.tlsCertExpiresAt}
          tlsCertDaysRemaining={healthTelemetry.tlsCertDaysRemaining}
          samlCertExpiresAt={healthTelemetry.samlCertExpiresAt}
          samlCertDaysRemaining={healthTelemetry.samlCertDaysRemaining}
          clientSecretExpiresAt={healthTelemetry.clientSecretExpiresAt}
          clientSecretDaysRemaining={healthTelemetry.clientSecretDaysRemaining}
        />
      )}

      <Card className="p-5 border-border/60 bg-card space-y-5 shadow-xs">
        <SsoProbeHeader
          isSsoAllowed={isSsoInteractive}
          isTesting={isTesting}
          canProbe={Boolean(
            issuerUrl ||
              metadataUrl ||
              singleSignOnUrl ||
              providerType === "GOOGLE" ||
              providerType === "GITHUB"
          )}
          lastTestStatus={lastTestStatus}
          lastTestAt={lastTestAt}
          onTestProbe={handleTestProbe}
        />

        <SsoFormFields
          isSsoAllowed={isSsoInteractive}
          isLoading={isLoading}
          providerType={providerType}
          displayName={displayName}
          clientId={clientId}
          clientSecret={clientSecret}
          hasExistingSecret={hasExistingSecret}
          issuerUrl={issuerUrl}
          singleSignOnUrl={singleSignOnUrl}
          entityId={entityId}
          signingCertificate={signingCertificate}
          onProviderTypeChange={handleProviderTypeChange}
          onDisplayNameChange={setDisplayName}
          onClientIdChange={setClientId}
          onClientSecretChange={setClientSecret}
          onIssuerUrlChange={handleIssuerUrlChange}
          onSingleSignOnUrlChange={setSingleSignOnUrl}
          onEntityIdChange={setEntityId}
          onSigningCertificateChange={setSigningCertificate}
          clientSecretExpiresAt={clientSecretExpiresAt}
          onClientSecretExpiresAtChange={setClientSecretExpiresAt}
        />

        <SsoEnforcementSwitches
          isSsoAllowed={isSsoInteractive}
          isLoading={isLoading}
          lastTestStatus={lastTestStatus}
          enforceSso={enforceSso}
          allowBreakGlassBypass={allowBreakGlassBypass}
          onEnforceSsoChange={setEnforceSso}
          onAllowBreakGlassBypassChange={setAllowBreakGlassBypass}
        />

        {canManageSso && (
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div>
              {clientId && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!isSsoInteractive || isDeleting}
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="h-7 px-2.5 text-xs font-medium gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/10"
                >
                  <Trash2 className="size-3.5" />
                  {t("settings.sso_delete_btn")}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                disabled={!isSsoInteractive || isSaving || !clientId.trim()}
                onClick={handleSave}
                className="h-7 px-2.5 text-xs font-medium gap-1.5"
              >
                {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                {t("settings.sso_save_btn")}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <SsoVerifiedDomainsCard
        slug={slug}
        isSsoInteractive={isSsoInteractive}
        canManageSso={canManageSso}
      />

      {isSsoAllowed && (
        <SsoScimProvisioningCard
          slug={slug}
          isSsoInteractive={isSsoInteractive}
          canManageSso={canManageSso}
        />
      )}

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md border-border/80 bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {t("settings.sso_delete_title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("settings.sso_delete_confirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeleteOpen(false)}
              className="h-7 px-2.5 text-xs"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleDelete}
              className="h-7 px-2.5 text-xs gap-1.5"
            >
              {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
              {t("settings.sso_delete_btn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
