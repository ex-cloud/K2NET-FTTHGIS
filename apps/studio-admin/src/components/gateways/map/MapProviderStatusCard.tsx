import React from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@k2net/ui";

export function MapProviderStatusCard() {
  return (
    <Card glowingEffect className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Status Provider
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-muted-foreground">Google Maps Geocoding</span>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">Active (Primary)</Badge>
        </div>
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-muted-foreground">HERE Maps API</span>
          <Badge className="bg-background text-muted-foreground border-border text-[9px]">Standby (Failover)</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Redis Cache Instance</span>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">Connected</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
