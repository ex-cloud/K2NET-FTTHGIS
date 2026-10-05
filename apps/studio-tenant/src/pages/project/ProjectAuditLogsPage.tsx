import { useParams } from "@tanstack/react-router";
import { TenantAuditExplorer } from "../../components/audit";

export function ProjectAuditLogsPage() {
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <TenantAuditExplorer scope="PROJECT" projectId={projectId} />
    </div>
  );
}
