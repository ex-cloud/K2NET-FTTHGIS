import * as React from "react";
import { PageLayout, PageHero, Button } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { KeyRound, Plus, Cpu } from "lucide-react";
import { useTenantLicense } from "../../../hooks/useTenantLicense";
import { ActiveLicenseCard } from "../../../components/licenses/ActiveLicenseCard";
import { ActivateLicenseKeyModal } from "../../../components/licenses/ActivateLicenseKeyModal";
import { BillingContactsCard } from "../../../components/licenses/BillingContactsCard";

export function LicenseOverviewPage() {
  const { t } = useTranslation();
  const {
    license,
    isLoading,
    activateLicense,
    isActivating,
    activateOfflineCertificate,
    isActivatingOffline,
    contacts,
    isContactsLoading,
    updateContacts,
    isUpdatingContacts,
  } = useTenantLicense();

  const [activateModalOpen, setActivateModalOpen] = React.useState(false);

  const planName = license?.planName || t("license.tenant.no_active_license");
  const daysRemaining = license?.daysRemaining != null ? license.daysRemaining : "—";
  const isAirGapped = Boolean(license?.machineFingerprint);

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <PageHero
        bordered={false}
        className="pb-0"
        eyebrow={t("license.hero_eyebrow")}
        title={t("license.tenant.active_title")}
        icon={KeyRound}
        subtitle={t("license.tenant.active_desc")}
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">{planName}</span>
              <span>{t("license.table.plan_tier")}</span>
            </div>
            <span className="text-muted-foreground/30 px-1">/</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground font-mono">{daysRemaining}</span>
              <span>{t("license.table.days_remaining").toLowerCase()}</span>
            </div>
            {isAirGapped && (
              <>
                <span className="text-muted-foreground/30 px-1">/</span>
                <div className="flex items-center gap-1 text-primary font-mono text-xs">
                  <Cpu className="size-3" />
                  <span>{t("license.modal.airgap_lock_badge")}</span>
                </div>
              </>
            )}
          </div>
        }
        actions={
          <Button
            variant="default"
            size="sm"
            onClick={() => setActivateModalOpen(true)}
            className="gap-1.5 h-7 px-2.5 text-xs font-medium shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>{t("license.tenant.activate_license_btn")}</span>
          </Button>
        }
      />

      <div className="w-full space-y-6">
        <ActiveLicenseCard
          license={license}
          isLoading={isLoading}
          onOpenActivateModal={() => setActivateModalOpen(true)}
        />

        <BillingContactsCard
          contacts={contacts}
          isLoading={isContactsLoading}
          onSave={updateContacts}
          isSaving={isUpdatingContacts}
        />
      </div>

      <ActivateLicenseKeyModal
        open={activateModalOpen}
        onOpenChange={setActivateModalOpen}
        onActivate={activateLicense}
        onActivateOffline={activateOfflineCertificate}
        isActivating={isActivating || isActivatingOffline}
      />
    </PageLayout>
  );
}
