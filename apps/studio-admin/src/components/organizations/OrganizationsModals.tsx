import * as React from "react";
import { TenantDomainModal } from "./TenantDomainModal";
import { TenantQuotaModal } from "./TenantQuotaModal";
import { TenantFeatureFlagsModal } from "./TenantFeatureFlagsModal";
import { ImpersonateTenantModal } from "./ImpersonateTenantModal";
import { OrganizationWizard } from "./OrganizationWizard";
import { DeleteOrganizationModal } from "./DeleteOrganizationModal";
import { TenantImportModal } from "./TenantImportModal";
import { toBackendPlanName, type EnrichedOrganization } from "./types";

interface OrganizationsModalsProps {
  activeDomainOrg: EnrichedOrganization | null;
  setActiveDomainOrg: (org: EnrichedOrganization | null) => void;
  activeQuotaOrg: EnrichedOrganization | null;
  setActiveQuotaOrg: (org: EnrichedOrganization | null) => void;
  activeFlagsOrg: EnrichedOrganization | null;
  setActiveFlagsOrg: (org: EnrichedOrganization | null) => void;
  activeImpersonateOrg: EnrichedOrganization | null;
  setActiveImpersonateOrg: (org: EnrichedOrganization | null) => void;
  wizardOpen: boolean;
  setWizardOpen: (open: boolean) => void;
  orgToDelete: EnrichedOrganization | null;
  setOrgToDelete: (org: EnrichedOrganization | null) => void;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (open: boolean) => void;
  refetch: () => void;
  updateOrganization?: (params: { slug: string; org: Record<string, unknown> }) => Promise<unknown>;
  deleteOrg?: (payload: { idOrSlug: string; mode: "soft" | "nuclear"; reason: string }) => Promise<unknown>;
  accessToken?: string;
}

export function OrganizationsModals({
  activeDomainOrg,
  setActiveDomainOrg,
  activeQuotaOrg,
  setActiveQuotaOrg,
  activeFlagsOrg,
  setActiveFlagsOrg,
  activeImpersonateOrg,
  setActiveImpersonateOrg,
  wizardOpen,
  setWizardOpen,
  orgToDelete,
  setOrgToDelete,
  isImportModalOpen,
  setIsImportModalOpen,
  refetch,
  updateOrganization,
  deleteOrg,
  accessToken,
}: OrganizationsModalsProps) {
  return (
    <>
      <TenantDomainModal
        organization={activeDomainOrg}
        isOpen={!!activeDomainOrg}
        onClose={() => setActiveDomainOrg(null)}
        onSaveDomain={async (_orgId, domain) => {
          if (activeDomainOrg && updateOrganization) {
            await updateOrganization({
              slug: activeDomainOrg.slug,
              org: { website: domain ? (domain.startsWith("http") ? domain : `https://${domain}`) : "" },
            });
            refetch();
          }
        }}
      />

      <TenantQuotaModal
        organization={activeQuotaOrg}
        isOpen={!!activeQuotaOrg}
        onClose={() => setActiveQuotaOrg(null)}
        onSaveQuotas={async (_orgId, quotas) => {
          if (activeQuotaOrg && updateOrganization) {
            await updateOrganization({
              slug: activeQuotaOrg.slug,
              org: {
                subscriptionPlan: {
                  name: toBackendPlanName(quotas.planTier || activeQuotaOrg.planTier),
                  maxProjects: quotas.maxOlts,
                  maxOdps: quotas.maxOdps,
                },
              },
            });
            refetch();
          }
        }}
      />

      <TenantFeatureFlagsModal
        organization={activeFlagsOrg}
        isOpen={!!activeFlagsOrg}
        onClose={() => setActiveFlagsOrg(null)}
        onSaveFlags={async () => {
          refetch();
        }}
      />

      <ImpersonateTenantModal
        organization={activeImpersonateOrg}
        isOpen={!!activeImpersonateOrg}
        onClose={() => setActiveImpersonateOrg(null)}
      />

      <OrganizationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSuccess={() => {
          refetch();
        }}
      />

      <DeleteOrganizationModal
        orgToDelete={orgToDelete}
        onClose={() => setOrgToDelete(null)}
        onDeleteSuccess={() => refetch()}
        deleteOrg={deleteOrg}
        accessToken={accessToken}
      />

      <TenantImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </>
  );
}
