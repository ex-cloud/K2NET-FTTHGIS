"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Button, Card } from "@k2net/ui";
import { cn } from "@/lib/utils";
import {
  Activity,
  Bell,
  CalendarClock,
  ChevronDown,
  ChevronRight,
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
import type { SubNode } from "./overview-map-types";
import { MapDetailPanel } from "./map-detail-panel";
import type { GatewayServiceStatus } from "@/lib/actions/gateways";

// ─── 9 Gateway Categorized 2-Column Matrix Configuration (Zero Collision) ────
// Column 1 (X = 665): 5 Business & Communication Gateways (Notification, WhatsApp, Payment, Storage, Map)
// Column 2 (X = 805): 4 Infrastructure & System Gateways (Audit, Scheduler, Export, OLT Poller)

export interface GatewayMatrixNode {
  id: string;
  name: string;
  gatewayName: string;
  port: number;
  icon: React.ElementType;
  column: 1 | 2;
  x: number;
  y: number;
  category: string;
  connectsTo: string[];
}

const GATEWAY_MATRIX: GatewayMatrixNode[] = [
  // ── Column 1: Core Business & Communication Gateways (X = 665) ──
  { id: "gw-notification", name: "Notification", gatewayName: "ftth-notification-gateway", port: 5001, icon: Bell,          column: 1, x: 665, y: 90,  category: "Messaging",      connectsTo: ["postgres-db", "redis-cache"] },
  { id: "gw-whatsapp",     name: "WhatsApp",     gatewayName: "ftth-whatsapp-gateway",     port: 5005, icon: MessageSquare, column: 1, x: 665, y: 170, category: "Chat WABA",      connectsTo: ["redis-cache"] },
  { id: "gw-payment",      name: "Payment",      gatewayName: "ftth-payment-gateway",      port: 5002, icon: CreditCard,    column: 1, x: 665, y: 250, category: "Fintech",        connectsTo: ["postgres-db", "keycloak-iam"] },
  { id: "gw-storage",      name: "Storage S3",   gatewayName: "ftth-storage-gateway",      port: 5004, icon: HardDrive,     column: 1, x: 665, y: 330, category: "MinIO S3",       connectsTo: ["postgres-db"] },
  { id: "gw-map",          name: "Spatial Map",  gatewayName: "ftth-map-gateway",          port: 5003, icon: Map,           column: 1, x: 665, y: 410, category: "GIS Geocoding",  connectsTo: ["postgres-db", "redis-cache"] },

  // ── Column 2: System & Background Workers (X = 805) ──
  { id: "gw-audit",        name: "Audit Logger", gatewayName: "ftth-audit-gateway",        port: 5009, icon: ClipboardList, column: 2, x: 805, y: 130, category: "Security",       connectsTo: ["postgres-db"] },
  { id: "gw-scheduler",    name: "Scheduler",    gatewayName: "ftth-scheduler-gateway",    port: 5006, icon: CalendarClock, column: 2, x: 805, y: 210, category: "Cron Automation",connectsTo: ["postgres-db"] },
  { id: "gw-export",       name: "Export Svc",   gatewayName: "ftth-export-gateway",       port: 5007, icon: Upload,        column: 2, x: 805, y: 290, category: "Async Worker",   connectsTo: ["postgres-db"] },
  { id: "gw-olt",          name: "OLT Poller",   gatewayName: "ftth-olt-gateway",          port: 5008, icon: Network,       column: 2, x: 805, y: 370, category: "SNMP Telemetry", connectsTo: ["postgres-db", "redis-cache"] },
];

const CLUSTER_HUB_X = 540;
const CLUSTER_HUB_Y = 250;

// ─── 4-Tier Node Fixed Positions (920 x 500 Stage) ────────────────────────────

interface StageNodePosition {
  x: number;
  y: number;
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  tone?: "green" | "blue" | "red";
  nodeId: string;
}

const STAGE_NODE_POSITIONS: Record<string, StageNodePosition> = {
  // Tier 1 — Edge Ingress
  "edge-router":   { x: 80,  y: 250, label: "Traefik / Kong API", sublabel: "Edge Router",    icon: Server,   tone: "green", nodeId: "edge-router"  },
  // Tier 2 — Core, AI & IAM
  "core-backend":  { x: 240, y: 115, label: "Spring Boot Core",   sublabel: "Port 9090",       icon: Cpu,      tone: "green", nodeId: "core-backend"  },
  "ai-gateway":    { x: 240, y: 250, label: "AI Gateway (RAG)",   sublabel: "Python Engine",   icon: Zap,      tone: "green", nodeId: "ai-gateway"    },
  "keycloak-iam":  { x: 240, y: 385, label: "Keycloak IAM",       sublabel: "Keycloak 26",     icon: KeyRound, tone: "green", nodeId: "keycloak-iam"  },
  // Tier 3 — Storage & Data Layer
  "postgres-db":   { x: 395, y: 175, label: "PostgreSQL",         sublabel: "(PostGIS)",        icon: Database, tone: "blue",  nodeId: "postgres-db"   },
  "redis-cache":   { x: 395, y: 325, label: "Redis Cache",        sublabel: "Port 6379",        icon: Activity, tone: "red",   nodeId: "redis-cache"   },
};

// ─── 4-Tier Logical Traffic Connections ───────────────────────────────────────

interface StageEdge {
  id: string;
  from: string;
  to: string;
  path: string;
  speed?: "fast" | "normal" | "slow";
}

const STAGE_EDGES: StageEdge[] = [
  // Edge → Core Layer
  { id: "edge-core",      from: "edge-router",  to: "core-backend", speed: "fast",   path: "M 80 250 C 150 250, 170 115, 240 115" },
  { id: "edge-ai",        from: "edge-router",  to: "ai-gateway",   speed: "fast",   path: "M 80 250 L 240 250" },
  { id: "edge-keycloak",  from: "edge-router",  to: "keycloak-iam", speed: "normal", path: "M 80 250 C 150 250, 170 385, 240 385" },

  // Core Layer → Storage & Data Layer
  { id: "core-postgres",  from: "core-backend", to: "postgres-db",  speed: "normal", path: "M 240 115 C 310 115, 325 175, 395 175" },
  { id: "core-redis",     from: "core-backend", to: "redis-cache",  speed: "slow",   path: "M 240 115 C 310 115, 325 325, 395 325" },
  { id: "ai-postgres",    from: "ai-gateway",   to: "postgres-db",  speed: "normal", path: "M 240 250 C 310 250, 325 175, 395 175" },
  { id: "ai-redis",       from: "ai-gateway",   to: "redis-cache",  speed: "fast",   path: "M 240 250 C 310 250, 325 325, 395 325" },

  // Data Layer → Go Gateways Cluster Hub
  { id: "postgres-hub",   from: "postgres-db",  to: "gw-cluster",   speed: "normal", path: `M 395 175 C 460 175, 480 250, ${CLUSTER_HUB_X} ${CLUSTER_HUB_Y}` },
  { id: "redis-hub",      from: "redis-cache",  to: "gw-cluster",   speed: "slow",   path: `M 395 325 C 460 325, 480 250, ${CLUSTER_HUB_X} ${CLUSTER_HUB_Y}` },
];

const subNodesMap: Record<string, SubNode[]> = {
  "edge-router": [
    { id: "sub-kong-rl",  name: "Rate Limit", details: "Global request throttling (100 req/min)",   icon: Zap,    xOffset: -10, yOffset: -34 },
    { id: "sub-kong-jwt", name: "JWT Auth",   details: "Validation of Keycloak JWT signatures",      icon: Lock,   xOffset: -10, yOffset: 34  },
  ],
  "core-backend": [
    { id: "sub-sb-tenant",name: "Tenancy",    details: "X-Tenant-ID header context filter",          icon: Layers, xOffset: 0,   yOffset: -34 },
  ],
  "ai-gateway": [
    { id: "sub-ai-vec",   name: "pgvector",   details: "500-token chunk vector embeddings",         icon: Database, xOffset: 0,  yOffset: -34 },
  ],
  "keycloak-iam": [
    { id: "sub-kc-realm", name: "Realms",     details: "Multi-tenant isolation configurations",      icon: Layers, xOffset: 0,   yOffset: 34  },
  ],
  "postgres-db": [
    { id: "sub-pg-spatial", name: "PostGIS",  details: "Spatial mapping & coordinate functions",    icon: Map,    xOffset: 0,   yOffset: -34 },
  ],
  "redis-cache": [
    { id: "sub-rd-pub",  name: "Pub/Sub",     details: "Event dispatcher channels (network-events)", icon: Radio,  xOffset: 0,   yOffset: 34  },
  ],
};

// ─── Status → Color helpers ───────────────────────────────────────────────────

type NodeStatus = "healthy" | "warning" | "error";

function statusToColor(status: NodeStatus): string {
  if (status === "error")   return "hsl(0 84% 60%)";
  if (status === "warning") return "hsl(45 95% 55%)";
  return "var(--primary)";
}

function getEdgeHealthColor(
  from: string,
  to: string,
  statusMap: Record<string, NodeStatus>
): string {
  const fromS = statusMap[from] ?? "healthy";
  const toS   = statusMap[to]   ?? "healthy";
  if (fromS === "error"   || toS === "error")   return "hsl(0 84% 60%)";
  if (fromS === "warning" || toS === "warning") return "hsl(45 95% 55%)";
  return "var(--primary)";
}

function getParticleClass(speed: StageEdge["speed"], status: NodeStatus): string {
  if (status === "error") return "animate-flow-particle-slow";
  if (speed === "fast")   return "animate-flow-particle-fast";
  if (speed === "slow")   return "animate-flow-particle-slow";
  return "animate-flow-particle";
}

// ─── Component Props ──────────────────────────────────────────────────────────

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
  const [collapsed, setCollapsed]               = useState(true);
  const [activeGatewayId, setActiveGatewayId]   = useState<string | null>(null);

  // ─── Build live status map from serviceNodes ───────────────────────────────
  const statusMap = useMemo<Record<string, NodeStatus>>(() => {
    const map: Record<string, NodeStatus> = {};
    for (const n of _serviceNodes) {
      map[n.id] = n.status;
    }
    return map;
  }, [_serviceNodes]);

  const getGatewayStatus = useCallback(
    (gwName: string): NodeStatus =>
      gateways.find((g) => g.name === gwName)?.active ? "healthy" : "error",
    [gateways]
  );

  const activeGwNode = useMemo(
    () => (activeGatewayId ? GATEWAY_MATRIX.find((g) => g.id === activeGatewayId) ?? null : null),
    [activeGatewayId]
  );

  const activeSelectedServiceNode = useMemo<ServiceNode | null>(() => {
    if (!activeGwNode) return activeNodeData;
    const gw     = gateways.find((g) => g.name === activeGwNode.gatewayName);
    const status = getGatewayStatus(activeGwNode.gatewayName);
    return {
      id: activeGwNode.id,
      name: `${activeGwNode.name} Gateway`,
      type: "gateway",
      status,
      port: activeGwNode.port,
      details: `Go microservice gateway handling ${activeGwNode.name.toLowerCase()} operations. Routes requests from Kong API Gateway through Redis/PostgreSQL.`,
      metrics: {
        Throughput: `${gw?.throughput ?? 0} req/min`,
        Latency:    `${gw?.latency ?? 0} ms`,
        Status:     gw?.active ? "Online" : "Offline",
      },
      x: 0,
      y: 0,
    };
  }, [activeGwNode, activeNodeData, gateways, getGatewayStatus]);

  const activeSubNodes = useMemo(() => {
    if (!activeNode || activeNode === "gw-cluster") return [];
    return subNodesMap[activeNode] || [];
  }, [activeNode]);

  // ─── Dimming logic: ONLY dim when a specific node is selected ──────────────
  const selectedServices = useMemo(() => {
    if (!activeNode) return null;
    const connected = new Set<string>([activeNode]);
    STAGE_EDGES.forEach((e) => {
      if (e.from === activeNode) connected.add(e.to);
      if (e.to   === activeNode) connected.add(e.from);
    });
    return connected;
  }, [activeNode]);

  const isNodeDimmed = useCallback(
    (id: string) => Boolean(selectedServices && !selectedServices.has(id)),
    [selectedServices]
  );

  const toggleCollapse = () => {
    setCollapsed((val) => !val);
    if (!collapsed) setActiveGatewayId(null);
  };

  const onlineGatewayCount = useMemo(
    () => GATEWAY_MATRIX.filter((gw) => gateways.find((g) => g.name === gw.gatewayName)?.active).length,
    [gateways]
  );

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
                setActiveGatewayId(null);
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
              background: "radial-gradient(circle at 75% 50%, rgba(38, 230, 161, 0.12), transparent 45%)",
            }}
          />

          {/* ── Stage (920px x 500px) ── */}
          <div
            className="relative w-[920px] h-[500px] transform-gpu transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
          >
            {/* ── SVG Connection Layer ── */}
            <svg
              className="absolute inset-0 w-[920px] h-[500px] overflow-visible pointer-events-none z-0"
              viewBox="0 0 920 500"
              role="img"
              aria-label="Animated service dependencies"
            >
              {/* Static & Animated Inter-Tier Edges */}
              {STAGE_EDGES.map((edge, edgeIdx) => {
                const dimmed      = isNodeDimmed(edge.from) || isNodeDimmed(edge.to);
                const edgeColor   = getEdgeHealthColor(edge.from, edge.to, statusMap);
                const fromStatus  = statusMap[edge.from] ?? "healthy";
                const toStatus    = statusMap[edge.to]   ?? "healthy";
                const edgeStatus: NodeStatus =
                  (fromStatus === "error"   || toStatus === "error")   ? "error" :
                  (fromStatus === "warning" || toStatus === "warning") ? "warning" :
                  "healthy";
                const particleClass = getParticleClass(edge.speed, edgeStatus);

                return (
                  <g
                    key={edge.id}
                    className={cn(
                      "transition-opacity duration-300",
                      dimmed ? "opacity-10" : "opacity-100"
                    )}
                  >
                    {/* Layer 1: Base rail track */}
                    <path
                      d={edge.path}
                      fill="none"
                      stroke="currentColor"
                      className="text-border/40 dark:text-border/30"
                      strokeWidth="1"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />

                    {/* Layer 2: Ambient pulse glow line */}
                    <path
                      d={edge.path}
                      fill="none"
                      stroke={edgeColor}
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeOpacity="0.25"
                      vectorEffect="non-scaling-stroke"
                      className={cn(
                        edgeStatus === "error"   ? "animate-glow-pulse-warn" :
                        edgeStatus === "warning" ? "animate-glow-pulse-warn" :
                        "animate-glow-pulse"
                      )}
                      style={{ animationDelay: `${edgeIdx * 0.25}s` }}
                    />

                    {/* Layer 3: Fiber-optic light packet */}
                    {edgeStatus !== "error" && (
                      <path
                        d={edge.path}
                        fill="none"
                        stroke={edgeColor}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeDasharray="14 160"
                        vectorEffect="non-scaling-stroke"
                        className={particleClass}
                        style={{ animationDelay: `${-(edgeIdx * 0.45)}s` }}
                      />
                    )}
                  </g>
                );
              })}

              {/* ── Branching Tree Lines to 2-Column Matrix (When Expanded) ── */}
              {!collapsed && GATEWAY_MATRIX.map((gw, idx) => {
                const targetX = gw.x - 55; // Left edge of the card
                const targetY = gw.y;
                const branchPath = `M ${CLUSTER_HUB_X + 45} ${CLUSTER_HUB_Y} C ${CLUSTER_HUB_X + 90} ${CLUSTER_HUB_Y}, ${targetX - 45} ${targetY}, ${targetX} ${targetY}`;
                const isOnline = getGatewayStatus(gw.gatewayName) === "healthy";
                const isAct = activeGatewayId === gw.id;

                return (
                  <g key={`branch-${gw.id}`} className="animate-fade-in">
                    {/* Base track */}
                    <path
                      d={branchPath}
                      fill="none"
                      stroke="currentColor"
                      className={cn("transition-colors", isAct ? "text-primary" : "text-border/40")}
                      strokeWidth={isAct ? "1.5" : "1"}
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />

                    {/* Light pulse */}
                    {isOnline && (
                      <path
                        d={branchPath}
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeDasharray="10 100"
                        vectorEffect="non-scaling-stroke"
                        className="animate-flow-particle-fast"
                        style={{ animationDelay: `${-(idx * 0.3)}s` }}
                      />
                    )}
                  </g>
                );
              })}

              {/* ── Bounding Cluster Frame for 2-Column Matrix (When Expanded) ── */}
              {!collapsed && (
                <g className="animate-fade-in">
                  <rect
                    x="595"
                    y="50"
                    width="310"
                    height="400"
                    rx="14"
                    fill="currentColor"
                    className="text-primary/5"
                    stroke="var(--primary)"
                    strokeOpacity={0.25}
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x="610"
                    y="72"
                    fill="currentColor"
                    className="text-[9px] font-mono font-bold tracking-widest text-primary uppercase select-none"
                  >
                    GO MICROSERVICES CLUSTER
                  </text>
                  <text
                    x="885"
                    y="72"
                    textAnchor="end"
                    fill="currentColor"
                    className="text-[8px] font-mono text-muted-foreground select-none"
                  >
                    {onlineGatewayCount}/{GATEWAY_MATRIX.length} ACTIVE
                  </text>
                </g>
              )}
            </svg>

            {/* ── Tier 1, 2, 3 Service Nodes (Compact & Crisp) ── */}
            {Object.entries(STAGE_NODE_POSITIONS).map(([nodeId, pos]) => {
              const NodeIcon    = pos.icon;
              const isSelected  = activeNode === nodeId;
              const dimmed      = isNodeDimmed(nodeId);
              const nodeStatus  = statusMap[nodeId] ?? "healthy";
              const dotColor    = statusToColor(nodeStatus);

              const toneClasses =
                nodeStatus === "error"   ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]" :
                nodeStatus === "warning" ? "bg-yellow-400 shadow-[0_0_8px_#facc15]" :
                pos.tone === "blue"      ? "bg-sky-400 shadow-[0_0_8px_#38bdf8]" :
                pos.tone === "red"       ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]" :
                                           "bg-primary shadow-[0_0_8px_var(--primary)]";

              return (
                <button
                  key={nodeId}
                  onClick={() => {
                    onSelectNode(nodeId);
                    setActiveGatewayId(null);
                  }}
                  style={{ left: pos.x, top: pos.y }}
                  aria-pressed={isSelected}
                  className={cn(
                    "absolute flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-all duration-300 cursor-pointer whitespace-nowrap -translate-x-1/2 -translate-y-1/2 select-none z-10",
                    "bg-gradient-to-b from-[#181d28] via-[#121620] to-[#0c0f17] dark:from-[#181d28] dark:via-[#121620] dark:to-[#0c0f17]",
                    "border-[#262e3f] dark:border-white/10 shadow-[0_6px_20px_-3px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.12)]",
                    "hover:border-primary/50 hover:shadow-[0_8px_25px_-3px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:scale-[1.03] text-foreground",
                    isSelected && "border-primary/80 bg-gradient-to-b from-[#152a22] to-[#0a1813] shadow-[0_0_20px_rgba(38,230,161,0.35),inset_0_1px_0_0_rgba(38,230,161,0.4)] scale-105 z-20 text-primary font-bold",
                    nodeStatus === "error" && "border-rose-500/50",
                    nodeStatus === "warning" && "border-yellow-400/50",
                    dimmed && "opacity-10 hover:opacity-100"
                  )}
                >
                  {/* Status Dot */}
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full flex-shrink-0 ring-2 ring-black/40",
                      toneClasses,
                      nodeStatus !== "error" && "animate-pulse"
                    )}
                    style={nodeStatus === "error" ? { backgroundColor: dotColor } : undefined}
                  />

                  {/* Label & Sublabel */}
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-semibold text-foreground tracking-tight leading-none">
                      {pos.label}
                    </span>
                    {pos.sublabel && (
                      <span className="text-[8px] font-mono text-muted-foreground/75 mt-0.5 leading-none">
                        {pos.sublabel}
                      </span>
                    )}
                  </div>

                  {/* Right Icon */}
                  <NodeIcon className={cn("h-3.5 w-3.5 ml-1 text-muted-foreground/50 shrink-0", isSelected && "text-primary")} />
                </button>
              );
            })}

            {/* ── Tier 4: Master Cluster Trunk Hub Button ── */}
            <button
              onClick={toggleCollapse}
              aria-pressed={!collapsed}
              aria-expanded={!collapsed}
              style={{ left: CLUSTER_HUB_X, top: CLUSTER_HUB_Y }}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-mono font-semibold transition-all duration-300 cursor-pointer whitespace-nowrap select-none z-20",
                "bg-gradient-to-b from-[#181d28] via-[#121620] to-[#0c0f17] dark:from-[#181d28] dark:via-[#121620] dark:to-[#0c0f17]",
                "border-[#262e3f] dark:border-white/10 shadow-[0_6px_20px_-3px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.12)]",
                collapsed
                  ? "border-primary/60 text-primary shadow-[0_0_18px_rgba(38,230,161,0.3),inset_0_1px_0_0_rgba(38,230,161,0.3)] hover:scale-[1.03]"
                  : "border-primary/40 bg-gradient-to-b from-[#152a22] to-[#0a1813] text-primary hover:border-primary"
              )}
            >
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)] animate-pulse flex-shrink-0 ring-2 ring-black/40" />
              <span className="text-[11px] font-bold">Go Gateways</span>
              <span className="text-[9px] text-muted-foreground font-mono font-normal">
                {collapsed
                  ? `+${GATEWAY_MATRIX.length} expand`
                  : `${onlineGatewayCount}/${GATEWAY_MATRIX.length}`}
              </span>
              {collapsed ? (
                <ChevronRight className="h-3.5 w-3.5 text-primary" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-primary" />
              )}
            </button>

            {/* ── 9 Categorized Matrix Nodes (When Expanded) ── */}
            {!collapsed &&
              GATEWAY_MATRIX.map((gw, idx) => {
                const isAct     = activeGatewayId === gw.id;
                const dimmed    = isNodeDimmed(gw.id);
                const GwIcon    = gw.icon;
                const gwStatus  = getGatewayStatus(gw.gatewayName);
                const isOnline  = gwStatus === "healthy";
                const dotCls    = isOnline
                  ? "bg-primary shadow-[0_0_6px_var(--primary)]"
                  : "bg-rose-500 shadow-[0_0_6px_#f43f5e]";

                return (
                  <button
                    key={gw.id}
                    onClick={() => {
                      setActiveGatewayId(gw.id);
                      onSelectNode("gw-cluster");
                    }}
                    style={{
                      left: gw.x,
                      top: gw.y,
                      animationDelay: `${idx * 25}ms`,
                    }}
                    aria-pressed={isAct}
                    className={cn(
                      "absolute flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[10px] font-mono transition-all duration-200 cursor-pointer whitespace-nowrap -translate-x-1/2 -translate-y-1/2 select-none z-30 animate-fade-in-scale",
                      "w-[125px] justify-between",
                      "bg-gradient-to-b from-[#181d28] via-[#121620] to-[#0c0f17] dark:from-[#181d28] dark:via-[#121620] dark:to-[#0c0f17]",
                      "border-[#262e3f] dark:border-white/10 shadow-[0_4px_14px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.1)] text-foreground/90 hover:border-primary/60 hover:scale-[1.04]",
                      isAct && "border-primary bg-gradient-to-b from-[#152a22] to-[#0a1813] text-primary shadow-[0_0_18px_rgba(38,230,161,0.35),inset_0_1px_0_0_rgba(38,230,161,0.3)] scale-105 z-40 font-bold",
                      !isOnline && "border-rose-500/30 opacity-70",
                      dimmed && "opacity-10 hover:opacity-100"
                    )}
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {/* Live status dot */}
                      <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", dotCls)} />
                      <span className="truncate font-semibold">{gw.name}</span>
                    </div>

                    <GwIcon
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        isAct ? "text-primary" : "text-muted-foreground/50",
                        !isOnline && "text-rose-400/70"
                      )}
                    />
                  </button>
                );
              })}

            {/* ── Sub-node Chips Overlay ── */}
            {activeNode && activeNode !== "gw-cluster" && activeSubNodes.map((sub) => {
              const pos = STAGE_NODE_POSITIONS[activeNode];
              if (!pos) return null;
              const SubIcon = sub.icon;
              return (
                <div
                  key={sub.id}
                  style={{ left: pos.x + sub.xOffset, top: pos.y + sub.yOffset }}
                  className="absolute z-30 flex items-center gap-1.5 rounded-md border border-primary/50 bg-gradient-to-b from-[#181d28] via-[#121620] to-[#0c0f17] px-2 py-0.5 shadow-[0_6px_16px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(38,230,161,0.3)] animate-fade-in-scale -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
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
      <MapDetailPanel activeNodeData={activeSelectedServiceNode} activeSubNodes={activeSubNodes} />
    </div>
  );
}
