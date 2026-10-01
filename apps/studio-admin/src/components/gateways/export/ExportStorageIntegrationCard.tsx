import React from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import type { ExportJob } from "@/lib/actions/gateways";

interface ExportStorageIntegrationCardProps {
  jobs: ExportJob[];
  loading: boolean;
}

export function ExportStorageIntegrationCard({ jobs, loading }: ExportStorageIntegrationCardProps) {
  const { t } = useTranslation();
  const queuedCount = jobs.filter((j) => j.status === "queued" || j.status === "processing").length;

  return (
    <Card glowingEffect className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("gateways.export.storage_integration")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-muted-foreground">{t("gateways.export.minio_connection")}</span>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">{t("gateways.export.connected")}</Badge>
        </div>
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-muted-foreground">{t("gateways.export.worker_status")}</span>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">{t("gateways.export.ready")}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t("gateways.export.jobs_in_queue")}</span>
          <Badge className="bg-muted/10 text-muted-foreground border-border text-[9px]">
            {loading ? "..." : queuedCount}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
