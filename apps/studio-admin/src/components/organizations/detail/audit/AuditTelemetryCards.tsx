import { Badge, Card } from "@k2net/ui";
import { Activity, Globe, Users } from "lucide-react";

interface AuditTelemetryCardsProps {
  picName?: string;
}

export function AuditTelemetryCards({ picName }: AuditTelemetryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4 bg-card border-border shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary text-xs font-bold font-mono uppercase">
            <Activity className="h-4 w-4" />
            <span>SNMP Optical Poller</span>
          </div>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono">
            05:42 WIB
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          2 OLT node aktif. 14 PON ports online dengan margin optical power rata-rata <strong className="text-foreground font-mono">-18.4 dBm</strong>.
        </p>
      </Card>

      <Card className="p-4 bg-card border-border shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-500 text-xs font-bold font-mono uppercase">
            <Globe className="h-4 w-4" />
            <span>Auto-SSL Renewal</span>
          </div>
          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-500 text-[9px] font-mono">
            02:15 WIB
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Sertifikat wildcard HTTPS Traefik valid hingga <strong className="text-foreground font-mono">25 Nov 2026</strong>.
        </p>
      </Card>

      <Card className="p-4 bg-card border-border shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-500 text-xs font-bold font-mono uppercase">
            <Users className="h-4 w-4" />
            <span>Keycloak IAM Session</span>
          </div>
          <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-500 text-[9px] font-mono">
            21:04 WIB
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Admin <strong className="text-foreground">{picName || "admin"}</strong> aktif login dari IP <code className="font-mono text-xs text-primary">180.252.110.12</code>.
        </p>
      </Card>
    </div>
  );
}
