import { PageHeader, PageContentShell } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { TenantAuditExplorer } from "../../components/audit";

export function OrgAuditLogsPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title={t("security.audit_org_title")}
        breadcrumbs={[
          { label: t("nav.organizations"), href: "/projects" },
          { label: t("nav.tenant_audit_logs") },
        ]}
      />

      <PageContentShell className="space-y-4 custom-scrollbar max-w-full w-full">
        <TenantAuditExplorer scope="ORGANIZATION" />
      </PageContentShell>
    </div>
  );
}
