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
    <Card className="flex h-full flex-col justify-between border-border bg-card/60 p-6 z-10">
      {activeNodeData ? (
        <div className="flex h-full flex-col justify-between gap-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Service Details</h4>
              {activeNodeData.port ? (
                <Badge variant="outline" className="border-white/10 text-[9px] font-mono text-zinc-500 bg-black/40">
                  Port {activeNodeData.port}
                </Badge>
              ) : null}
            </div>

            {/* Name & Status */}
            <div className="space-y-2">
              <h3 className="text-base font-light text-zinc-100 flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    activeNodeData.status === "healthy"
                      ? "bg-emerald-500"
                      : activeNodeData.status === "warning"
                      ? "bg-amber-500"
                      : "bg-red-500"
                  )}
                />
                {activeNodeData.name}
              </h3>
              <p className="text-[10px] leading-relaxed text-zinc-500">{activeNodeData.details}</p>
            </div>

            {/* Metrics telemetry */}
            <div className="space-y-3 pt-3">
              <h5 className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Metrics &amp; Telemetry</h5>
              <div className="grid grid-cols-1 gap-2.5">
                {Object.entries(activeNodeData.metrics).map(([key, val]) => (
                  <div key={key} className="rounded-lg border border-white/[0.02] bg-zinc-950/60 p-2">
                    <span className="text-[8px] font-mono uppercase tracking-wide text-zinc-500">{key}</span>
                    <span className="mt-0.5 block text-[10px] font-medium font-mono text-zinc-300">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-components */}
            {activeSubNodes.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-border">
                <h5 className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                  Sub Components ({activeSubNodes.length})
                </h5>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {activeSubNodes.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <div
                        key={sub.id}
                        className="flex gap-2 p-1.5 rounded-lg bg-emerald-950/10 border border-emerald-500/5 items-start"
                      >
                        <SubIcon className="h-3.5 w-3.5 text-primary mt-0.5" />
                        <div>
                          <div className="text-[9px] font-bold text-zinc-300 font-mono">{sub.name}</div>
                          <div className="text-[8.5px] text-zinc-500 leading-snug">{sub.details}</div>
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
                  className="w-full gap-1.5 border-white/10 text-[10px] transition-all hover:border-primary/30 hover:bg-emerald-500/5 hover:text-primary"
                >
                  Open Gateway Settings <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            ) : activeNodeData.id === "auth-keycloak" ? (
              <Link href="/security/auth" className="w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 border-white/10 text-[10px] transition-all hover:border-primary/30 hover:bg-emerald-500/5 hover:text-primary"
                >
                  Manage IAM Policies <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            ) : (
              <Button
                disabled
                variant="outline"
                size="sm"
                className="w-full gap-1.5 border-white/10 text-[10px] text-zinc-600"
              >
                System Managed Core
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center py-12 text-zinc-600">
          <Server className="mb-2 h-8 w-8 opacity-40" />
          <span className="text-xs">Select a service to view its details.</span>
        </div>
      )}
    </Card>
  );
}
