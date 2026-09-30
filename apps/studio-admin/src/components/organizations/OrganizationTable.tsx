import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Checkbox,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import type { EnrichedOrganization, OrganizationStatus } from "./types";
import { OrganizationTableRow } from "./table/OrganizationTableRow";

interface OrganizationTableProps {
  organizations: EnrichedOrganization[];
  selectedIds: string[];
  activeImpersonationSlug?: string;
  activeImpersonationRemainingSeconds?: number;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onImpersonate: (org: EnrichedOrganization) => void;
  onStopImpersonation?: (org: EnrichedOrganization) => void;
  onReopenPortal?: (org: EnrichedOrganization) => void;
  onOpenDomainModal: (org: EnrichedOrganization) => void;
  onOpenQuotaModal: (org: EnrichedOrganization) => void;
  onOpenFlagsModal: (org: EnrichedOrganization) => void;
  onExtendTrial: (org: EnrichedOrganization) => void;
  onUpdateStatus: (org: EnrichedOrganization, status: OrganizationStatus) => void;
  onDelete: (org: EnrichedOrganization) => void;
}

export function OrganizationTable({
  organizations,
  selectedIds,
  activeImpersonationSlug,
  activeImpersonationRemainingSeconds,
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
}: OrganizationTableProps) {
  const { t } = useTranslation();
  const allSelected = organizations.length > 0 && selectedIds.length === organizations.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < organizations.length;

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/40 border-b border-border/80">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40px] pl-6">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={onToggleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[220px]">
              {t("organizations.org_name")}
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">
              {t("organizations.status")}
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[140px]">
              {t("organizations.impersonate_tenant")}
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[180px]">
              {t("billing.hardware_capacity")}
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[180px]">
              {t("organizations.tab_network")}
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[140px]">
              {t("nav.settings")}
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[160px] pr-6">
              {t("organizations.pic_name")}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {organizations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-48 text-center text-muted-foreground text-xs">
                {t("common.no_data")}
              </TableCell>
            </TableRow>
          ) : (
            organizations.map((org) => {
              const isSelected = selectedIds.includes(org.id);
              const isImpersonatingThisOrg = Boolean(
                activeImpersonationSlug &&
                  activeImpersonationSlug === org.slug &&
                  (activeImpersonationRemainingSeconds ?? 0) > 0
              );

              return (
                <OrganizationTableRow
                  key={org.id}
                  organization={org}
                  isSelected={isSelected}
                  isImpersonatingThisOrg={isImpersonatingThisOrg}
                  activeImpersonationRemainingSeconds={activeImpersonationRemainingSeconds}
                  onToggleSelect={onToggleSelect}
                  onImpersonate={onImpersonate}
                  onStopImpersonation={onStopImpersonation}
                  onReopenPortal={onReopenPortal}
                  onOpenDomainModal={onOpenDomainModal}
                  onOpenQuotaModal={onOpenQuotaModal}
                  onOpenFlagsModal={onOpenFlagsModal}
                  onExtendTrial={onExtendTrial}
                  onUpdateStatus={onUpdateStatus}
                  onDelete={onDelete}
                />
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
