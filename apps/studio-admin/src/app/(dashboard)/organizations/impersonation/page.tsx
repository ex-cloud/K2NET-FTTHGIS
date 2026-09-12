"use client";

import { useState } from "react";
import { useImpersonationCenter, type ImpersonationSessionItem } from "@/hooks/useImpersonationCenter";
import { usePermissions } from "@/hooks/use-permissions";
import { ImpersonationCenterHeader } from "@/components/organizations/impersonation-center/ImpersonationCenterHeader";
import { ImpersonationKpiCards } from "@/components/organizations/impersonation-center/ImpersonationKpiCards";
import { ImpersonationActiveTable } from "@/components/organizations/impersonation-center/ImpersonationActiveTable";
import { ImpersonationHistoryTable } from "@/components/organizations/impersonation-center/ImpersonationHistoryTable";
import { ImpersonationAuditModal } from "@/components/organizations/impersonation-center/ImpersonationAuditModal";
import { ImpersonationRevokeModal } from "@/components/organizations/impersonation-center/ImpersonationRevokeModal";

export default function ImpersonationCenterPage() {
  const {
    stats,
    activeSessions,
    historySessions,
    loading,
    actionLoadingId,
    page,
    setPage,
    totalPages,
    totalElements,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    refresh,
    emergencyRevoke,
    reopenPortal,
  } = useImpersonationCenter();

  const { isSuperAdmin, canAccess } = usePermissions();
  const canForceRevoke = isSuperAdmin || canAccess("system.support.impersonate.force-revoke");

  // Detail Modal State
  const [selectedSession, setSelectedSession] = useState<ImpersonationSessionItem | null>(null);

  // Revoke Confirmation State
  const [revokeTarget, setRevokeTarget] = useState<ImpersonationSessionItem | null>(null);

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-background">
      <ImpersonationCenterHeader
        canForceRevoke={canForceRevoke}
        loading={loading}
        onRefresh={() => refresh()}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        <ImpersonationKpiCards stats={stats} />

        <ImpersonationActiveTable
          activeSessions={activeSessions}
          canForceRevoke={canForceRevoke}
          actionLoadingId={actionLoadingId}
          onReopenPortal={reopenPortal}
          onRevokeClick={(s) => setRevokeTarget(s)}
        />

        <ImpersonationHistoryTable
          historySessions={historySessions}
          totalElements={totalElements}
          totalPages={totalPages}
          page={page}
          setPage={setPage}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          loading={loading}
          onSelectSession={(s) => setSelectedSession(s)}
        />
      </div>

      <ImpersonationAuditModal
        selectedSession={selectedSession}
        onClose={() => setSelectedSession(null)}
      />

      <ImpersonationRevokeModal
        revokeTarget={revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={async (target) => {
          setRevokeTarget(null);
          await emergencyRevoke(target.id, target.targetOrgName);
        }}
      />
    </div>
  );
}
