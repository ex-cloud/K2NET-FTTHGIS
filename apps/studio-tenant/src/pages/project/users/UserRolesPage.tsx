import * as React from "react";
import { useParams } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import {
  PageLayout,
  PageHero,
  Card,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

export function UserRolesPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const _projectId = params?.projectId || "proj-bdg-01";

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <PageHero
        title={t("security.roles_matrix")}
        subtitle="Zero-Trust Spatial ABAC & Project Access Governance"
        icon={ShieldCheck}
      />

      <Card className="p-5 border-border/60 bg-card space-y-3 shadow-xs max-w-4xl">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Zero-Trust Spatial ABAC Enforcement</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("team.abac_desc", {
            defaultValue: "Staf dengan peran Teknisi dan Surveyor hanya diizinkan melihat dan mengedit aset di dalam poligon batas geografis proyek ini. Hak akses dievaluasi otomatis oleh Spring Boot Core & Keycloak JWT.",
          })}
        </p>
      </Card>
    </PageLayout>
  );
}
