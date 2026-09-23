import * as React from "react";
import { useParams } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import {
  PageHeader,
  PageContentShell,
  Card,
} from "@k2net/ui";

export function UserRolesPage() {
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: "Proyek", href: "/projects" },
          { label: "Subscribers", href: `/project/${projectId}/users/subscribers` },
          { label: "Peran Akses Proyek" },
        ]}
        title="Peran & Izin Akses Proyek (Spatial ABAC)"
      />

      <PageContentShell className="space-y-4 custom-scrollbar max-w-4xl">
        <Card className="p-5 border-border/60 bg-card space-y-3 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Zero-Trust Spatial ABAC Enforcement</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Staf dengan peran <strong>Teknisi</strong> dan <strong>Surveyor</strong> hanya diizinkan melihat dan mengedit aset di dalam poligon batas geografis proyek ini. Hak akses dievaluasi otomatis oleh Spring Boot Core & Keycloak JWT.
          </p>
        </Card>
      </PageContentShell>
    </div>
  );
}
