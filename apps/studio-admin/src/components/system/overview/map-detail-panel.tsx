"use client";

import { Badge } from "@k2net/ui";
import { Button } from "@k2net/ui";
import { Card } from "@k2net/ui";
import { ExternalLink, Server } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ServiceNode } from "./overview-types";
import type { SubNode } from "./overview-map-types";

interface MapDetailPanelProps {
  activeNodeData: ServiceNode | null;
  activeSubNodes: SubNode[];
}

export function MapDetailPanel({ activeNodeData, activeSubNodes }: MapDetailPanelProps) {
  return (
    <Card className="flex h-full flex-col justify-between border-border bg-card p-6 z-10">
      {activeNodeData ? (
        <div className="flex h-full flex-col justify-between gap-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground/75 dark:text-muted-foreground">Service Details</h4>
              {activeNodeData.port ? (
                <Badge variant="outline" className="border-border text-[9px] font-mono text-muted-foreground bg-muted/40 font-bold">
                  Port {activeNodeData.port}
                </Badge>
              ) : null}
            </div>

            {/* Name & Status */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    activeNodeData.status === "healthy"
                      ? "bg-primary"
                      : activeNodeData.status === "warning"
                      ? "bg-amber-500"
                      : "bg-red-500"
                  )}
                />
                {activeNodeData.name}
              </h3>
              <p className="text-[10px] leading-relaxed text-muted-foreground">{activeNodeData.details}</p>
            </div>

            {/* Metrics telemetry */}
            <div className="space-y-3 pt-3">
              <h5 className="text-[9px] font-bold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground/70">Metrics &amp; Telemetry</h5>
              <div className="grid grid-cols-1 gap-2.5">
                {Object.entries(activeNodeData.metrics).map(([key, val]) => (
                  <div key={key} className="rounded-lg border border-border bg-muted/30 p-2">
                    <span className="text-[8px] font-mono uppercase tracking-wide text-foreground/75 dark:text-muted-foreground/65">{key}</span>
                    <span className="mt-0.5 block text-[10px] font-bold font-mono text-foreground">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-components */}
            {activeSubNodes.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-border">
                <h5 className="text-[9px] font-bold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground/70">
                  Sub Components ({activeSubNodes.length})
                </h5>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {activeSubNodes.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <div
                        key={sub.id}
                        className="flex gap-2 p-1.5 rounded-lg bg-primary/5 border border-primary/10 items-start"
                      >
                        <SubIcon className="h-3.5 w-3.5 text-primary mt-0.5" />
                        <div>
                          <div className="text-[9px] font-bold text-foreground font-mono">{sub.name}</div>
                          <div className="text-[8.5px] text-muted-foreground leading-snug">{sub.details}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer action */}
          <div className="border-t border-border pt-4">
            {activeNodeData.id.startsWith("gw-") ? (
              <Link href="/gateways/overview" className="w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 border-border text-[10px] text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  Open Gateway Settings <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            ) : activeNodeData.id === "auth-keycloak" ? (
              <Link href="/security/auth" className="w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 border-border text-[10px] text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  Manage IAM Policies <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            ) : (
              <Button
                disabled
                variant="outline"
                size="sm"
                className="w-full gap-1.5 border-border text-[10px] text-muted-foreground/60"
              >
                System Managed Core
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center py-12 text-muted-foreground">
          <Server className="mb-2 h-8 w-8 opacity-40" />
          <span className="text-xs">Select a service to view its details.</span>
        </div>
      )}
    </Card>
  );
}
