"use client";

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
// Angles distributed evenly for a clean ring layout (matching target image)
const GATEWAY_ORBIT: GatewayOrbitNode[] = [
  { id: "gw-notification", name: "Notification", gatewayName: "ftth-notification-gateway", port: 5001, icon: Bell,          angle: -72,  connectsTo: ["cache-redis", "db-postgres"] },
  { id: "gw-payment",      name: "Payment",      gatewayName: "ftth-payment-gateway",      port: 5002, icon: CreditCard,    angle: -32,  connectsTo: ["db-postgres", "auth-keycloak"] },
  { id: "gw-map",          name: "Map",           gatewayName: "ftth-map-gateway",          port: 5003, icon: Map,           angle: 8,    connectsTo: ["db-postgres", "cache-redis"] },
  { id: "gw-storage",      name: "Storage",      gatewayName: "ftth-storage-gateway",       port: 5004, icon: HardDrive,     angle: 48,   connectsTo: ["db-postgres"] },
  { id: "gw-whatsapp",     name: "WhatsApp",     gatewayName: "ftth-whatsapp-gateway",      port: 5005, icon: MessageSquare, angle: 108,  connectsTo: ["cache-redis"] },
  { id: "gw-export",       name: "Export",       gatewayName: "ftth-export-gateway",        port: 5007, icon: Upload,        angle: 148,  connectsTo: ["db-postgres"] },
  { id: "gw-olt",          name: "OLT",          gatewayName: "ftth-olt-gateway",           port: 5008, icon: Network,       angle: 188,  connectsTo: ["db-postgres", "cache-redis"] },
  { id: "gw-scheduler",    name: "Scheduler",    gatewayName: "ftth-scheduler-gateway",     port: 5006, icon: CalendarClock, angle: 228,  connectsTo: ["db-postgres"] },
  { id: "gw-audit",        name: "Audit",        gatewayName: "ftth-audit-gateway",         port: 5009, icon: ClipboardList, angle: 268,  connectsTo: ["db-postgres"] },
];

// Larger orbit radius — matches the BIG ring in the target image
const ORBIT_RX = 22;  // % of viewport width
const ORBIT_RY = 27;  // % of viewport height

// ─── Static data ─────────────────────────────────────────────────────────────

const subNodesMap: Record<string, SubNode[]> = {
  "core-router": [
    { id: "sub-kong-rl",  name: "Rate Limit", details: "Global request throttling (100 req/min)",   icon: Zap,    xOffset: -35, yOffset: -48 },
    { id: "sub-kong-ip",  name: "IP Rules",   details: "WhatsApp webhook whitelist CIDR",             icon: Shield, xOffset: 0,   yOffset: -60 },
    { id: "sub-kong-jwt", name: "JWT Auth",   details: "Validation of Keycloak JWT signatures",       icon: Lock,   xOffset: 35,  yOffset: -48 },
  ],
  "auth-keycloak": [
    { id: "sub-kc-realm", name: "Realms",     details: "Multi-tenant isolation configurations",       icon: Layers, xOffset: -50, yOffset: 30 },
    { id: "sub-kc-mfa",   name: "MFA Policy", details: "Multi-factor authentication check",           icon: Shield, xOffset: -50, yOffset: -30 },
  ],
  "db-postgres": [
    { id: "sub-pg-part",    name: "Partitions", details: "Audit Logs monthly tables partitioned",     icon: Database, xOffset: 50, yOffset: -28 },
    { id: "sub-pg-spatial", name: "PostGIS",    details: "Spatial mapping & coordinate functions",    icon: Map,      xOffset: 50, yOffset: 28 },
  ],
  "cache-redis": [
    { id: "sub-rd-pub",  name: "Pub/Sub",    details: "Event dispatcher channels (network-events)",   icon: Radio,  xOffset: -30, yOffset: -48 },
    { id: "sub-rd-tile", name: "Tile Cache", details: "Cached spatial map tiles storage",              icon: Layers, xOffset: 30,  yOffset: -48 },
  ],
};

const parentConnections: ParentConnection[] = [
  { from: "core-router", to: "auth-keycloak", dashed: false },
  { from: "core-router", to: "db-postgres",   dashed: false },
  { from: "core-router", to: "cache-redis",   dashed: false },
  { from: "core-router", to: "gw-cluster",    dashed: false },
  { from: "cache-redis", to: "gw-cluster",    dashed: false },
  { from: "db-postgres", to: "gw-cluster",    dashed: false },
];

