import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { Button } from "@k2net/ui";
import { Card } from "@k2net/ui";
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
  LayoutGrid,
  Layers,
  Lock,
  Map,
  MessageSquare,
  Minimize2,
  Network,
  Radio,
  RefreshCw,
  Server,
  Shield,
  Upload,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { ServiceNode } from "./overview-types";
import type { GatewayOrbitNode, ParentConnection, SubNode } from "./overview-map-types";
import { MapDetailPanel } from "./map-detail-panel";
import type { GatewayServiceStatus } from "@/lib/actions/gateways";

// ─── Gateway Orbit Configuration ─────────────────────────────────────────────

const GATEWAY_ORBIT: GatewayOrbitNode[] = [
  { id: "gw-notification", name: "Notification", gatewayName: "ftth-notification-gateway", port: 5001, icon: Bell,          angle: -90,  connectsTo: ["cache-redis", "db-postgres"] },
  { id: "gw-payment",      name: "Payment",      gatewayName: "ftth-payment-gateway",      port: 5002, icon: CreditCard,    angle: -50,  connectsTo: ["db-postgres", "auth-keycloak"] },
  { id: "gw-map",          name: "Map",          gatewayName: "ftth-map-gateway",           port: 5003, icon: Map,           angle: -10,  connectsTo: ["db-postgres", "cache-redis"] },
  { id: "gw-storage",      name: "Storage",      gatewayName: "ftth-storage-gateway",       port: 5004, icon: HardDrive,     angle: 30,   connectsTo: ["db-postgres"] },
  { id: "gw-whatsapp",     name: "WhatsApp",     gatewayName: "ftth-whatsapp-gateway",      port: 5005, icon: MessageSquare, angle: 70,   connectsTo: ["cache-redis"] },
  { id: "gw-scheduler",    name: "Scheduler",    gatewayName: "ftth-scheduler-gateway",     port: 5006, icon: CalendarClock, angle: 110,  connectsTo: ["db-postgres"] },
  { id: "gw-export",       name: "Export",       gatewayName: "ftth-export-gateway",        port: 5007, icon: Upload,        angle: 150,  connectsTo: ["db-postgres"] },
  { id: "gw-olt",          name: "OLT",          gatewayName: "ftth-olt-gateway",           port: 5008, icon: Network,       angle: 190,  connectsTo: ["db-postgres", "cache-redis"] },
  { id: "gw-audit",        name: "Audit",        gatewayName: "ftth-audit-gateway",         port: 5009, icon: ClipboardList, angle: 230,  connectsTo: ["db-postgres"] },
];

const ORBIT_RX = 14; // horizontal orbit radius as %
const ORBIT_RY = 18; // vertical orbit radius as %

// ─── Static data ─────────────────────────────────────────────────────────────

const subNodesMap: Record<string, SubNode[]> = {
  "core-router": [
    { id: "sub-kong-rl",  name: "Rate Limit", details: "Global request throttling (100 req/min)",   icon: Zap,    xOffset: -30, yOffset: -50 },
    { id: "sub-kong-ip",  name: "IP Rules",   details: "WhatsApp webhook whitelist CIDR",             icon: Shield, xOffset: 0,   yOffset: -65 },
    { id: "sub-kong-jwt", name: "JWT Auth",   details: "Validation of Keycloak JWT signatures",       icon: Lock,   xOffset: 30,  yOffset: -50 },
  ],
  "auth-keycloak": [
    { id: "sub-kc-realm", name: "Realms",     details: "Multi-tenant isolation configurations",       icon: Layers, xOffset: -45, yOffset: 25 },
    { id: "sub-kc-mfa",   name: "MFA Policy", details: "Multi-factor authentication check",           icon: Shield, xOffset: -45, yOffset: -25 },
  ],
  "db-postgres": [
    { id: "sub-pg-part",    name: "Partitions", details: "Audit Logs monthly tables partitioned",     icon: Database, xOffset: 45, yOffset: -25 },
    { id: "sub-pg-spatial", name: "PostGIS",    details: "Spatial mapping & coordinate functions",    icon: Map,      xOffset: 45, yOffset: 25 },
  ],
  "cache-redis": [
    { id: "sub-rd-pub",  name: "Pub/Sub",    details: "Event dispatcher channels (network-events)",   icon: Radio,  xOffset: -25, yOffset: 55 },
    { id: "sub-rd-tile", name: "Tile Cache", details: "Cached spatial map tiles storage",              icon: Layers, xOffset: 25,  yOffset: 55 },
  ],
};

