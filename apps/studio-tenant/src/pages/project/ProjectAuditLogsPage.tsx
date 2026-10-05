import * as React from "react";
import { useParams } from "@tanstack/react-router";
import { PageHeader, PageContentShell } from "@k2net/ui";
import { useProjects } from "../../hooks/useProjects";
import { useTranslation } from "@k2net/i18n";
import { TenantAuditExplorer } from "../../components/audit";

export function ProjectAuditLogsPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";
  const { projects } = useProjects();

  const project = React.useMemo(() => {
    return (
      projects.find((p) => p.id === projectId) || {
        name: "FTTH Project",
        code: "FTTH-PROJ",
      }
    );
  }, [projects, projectId]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: t("nav.projects"), href: "/projects" },
          { label: project.name, href: `/project/${projectId}/overview` },
          { label: t("nav.project_audit_logs") },
        ]}
        title={`${t("security.audit_proj_title")} • ${project.name}`}
      />

      <PageContentShell className="space-y-4 custom-scrollbar max-w-full w-full">
        <TenantAuditExplorer
          scope="PROJECT"
          projectId={projectId}
          title={`${t("security.audit_proj_title")} • ${project.name}`}
          description={t("security.audit_proj_desc")}
        />
      </PageContentShell>
    </div>
  );
}
