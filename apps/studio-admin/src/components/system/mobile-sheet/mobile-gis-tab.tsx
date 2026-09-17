import * as React from "react";
import { MapPin } from "lucide-react";
import { Badge, Button } from "@k2net/ui";
import { useSystemOverviewData } from "@/hooks/useSystemOverviewData";

interface MobileGisTabProps {
  onNavigate: (url: string) => void;
}

export function MobileGisTab({ onNavigate }: MobileGisTabProps) {
  const systemData = useSystemOverviewData();

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in-0 duration-200">
      <div className="flex items-center justify-between p-3.5 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-primary" />
          <span className="text-xs font-bold text-foreground">Spatial Map Gateway</span>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
          Port :5003 Live
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg border border-border/60 bg-card/40">
            <span className="text-[10px] text-muted-foreground block">Active Gateways</span>
            <span className="text-lg font-bold text-primary">
              {systemData.activeGatewaysCount} / {systemData.totalGatewaysCount}
            </span>
          </div>
          <div className="p-3 rounded-lg border border-border/60 bg-card/40">
            <span className="text-[10px] text-muted-foreground block">Spatial Conns</span>
            <span className="text-lg font-bold text-primary">
              {systemData.systemResources.postgresConns} Pool
            </span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border/60 bg-card/40 space-y-2">
          <span className="text-xs font-semibold text-foreground block">
            Telemetri Node FTTH Aktif
          </span>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Database PostGIS</span>
              <span className="text-primary font-mono font-medium">UP (Healthy)</span>
            </div>
            <div className="flex justify-between">
              <span>Redis Spatial Cache</span>
              <span className="text-primary font-mono font-medium">99.8% Hit</span>
            </div>
            <div className="flex justify-between">
              <span>OLT SNMP Poller</span>
              <span className="text-primary font-mono font-medium">:5010 Active</span>
            </div>
          </div>
        </div>

        <Button
          onClick={() => onNavigate("/observability/spatial-map")}
          className="w-full h-8 text-xs font-medium mt-2"
        >
          Inspect Spatial Map Engine &rarr;
        </Button>
      </div>
    </div>
  );
}
