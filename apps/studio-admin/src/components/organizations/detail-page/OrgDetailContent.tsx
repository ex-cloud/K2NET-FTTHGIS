import * as React from "react";
import { OrgOverviewTab } from "../detail/OrgOverviewTab";
import { OrgHardwareTab } from "../detail/OrgHardwareTab";
import { OrgNetworkDomainTab } from "../detail/OrgNetworkDomainTab";
import { OrgTeamAccessTab } from "../detail/OrgTeamAccessTab";
import { OrgDocumentsTab } from "../detail/OrgDocumentsTab";
import { OrgApiWebhooksTab } from "../detail/OrgApiWebhooksTab";
import { OrgDataBackupsTab } from "../detail/OrgDataBackupsTab";
import { OrgBillingTab } from "../detail/OrgBillingTab";
import { OrgAuditLogsTab } from "../detail/OrgAuditLogsTab";
import { OrgDangerZoneTab } from "../detail/OrgDangerZoneTab";
import type { EnrichedOrganization, OrganizationStatus } from "../types";
import type { DetailTab } from "./types";

interface OrgDetailContentProps {
  activeTab: DetailTab;
  org: EnrichedOrganization;
  onImpersonate: () => void;
  onOpenDomainModal: () => void;
  onOpenQuotaModal: () => void;
  onOpenFlagsModal: () => void;
  onUpdateStatus: (status: OrganizationStatus) => Promise<void>;
  onDeleteClick: () => void;
}

export function OrgDetailContent({
  activeTab,
  org,
  onImpersonate,
  onOpenDomainModal,
  onOpenQuotaModal,
  onUpdateStatus,
  onDeleteClick,
}: OrgDetailContentProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
      {activeTab === "overview" && (
        <OrgOverviewTab
          organization={org}
          onOpenPlanUpgrade={onOpenQuotaModal}
        />
      )}

      {activeTab === "hardware" && (
        <OrgHardwareTab organization={org} onOpenQuotaModal={onOpenQuotaModal} />
      )}

      {activeTab === "network" && (
        <OrgNetworkDomainTab organization={org} onOpenDomainModal={onOpenDomainModal} />
      )}

      {activeTab === "team" && <OrgTeamAccessTab organization={org} />}

      {activeTab === "documents" && <OrgDocumentsTab organization={org} />}

      {activeTab === "api" && <OrgApiWebhooksTab organization={org} />}

      {activeTab === "backups" && <OrgDataBackupsTab organization={org} />}

      {activeTab === "billing" && (
        <OrgBillingTab organization={org} onOpenPlanUpgrade={onOpenQuotaModal} />
      )}

      {activeTab === "audit" && <OrgAuditLogsTab organization={org} />}

      {activeTab === "danger" && (
        <OrgDangerZoneTab
          organization={org}
          onImpersonate={onImpersonate}
          onUpdateStatus={onUpdateStatus}
          onDelete={onDeleteClick}
        />
      )}
    </div>
  );
}
