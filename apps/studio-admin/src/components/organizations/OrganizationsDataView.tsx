import * as React from "react";
import { TablePageSkeleton } from "@k2net/ui";
import { cn } from "@/lib/utils";
import { OrganizationTable } from "./OrganizationTable";
import { OrganizationCard } from "./OrganizationCard";
import type { EnrichedOrganization, OrganizationStatus } from "./types";
import type { ViewMode } from "./useOrganizationsDirectory";

interface OrganizationsDataViewProps {
  isLoading: boolean;
  viewMode: ViewMode;
  filteredOrganizations: EnrichedOrganization[];
  selectedIds: string[];
  activeSession: {
    hasActiveSession: boolean;
    remainingSeconds?: number;
    targetOrgSlug?: string;
  } | null;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onImpersonate: (org: EnrichedOrganization) => void;
  onStopImpersonation: () => void;
  onReopenPortal: (slug: string) => void;
  onOpenDomainModal: (org: EnrichedOrganization) => void;
  onOpenQuotaModal: (org: EnrichedOrganization) => void;
  onOpenFlagsModal: (org: EnrichedOrganization) => void;
  onExtendTrial: (org: EnrichedOrganization) => void;
  onUpdateStatus: (org: EnrichedOrganization, newStatus: OrganizationStatus) => Promise<void>;
  onDelete: (org: EnrichedOrganization) => void;
}

export function OrganizationsDataView({
  isLoading,
  viewMode,
  filteredOrganizations,
  selectedIds,
  activeSession,
  onToggleSelect,
  onToggleSelectAll,
  onImpersonate,
  onStopImpersonation,
  onReopenPortal,
  onOpenDomainModal,
  onOpenQuotaModal,
  onOpenFlagsModal,
  onExtendTrial,
  onUpdateStatus,
  onDelete,
}: OrganizationsDataViewProps) {
  if (isLoading) {
    return (
      <div className="p-6">
        <TablePageSkeleton />
      </div>
    );
  }

  if (viewMode === "table") {
    return (
      <OrganizationTable
        organizations={filteredOrganizations}
        selectedIds={selectedIds}
        activeImpersonationSlug={activeSession?.hasActiveSession ? activeSession.targetOrgSlug : undefined}
        activeImpersonationRemainingSeconds={activeSession?.remainingSeconds}
        onToggleSelect={onToggleSelect}
        onToggleSelectAll={onToggleSelectAll}
        onImpersonate={onImpersonate}
        onStopImpersonation={onStopImpersonation}
        onReopenPortal={(org) => onReopenPortal(org.slug)}
        onOpenDomainModal={onOpenDomainModal}
        onOpenQuotaModal={onOpenQuotaModal}
        onOpenFlagsModal={onOpenFlagsModal}
        onExtendTrial={onExtendTrial}
        onUpdateStatus={onUpdateStatus}
        onDelete={onDelete}
      />
    );
  }

  return (
    <div
      className={cn(
        "p-4 md:p-6",
        viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-3"
      )}
    >
      {filteredOrganizations.length === 0 ? (
        <div className="col-span-full py-16 text-center text-xs text-muted-foreground rounded-xl border border-border bg-card">
          No organizations found matching the selected filters.
        </div>
      ) : (
        filteredOrganizations.map((org) => (
          <OrganizationCard
            key={org.id}
            organization={org}
            viewMode={viewMode}
            onImpersonate={onImpersonate}
            onOpenDomainModal={onOpenDomainModal}
            onOpenQuotaModal={onOpenQuotaModal}
            onOpenFlagsModal={onOpenFlagsModal}
            onExtendTrial={onExtendTrial}
            onUpdateStatus={onUpdateStatus}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}
