import * as React from "react";
import { TenantDomainModal } from "../TenantDomainModal";
import { TenantQuotaModal } from "../TenantQuotaModal";
import { TenantFeatureFlagsModal } from "../TenantFeatureFlagsModal";
import { ImpersonateTenantModal } from "../ImpersonateTenantModal";
import { DeleteOrganizationModal } from "../DeleteOrganizationModal";
import { toBackendPlanName, type EnrichedOrganization } from "../types";

interface OrgDetailModalsProps {
  org: EnrichedOrganization;
  domainModalOpen: boolean;
  setDomainModalOpen: (open: boolean) => void;
  quotaModalOpen: boolean;
  setQuotaModalOpen: (open: boolean) => void;
  flagsModalOpen: boolean;
  setFlagsModalOpen: (open: boolean) => void;
  impersonateModalOpen: boolean;
  setImpersonateModalOpen: (open: boolean) => void;
  deleteOpen: boolean;
  setDeleteOpen: (open: boolean) => void;
  refresh: () => void;
  updateOrganization?: (params: { slug: string; org: Record<string, unknown> }) => Promise<unknown>;
  deleteOrg?: (payload: { idOrSlug: string; mode: "soft" | "nuclear"; reason: string }) => Promise<unknown>;
  accessToken?: string;
  onDeleted: () => void;
}

export function OrgDetailModals({
  org,
  domainModalOpen,
  setDomainModalOpen,
  quotaModalOpen,
  setQuotaModalOpen,
  flagsModalOpen,
  setFlagsModalOpen,
  impersonateModalOpen,
  setImpersonateModalOpen,
  deleteOpen,
  setDeleteOpen,
  refresh,
  updateOrganization,
  deleteOrg,
  accessToken,
  onDeleted,
}: OrgDetailModalsProps) {
  return (
    <>
      <TenantDomainModal
        organization={org}
        isOpen={domainModalOpen}
        onClose={() => setDomainModalOpen(false)}
        onSaveDomain={async (_orgId, domain) => {
          if (updateOrganization) {
            await updateOrganization({
              slug: org.slug,
              org: { website: domain ? (domain.startsWith("http") ? domain : `https://${domain}`) : "" },
            });
            refresh();
          }
        }}
      />

      <TenantQuotaModal
        organization={org}
        isOpen={quotaModalOpen}
        onClose={() => setQuotaModalOpen(false)}
        onSaveQuotas={async (_orgId, quotas) => {
          if (updateOrganization) {
            await updateOrganization({
              slug: org.slug,
              org: {
                subscriptionPlan: {
                  name: toBackendPlanName(quotas.planTier || org.planTier),
                  maxProjects: quotas.maxOlts,
                  maxOdps: quotas.maxOdps,
                },
              },
            });
            refresh();
          }
        }}
      />

      <TenantFeatureFlagsModal
        organization={org}
        isOpen={flagsModalOpen}
        onClose={() => setFlagsModalOpen(false)}
        onSaveFlags={async () => {
          refresh();
        }}
      />

      <ImpersonateTenantModal
        organization={org}
        isOpen={impersonateModalOpen}
        onClose={() => setImpersonateModalOpen(false)}
      />

      <DeleteOrganizationModal
        orgToDelete={deleteOpen ? org : null}
        onClose={() => setDeleteOpen(false)}
        onDeleteSuccess={onDeleted}
        deleteOrg={deleteOrg}
        accessToken={accessToken}
      />
    </>
  );
}
