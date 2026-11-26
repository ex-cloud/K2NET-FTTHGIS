import * as React from "react";
import {
  ArrowUpCircle,
  Copy,
  KeyRound,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Badge, Button, Card } from "@k2net/ui";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import {
  PromoteSamlCertDialog,
  RetireSamlCertDialog,
  StageSamlCertDialog,
} from "./SsoSamlCertDialogs";

export interface SamlCertificateSlotDto {
  slot: "PRIMARY" | "SECONDARY" | string;
  present: boolean;
  subject?: string | null;
  issuer?: string | null;
  serialNumber?: string | null;
  sha256Fingerprint?: string | null;
  notBefore?: string | null;
  expiresAt?: string | null;
  daysRemaining?: number | null;
  status: "VALID" | "EXPIRING_SOON" | "EXPIRED" | "EMPTY" | string;
}

export interface SamlCertificatesStatusDto {
  organizationSlug: string;
  providerType?: string | null;
  configured: boolean;
  overlapActive: boolean;
  overlapStartedAt?: string | null;
  lastRotatedAt?: string | null;
  keycloakAlias?: string | null;
  spEntityId?: string | null;
  spAcsUrl?: string | null;
  spMetadataUrl?: string | null;
  primary: SamlCertificateSlotDto;
  secondary: SamlCertificateSlotDto;
  version?: number;
}

export interface SsoSamlCertRotationCardProps {
  slug?: string;
  isSsoInteractive: boolean;
  canManageSso: boolean;
  onCertificatesChanged?: () => void;
}

function getSlotStatusBadgeClass(status: string): string {
  if (status === "VALID") {
    return "border-primary/30 text-primary bg-primary/10 text-[10px] font-mono";
  }
  if (status === "EXPIRING_SOON") {
    return "border-border text-foreground bg-muted text-[10px] font-mono";
  }
  if (status === "EXPIRED") {
    return "border-destructive/40 text-destructive bg-destructive/10 text-[10px] font-mono";
  }
  return "border-border text-muted-foreground text-[10px] font-mono";
}

function getSlotStatusLabel(status: string, t: ReturnType<typeof useTranslation>["t"]): string {
  switch (status) {
    case "VALID":
      return t("settings.sso_saml_rot_status_valid");
    case "EXPIRING_SOON":
      return t("settings.sso_saml_rot_status_expiring");
    case "EXPIRED":
      return t("settings.sso_saml_rot_status_expired");
    default:
      return t("settings.sso_saml_rot_status_empty");
  }
}

