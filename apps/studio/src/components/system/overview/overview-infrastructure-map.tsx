import React, { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Activity,
  Cpu,
  CreditCard,
  Database,
  FileText,
  HardDrive,
  KeyRound,
  Layers,
  Lock,
  Map,
  MessageSquare,
  Radio,
  RefreshCw,
  Server,
  Shield,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { ServiceNode } from "./overview-types";
import type { ParentConnection, SubNode } from "./overview-map-types";
import { MapDetailPanel } from "./map-detail-panel";

// ─── Static data ─────────────────────────────────────────────────────────────

const subNodesMap: Record<string, SubNode[]> = {
  "core-router": [
    { id: "sub-kong-rl", name: "Rate Limit", details: "Global request throttling (100 req/min)", icon: Zap, xOffset: -30, yOffset: -50 },
    { id: "sub-kong-ip", name: "IP Rules", details: "WhatsApp webhook whitelist CIDR", icon: Shield, xOffset: 0, yOffset: -65 },
    { id: "sub-kong-jwt", name: "JWT Auth", details: "Validation of Keycloak JWT signatures", icon: Lock, xOffset: 30, yOffset: -50 },
  ],
  "auth-keycloak": [
    { id: "sub-kc-realm", name: "Realms", details: "Multi-tenant isolation configurations", icon: Layers, xOffset: -45, yOffset: 25 },
    { id: "sub-kc-mfa", name: "MFA Policy", details: "Multi-factor authentication check", icon: Shield, xOffset: -45, yOffset: -25 },
  ],
  "db-postgres": [
    { id: "sub-pg-part", name: "Partitions", details: "Audit Logs monthly tables partitioned", icon: Database, xOffset: 45, yOffset: -25 },
    { id: "sub-pg-spatial", name: "PostGIS", details: "Spatial mapping & coordinate functions", icon: Map, xOffset: 45, yOffset: 25 },
  ],
  "cache-redis": [
    { id: "sub-rd-pub", name: "Pub/Sub", details: "Event dispatcher channels (network-events)", icon: Radio, xOffset: -25, yOffset: 55 },
    { id: "sub-rd-tile", name: "Tile Cache", details: "Cached spatial map tiles storage", icon: Layers, xOffset: 25, yOffset: 55 },
  ],
  "gw-notification": [
    { id: "sub-gw-not-smtp", name: "Brevo SMTP", details: "Automated SMTP billing emails", icon: FileText, xOffset: -35, yOffset: 40 },
    { id: "sub-gw-not-wa", name: "WhatsApp", details: "Direct OLT status triggers to Whatsapp", icon: MessageSquare, xOffset: 5, yOffset: 50 },
  ],
  "gw-payment": [
    { id: "sub-gw-pay-xen", name: "Xendit SDK", details: "Integrations for checkout URLs", icon: CreditCard, xOffset: -10, yOffset: 50 },
  ],
  "gw-map": [
    { id: "sub-gw-map-api", name: "Geocoding", details: "Here Maps & Google Maps client API", icon: Map, xOffset: 10, yOffset: 50 },
  ],
  "gw-storage": [
    { id: "sub-gw-st-s3", name: "MinIO S3", details: "Bucket links (db-backups & static WebP)", icon: HardDrive, xOffset: 35, yOffset: 40 },
  ],
};

const parentConnections: ParentConnection[] = [
  { from: "core-router", to: "auth-keycloak", dashed: true },
  { from: "core-router", to: "db-postgres", dashed: true },
  { from: "core-router", to: "cache-redis", dashed: false },
  { from: "cache-redis", to: "gw-notification", dashed: false },
  { from: "cache-redis", to: "gw-payment", dashed: false },
  { from: "cache-redis", to: "gw-map", dashed: false },
  { from: "cache-redis", to: "gw-storage", dashed: false },
  { from: "auth-keycloak", to: "gw-payment", dashed: true },
  { from: "db-postgres", to: "gw-map", dashed: true },
];

const relationsMap: Record<string, string[]> = {
  "core-router": ["auth-keycloak", "db-postgres", "cache-redis", "gw-notification", "gw-payment", "gw-map", "gw-storage"],
  "auth-keycloak": ["core-router", "gw-payment"],
  "db-postgres": ["core-router", "cache-redis", "gw-map", "gw-notification", "gw-payment", "gw-storage"],
  "cache-redis": ["core-router", "db-postgres", "gw-notification", "gw-payment", "gw-map", "gw-storage"],
  "gw-notification": ["core-router", "db-postgres", "cache-redis"],
  "gw-payment": ["core-router", "db-postgres", "auth-keycloak", "cache-redis"],
  "gw-map": ["core-router", "db-postgres", "cache-redis"],
  "gw-storage": ["core-router", "db-postgres", "cache-redis"],
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface OverviewInfrastructureMapProps {
  serviceNodes: ServiceNode[];
  activeNode: string | null;
  onSelectNode: (nodeId: string) => void;
  activeNodeData: ServiceNode | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNodeIcon(type: ServiceNode["type"]) {
  switch (type) {
    case "core": return Server;
    case "db": return Database;
    case "auth": return KeyRound;
    case "cache": return Activity;
    default: return Cpu;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function OverviewInfrastructureMap({
  serviceNodes,
  activeNode,
  onSelectNode,
  activeNodeData,
}: OverviewInfrastructureMapProps) {
  // Pan and Zoom Canvas state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.95);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Mouse drag handler for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Wheel zoom handler registered via useEffect to bypass React passive event listener limitation
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const handleWheelRaw = (e: WheelEvent) => {
      e.preventDefault(); // Stop outer page from scrolling
      const zoomFactor = 0.05;
      const direction = e.deltaY < 0 ? 1 : -1;
      setZoom((z) => Math.min(Math.max(z + direction * zoomFactor, 0.6), 1.6));
    };

    el.addEventListener("wheel", handleWheelRaw, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheelRaw);
    };
  }, []);

  const resetViewport = () => {
    setPan({ x: 0, y: 0 });
    setZoom(0.95);
  };

  // Determine if a node should fade in Focus Mode
  const isNodeDimmed = (nodeId: string) => {
    if (!activeNode) return false;
    if (activeNode === nodeId) return false;
    return !(relationsMap[activeNode]?.includes(nodeId));
  };

  // Sub-nodes dynamic list for active node
  const activeSubNodes = useMemo(() => {
    if (!activeNode) return [];
    return subNodesMap[activeNode] || [];
  }, [activeNode]);

  // Find dynamic screen positions of parent nodes to draw SVG connections
  const getNodeCoords = (nodeId: string) => {
    switch (nodeId) {
      case "core-router": return { x: 50, y: 12.5 };
      case "auth-keycloak": return { x: 16.66, y: 37.5 };
      case "db-postgres": return { x: 83.33, y: 37.5 };
      case "cache-redis": return { x: 50, y: 62.5 };
      case "gw-notification": return { x: 8.33, y: 87.5 };
      case "gw-payment": return { x: 33.33, y: 87.5 };
      case "gw-map": return { x: 66.66, y: 87.5 };
      case "gw-storage": return { x: 91.66, y: 87.5 };
      default: return { x: 50, y: 50 };
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Canvas container card */}
      <Card 
        className="flex flex-col justify-start border-white/5 bg-[#0b0b0b]/40 p-6 lg:col-span-2 relative select-none overflow-hidden h-full min-h-[460px]"
        ref={containerRef}
      >
        <div className="flex justify-between items-start z-20 pointer-events-none">
          <div>
            <h4 className="text-sm font-semibold text-zinc-200 pointer-events-auto">Infrastructure Dependency Map</h4>
            <p className="mt-0.5 text-[10px] text-zinc-500 pointer-events-auto">
              Interactive canvas. Pan with drag, zoom with wheel, click node to highlight and expand dependencies.
            </p>
          </div>
          
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-zinc-900/90 border border-white/5 rounded-lg p-1 pointer-events-auto shadow-xl">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              onClick={() => setZoom((z) => Math.min(z + 0.1, 1.6))}
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[9px] font-mono font-bold text-zinc-500 px-1 select-none">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              onClick={() => setZoom((z) => Math.max(z - 0.1, 0.6))}
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <div className="w-[1px] h-3 bg-white/10 mx-0.5" />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              onClick={resetViewport}
              title="Reset View"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* CSS grid background interactive viewport wrapper */}
        <div 
          ref={viewportRef}
          className="relative mt-6 flex-1 w-full overflow-hidden rounded-xl border border-white/[0.03] bg-zinc-950/40 cursor-grab active:cursor-grabbing min-h-[380px]"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
          {/* Grid pattern background that moves and scales */}
          <div 
            className="absolute inset-0 z-0 opacity-25"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1.2px, transparent 1.2px)",
              backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
              transition: isDragging ? "none" : "transform 0.1s ease-out"
            }}
          />

          {/* Transformed viewport content wrapper */}
          <div
            className="absolute inset-0 w-full h-full transform-gpu"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.15s ease-out",
            }}
          >
            {/* SVG connections */}
            <svg className="absolute inset-0 h-full w-full pointer-events-none z-0 overflow-visible">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* Parent connections */}
              {parentConnections.map((conn, idx) => {
                const start = getNodeCoords(conn.from);
                const end = getNodeCoords(conn.to);
                const nodeFrom = serviceNodes.find((n) => n.id === conn.from);
                const nodeTo = serviceNodes.find((n) => n.id === conn.to);
                const isHealthy = nodeFrom?.status === "healthy" && nodeTo?.status === "healthy";
                const isHighlighted =
                  activeNode &&
                  ((activeNode === conn.from && relationsMap[activeNode]?.includes(conn.to)) ||
                   (activeNode === conn.to && relationsMap[activeNode]?.includes(conn.from)));
                const isDimmed = activeNode && !isHighlighted;

                return (
                  <g key={`conn-${idx}`} style={{ transition: "opacity 0.3s ease" }} className={isDimmed ? "opacity-20" : "opacity-100"}>
                    <line
                      x1={`${start.x}%`} y1={`${start.y}%`}
                      x2={`${end.x}%`} y2={`${end.y}%`}
                      stroke={isHealthy ? (isHighlighted ? "#34d399" : "#10b981") : "#f97316"}
                      strokeWidth={isHighlighted ? 2.2 : 1.2}
                      strokeDasharray={conn.dashed ? "4 4" : undefined}
                      filter={isHighlighted ? (isHealthy ? "url(#glow)" : "url(#glow-red)") : undefined}
                      style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}
                    />
                    {isHealthy && (isHighlighted || (!activeNode && !conn.dashed)) && (
                      <line
                        x1={`${start.x}%`} y1={`${start.y}%`}
                        x2={`${end.x}%`} y2={`${end.y}%`}
                        stroke="#ffffff" strokeWidth={1.5}
                        strokeDasharray="5 15" strokeDashoffset="0"
                        className="animate-dash"
                        style={{ animation: "dash-marching 1.5s linear infinite", opacity: isHighlighted ? 0.8 : 0.2 }}
                      />
                    )}
                  </g>
                );
              })}

              {/* Sub-node connector lines */}
              {activeNode &&
                activeSubNodes.map((sub, idx) => {
                  const pc = getNodeCoords(activeNode);
                  return (
                    <g key={`sub-conn-${idx}`} className="animate-fade-in">
                      <line
                        x1={`${pc.x}%`} y1={`${pc.y}%`}
                        x2={`calc(${pc.x}% + ${sub.xOffset}px)`}
                        y2={`calc(${pc.y}% + ${sub.yOffset}px)`}
                        stroke="#059669" strokeWidth={1.5}
                        strokeDasharray="2 3" filter="url(#glow)"
                      />
                    </g>
                  );
                })}
            </svg>

            {/* Main nodes */}
            {serviceNodes.map((node) => {
              const Icon = getNodeIcon(node.type);
              const isSelected = activeNode === node.id;
              const dimmed = isNodeDimmed(node.id);
              return (
                <button
                  key={node.id}
                  onClick={(e) => { e.stopPropagation(); onSelectNode(node.id); }}
                  style={{
                    left: `${(node.x / 12) * 100}%`,
                    top: `${(node.y / 8) * 100}%`,
                    transform: "translate(-50%, -50%)",
                    transition: "opacity 0.3s ease, border-color 0.3s, box-shadow 0.3s",
                  }}
                  className={cn(
                    "absolute z-10 flex min-w-[76px] flex-col items-center justify-center rounded-xl border bg-black/90 p-3 shadow-2xl transition-all duration-300 group hover:-translate-y-0.5",
                    isSelected
                      ? "border-emerald-400 bg-emerald-950/20 shadow-[0_0_20px_rgba(52,211,153,0.25)] ring-1 ring-emerald-500/20 scale-105 z-20"
                      : "border-white/5 hover:border-white/20 hover:shadow-emerald-500/5",
                    dimmed ? "opacity-25" : "opacity-100"
                  )}
                >
                  <div className={cn(
                    "mb-1.5 flex items-center justify-center rounded-lg border p-1.5 transition-colors",
                    isSelected
                      ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                      : "border-white/5 bg-zinc-900 text-zinc-500 group-hover:text-zinc-300"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      node.status === "healthy" ? "bg-emerald-500 animate-pulse"
                        : node.status === "warning" ? "bg-amber-500"
                        : "bg-red-500 animate-ping"
                    )} />
                    <span className="max-w-[55px] truncate text-[8px] font-mono font-bold uppercase text-zinc-300">
                      {node.id.startsWith("gw-") ? node.id.replace("gw-", "") : node.name.split(" ")[0]}
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Sub-nodes */}
            {activeNode &&
              activeSubNodes.map((sub) => {
                const pc = getNodeCoords(activeNode);
                const SubIcon = sub.icon;
                return (
                  <div
                    key={sub.id}
                    style={{
                      left: `calc(${pc.x}% + ${sub.xOffset}px)`,
                      top: `calc(${pc.y}% + ${sub.yOffset}px)`,
                      transform: "translate(-50%, -50%)",
                    }}
                    className="absolute z-30 flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-950/90 px-2 py-1 shadow-lg backdrop-blur-sm animate-fade-in group hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all"
                    title={sub.details}
                  >
                    <div className="flex items-center justify-center text-emerald-400">
                      <SubIcon className="h-3 w-3" />
                    </div>
                    <span className="text-[7.5px] font-mono font-bold text-zinc-300 tracking-wider uppercase select-none">
                      {sub.name}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Animation keyframes */}
        <style jsx global>{`
          @keyframes dash-marching { to { stroke-dashoffset: -20; } }
          @keyframes fade-in {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
            to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
          .animate-fade-in { animation: fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        `}</style>
      </Card>

      {/* ── Detail Panel ──────────────────────────────────────── */}
      <MapDetailPanel activeNodeData={activeNodeData} activeSubNodes={activeSubNodes} />
    </div>
  );
}
