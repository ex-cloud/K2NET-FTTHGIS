import { Radio, Skull, AlertOctagon, ShieldAlert as ShieldIcon } from "lucide-react";
import { Card, CardContent } from "@k2net/ui";

interface AlertsKpiCardsProps {
  criticalCount: number;
  warningCount: number;
  blockedCount: number;
}

export function AlertsKpiCards({ criticalCount, warningCount, blockedCount }: AlertsKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
      <Card glowingEffect className="bg-muted/35 border-border shadow-md backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">Global Threats Status</p>
            <Radio className={`w-4 h-4 ${criticalCount > 0 ? "text-rose-500 animate-pulse" : "text-primary"}`} />
          </div>
          <p className={`text-2xl font-bold mt-2 ${criticalCount > 0 ? "text-rose-400" : "text-primary"}`}>
            {criticalCount > 0 ? "Under Cyber Threat" : "Secured & Plausible"}
          </p>
        </CardContent>
      </Card>
      <Card glowingEffect className="bg-muted/35 border-border shadow-md backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">Critical Alerts</p>
            <Skull className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-rose-500 font-mono">{criticalCount}</p>
        </CardContent>
      </Card>
      <Card glowingEffect className="bg-muted/35 border-border shadow-md backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">Warning Anomalies</p>
            <AlertOctagon className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-amber-500 font-mono">{warningCount}</p>
        </CardContent>
      </Card>
      <Card glowingEffect className="bg-muted/35 border-border shadow-md backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">Blocked IP/CIDR Rules</p>
            <ShieldIcon className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold mt-2 text-primary font-mono">{blockedCount}</p>
        </CardContent>
      </Card>
    </div>
  );
}