function SamlCertSlotCard({
  title,
  slot,
  emptyText,
  onCopyFingerprint,
  actions,
}: {
  title: string;
  slot?: SamlCertificateSlotDto;
  emptyText?: string;
  onCopyFingerprint: (value: string) => void;
  actions?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const present = Boolean(slot?.present);
  const status = slot?.status || "EMPTY";

  return (
    <div className="p-4 rounded-lg border border-border/60 bg-muted/15 space-y-3 flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <KeyRound className="size-3.5 text-primary" />
            {title}
          </span>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={getSlotStatusBadgeClass(status)}>
              {getSlotStatusLabel(status, t)}
            </Badge>
            {present && typeof slot?.daysRemaining === "number" && (
              <Badge variant="outline" className="border-border text-muted-foreground text-[10px] font-mono">
                {slot.daysRemaining <= 0
                  ? t("settings.sso_health_expired_badge")
                  : t("settings.sso_health_days_left", { days: slot.daysRemaining })}
              </Badge>
            )}
          </div>
        </div>

        {!present ? (
          <p className="text-[11px] text-muted-foreground py-2">{emptyText}</p>
        ) : (
          <div className="space-y-2 text-[11px]">
            <div>
              <div className="text-muted-foreground">{t("settings.sso_saml_rot_fingerprint")}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <code className="text-[10px] font-mono text-foreground bg-background border border-border/60 rounded px-2 py-1 break-all flex-1">
                  {slot?.sha256Fingerprint || "—"}
                </code>
                {slot?.sha256Fingerprint && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => onCopyFingerprint(slot.sha256Fingerprint!)}
                    className="h-6 px-2 text-[11px] shrink-0"
                  >
                    <Copy className="size-3" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground block">{t("settings.sso_saml_rot_subject")}</span>
                <span className="font-mono text-foreground break-all">{slot?.subject || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">{t("settings.sso_saml_rot_issuer")}</span>
                <span className="font-mono text-foreground break-all">{slot?.issuer || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">{t("settings.sso_saml_rot_serial")}</span>
                <span className="font-mono text-foreground break-all">{slot?.serialNumber || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">{t("settings.sso_saml_rot_expires")}</span>
                <span className="font-mono text-foreground">
                  {slot?.expiresAt ? new Date(slot.expiresAt).toLocaleString() : "—"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">{actions}</div>}
    </div>
  );
}

export function SsoSamlCertRotationCard({
  slug,
  isSsoInteractive,
  canManageSso,
  onCertificatesChanged,
}: SsoSamlCertRotationCardProps) {
  const { t } = useTranslation();
  const [statusData, setStatusData] = React.useState<SamlCertificatesStatusDto | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const [stageOpen, setStageOpen] = React.useState(false);
  const [stagePem, setStagePem] = React.useState("");
  const [isStaging, setIsStaging] = React.useState(false);

  const [promoteOpen, setPromoteOpen] = React.useState(false);
  const [keepPrevious, setKeepPrevious] = React.useState(false);
  const [isPromoting, setIsPromoting] = React.useState(false);

  const [retireOpen, setRetireOpen] = React.useState(false);
  const [isRetiring, setIsRetiring] = React.useState(false);

  const loadCertificates = React.useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    try {
      const { apiClient } = await import("../../lib/api-client");
      const res = await apiClient<SamlCertificatesStatusDto>(
        `/api/v1/organizations/${encodeURIComponent(slug)}/sso/saml/certificates`
      );
      setStatusData(res);
    } catch {
      // Ignore if SAML not saved yet
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  React.useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  const handleCopy = async (val?: string | null) => {
    if (!val) return;
    try {
      await navigator.clipboard.writeText(val);
      toast.success(t("settings.sso_saml_rot_copied"));
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleStage = async () => {
    if (!slug) return;
    if (!stagePem.trim()) {
      toast.error(t("settings.sso_saml_rot_pem_required"));
      return;
    }
    setIsStaging(true);
    try {
      const { apiClient } = await import("../../lib/api-client");
      const res = await apiClient<SamlCertificatesStatusDto>(
        `/api/v1/organizations/${encodeURIComponent(slug)}/sso/saml/certificates/stage`,
        {
          method: "POST",
          body: JSON.stringify({ certificatePem: stagePem.trim() }),
        }
      );
      setStatusData(res);
      setStageOpen(false);
      setStagePem("");
      toast.success(t("settings.sso_saml_rot_stage_success"));
      onCertificatesChanged?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setIsStaging(false);
    }
  };

  const handlePromote = async () => {
    if (!slug) return;
    setIsPromoting(true);
    try {
      const { apiClient } = await import("../../lib/api-client");
      const res = await apiClient<SamlCertificatesStatusDto>(
        `/api/v1/organizations/${encodeURIComponent(slug)}/sso/saml/certificates/promote`,
        {
          method: "POST",
          body: JSON.stringify({ keepPreviousAsSecondary: keepPrevious }),
        }
      );
      setStatusData(res);
      setPromoteOpen(false);
      setKeepPrevious(false);
      toast.success(t("settings.sso_saml_rot_promote_success"));
      onCertificatesChanged?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setIsPromoting(false);
    }
  };

  const handleRetire = async () => {
    if (!slug) return;
    setIsRetiring(true);
    try {
      const { apiClient } = await import("../../lib/api-client");
      const res = await apiClient<SamlCertificatesStatusDto>(
        `/api/v1/organizations/${encodeURIComponent(slug)}/sso/saml/certificates/secondary`,
        { method: "DELETE" }
      );
      setStatusData(res);
      setRetireOpen(false);
      toast.success(t("settings.sso_saml_rot_retire_success"));
      onCertificatesChanged?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRetiring(false);
    }
  };

  const canStage = isSsoInteractive && Boolean(statusData?.primary?.present);
  const canOperateSecondary = isSsoInteractive && Boolean(statusData?.secondary?.present);

  return (
    <Card className="p-5 border-border/60 bg-card space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <h4 className="text-xs font-semibold text-foreground">
              {t("settings.sso_saml_rot_title")}
            </h4>
            {statusData?.overlapActive && (
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-[10px] font-mono">
                {t("settings.sso_health_overlap_badge")}
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">{t("settings.sso_saml_rot_desc")}</p>
          {statusData?.lastRotatedAt && (
            <p className="text-[11px] font-mono text-muted-foreground">
              {t("settings.sso_saml_rot_last_rotated", {
                time: new Date(statusData.lastRotatedAt).toLocaleString(),
              })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={loadCertificates}
            className="h-7 px-2.5 text-xs font-medium gap-1.5"
          >
            <RefreshCw className={isLoading ? "size-3.5 animate-spin" : "size-3.5"} />
            {t("common.refresh")}
          </Button>
          {canManageSso && (
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={!canStage}
              onClick={() => setStageOpen(true)}
              className="h-7 px-2.5 text-xs font-medium gap-1.5"
            >
              <Plus className="size-3.5" />
              {t("settings.sso_saml_rot_stage_btn")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
        <div className="p-2.5 rounded-md border border-border/60 bg-muted/20 font-medium text-foreground">
          {t("settings.sso_saml_rot_step_1")}
        </div>
        <div className="p-2.5 rounded-md border border-border/60 bg-muted/20 font-medium text-foreground">
          {t("settings.sso_saml_rot_step_2")}
        </div>
        <div className="p-2.5 rounded-md border border-border/60 bg-muted/20 font-medium text-foreground">
          {t("settings.sso_saml_rot_step_3")}
        </div>
      </div>

      {statusData?.spAcsUrl && (
        <div className="p-3 rounded-lg border border-border/60 bg-muted/15 space-y-2">
          <div className="text-[11px] font-semibold text-foreground">
            {t("settings.sso_saml_rot_sp_title")}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 text-[11px]">
            {[
              { label: t("settings.sso_saml_rot_sp_entity"), value: statusData.spEntityId },
              { label: t("settings.sso_saml_rot_sp_acs"), value: statusData.spAcsUrl },
              { label: t("settings.sso_saml_rot_sp_metadata"), value: statusData.spMetadataUrl },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <span className="text-muted-foreground">{item.label}</span>
                <div className="flex items-center gap-1">
                  <code className="text-[10px] font-mono bg-background border border-border/60 rounded px-2 py-1 truncate flex-1">
                    {item.value || "—"}
                  </code>
                  {item.value && (
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => handleCopy(item.value)}
                      className="h-6 px-2 text-[11px] shrink-0"
                    >
                      <Copy className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SamlCertSlotCard
          title={t("settings.sso_saml_rot_slot_primary")}
          slot={statusData?.primary}
          emptyText={t("settings.sso_saml_rot_status_empty")}
          onCopyFingerprint={handleCopy}
        />

        <SamlCertSlotCard
          title={t("settings.sso_saml_rot_slot_secondary")}
          slot={statusData?.secondary}
          emptyText={t("settings.sso_saml_rot_secondary_empty")}
          onCopyFingerprint={handleCopy}
          actions={
            canManageSso && statusData?.secondary?.present ? (
              <>
                <Button
                  type="button"
                  variant="default"
                  size="xs"
                  disabled={!canOperateSecondary}
                  onClick={() => setPromoteOpen(true)}
                  className="h-6 px-2 text-[11px] gap-1"
                >
                  <ArrowUpCircle className="size-3" />
                  {t("settings.sso_saml_rot_promote_btn")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={!canOperateSecondary}
                  onClick={() => setRetireOpen(true)}
                  className="h-6 px-2 text-[11px] gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <Trash2 className="size-3" />
                  {t("settings.sso_saml_rot_retire_btn")}
                </Button>
              </>
            ) : undefined
          }
        />
      </div>

      <StageSamlCertDialog
        open={stageOpen}
        onOpenChange={setStageOpen}
        certificatePem={stagePem}
        onCertificatePemChange={setStagePem}
        isSubmitting={isStaging}
        onConfirm={handleStage}
      />

      <PromoteSamlCertDialog
        open={promoteOpen}
        onOpenChange={setPromoteOpen}
        keepPreviousAsSecondary={keepPrevious}
        onKeepPreviousChange={setKeepPrevious}
        isSubmitting={isPromoting}
        onConfirm={handlePromote}
      />

      <RetireSamlCertDialog
        open={retireOpen}
        onOpenChange={setRetireOpen}
        isSubmitting={isRetiring}
        onConfirm={handleRetire}
      />
    </Card>
  );
}
