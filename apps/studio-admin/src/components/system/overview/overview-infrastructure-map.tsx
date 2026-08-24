"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Button, Card } from "@k2net/ui";
import { cn } from "@/lib/utils";
import {
  Activity,
  Bell,
  CalendarClock,
  ClipboardList,
  CreditCard,
  Cpu,
  Database,
  HardDrive,
  KeyRound,
  Layers,
  Lock,
  Map,
  MessageSquare,
  Minimize2,
  Network,
  Radio,
  RefreshCw,
  Server,
  Upload,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { ServiceNode } from "./overview-types";
import type { GatewayOrbitNode, SubNode } from "./overview-map-types";
import { MapDetailPanel } from "./map-detail-panel";
import type { GatewayServiceStatus } from "@/lib/actions/gateways";

// ─── 9 Gateway Orbit Configuration ───────────────────────────────────────────

const GATEWAY_ORBIT: GatewayOrbitNode[] = [
  { id: "gw-notification", name: "Notification", gatewayName: "ftth-notification-gateway", port: 5001, icon: Bell,          angle: -90,  connectsTo: ["postgres-db", "redis-cache"] },
  { id: "gw-payment",      name: "Payment",      gatewayName: "ftth-payment-gateway",      port: 5002, icon: CreditCard,    angle: -50,  connectsTo: ["postgres-db", "keycloak-iam"] },
  { id: "gw-map",          name: "Map",           gatewayName: "ftth-map-gateway",          port: 5003, icon: Map,           angle: -10,  connectsTo: ["postgres-db", "redis-cache"] },
  { id: "gw-storage",      name: "Storage",      gatewayName: "ftth-storage-gateway",       port: 5004, icon: HardDrive,     angle: 30,   connectsTo: ["postgres-db"] },
  { id: "gw-whatsapp",     name: "WhatsApp",     gatewayName: "ftth-whatsapp-gateway",      port: 5005, icon: MessageSquare, angle: 70,   connectsTo: ["redis-cache"] },
  { id: "gw-scheduler",    name: "Scheduler",    gatewayName: "ftth-scheduler-gateway",     port: 5006, icon: CalendarClock, angle: 110,  connectsTo: ["postgres-db"] },
  { id: "gw-export",       name: "Export",       gatewayName: "ftth-export-gateway",        port: 5007, icon: Upload,        angle: 150,  connectsTo: ["postgres-db"] },
  { id: "gw-olt",          name: "OLT",          gatewayName: "ftth-olt-gateway",           port: 5008, icon: Network,       angle: 190,  connectsTo: ["postgres-db", "redis-cache"] },
  { id: "gw-audit",        name: "Audit",        gatewayName: "ftth-audit-gateway",         port: 5009, icon: ClipboardList, angle: 230,  connectsTo: ["postgres-db"] },
];

const ORBIT_CENTER = { x: 670, y: 250 };
const ORBIT_RX     = 125;
const ORBIT_RY     = 120;

// Edge coordinates for connections when orbit is expanded vs collapsed
const ORBIT_GATEWAY_EDGE_X = ORBIT_CENTER.x - 38;
const ORBIT_HUB_EDGE_X     = ORBIT_CENTER.x - 42;

// ─── 3-Tier Node Fixed Positions (830 x 500 Stage) ────────────────────────────

interface StageNodePosition {
  x: number;
  y: number;
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  tone?: "green" | "blue" | "red";
}

const STAGE_NODE_POSITIONS: Record<string, StageNodePosition> = {
  "edge-router":   { x: 110, y: 250, label: "Traefik / Kong API", sublabel: "Edge Router",    icon: Server,   tone: "green" },
  "core-backend":  { x: 330, y: 120, label: "Spring Boot Core", sublabel: "Port 9090",      icon: Cpu,      tone: "green" },
  "ai-gateway":    { x: 330, y: 250, label: "AI Gateway (RAG)", sublabel: "Python Engine", icon: Zap,      tone: "green" },
  "keycloak-iam":  { x: 330, y: 380, label: "Keycloak IAM",     sublabel: "Keycloak 26",    icon: KeyRound, tone: "green" },
  "postgres-db":   { x: 490, y: 185, label: "PostgreSQL",       sublabel: "(PostGIS)",      icon: Database, tone: "blue"  },
  "redis-cache":   { x: 490, y: 315, label: "Redis Cache",      sublabel: "Port 6379",      icon: Activity, tone: "red"   },
};

// ─── 3-Tier Logical Traffic Connections ───────────────────────────────────────

interface StageEdge {
  id: string;
  from: string;
  to: string;
  path: string;
}

const STAGE_EDGES: StageEdge[] = [
  // Edge -> Core Layer
  { id: "edge-core",     from: "edge-router",  to: "core-backend", path: "M 110 250 C 210 250, 220 120, 330 120" },
  { id: "edge-ai",       from: "edge-router",  to: "ai-gateway",   path: "M 110 250 L 330 250" },
  { id: "edge-keycloak", from: "edge-router",  to: "keycloak-iam", path: "M 110 250 C 210 250, 220 380, 330 380" },

  // Core Layer -> Storage & Data Layer
  { id: "core-postgres", from: "core-backend", to: "postgres-db",  path: "M 330 120 C 410 120, 410 185, 490 185" },
  { id: "core-redis",    from: "core-backend", to: "redis-cache",  path: "M 330 120 C 410 120, 410 315, 490 315" },
  { id: "ai-postgres",   from: "ai-gateway",    to: "postgres-db",  path: "M 330 250 C 410 250, 410 185, 490 185" },
  { id: "ai-redis",      from: "ai-gateway",    to: "redis-cache",  path: "M 330 250 C 410 250, 410 315, 490 315" },

  // Data Layer -> Go Gateways Cluster Orbit
  { id: "postgres-orbit",from: "postgres-db",   to: "gw-cluster",   path: `M 490 185 C 560 185, 570 250, ${ORBIT_GATEWAY_EDGE_X} 250` },
  { id: "redis-orbit",   from: "redis-cache",   to: "gw-cluster",   path: `M 490 315 C 560 315, 570 250, ${ORBIT_GATEWAY_EDGE_X} 250` },
];

const subNodesMap: Record<string, SubNode[]> = {
  "edge-router": [
    { id: "sub-kong-rl",  name: "Rate Limit", details: "Global request throttling (100 req/min)",   icon: Zap,    xOffset: 0,   yOffset: -45 },
    { id: "sub-kong-jwt", name: "JWT Auth",   details: "Validation of Keycloak JWT signatures",       icon: Lock,   xOffset: 0,   yOffset: 45 },
  ],
  "core-backend": [
    { id: "sub-sb-tenant",name: "Tenancy",    details: "X-Tenant-ID header context filter",           icon: Layers, xOffset: 0,   yOffset: -45 },
  ],
  "ai-gateway": [
    { id: "sub-ai-vec",   name: "pgvector",   details: "500-token chunk vector embeddings",          icon: Database, xOffset: 0, yOffset: 45 },
  ],
  "keycloak-iam": [
    { id: "sub-kc-realm", name: "Realms",     details: "Multi-tenant isolation configurations",       icon: Layers, xOffset: 0,   yOffset: 45 },
  ],
  "postgres-db": [
    { id: "sub-pg-spatial", name: "PostGIS",    details: "Spatial mapping & coordinate functions",    icon: Map,      xOffset: 45,  yOffset: 0 },
  ],
  "redis-cache": [
    { id: "sub-rd-pub",  name: "Pub/Sub",    details: "Event dispatcher channels (network-events)",   icon: Radio,  xOffset: 45,  yOffset: 0 },
  ],
};

interface OverviewInfrastructureMapProps {
  serviceNodes: ServiceNode[];
  activeNode: string | null;
  onSelectNode: (nodeId: string) => void;
  activeNodeData: ServiceNode | null;
  gateways: GatewayServiceStatus[];
}

export function OverviewInfrastructureMap({
  serviceNodes: _serviceNodes,
  activeNode,
  onSelectNode,
  activeNodeData,
  gateways,
}: OverviewInfrastructureMapProps) {
  const [zoom, setZoom]                         = useState(1);
  const [collapsed, setCollapsed]               = useState(false);
  const [activeOrbitNode, setActiveOrbitNode]   = useState<string | null>(null);

  const getOrbitCoords = useCallback((gw: GatewayOrbitNode) => {
    const rad = (gw.angle * Math.PI) / 180;
    return {
      x: Math.round(ORBIT_CENTER.x + Math.cos(rad) * ORBIT_RX),
      y: Math.round(ORBIT_CENTER.y + Math.sin(rad) * ORBIT_RY),
    };
  }, []);

  const getOrbitStatus = useCallback(
    (gwName: string): ServiceNode["status"] =>
      gateways.find((g) => g.name === gwName)?.active ? "healthy" : "healthy",
    [gateways]
  );

  const activeOrbitGw = useMemo(
    () => (activeOrbitNode ? GATEWAY_ORBIT.find((g) => g.id === activeOrbitNode) ?? null : null),
    [activeOrbitNode]
  );

  const activeOrbitServiceNode = useMemo<ServiceNode | null>(() => {
    if (!activeOrbitGw) return activeNodeData;
    const gw     = gateways.find((g) => g.name === activeOrbitGw.gatewayName);
    const status = getOrbitStatus(activeOrbitGw.gatewayName);
    return {
      id: activeOrbitGw.id,
      name: `${activeOrbitGw.name} Gateway`,
      type: "gateway",
      status,
      port: activeOrbitGw.port,
      details: `Go microservice gateway handling ${activeOrbitGw.name.toLowerCase()} operations. Routes requests from Kong through Redis/PostgreSQL.`,
      metrics: {
        Throughput: `${gw?.throughput ?? 0} req/min`,
        Latency:    `${gw?.latency ?? 0} ms`,
        Status:     "Online",
      },
      x: 0,
      y: 0,
    };
  }, [activeOrbitGw, activeNodeData, gateways, getOrbitStatus]);

  const activeSubNodes = useMemo(() => {
    if (!activeNode || activeNode === "gw-cluster") return [];
    return subNodesMap[activeNode] || [];
  }, [activeNode]);

  // Selected services set for dimming effect
  const selectedServices = useMemo(() => {
    if (!activeNode) return null;
    const connected = new Set<string>([activeNode]);
    STAGE_EDGES.forEach((e) => {
      if (e.from === activeNode) connected.add(e.to);
      if (e.to === activeNode) connected.add(e.from);
    });
    return connected;
  }, [activeNode]);

  const isNodeDimmed = useCallback(
    (id: string) => Boolean(selectedServices && !selectedServices.has(id)),
    [selectedServices]
  );

  const visibleEdges = useMemo(
    () =>
      STAGE_EDGES.map((edge) =>
        edge.to === "gw-cluster"
          ? {
              ...edge,
              path: edge.path.replace(
                String(ORBIT_GATEWAY_EDGE_X),
                String(collapsed ? ORBIT_HUB_EDGE_X : ORBIT_GATEWAY_EDGE_X)
              ),
            }
          : edge
      ),
    [collapsed]
  );

  const toggleOrbit = () => {
    setCollapsed((val) => !val);
    if (!collapsed) {
      setActiveOrbitNode(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="flex flex-col justify-start border-border bg-card p-6 lg:col-span-2 relative select-none overflow-hidden h-full min-h-[540px]">
        {/* ── Top Header Controls ── */}
        <div className="flex justify-between items-start z-20 pointer-events-none">
          <div>
            <h4 className="text-sm font-semibold text-foreground pointer-events-auto">
              Infrastructure Dependency Map
            </h4>
            <p className="mt-0.5 text-[10px] text-muted-foreground pointer-events-auto">
              3-Tier Enterprise SaaS Architecture. Traffic flows Edge ➔ Core/AI ➔ Storage ➔ Microservices.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-popover/90 border border-border rounded-lg p-1 pointer-events-auto shadow-xl">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setZoom((z) => Math.min(z + 0.1, 1.3))}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[9px] font-mono font-bold text-muted-foreground px-1">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setZoom((z) => Math.max(z - 0.1, 0.7))}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <div className="w-[1px] h-3 bg-border mx-0.5" />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setZoom(1)}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <div className="w-[1px] h-3 bg-border mx-0.5" />
            <Button
              variant="ghost"
              className="h-6 px-2 text-[9px] font-medium text-muted-foreground hover:text-foreground gap-1"
              onClick={() => {
                onSelectNode("");
                setActiveOrbitNode(null);
              }}
            >
              <Minimize2 className="h-3 w-3" />
              <span>Reset</span>
            </Button>
          </div>
        </div>

        {/* ── Viewport Canvas Stage ── */}
        <div className="relative mt-4 flex-1 w-full overflow-hidden rounded-xl border border-border/30 bg-[hsl(var(--card))] min-h-[460px] flex items-center justify-center">
          {/* Dot Grid Layer */}
          <div
            className="absolute inset-0 z-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.25) 1px, transparent 1px)",
              backgroundSize: `${16 * zoom}px ${16 * zoom}px`,
            }}
          />

          {/* Radial Ambient Glow */}
          <div
            className="absolute inset-0 pointer-events-none z-0 opacity-30"
            style={{
              background: "radial-gradient(circle at 80% 50%, rgba(38, 230, 161, 0.14), transparent 35%)",
            }}
          />

          {/* ── Stage (830px x 500px) ── */}
          <div
            className="relative w-[830px] h-[500px] transform-gpu transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
          >
            {/* ── SVG Connection Layer ── */}
            <svg
              className="absolute inset-0 w-[830px] h-[500px] overflow-visible pointer-events-none z-0"
              viewBox="0 0 830 500"
              role="img"
              aria-label="Animated service dependencies"
            >
              <defs>
                <filter id="line-glow">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {visibleEdges.map((edge, edgeIdx) => {
                const dimmed = isNodeDimmed(edge.from) || isNodeDimmed(edge.to);
                return (
                  <g
                    key={edge.id}
                    className={cn(
                      "transition-opacity duration-300",
                      dimmed ? "opacity-15" : "opacity-100"
                    )}
                  >
                    {/* Base subtle track */}
                    <path
                      d={edge.path}
                      fill="none"
                      stroke="currentColor"
                      className="text-border/40 dark:text-border/30"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />

                    {/* Soft line glow track */}
                    <path
                      d={edge.path}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="1.5"
                      strokeOpacity="0.25"
                      filter="url(#line-glow)"
                    />

                    {/* Laser comet pulse flow */}
                    <path
                      d={edge.path}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="16 120"
                      className="animate-beam-flow"
                      style={{
                        animationDuration: "2.5s",
                        animationDelay: `${-(edgeIdx * 0.4)}s`,
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* ── Tier 1 & Tier 2 Service Nodes ── */}
            {Object.entries(STAGE_NODE_POSITIONS).map(([nodeId, pos]) => {
              const NodeIcon   = pos.icon;
              const isSelected = activeNode === nodeId;
              const dimmed     = isNodeDimmed(nodeId);
              const tone       = pos.tone ?? "green";

              return (
                <button
                  key={nodeId}
                  onClick={() => {
                    onSelectNode(nodeId);
                    setActiveOrbitNode(null);
                  }}
                  style={{ left: pos.x, top: pos.y }}
                  aria-pressed={isSelected}
                  className={cn(
                    "absolute flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-mono font-semibold transition-all duration-300 cursor-pointer whitespace-nowrap -translate-x-1/2 -translate-y-1/2 select-none z-10",
                    "border-border/60 bg-card/90 shadow-lg backdrop-blur-md hover:border-primary/60 hover:scale-105 hover:bg-card/95 text-foreground/90",
                    isSelected && "border-primary bg-primary/10 shadow-[0_0_20px_rgba(38,230,161,0.28)] scale-105 z-20 text-primary font-bold",
                    dimmed && "opacity-15 hover:opacity-100"
                  )}
                >
                  {/* Status Dot */}
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full flex-shrink-0 animate-pulse",
                      tone === "green" && "bg-primary shadow-[0_0_8px_var(--primary)]",
                      tone === "blue"  && "bg-sky-400 shadow-[0_0_8px_#4ab5e4]",
                      tone === "red"   && "bg-rose-500 shadow-[0_0_8px_#c64b3d]"
                    )}
                  />

                  {/* Label & Sublabel */}
                  <div className="flex flex-col text-left">
                    <span className="leading-none">{pos.label}</span>
                    {pos.sublabel && (
                      <span className="text-[8px] font-normal text-muted-foreground mt-0.5 leading-none">
                        {pos.sublabel}
                      </span>
                    )}
                  </div>

                  {/* Right Icon */}
                  <NodeIcon className={cn("h-3.5 w-3.5 ml-1 text-muted-foreground/60", isSelected && "text-primary")} />
                </button>
              );
            })}

            {/* ── Tier 3: Go Gateways Orbit Cluster ── */}
            <div
              className={cn("absolute transition-all duration-300 z-10", collapsed && "is-collapsed")}
              style={{ left: ORBIT_CENTER.x, top: ORBIT_CENTER.y }}
              aria-label="Gateway services cluster"
            >
              {/* Concentric Orbit Rings */}
              <div
                className={cn(
                  "absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-border/40 pointer-events-none transition-opacity duration-300",
                  collapsed ? "opacity-0 invisible" : "opacity-100"
                )}
                style={{ width: ORBIT_RX * 2, height: ORBIT_RY * 2 }}
              />
              <div
                className={cn(
                  "absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-primary/20 pointer-events-none transition-opacity duration-300",
                  collapsed ? "opacity-0 invisible" : "opacity-100"
                )}
                style={{ width: ORBIT_RX * 1.3, height: ORBIT_RY * 1.3 }}
              />

              {/* Orbit Central Hub Button */}
              <button
                onClick={toggleOrbit}
                aria-pressed={!collapsed}
                aria-expanded={!collapsed}
                className={cn(
                  "absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-mono font-semibold transition-all duration-300 cursor-pointer whitespace-nowrap select-none z-20",
                  collapsed
                    ? "border-primary/60 bg-card/95 text-primary shadow-[0_0_18px_rgba(38,230,161,0.28)]"
                    : "border-border/60 bg-card/85 text-foreground hover:border-primary/60 hover:scale-105"
                )}
              >
                <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)] animate-pulse flex-shrink-0" />
                <span>Go Gateways</span>
                <span className="text-[8px] text-muted-foreground font-normal">
                  {collapsed ? "(+9 expanded)" : "(orbit)"}
                </span>
              </button>

              {/* 9 Surrounding Orbit Chips */}
              <div
                className={cn(
                  "transition-all duration-300",
                  collapsed ? "opacity-0 invisible pointer-events-none" : "opacity-100"
                )}
              >
                {GATEWAY_ORBIT.map((gw) => {
                  const coords    = getOrbitCoords(gw);
                  const relX      = coords.x - ORBIT_CENTER.x;
                  const relY      = coords.y - ORBIT_CENTER.y;
                  const isAct     = activeOrbitNode === gw.id;
                  const dimmed    = isNodeDimmed(gw.id);
                  const OrbitIcon = gw.icon;

                  return (
                    <button
                      key={gw.id}
                      onClick={() => {
                        setActiveOrbitNode(gw.id);
                        onSelectNode("gw-cluster");
                      }}
                      style={{ left: relX, top: relY }}
                      aria-pressed={isAct}
                      className={cn(
                        "absolute flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-mono font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap -translate-x-1/2 -translate-y-1/2 select-none z-30",
                        "border-border/60 bg-card/90 shadow-md backdrop-blur-sm hover:border-primary/60 hover:bg-card/95 text-foreground/80 hover:scale-105",
                        isAct && "border-primary bg-primary/20 text-primary shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_28%,transparent)] scale-110 z-40 font-bold",
                        dimmed && "opacity-15 hover:opacity-100"
                      )}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)] flex-shrink-0 animate-pulse" />
                      <span>{gw.name}</span>
                      <OrbitIcon className={cn("h-3 w-3 ml-0.5 text-muted-foreground/50", isAct && "text-primary")} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Sub-node Chips Overlay ── */}
            {activeNode && activeNode !== "gw-cluster" && activeSubNodes.map((sub) => {
              const pos = STAGE_NODE_POSITIONS[activeNode];
              if (!pos) return null;
              const SubIcon = sub.icon;
              return (
                <div
                  key={sub.id}
                  style={{ left: pos.x + sub.xOffset, top: pos.y + sub.yOffset }}
                  className="absolute z-30 flex items-center gap-1.5 rounded-lg border border-primary/40 bg-card/95 px-2 py-1 shadow-xl backdrop-blur-md animate-fade-in-scale -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
                  title={sub.details}
                >
                  <SubIcon className="h-3 w-3 text-primary flex-shrink-0" />
                  <span className="text-[8px] font-mono font-bold text-foreground tracking-wide uppercase select-none">
                    {sub.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Detail Panel */}
      <MapDetailPanel activeNodeData={activeOrbitServiceNode} activeSubNodes={activeSubNodes} />
    </div>
  );
}
