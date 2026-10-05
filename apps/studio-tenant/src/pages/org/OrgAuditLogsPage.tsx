import { TenantAuditExplorer } from "../../components/audit";

export function OrgAuditLogsPage() {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <TenantAuditExplorer scope="ORGANIZATION" />
    </div>
  );
}
