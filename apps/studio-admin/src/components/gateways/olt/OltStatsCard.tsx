import React from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import type { OLTDevice } from "@/lib/actions/gateways";

interface OltStatsCardProps {
  devices: OLTDevice[];
  loading: boolean;
}

export function OltStatsCard({ devices, loading }: OltStatsCardProps) {
  const { t } = useTranslation();
  const uniqueVendorsCount = new Set(devices.map((d) => d.vendor)).size;

  return (
    <Card glowingEffect className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("gateways.olt.device_stats")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-muted-foreground">{t("gateways.olt.total_olt")}</span>
          <Badge className="bg-muted/10 text-muted-foreground border-border text-[9px]">
            {loading ? "..." : devices.length}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t("gateways.olt.unique_vendors")}</span>
          <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[9px]">
            {loading ? "..." : uniqueVendorsCount}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
