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
              Organization
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">
              Status
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[140px]">
              Impersonation
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[180px]">
              Hardware Quota
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[180px]">
              Domain & SSL
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[140px]">
              Add-on Flags
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[160px] pr-6">
              Technical PIC
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {organizations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-48 text-center text-muted-foreground text-xs">
                No organizations found matching the selected filters.
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
