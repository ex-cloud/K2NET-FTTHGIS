import * as React from "react";
import { Building2 } from "lucide-react";
import { useTranslation } from "@k2net/i18n";
import type { EnrichedOrganization } from "./types";

interface OrganizationStatsHeaderProps {
  organizations: EnrichedOrganization[];
}

export function OrganizationStatsHeader({ organizations }: OrganizationStatsHeaderProps) {
  const { t } = useTranslation();
  const activeCount = organizations.filter((o) => o.status === "ACTIVE").length;
  const provisioningCount = organizations.filter((o) => o.status === "PROVISIONING").length;
  const suspendedCount = organizations.filter(
    (o) => o.status === "SUSPENDED" || o.status === "OVERDUE"
  ).length;

  return (
    <>
      <div className="px-4 md:px-6 shrink-0">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2 tracking-tight">
          <Building2 className="h-5 w-5 text-primary" />
          <span>{t("organizations.cmd_center_title")}</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("organizations.cmd_center_desc")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground/90 font-medium px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{activeCount}</span>
          <span>{t("organizations.active_orgs")}</span>
        </div>
        <span className="text-muted-foreground/30 px-1">/</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{provisioningCount}</span>
          <span>{t("organizations.provisioning")}</span>
        </div>
        <span className="text-muted-foreground/30 px-1">/</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-destructive font-mono">{suspendedCount}</span>
          <span>{t("organizations.suspended")}</span>
        </div>
        <span className="text-muted-foreground/30 px-1">/</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground font-mono">{organizations.length}</span>
          <span>{t("organizations.total")}</span>
        </div>
      </div>
    </>
  );
}
