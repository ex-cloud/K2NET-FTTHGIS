import * as React from "react";
import { OrgToolbarFilters } from "./toolbar/OrgToolbarFilters";
import { OrgToolbarActions } from "./toolbar/OrgToolbarActions";

interface OrganizationToolbarProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  planFilter: string;
  setPlanFilter: (v: string) => void;
  viewMode: "grid" | "list" | "table";
  setViewMode: (v: "grid" | "list" | "table") => void;
  compactView: boolean;
  setCompactView: (v: boolean | ((prev: boolean) => boolean)) => void;
  loading: boolean;
  onRefresh: () => void;
  onNewOrganization: () => void;
  onImportBackup?: () => void;
}

export function OrganizationToolbar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  planFilter,
  setPlanFilter,
  viewMode,
  setViewMode,
  compactView,
  setCompactView,
  loading,
  onRefresh,
  onNewOrganization,
  onImportBackup,
}: OrganizationToolbarProps) {
  return (
    <div className="relative z-30 bg-background/50 backdrop-blur-sm py-2.5 px-6 shrink-0 border-b border-border/60">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <OrgToolbarFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          planFilter={planFilter}
          setPlanFilter={setPlanFilter}
        />

        <OrgToolbarActions
          viewMode={viewMode}
          setViewMode={setViewMode}
          compactView={compactView}
          setCompactView={setCompactView}
          loading={loading}
          onRefresh={onRefresh}
          onNewOrganization={onNewOrganization}
          onImportBackup={onImportBackup}
        />
      </div>
    </div>
  );
}