const relationsMap: Record<string, string[]> = {
  "core-router":   ["auth-keycloak", "db-postgres", "cache-redis", "gw-cluster"],
  "auth-keycloak": ["core-router", "gw-cluster"],
  "db-postgres":   ["core-router", "cache-redis", "gw-cluster"],
  "cache-redis":   ["core-router", "db-postgres", "gw-cluster"],
  "gw-cluster":    ["core-router", "auth-keycloak", "db-postgres", "cache-redis"],
};

// Default positions — balanced layout, stays within 20-80% range per Gemini AI advice
// Coordinates are 0-100 scale matching viewBox="0 0 100 100" and CSS left/top %
const DEFAULT_POSITIONS: Record<string, { x: number; y: number }> = {
  "core-router":   { x: 35, y: 25 }, // top-center-left
  "auth-keycloak": { x: 70, y: 25 }, // top-right
  "db-postgres":   { x: 35, y: 55 }, // center
  "cache-redis":   { x: 35, y: 80 }, // bottom
  "gw-cluster":    { x: 72, y: 65 }, // center-right (orbit center)
};

// Stagger delays for laser comet per beam
const BEAM_DELAYS = [0, 0.5, 1.0, 1.5, 2.0, 2.5];

// ─── Bezier Math (React Flow Style Smooth Cubic Bezier) ──────────────────────

function getCurvedPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  curvature = 0.5
): string {
  const dx = end.x - start.x;

  const cx1 = start.x + dx * curvature;
  const cy1 = start.y;
  const cx2 = start.x + dx * (1 - curvature);
  const cy2 = end.y;

  return `M ${start.x} ${start.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${end.x} ${end.y}`;
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

function getStatusDotColor(status: ServiceNode["status"]): string {
  // Returns CSS variable path resolved at runtime for SVG/inline-style usage
  // These are JavaScript string values passed to style={{ backgroundColor }}, not Tailwind classes
  switch (status) {
    case "healthy": return "var(--primary)";
    case "warning": return "hsl(45 93% 47%)";
    default:        return "hsl(0 84% 60%)";
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
    (nodeId: string) => nodePositions[nodeId] ?? DEFAULT_POSITIONS[nodeId] ?? { x: 50, y: 50 },
    [nodePositions]
  );

  const getOrbitCoords = useCallback(
    (gw: GatewayOrbitNode) => {
      const c   = getNodeCoords("gw-cluster");
      const rad = (gw.angle * Math.PI) / 180;
      return { x: c.x + Math.cos(rad) * ORBIT_RX, y: c.y + Math.sin(rad) * ORBIT_RY };
    },
    [getNodeCoords]
  );

  // ── Dimming ──────────────────────────────────────────────────────────────

  const isNodeDimmed = useCallback(
    (nodeId: string) => {
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

  const clusterNode       = serviceNodes.find((n) => n.id === "gw-cluster");
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
        className="flex flex-col justify-start border-border bg-card p-6 lg:col-span-2 relative select-none overflow-hidden h-full min-h-[560px]"
        ref={containerRef}
      >
        {/* ── Header + Controls ── */}
        <div className="flex justify-between items-start z-20 pointer-events-none">
          <div>
            <h4 className="text-sm font-semibold text-foreground pointer-events-auto">Infrastructure Dependency Map</h4>
            <p className="mt-0.5 text-[10px] text-muted-foreground pointer-events-auto">
              Interactive canvas. Pan with drag, zoom with wheel, click node to highlight. Drag nodes to reposition.
            </p>
          </div>
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
            >
              <Minimize2 className="h-3 w-3" />
              <span>Collapse All</span>
            </Button>
          </div>
        </div>

        {/* ── Viewport ── */}
        <div
          ref={viewportRef}
          className="relative mt-4 flex-1 w-full overflow-hidden rounded-xl border border-border/30 bg-[hsl(var(--card))] cursor-grab active:cursor-grabbing min-h-[470px]"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
          {/* Subtle dot grid — very faint like target image */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
              backgroundSize: `${28 * zoom}px ${28 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
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
            {/* ════════════════════════════════════════════════════════════
                SVG layer — connections, orbit rings, laser comets
                KEY FIX: viewBox="0 0 100 100" + preserveAspectRatio="none"
                makes SVG coordinate space (0-100) sync exactly with
                CSS percentage positions (left: 42%, top: 22%) of node buttons.
                Without this, path coordinates are interpreted as pixels ≠ %!
                ════════════════════════════════════════════════════════════ */}
            <svg
              className="absolute inset-0 h-full w-full pointer-events-none z-0"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Per-connection comet gradients — userSpaceOnUse in viewBox 0-100 coords */}
                {parentConnections.map((conn, idx) => {
                  const s = getNodeCoords(conn.from);
                  const e = getNodeCoords(conn.to);
                  return (
                    <linearGradient
                      key={`lg-${idx}`}
                      id={`comet-${idx}`}
                      gradientUnits="userSpaceOnUse"
                      x1={s.x} y1={s.y}
                      x2={e.x} y2={e.y}
                    >
                      <stop offset="0%"   stopColor="var(--primary)" stopOpacity="0"   />
                      <stop offset="60%"  stopColor="var(--primary)" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="hsl(0 0% 100%)" stopOpacity="1"   />
                    </linearGradient>
                  );
                })}

                {/* Orbit active beam gradient */}
                <linearGradient id="orbit-beam" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="var(--primary)" stopOpacity="0"   />
                  <stop offset="60%"  stopColor="var(--primary)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="hsl(0 0% 100%)" stopOpacity="1"   />
                </linearGradient>

                {/* Soft node selection glow */}
                <filter id="node-glow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Comet tip glow */}
                <filter id="comet-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Orbit area aurora glow — Aceternity Deep Dark radial gradient */}
                <radialGradient id="orbit-aura" cx="50%" cy="50%" r="50%" gradientUnits="objectBoundingBox">
                  <stop offset="0%"   stopColor="var(--primary)" stopOpacity="0.15" />
                  <stop offset="55%"  stopColor="var(--primary)" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0"   />
                </radialGradient>
              </defs>

              {/* ── PILAR 4: Concentric Orbit Rings (Railway.app style) ── */}
              {isClusterExpanded && (
                <>
                  {/* Aurora glow fill — bare numbers in viewBox 0-100 coords */}
                  <ellipse
                    cx={clusterPos.x}
                    cy={clusterPos.y}
                    rx={ORBIT_RX + 9}
                    ry={ORBIT_RY + 10}
                    fill="url(#orbit-aura)"
                  />
                  {/* Outer ring — wide halo */}
                  <ellipse
                    cx={clusterPos.x}
                    cy={clusterPos.y}
                    rx={ORBIT_RX + 5}
                    ry={ORBIT_RY + 5.5}
                    fill="none"
                    stroke="var(--primary)"
                    strokeOpacity="0.14"
                    strokeWidth="1.2"
                    strokeDasharray="6 6"
                    vectorEffect="non-scaling-stroke"
                  />
                  {/* Inner ring — main orbit track */}
                  <ellipse
                    cx={clusterPos.x}
                    cy={clusterPos.y}
                    rx={ORBIT_RX}
                    ry={ORBIT_RY}
                    fill="none"
                    stroke="var(--primary)"
                    strokeOpacity="0.35"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    vectorEffect="non-scaling-stroke"
                  />
                </>
              )}

              {/* ── PILAR 1+2: Cubic Bezier connections + Magic UI Laser Comet Beams ── */}
              {parentConnections.map((conn, idx) => {
                const s = getNodeCoords(conn.from);
                const e = getNodeCoords(conn.to);
                const isHighlighted =
                  !!activeNode &&
                  ((activeNode === conn.from && relationsMap[activeNode]?.includes(conn.to)) ||
                   (activeNode === conn.to   && relationsMap[activeNode]?.includes(conn.from)));
                const isDimmed = !!activeNode && !isHighlighted;
                // PILAR 1: Smooth Cubic Bezier (React Flow formula)
                const curveD = getCurvedPath(s, e, 0.5);

                return (
                  <g
                    key={`conn-${idx}`}
                    // PILAR 4: opacity-20 saat dimmed (sesuai dokumen: 20%)
                    className={cn(
                      "transition-opacity duration-300",
                      isDimmed ? "opacity-20" : "opacity-100"
                    )}
                  >
                    {/* PILAR 3: Aceternity base track — text-border/40, 1.5px, tidak berkedip */}
                    <path
                      d={curveD}
                      fill="none"
                      stroke="currentColor"
                      vectorEffect="non-scaling-stroke"
                      className={cn(
                        "transition-all duration-300",
                        isHighlighted ? "text-primary/50" : "text-border/40 dark:text-border/30"
                      )}
                      strokeWidth={isHighlighted ? 2 : 1.5}
                    />

                    {/* PILAR 2: Magic UI Laser Comet — solid var(--primary), 24px + 140px gap */}
                    <path
                      d={curveD}
                      fill="none"
                      stroke="var(--primary)"
                      vectorEffect="non-scaling-stroke"
                      strokeWidth={isHighlighted ? 2.5 : 1.8}
                      strokeLinecap="round"
                      strokeDasharray="24 140"
                      filter={isHighlighted ? "url(#comet-glow)" : undefined}
                      className="animate-beam-flow"
                      style={{
                        animationDuration: isHighlighted ? "1.5s" : "2.4s",
                        animationDelay: `${BEAM_DELAYS[idx] ?? 0}s`,
                      }}
                    />
                  </g>
                );
              })}

              {/* ── PILAR 4: Orbit spokes — dihapus per dokumen, diganti concentric ring ── */}
              {/* Spoke lines tidak diperlukan — orbit ring sudah cukup sebagai guide */}

              {/* ── Smart routing: active orbit → its dependencies ── */}
              {isClusterExpanded && activeOrbitNode && (() => {
                const gw = GATEWAY_ORBIT.find((g) => g.id === activeOrbitNode);
                if (!gw) return null;
                const op = getOrbitCoords(gw);
                return gw.connectsTo.map((targetId) => {
                  const tp     = getNodeCoords(targetId);
                  const smartD = getCurvedPath(op, tp, 0.42);
                  return (
                    <g key={`smart-${gw.id}-${targetId}`}>
                      <path
                        d={smartD}
                        fill="none"
                        stroke="var(--primary)"
                        vectorEffect="non-scaling-stroke"
                        strokeWidth={1.2}
                        strokeDasharray="4 5"
                        strokeOpacity={0.4}
                      />
                      <path
                        d={smartD}
                        fill="none"
                        stroke="url(#orbit-beam)"
                        vectorEffect="non-scaling-stroke"
                        strokeWidth={2.4}
                        strokeLinecap="round"
                        strokeDasharray="20 126"
                        filter="url(#comet-glow)"
                        className="animate-beam-flow"
                        style={{ animationDuration: "1.4s" }}
                      />
                    </g>
                  );
                });
              })()}
            </svg>

            {/* ════════════════════════════════════════════════════════════
                Main 5 parent nodes — pill-style cards like target image
                ════════════════════════════════════════════════════════════ */}
            {serviceNodes.map((node) => {
              const Icon       = getNodeIcon(node.type);
              const isSelected = activeNode === node.id;
              const dimmed     = isNodeDimmed(node.id);
              const pos        = getNodeCoords(node.id);
              const isCluster  = node.id === "gw-cluster";
              const dotColor   = getStatusDotColor(node.status);

              return (
                <button
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onClick={() => handleNodeClick(node.id)}
                  style={{
                    left: `${pos.x}%`,
                    top:  `${pos.y}%`,
                    transform: "translate(-50%, -50%)",
                    transition: "opacity 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s, transform 0.2s",
                    cursor: "grab",
                    // Glow halo behind selected node — matches target image
                    boxShadow: isSelected
                      ? "0 0 0 1px color-mix(in srgb, var(--primary) 50%, transparent), 0 0 32px color-mix(in srgb, var(--primary) 25%, transparent), 0 4px 20px rgba(0,0,0,0.4)"
                      : "0 2px 12px rgba(0,0,0,0.3)",
                  }}
                  // PILAR 4: Spotlight Focus Mode — dim unrelated nodes to opacity-10
                  className={cn(
                    "absolute z-10 flex items-center gap-2 rounded-xl border backdrop-blur-sm px-4 py-2.5 transition-all duration-300 group whitespace-nowrap",
                    isCluster ? "min-w-[140px]" : "min-w-[118px]",
                    isSelected
                      ? "border-primary/60 bg-primary/10 scale-105 z-20"
                      : "border-border/50 bg-card/80 hover:border-border/80 hover:scale-[1.03] hover:bg-card/95",
                  dimmed ? "opacity-20" : "opacity-100"
                  )}
                >
                  {/* Status dot */}
                  <span
                    className={cn("h-2 w-2 rounded-full flex-shrink-0", node.status === "healthy" ? "animate-pulse" : "")}
                    style={{ backgroundColor: dotColor, boxShadow: isSelected ? `0 0 8px ${dotColor}` : undefined }}
                  />

                  {/* Label + Subtitle (like target: "Core Router" / "Kong)") */}
                  <div className="flex flex-col min-w-0">
                    <span className={cn("text-[10.5px] font-semibold font-mono uppercase tracking-wide truncate",
                      isSelected ? "text-primary" : "text-foreground/90"
                    )}>
                      {isCluster ? "Go Gateways" : node.name.split(" ").slice(0, 2).join(" ")}
                    </span>
                    <span className="text-[8px] text-muted-foreground/60 font-mono truncate">
                      {isCluster
                        ? (isClusterExpanded ? "▲ collapse" : "▼ expand")
                        : node.type === "core"  ? "Kong)"
                        : node.type === "db"    ? "(SpatiaLite)"
                        : node.type === "auth"  ? "Keycloak 26"
                        : node.type === "cache" ? "Redis 7"
                        : `port ${node.port}`}
                    </span>
                  </div>

                  {/* Icon — right side */}
                  <Icon className={cn(
                    "h-3.5 w-3.5 flex-shrink-0 ml-auto",
                    isSelected ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground/80"
                  )} />

                  {/* Cluster online badge */}
                  {isCluster && (
                    <span className={cn(
                      "absolute -top-2 -right-1 flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[7px] font-mono font-bold whitespace-nowrap",
                      clusterStatus === "healthy"
                        ? "border-primary/30 bg-primary/20 text-primary"
                        : "border-red-500/30 bg-red-950/80 text-red-400"
                    )}>
                      <span className={cn("h-1 w-1 rounded-full", clusterStatus === "healthy" ? "bg-primary animate-pulse" : "bg-red-400")} />
                      {clusterOnlineText}
                    </span>
                  )}
                </button>
              );
            })}

            {/* ════════════════════════════════════════════════════════════
                9 Orbit chips — pill cards around concentric ring
                ════════════════════════════════════════════════════════════ */}
            {isClusterExpanded && GATEWAY_ORBIT.map((gw, gwIdx) => {
              const OrbitIcon   = gw.icon;
              const orbitPos    = getOrbitCoords(gw);
              const status      = getOrbitStatus(gw.gatewayName);
              const isActive    = activeOrbitNode === gw.id;
              const otherActive = activeOrbitNode !== null && !isActive;
              const dotColor    = getStatusDotColor(status);

              return (
                <button
                  key={gw.id}
                  onClick={() => handleOrbitClick(gw.id)}
                  style={{
                    left: `${orbitPos.x}%`,
                    top:  `${orbitPos.y}%`,
                    transform: "translate(-50%, -50%)",
                    // Glow for active orbit chip — matches target image (Notification highlighted)
                    boxShadow: isActive
                      ? "0 0 0 1px color-mix(in srgb, var(--primary) 60%, transparent), 0 0 24px color-mix(in srgb, var(--primary) 35%, transparent)"
                      : "0 1px 8px rgba(0,0,0,0.3)",
                    animationDelay: `${gwIdx * 40}ms`,
                  }}
                  className={cn(
                    "absolute z-30 flex items-center gap-1.5 rounded-lg border backdrop-blur-sm px-2.5 py-1.5 transition-all duration-200 animate-fade-in-scale group cursor-pointer whitespace-nowrap",
                    isActive
                      ? "border-primary/60 bg-primary/10 scale-110 z-40"
                      : "border-border/60 bg-card/85 hover:border-border/90 hover:scale-105 hover:bg-card/95",
                    otherActive ? "opacity-25" : "opacity-100"
                  )}
                  title={`${gw.name} Gateway — Port ${gw.port}`}
                >
                  {/* Status dot */}
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", status === "healthy" ? "animate-pulse" : "")}
                    style={{ backgroundColor: dotColor, boxShadow: isActive ? `0 0 6px ${dotColor}` : undefined }}
                  />
                  {/* Label */}
                  <span className={cn(
                    "text-[8.5px] font-mono font-semibold",
                    isActive ? "text-primary" : "text-foreground/80 group-hover:text-foreground"
                  )}>
                    {gw.name}
                  </span>
                  {/* Icon */}
                  <OrbitIcon className={cn(
                    "h-3 w-3 flex-shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground/50"
                  )} />
                </button>
              );
            })}

            {/* ── Sub-node chips for selected parent node ── */}
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
                    className="absolute z-30 flex items-center gap-1.5 rounded-lg border border-primary/25 bg-card/90 px-2 py-1 shadow-lg backdrop-blur-md animate-fade-in-scale hover:border-primary/50 transition-all"
                    title={sub.details}
                  >
                    <SubIcon className="h-2.5 w-2.5 text-primary flex-shrink-0" />
                    <span className="text-[7.5px] font-mono font-bold text-foreground/90 tracking-wide uppercase select-none">
                      {sub.name}
                    </span>
                  </div>
                );
              })
            }
          </div>
        </div>
      </Card>

      <MapDetailPanel activeNodeData={activeOrbitServiceNode} activeSubNodes={activeSubNodes} />
    </div>
  );
}
