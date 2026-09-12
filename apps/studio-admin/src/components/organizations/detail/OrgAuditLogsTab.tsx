import type { EnrichedOrganization } from "../types";
import { useOrgAuditLogsState } from "./audit/useOrgAuditLogsState";
import { AuditTelemetryCards } from "./audit/AuditTelemetryCards";
import { AuditLogsTable } from "./audit/AuditLogsTable";
import { AuditEventDiffModal } from "./audit/AuditEventDiffModal";

export type { TenantAuditEvent, AuditSeverity, RawTenantAuditEvent } from "./audit/types";

interface OrgAuditLogsTabProps {
  organization: EnrichedOrganization;
}

export function OrgAuditLogsTab({ organization: org }: OrgAuditLogsTabProps) {
  const {
    searchQuery,
    setSearchQuery,
    selectedSeverity,
    setSelectedSeverity,
    selectedCategory,
    setSelectedCategory,
    selectedEvent,
    setSelectedEvent,
    isRefetching,
    filteredEvents,
    handleRefresh,
  } = useOrgAuditLogsState(org);

  return (
    <div className="space-y-6">
      {/* 1. Telemetry & Live Stream Health Banner */}
      <AuditTelemetryCards picName={org.picName} />

      {/* 2. Audit Stream Table */}
      <AuditLogsTable
        filteredEvents={filteredEvents}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedSeverity={selectedSeverity}
        setSelectedSeverity={setSelectedSeverity}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        isRefetching={isRefetching}
        onRefresh={handleRefresh}
        onInspect={(evt) => setSelectedEvent(evt)}
      />

      {/* 3. Event Payload Diff Modal */}
      <AuditEventDiffModal
        selectedEvent={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
