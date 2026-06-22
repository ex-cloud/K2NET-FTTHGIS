import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity, Cpu, Database, ExternalLink, KeyRound, Server } from "lucide-react";
import Link from "next/link";
import type { ServiceNode } from "./overview-types";

interface OverviewInfrastructureMapProps {
  serviceNodes: ServiceNode[];
  activeNode: string | null;
  onSelectNode: (nodeId: string) => void;
  activeNodeData: ServiceNode | null;
}

export function OverviewInfrastructureMap({
  serviceNodes,
  activeNode,
  onSelectNode,
  activeNodeData,
}: OverviewInfrastructureMapProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="flex flex-col justify-between border-white/5 bg-[#0b0b0b]/40 p-6 lg:col-span-2">
        <div>
          <h4 className="text-sm font-semibold text-zinc-200">Infrastructure Dependency Map</h4>
          <p className="mt-0.5 text-[10px] text-zinc-500">
            Interactive logical mapping of core database, identity management, and active gateways. Click a node to view configuration telemetry.
          </p>
        </div>

        <div className="relative mt-6 h-[320px] overflow-hidden rounded-xl border border-white/[0.03] bg-zinc-950/40">
          <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-40">
            <line x1="50%" y1="15%" x2="18%" y2="40%" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 3" />
            <line x1="50%" y1="15%" x2="82%" y2="40%" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 3" />
            <line x1="50%" y1="15%" x2="50%" y2="65%" stroke="#10b981" strokeWidth="1.2" />
            <line x1="50%" y1="65%" x2="10%" y2="85%" stroke="#10b981" strokeWidth="1" />
            <line x1="50%" y1="65%" x2="35%" y2="85%" stroke="#10b981" strokeWidth="1" />
            <line x1="50%" y1="65%" x2="65%" y2="85%" stroke="#10b981" strokeWidth="1" />
            <line x1="50%" y1="65%" x2="90%" y2="85%" stroke="#10b981" strokeWidth="1" />
            <line x1="82%" y1="40%" x2="65%" y2="85%" stroke="#10b981" strokeWidth="0.8" strokeDasharray="4 4" />
            <line x1="18%" y1="40%" x2="35%" y2="85%" stroke="#10b981" strokeWidth="0.8" strokeDasharray="4 4" />
          </svg>

          {serviceNodes.map((node) => {
            const Icon = node.type === "core" ? Server : node.type === "db" ? Database : node.type === "auth" ? KeyRound : node.type === "cache" ? Activity : Cpu;
            const isSelected = activeNode === node.id;

            return (
              <button
                key={node.id}
                onClick={() => onSelectNode(node.id)}
                style={{
                  left: `${(node.x / 12) * 100}%`,
                  top: `${(node.y / 8) * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
                className={cn(
                  "absolute z-10 flex min-w-[70px] flex-col items-center justify-center rounded-xl border bg-[#0b0b0b]/90 p-3 shadow-2xl transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-emerald-500/5",
                  isSelected
                    ? "border-emerald-500/70 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20"
                    : "border-white/5 hover:border-white/20"
                )}
              >
                <div className={cn(
                  "mb-1.5 flex items-center justify-center rounded-lg border p-1.5 transition-colors",
                  isSelected
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-white/5 bg-zinc-900 text-zinc-500 group-hover:text-zinc-300"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn("h-1.5 w-1.5 rounded-full", node.status === "healthy" ? "bg-emerald-500" : node.status === "warning" ? "bg-amber-500" : "bg-red-500")} />
                  <span className="max-w-[50px] truncate text-[8px] font-mono font-bold uppercase text-zinc-400">
                    {node.id.startsWith("gw-") ? node.id.replace("gw-", "") : node.name.split(" ")[0]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="flex h-full flex-col justify-between border-white/5 bg-[#0b0b0b]/60 p-6">
        {activeNodeData ? (
          <div className="flex h-full flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-300">Service Details</h4>
                {activeNodeData.port ? (
                  <Badge variant="outline" className="border-white/10 text-[9px] font-mono text-zinc-500">
                    Port {activeNodeData.port}
                  </Badge>
                ) : null}
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-light text-zinc-100">{activeNodeData.name}</h3>
                <p className="text-[10px] leading-relaxed text-zinc-500">{activeNodeData.details}</p>
              </div>

              <div className="space-y-3 pt-3">
                <h5 className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Metrics & Telemetry</h5>
                <div className="grid grid-cols-1 gap-2.5">
                  {Object.entries(activeNodeData.metrics).map(([key, val]) => (
                    <div key={key} className="rounded-lg border border-white/[0.02] bg-zinc-950/60 p-2">
                      <span className="text-[8px] font-mono uppercase tracking-wide text-zinc-500">{key}</span>
                      <span className="mt-0.5 block text-[10px] font-medium font-mono text-zinc-300">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4">
              {activeNodeData.id.startsWith("gw-") ? (
                <Link href="/gateways/overview" className="w-full">
                  <Button variant="outline" size="sm" className="w-full gap-1.5 border-white/10 text-[10px] transition-all hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400">
                    Open Gateway Settings <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              ) : activeNodeData.id === "auth-keycloak" ? (
                <Link href="/security/auth" className="w-full">
                  <Button variant="outline" size="sm" className="w-full gap-1.5 border-white/10 text-[10px] transition-all hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400">
                    Manage IAM Policies <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              ) : (
                <Button disabled variant="outline" size="sm" className="w-full gap-1.5 border-white/10 text-[10px] text-zinc-600">
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
    </div>
  );
}
