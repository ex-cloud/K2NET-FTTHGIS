import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Save,
  Lock,
  Sparkles,
  ExternalLink,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  Card,
  Button,
  Label,
  Switch,
  Badge,
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
import { SsoFormFields } from "./SsoFormFields";

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
  version?: number;
}

export function SsoSettingsSection({ slug }: { slug?: string }) {
  const { t } = useTranslation();
  const { license, isLoading: isLicenseLoading } = useTenantLicense();

  const isSsoAllowed = Boolean(license?.entitlements?.ssoEnabled);

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
  const [domainMappings, setDomainMappings] = React.useState<string>("");
  const [lastTestStatus, setLastTestStatus] = React.useState<string | undefined>(undefined);
  const [lastTestAt, setLastTestAt] = React.useState<string | undefined>(undefined);
  const [version, setVersion] = React.useState<number | undefined>(undefined);

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [isTesting, setIsTesting] = React.useState<boolean>(false);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState<boolean>(false);

  const handleProviderTypeChange = (nextType: string) => {
    setProviderType(nextType);
  };

  const loadSsoConfig = React.useCallback(async () => {
    if (!slug || !isSsoAllowed) return;
    setIsLoading(true);
    try {
      const { apiClient } = await import("../../lib/api-client");
      const res = await apiClient<SsoConfigResponse>(`/api/v1/organizations/${encodeURIComponent(slug)}/sso`);
      if (res && res.providerType) {
        setProviderType(res.providerType);
        setDisplayName(res.displayName || "");
        setClientId(res.clientId || "");
        setHasExistingSecret(Boolean(res.hasClientSecret));
        setIssuerUrl(res.issuerUrl || "");
        setMetadataUrl(res.metadataUrl || "");
        setSingleSignOnUrl(res.singleSignOnUrl || "");
        setEntityId(res.entityId || "");
        setSigningCertificate(res.signingCertificate || "");
        setEnforceSso(Boolean(res.enforceSso));
        setAllowBreakGlassBypass(res.allowBreakGlassBypass !== false);
        setDomainMappings(Array.isArray(res.domainMappings) ? res.domainMappings.join(", ") : "");
        setLastTestStatus(res.lastTestStatus);
        setLastTestAt(res.lastTestAt);
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
      const res = await apiClient<{ success: boolean; message: string; latencyMs?: number }>(
        `/api/v1/organizations/${encodeURIComponent(slug)}/sso/test-probe`,
        {
          method: "POST",
          body: JSON.stringify({
            providerType,
            issuerUrl: issuerUrl || undefined,
            metadataUrl: metadataUrl || undefined,
            clientId,
            clientSecret: clientSecret || undefined,
          }),
        }
      );

      if (res.success) {
        setLastTestStatus("SUCCESS");
        setLastTestAt(new Date().toISOString());
        toast.success(t("settings.sso_test_probe_success", { ms: res.latencyMs || 45 }));
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
              metadataUrl: metadataUrl.trim() || undefined,
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
        metadataUrl: metadataUrl.trim() || undefined,
        singleSignOnUrl: singleSignOnUrl.trim() || undefined,
        entityId: entityId.trim() || undefined,
        signingCertificate: signingCertificate.trim() || undefined,
        enforceSso,
        allowBreakGlassBypass,
        domainMappings: domainMappings
          .split(/[,\n]/)
          .map((d) => d.trim().toLowerCase())
          .filter((d) => d.length > 0),
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
      {!isSsoAllowed && !isLicenseLoading && <SsoLockedNoticeCard />}

      <Card className="p-5 border-border/60 bg-card space-y-5 shadow-xs">
        <SsoProbeHeader
          isSsoAllowed={isSsoAllowed}
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
          isSsoAllowed={isSsoAllowed}
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
          domainMappings={domainMappings}
          onProviderTypeChange={handleProviderTypeChange}
          onDisplayNameChange={setDisplayName}
          onClientIdChange={setClientId}
          onClientSecretChange={setClientSecret}
          onIssuerUrlChange={setIssuerUrl}
          onSingleSignOnUrlChange={setSingleSignOnUrl}
          onEntityIdChange={setEntityId}
          onSigningCertificateChange={setSigningCertificate}
          onDomainMappingsChange={setDomainMappings}
        />

        <SsoEnforcementSwitches
          isSsoAllowed={isSsoAllowed}
          isLoading={isLoading}
          lastTestStatus={lastTestStatus}
          enforceSso={enforceSso}
          allowBreakGlassBypass={allowBreakGlassBypass}
          onEnforceSsoChange={setEnforceSso}
          onAllowBreakGlassBypassChange={setAllowBreakGlassBypass}
        />

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div>
            {clientId && (
              <Button
                variant="outline"
                size="sm"
                disabled={!isSsoAllowed || isDeleting}
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
              disabled={!isSsoAllowed || isSaving || !clientId.trim()}
              onClick={handleSave}
              className="h-7 px-2.5 text-xs font-medium gap-1.5"
            >
              {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              {t("settings.sso_save_btn")}
            </Button>
          </div>
        </div>
      </Card>

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

// ── Sub-Components ─────────────────────────────────────────────────────────

function SsoLockedNoticeCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card className="border-amber-500/40 bg-amber-500/5 p-4 sm:p-5 relative overflow-hidden shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
            <Lock className="size-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              {t("settings.sso_locked_title")}
              <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] px-1.5 py-0 font-mono">
                {t("settings.sso_badge_locked")}
              </Badge>
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              {t("settings.sso_locked_desc")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs font-medium gap-1.5 border-border/80"
            onClick={() => navigate({ to: "/billing/marketplace" as unknown as string })}
          >
            <ExternalLink className="size-3.5" />
            {t("settings.sso_marketplace_btn")}
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-7 px-2.5 text-xs font-medium gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => navigate({ to: "/billing/license" as unknown as string })}
          >
            <Sparkles className="size-3.5" />
            {t("settings.sso_upgrade_btn")}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SsoProbeHeader({
  isSsoAllowed,
  isTesting,
  canProbe,
  lastTestStatus,
  lastTestAt,
  onTestProbe,
}: {
  isSsoAllowed: boolean;
  isTesting: boolean;
  canProbe: boolean;
  lastTestStatus?: string;
  lastTestAt?: string;
  onTestProbe: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-muted/30 border border-border/40">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-semibold">{t("settings.sso_integration_label")}</Label>
          <Badge
            variant="outline"
            className={
              lastTestStatus === "SUCCESS"
                ? "border-primary/40 text-primary bg-primary/10 text-[10px]"
                : lastTestStatus === "FAILED"
                ? "border-destructive/40 text-destructive bg-destructive/10 text-[10px]"
                : "border-border text-muted-foreground text-[10px]"
            }
          >
            {lastTestStatus === "SUCCESS" ? (
              <span className="flex items-center gap-1"><CheckCircle2 className="size-3" /> {t("settings.sso_status_verified")}</span>
            ) : lastTestStatus === "FAILED" ? (
              <span className="flex items-center gap-1"><AlertCircle className="size-3" /> {t("settings.sso_status_failed")}</span>
            ) : (
              t("settings.sso_status_not_tested")
            )}
          </Badge>
          {lastTestAt && (
            <span className="text-[10px] text-muted-foreground font-mono">
              ({new Date(lastTestAt).toLocaleTimeString()})
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {t("settings.sso_integration_desc")}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!isSsoAllowed || isTesting || !canProbe}
          onClick={onTestProbe}
          className="h-7 px-2.5 text-xs font-medium gap-1.5 border-border/80"
        >
          {isTesting ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5 text-primary" />}
          {isTesting ? t("settings.sso_test_probe_testing") : t("settings.sso_test_probe_btn")}
        </Button>
      </div>
    </div>
  );
}

function SsoEnforcementSwitches({
  isSsoAllowed,
  isLoading,
  lastTestStatus,
  enforceSso,
  allowBreakGlassBypass,
  onEnforceSsoChange,
  onAllowBreakGlassBypassChange,
}: {
  isSsoAllowed: boolean;
  isLoading: boolean;
  lastTestStatus?: string;
  enforceSso: boolean;
  allowBreakGlassBypass: boolean;
  onEnforceSsoChange: (val: boolean) => void;
  onAllowBreakGlassBypassChange: (val: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 pt-3 border-t border-border/50">
      <div
        className="flex items-center justify-between p-3.5 rounded-lg bg-muted/20 border border-border/50 hover:border-border/80 transition-colors cursor-pointer"
        onClick={() => {
          if (isSsoAllowed && !isLoading) {
            onEnforceSsoChange(!enforceSso);
          }
        }}
      >
        <div className="space-y-0.5 pr-4">
          <Label htmlFor="sso-enforce-switch" className="text-xs font-semibold flex items-center gap-2 cursor-pointer">
            <span>{t("settings.sso_enforce_label")}</span>
            <Badge
              variant="outline"
              className={
                enforceSso
                  ? "border-primary/40 text-primary bg-primary/10 text-[10px]"
                  : "border-border text-muted-foreground text-[10px]"
              }
            >
              {enforceSso ? "ENFORCED (ON)" : "OPTIONAL (OFF)"}
            </Badge>
            {lastTestStatus !== "SUCCESS" && (
              <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-[10px]">
                {t("settings.sso_probe_required_badge")}
              </Badge>
            )}
          </Label>
          <p className="text-[11px] text-muted-foreground">
            {t("settings.sso_enforce_desc")}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Switch
            id="sso-enforce-switch"
            disabled={!isSsoAllowed || isLoading}
            checked={enforceSso}
            onCheckedChange={onEnforceSsoChange}
          />
        </div>
      </div>

      <div
        className="flex items-center justify-between p-3.5 rounded-lg bg-muted/20 border border-border/50 hover:border-border/80 transition-colors cursor-pointer"
        onClick={() => {
          if (isSsoAllowed && !isLoading) {
            onAllowBreakGlassBypassChange(!allowBreakGlassBypass);
          }
        }}
      >
        <div className="space-y-0.5 pr-4">
          <Label htmlFor="sso-breakglass-switch" className="text-xs font-semibold flex items-center gap-2 cursor-pointer">
            <span>{t("settings.sso_break_glass_label")}</span>
            <Badge
              variant="outline"
              className={
                allowBreakGlassBypass
                  ? "border-primary/40 text-primary bg-primary/10 text-[10px]"
                  : "border-border text-muted-foreground text-[10px]"
              }
            >
              {allowBreakGlassBypass ? "ENABLED (ON)" : "DISABLED (OFF)"}
            </Badge>
          </Label>
          <p className="text-[11px] text-muted-foreground">{t("settings.sso_break_glass_desc")}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Switch
            id="sso-breakglass-switch"
            disabled={!isSsoAllowed || isLoading}
            checked={allowBreakGlassBypass}
            onCheckedChange={onAllowBreakGlassBypassChange}
          />
        </div>
      </div>
    </div>
  );
}