const parentConnections: ParentConnection[] = [
  { from: "core-router", to: "auth-keycloak", dashed: true  },
  { from: "core-router", to: "db-postgres",   dashed: true  },
  { from: "core-router", to: "cache-redis",   dashed: false },
  { from: "core-router", to: "gw-cluster",    dashed: true  },
  { from: "cache-redis", to: "gw-cluster",    dashed: false },
  { from: "db-postgres", to: "gw-cluster",    dashed: true  },
];

const relationsMap: Record<string, string[]> = {
  "core-router":   ["auth-keycloak", "db-postgres", "cache-redis", "gw-cluster"],
  "auth-keycloak": ["core-router", "gw-cluster"],
  "db-postgres":   ["core-router", "cache-redis", "gw-cluster"],
  "cache-redis":   ["core-router", "db-postgres", "gw-cluster"],
  "gw-cluster":    ["core-router", "auth-keycloak", "db-postgres", "cache-redis"],
};

const DEFAULT_POSITIONS: Record<string, { x: number; y: number }> = {
  "core-router":   { x: 50,    y: 12.5 },
  "auth-keycloak": { x: 16.66, y: 40   },
  "db-postgres":   { x: 83.33, y: 40   },
  "cache-redis":   { x: 32,    y: 70   },
  "gw-cluster":    { x: 72,    y: 73   },
};

// ─── Bezier Math Generator (React Flow Style) ────────────────────────────────

function getCurvedPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  curvature = 0.5
): string {
  const x1 = start.x;
  const y1 = start.y;
  const x2 = end.x;
  const y2 = end.y;

  const dx = x2 - x1;
  const dy = y2 - y1;

  let cx1: number;
  let cy1: number;
  let cx2: number;
  let cy2: number;

  if (Math.abs(dx) >= Math.abs(dy)) {
    cx1 = x1 + dx * curvature;
    cy1 = y1;
    cx2 = x1 + dx * (1 - curvature);
    cy2 = y2;
  } else {
    cx1 = x1;
    cy1 = y1 + dy * curvature;
    cx2 = x2;
    cy2 = y1 + dy * (1 - curvature);
  }

  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface OverviewInfrastructureMapProps {
  serviceNodes: ServiceNode[];
  activeNode: string | null;
  onSelectNode: (nodeId: string) => void;
  activeNodeData: ServiceNode | null;
  gateways: GatewayServiceStatus[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNodeIcon(type: ServiceNode["type"]) {
  switch (type) {
    case "core":    return Server;
    case "db":      return Database;
    case "auth":    return KeyRound;
    case "cache":   return Activity;
    case "gateway": return LayoutGrid;
    default:        return Cpu;
  }
}

function getStatusColor(status: ServiceNode["status"]): string {
  switch (status) {
    case "healthy": return "bg-primary";
    case "warning": return "bg-amber-500";
    default:        return "bg-red-500";
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function OverviewInfrastructureMap({
  serviceNodes,
  activeNode,
  onSelectNode,
  activeNodeData,
  gateways,
}: OverviewInfrastructureMapProps) {
  const [pan, setPan]               = useState({ x: 0, y: 0 });
  const [zoom, setZoom]             = useState(0.95);
  const [isDragging, setIsDragging] = useState(false);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [isClusterExpanded, setIsClusterExpanded] = useState(false);
  const [activeOrbitNode, setActiveOrbitNode]     = useState<string | null>(null);

  const containerRef    = useRef<HTMLDivElement>(null);
  const viewportRef     = useRef<HTMLDivElement>(null);
  const dragStart       = useRef({ x: 0, y: 0 });
  const draggedNodeId   = useRef<string | null>(null);
  const nodeDragOrigin  = useRef<{ mx: number; my: number; nx: number; ny: number } | null>(null);
  const hasDraggedNode  = useRef(false);

  // ── Coordinates ──────────────────────────────────────────────────────────

  const getNodeCoords = useCallback(
    (nodeId: string): { x: number; y: number } =>
      nodePositions[nodeId] ?? DEFAULT_POSITIONS[nodeId] ?? { x: 50, y: 50 },
    [nodePositions]
  );

  const getOrbitCoords = useCallback(
    (gw: GatewayOrbitNode): { x: number; y: number } => {
      const c   = getNodeCoords("gw-cluster");
      const rad = (gw.angle * Math.PI) / 180;
      return { x: c.x + Math.cos(rad) * ORBIT_RX, y: c.y + Math.sin(rad) * ORBIT_RY };
    },
    [getNodeCoords]
  );

  // ── Dimming ──────────────────────────────────────────────────────────────

  const isNodeDimmed = useCallback(
    (nodeId: string): boolean => {
      if (!activeNode) return false;
      if (activeNode === nodeId) return false;
      return !(relationsMap[activeNode]?.includes(nodeId));
    },
    [activeNode]
  );

  // ── Sub-nodes ────────────────────────────────────────────────────────────

  const activeSubNodes = useMemo<SubNode[]>(() => {
    if (!activeNode || activeNode === "gw-cluster") return [];
    return subNodesMap[activeNode] || [];
  }, [activeNode]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      if (e.button !== 0) return;
      const coords = getNodeCoords(nodeId);
      draggedNodeId.current  = nodeId;
      nodeDragOrigin.current = { mx: e.clientX, my: e.clientY, nx: coords.x, ny: coords.y };
      hasDraggedNode.current = false;
    },
    [getNodeCoords]
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeId.current && nodeDragOrigin.current) {
      const vp = viewportRef.current;
      if (!vp) return;
      const rect = vp.getBoundingClientRect();
      const dx = (e.clientX - nodeDragOrigin.current.mx) / (rect.width  / 100) / zoom;
      const dy = (e.clientY - nodeDragOrigin.current.my) / (rect.height / 100) / zoom;
      if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) hasDraggedNode.current = true;
      if (hasDraggedNode.current) {
        const nx = Math.max(3, Math.min(97, nodeDragOrigin.current.nx + dx));
        const ny = Math.max(3, Math.min(97, nodeDragOrigin.current.ny + dy));
        setNodePositions((prev) => ({ ...prev, [draggedNodeId.current!]: { x: nx, y: ny } }));
      }
      return;
    }
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const handleMouseUpOrLeave = () => {
    draggedNodeId.current  = null;
    nodeDragOrigin.current = null;
    setIsDragging(false);
  };

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (hasDraggedNode.current) { hasDraggedNode.current = false; return; }
      if (nodeId === "gw-cluster") {
        setIsClusterExpanded((p) => !p);
        setActiveOrbitNode(null);
      }
      onSelectNode(nodeId);
    },
    [onSelectNode]
  );

  const handleOrbitClick = useCallback(
    (orbitId: string) => {
      setActiveOrbitNode((p) => (p === orbitId ? null : orbitId));
      onSelectNode("gw-cluster");
    },
    [onSelectNode]
  );

  const handleCollapseAll = () => {
    setIsClusterExpanded(false);
    setActiveOrbitNode(null);
    onSelectNode("");
  };

  const resetViewport = () => { setPan({ x: 0, y: 0 }); setZoom(0.95); };

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.min(Math.max(z + (e.deltaY < 0 ? 1 : -1) * 0.05, 0.6), 1.6));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ── Gateway helpers ───────────────────────────────────────────────────────

  const getOrbitStatus = useCallback(
    (gwName: string): ServiceNode["status"] =>
      gateways.find((g) => g.name === gwName)?.active ? "healthy" : "error",
    [gateways]
  );

  const clusterNode = serviceNodes.find((n) => n.id === "gw-cluster");
  const clusterStatus     = clusterNode?.status ?? "healthy";
  const clusterOnlineText = clusterNode?.metrics?.["Online"] ?? "—";
  const clusterPos        = getNodeCoords("gw-cluster");

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
        Status:     status === "healthy" ? "Online" : "Offline",
      },
      x: 0,
      y: 0,
    };
  }, [activeOrbitGw, activeNodeData, gateways, getOrbitStatus]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card
        className="flex flex-col justify-start border-border bg-card p-6 lg:col-span-2 relative select-none overflow-hidden h-full min-h-[460px]"
        ref={containerRef}
      >
        {/* Header + Controls */}
        <div className="flex justify-between items-start z-20 pointer-events-none">
          <div>
            <h4 className="text-sm font-semibold text-foreground pointer-events-auto">Infrastructure Dependency Map</h4>
            <p className="mt-0.5 text-[10px] text-muted-foreground pointer-events-auto">
              Interactive canvas. Pan with drag, zoom with wheel, click node to highlight. Drag nodes to reposition.
            </p>
          </div>

          {/* Unified zoom + collapse controls */}
          <div className="flex items-center gap-1 bg-popover/90 border border-border rounded-lg p-1 pointer-events-auto shadow-xl">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={() => setZoom((z) => Math.min(z + 0.1, 1.6))} title="Zoom In">
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[9px] font-mono font-bold text-muted-foreground px-1 select-none">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={() => setZoom((z) => Math.max(z - 0.1, 0.6))} title="Zoom Out">
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <div className="w-[1px] h-3 bg-border mx-0.5" />
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={resetViewport} title="Reset View">
              <RefreshCw className="h-3 w-3" />
            </Button>
            <div className="w-[1px] h-3 bg-border mx-0.5" />
            <Button
              variant="ghost"
              className="h-6 px-2 text-[9px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent gap-1 flex items-center"
              onClick={handleCollapseAll}
              title="Collapse All"
            >
              <Minimize2 className="h-3 w-3" />
              <span>Collapse All</span>
            </Button>
          </div>
        </div>

        {/* Viewport */}
        <div
          ref={viewportRef}
          className="relative mt-6 flex-1 w-full overflow-hidden rounded-xl border border-border/40 bg-card/40 cursor-grab active:cursor-grabbing min-h-[380px]"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
          {/* Dot grid */}
          <div
            className="absolute inset-0 z-0 opacity-25"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1.2px, transparent 1.2px)",
              backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
              transition: isDragging ? "none" : "transform 0.1s ease-out",
            }}
          />

          {/* Transform wrapper */}
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
                {/* Soft ambient glow */}
                <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Concentric Orbit Guide Ellipse for Go Gateways */}
              {isClusterExpanded && (
                <ellipse
                  cx={`${clusterPos.x}%`}
                  cy={`${clusterPos.y}%`}
                  rx={`${ORBIT_RX}%`}
                  ry={`${ORBIT_RY}%`}
                  fill="none"
                  stroke="currentColor"
                  className="text-primary/20 transition-opacity duration-300"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                />
              )}

              {/* Parent connections — Smooth Cubic Bezier Curves with Laser Comet Beams */}
              {parentConnections.map((conn, idx) => {
                const start      = getNodeCoords(conn.from);
                const end        = getNodeCoords(conn.to);
                const nodeFrom   = serviceNodes.find((n) => n.id === conn.from);
                const nodeTo     = serviceNodes.find((n) => n.id === conn.to);
                const isHealthy  = nodeFrom?.status === "healthy" && nodeTo?.status === "healthy";
                const isHighlighted =
                  !!activeNode &&
                  ((activeNode === conn.from && relationsMap[activeNode]?.includes(conn.to)) ||
                   (activeNode === conn.to   && relationsMap[activeNode]?.includes(conn.from)));
                const isDimmed = !!activeNode && !isHighlighted;
                const curveD   = getCurvedPath(start, end, 0.5);

                return (
                  <g key={`conn-${idx}`} style={{ transition: "opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }} className={isDimmed ? "opacity-20" : "opacity-100"}>
                    {/* 1. Subtle Base Track */}
                    <path
                      d={curveD}
                      fill="none"
                      stroke="currentColor"
                      className={cn(
                        "transition-colors duration-300",
                        isHighlighted ? "text-primary/40" : "text-border/40 dark:text-border/30"
                      )}
                      strokeWidth={isHighlighted ? 1.8 : 1.2}
                      strokeDasharray={conn.dashed ? "4 4" : undefined}
                    />

                    {/* 2. Sleek Laser Comet Pulse Flow (Magic UI Animated Beam Style) */}
                    <path
                      d={curveD}
                      fill="none"
                      stroke={isHealthy ? "var(--primary)" : "#f97316"}
                      strokeWidth={isHighlighted ? 2.4 : 1.6}
                      strokeLinecap="round"
                      strokeDasharray="24 140"
                      filter={isHighlighted && isHealthy ? "url(#soft-glow)" : undefined}
                      className={cn(
                        "animate-beam-flow transition-opacity duration-300",
                        isHighlighted ? "opacity-100" : isDimmed ? "opacity-0" : "opacity-75"
                      )}
                      style={{
                        animationDuration: isHighlighted ? "1.8s" : "2.8s",
                      }}
                    />
                  </g>
                );
              })}

              {/* Orbit spokes: cluster center → each orbit chip */}
              {isClusterExpanded && GATEWAY_ORBIT.map((gw) => {
                const cluster = getNodeCoords("gw-cluster");
                const orbit   = getOrbitCoords(gw);
                const isAct   = activeOrbitNode === gw.id;
                const spokeD  = getCurvedPath(cluster, orbit, 0.4);
                return (
                  <path
                    key={`spoke-${gw.id}`}
                    d={spokeD}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth={isAct ? 1.5 : 0.8}
                    strokeDasharray="2 4"
                    opacity={isAct ? 0.75 : 0.25}
                    style={{ transition: "opacity 0.3s, stroke-width 0.3s" }}
                  />
                );
              })}

              {/* Smart routing: active orbit node → its dependency nodes */}
              {isClusterExpanded && activeOrbitNode && (() => {
                const gw = GATEWAY_ORBIT.find((g) => g.id === activeOrbitNode);
                if (!gw) return null;
                const op = getOrbitCoords(gw);
                return gw.connectsTo.map((targetId) => {
                  const tp = getNodeCoords(targetId);
                  const smartD = getCurvedPath(op, tp, 0.45);
                  return (
                    <g key={`smart-${gw.id}-${targetId}`} className="animate-fade-in">
                      {/* Subtle guide curve */}
                      <path
                        d={smartD}
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        opacity={0.5}
                      />
                      {/* Active laser beam */}
                      <path
                        d={smartD}
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeDasharray="28 120"
                        filter="url(#soft-glow)"
                        className="animate-beam-flow opacity-100"
                        style={{ animationDuration: "1.6s" }}
                      />
                    </g>
                  );
                });
              })()}
            </svg>

            {/* Main 5 nodes */}
            {serviceNodes.map((node) => {
              const Icon      = getNodeIcon(node.type);
              const isSelected = activeNode === node.id;
              const dimmed     = isNodeDimmed(node.id);
              const pos        = getNodeCoords(node.id);
              const isCluster  = node.id === "gw-cluster";

              return (
                <button
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onClick={() => handleNodeClick(node.id)}
                  style={{
                    left: `${pos.x}%`,
                    top:  `${pos.y}%`,
                    transform: "translate(-50%, -50%)",
                    transition: "opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s, box-shadow 0.3s, transform 0.2s",
                    cursor: "grab",
                  }}
                  className={cn(
                    "absolute z-10 flex flex-col items-center justify-center rounded-xl border bg-card/95 backdrop-blur-md p-3 shadow-xl transition-all duration-300 group ring-1 ring-border/50",
                    isCluster ? "min-w-[92px]" : "min-w-[78px]",
                    isSelected
                      ? "border-primary/80 bg-primary/10 shadow-[0_0_25px_rgba(16,185,129,0.25)] ring-1 ring-primary/40 scale-105 z-20"
                      : "border-border/70 hover:border-foreground/30 hover:scale-102",
                    dimmed ? "opacity-20" : "opacity-100"
                  )}
                >
                  {isCluster && (
                    <span className={cn(
                      "absolute -top-2.5 -right-2 flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[7px] font-mono font-bold shadow-lg whitespace-nowrap",
                      clusterStatus === "healthy" ? "border-primary/30 bg-muted text-primary"
                        : clusterStatus === "warning" ? "border-amber-500/30 bg-muted text-amber-500"
                        : "border-red-500/30 bg-muted text-red-500"
                    )}>
                      <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", getStatusColor(clusterStatus))} />
                      {clusterOnlineText}
                    </span>
                  )}

                  <div className={cn(
                    "mb-1.5 flex items-center justify-center rounded-lg border p-1.5 transition-colors",
                    isSelected
                      ? "border-primary/50 bg-primary/20 text-primary"
                      : "border-border/60 bg-muted/60 text-muted-foreground group-hover:text-foreground"
                  )}>
                    <Icon className={cn("h-4 w-4", isCluster && "h-5 w-5")} />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      getStatusColor(node.status),
                      node.status === "healthy" ? "animate-pulse" : node.status === "error" ? "animate-ping" : ""
                    )} />
                    <span className="max-w-[72px] truncate text-[8.5px] font-mono font-bold uppercase text-foreground">
                      {isCluster ? "Go Gateways" : node.name.split(" ")[0]}
                    </span>
                  </div>

                  {isCluster && (
                    <span className="mt-0.5 text-[7px] text-muted-foreground font-mono">
                      {isClusterExpanded ? "▲ collapse" : "▼ expand"}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Orbit chips (9 gateways) — High Contrast Glassmorphic Capsules */}
            {isClusterExpanded && GATEWAY_ORBIT.map((gw) => {
              const OrbitIcon    = gw.icon;
              const orbitPos     = getOrbitCoords(gw);
              const status       = getOrbitStatus(gw.gatewayName);
              const isActive     = activeOrbitNode === gw.id;
              const otherActive  = activeOrbitNode !== null && !isActive;

              return (
                <button
                  key={gw.id}
                  onClick={() => handleOrbitClick(gw.id)}
                  style={{
                    left: `${orbitPos.x}%`,
                    top:  `${orbitPos.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  className={cn(
                    "absolute z-30 flex flex-col items-center justify-center rounded-xl border shadow-lg backdrop-blur-md transition-all duration-200 animate-fade-in group cursor-pointer",
                    "w-9 h-9",
                    isActive
                      ? "border-primary/80 bg-primary/20 shadow-[0_0_15px_rgba(16,185,129,0.35)] ring-1 ring-primary/50 scale-125 z-40"
                      : "border-border/80 bg-card/95 hover:border-foreground/30 hover:scale-110",
                    otherActive ? "opacity-35" : "opacity-100"
                  )}
                  title={`${gw.name} Gateway — Port ${gw.port}`}
                >
                  <OrbitIcon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  <span className={cn(
                    "absolute -bottom-4 left-1/2 -translate-x-1/2 text-[7.5px] font-mono font-semibold whitespace-nowrap",
                    isActive ? "text-primary font-bold" : "text-muted-foreground/90"
                  )}>
                    {gw.name}
                  </span>
                  <span className={cn(
                    "absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full border border-background",
                    getStatusColor(status),
                    status === "healthy" ? "animate-pulse" : ""
                  )} />
                </button>
              );
            })}

            {/* Sub-node chips for non-cluster nodes */}
            {activeNode && activeNode !== "gw-cluster" &&
              activeSubNodes.map((sub) => {
                const pc      = getNodeCoords(activeNode);
                const SubIcon = sub.icon;
                return (
                  <div
                    key={sub.id}
                    style={{
                      left: `calc(${pc.x}% + ${sub.xOffset}px)`,
                      top:  `calc(${pc.y}% + ${sub.yOffset}px)`,
                      transform: "translate(-50%, -50%)",
                    }}
                    className="absolute z-30 flex items-center gap-1.5 rounded-xl border border-primary/30 bg-card/95 px-2.5 py-1 shadow-lg backdrop-blur-md animate-fade-in hover:border-primary/60 transition-all"
                    title={sub.details}
                  >
                    <div className="flex items-center justify-center text-primary">
                      <SubIcon className="h-3 w-3" />
                    </div>
                    <span className="text-[7.5px] font-mono font-bold text-foreground tracking-wider uppercase select-none">
                      {sub.name}
                    </span>
                  </div>
                );
              })
            }
          </div>
        </div>

        <style jsx global>{`
          @keyframes beam-flow {
            from {
              stroke-dashoffset: 164;
            }
            to {
              stroke-dashoffset: 0;
            }
          }
          .animate-beam-flow {
            animation: beam-flow 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
          @keyframes fade-in {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.75); }
            to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
          .animate-fade-in { animation: fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        `}</style>
      </Card>

      <MapDetailPanel activeNodeData={activeOrbitServiceNode} activeSubNodes={activeSubNodes} />
    </div>
  );
}
