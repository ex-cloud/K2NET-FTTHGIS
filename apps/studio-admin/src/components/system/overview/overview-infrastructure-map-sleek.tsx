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
  Database,
  HardDrive,
  KeyRound,
  LayoutGrid,
  Map,
  MessageSquare,
  Minimize2,
  Network,
  RefreshCw,
  Server,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { ServiceNode } from "./overview-types";
import type { GatewayOrbitNode, SubNode } from "./overview-map-types";
import { MapDetailPanel } from "./map-detail-panel";
import type { GatewayServiceStatus } from "@/lib/actions/gateways";

// ─── 9 Gateway Orbit Nodes Configuration ──────────────────────────────────────

const GATEWAY_ORBIT: GatewayOrbitNode[] = [
  { id: "gw-notification", name: "Notification", gatewayName: "ftth-notification-gateway", port: 5001, icon: Bell,          angle: -72,  connectsTo: ["cache-redis", "db-postgres"] },
  { id: "gw-payment",      name: "Payment",      gatewayName: "ftth-payment-gateway",      port: 5002, icon: CreditCard,    angle: -32,  connectsTo: ["db-postgres", "auth-keycloak"] },
  { id: "gw-map",          name: "Map",           gatewayName: "ftth-map-gateway",          port: 5003, icon: Map,           angle: 8,    connectsTo: ["db-postgres", "cache-redis"] },
  { id: "gw-storage",      name: "Storage",      gatewayName: "ftth-storage-gateway",       port: 5004, icon: HardDrive,     angle: 48,   connectsTo: ["db-postgres"] },
  { id: "gw-whatsapp",     name: "WhatsApp",     gatewayName: "ftth-whatsapp-gateway",      port: 5005, icon: MessageSquare, angle: 108,  connectsTo: ["cache-redis"] },
  { id: "gw-export",       name: "Export",       gatewayName: "ftth-export-gateway",        port: 5007, icon: Upload,        angle: 148,  connectsTo: ["db-postgres"] },
  { id: "gw-scheduler",    name: "Scheduler",    gatewayName: "ftth-scheduler-gateway",     port: 5006, icon: CalendarClock, angle: 188,  connectsTo: ["db-postgres"] },
  { id: "gw-olt",          name: "OLT",          gatewayName: "ftth-olt-gateway",           port: 5008, icon: Network,       angle: 228,  connectsTo: ["db-postgres", "cache-redis"] },
  { id: "gw-audit",        name: "Audit",        gatewayName: "ftth-audit-gateway",         port: 5009, icon: ClipboardList, angle: 268,  connectsTo: ["db-postgres"] },
];

// ─── Fixed Canvas Dimensions (Matching infra_map_preview.jpg 100%) ───────────

const CANVAS_WIDTH  = 1000;
const CANVAS_HEIGHT = 560;

// Center of Orbit Ring on the Right Side
const ORBIT_CENTER = { x: 770, y: 320 };
const ORBIT_RADIUS = 135;

// Main Parent Node Fixed Positions in Canvas Coordinate Space (0..1000, 0..560)
const NODE_POSITIONS: Record<string, { x: number; y: number; title: string; subtitle: string; icon: React.ElementType }> = {
  "gw-left":       { x: 180, y: 280, title: "Go Gateways",      subtitle: "",             icon: LayoutGrid },
  "core-router":   { x: 440, y: 130, title: "Core Router",      subtitle: "Kong)",        icon: Server },
  "auth-keycloak": { x: 750, y: 130, title: "Keycloak Auth",    subtitle: "",             icon: KeyRound },
  "db-postgres":   { x: 440, y: 280, title: "PostgreSQL",       subtitle: "(SpatialLite)", icon: Database },
  "cache-redis":   { x: 440, y: 420, title: "Redis Cache",      subtitle: "",             icon: Activity },
};

// Main Topology Connections (Matching infra_map_preview.jpg)
const MAP_CONNECTIONS = [
  { id: "conn-1", from: "gw-left",       to: "core-router",   pathD: "M 180 280 C 310 280, 310 130, 440 130" },
  { id: "conn-2", from: "gw-left",       to: "auth-keycloak", pathD: "M 180 280 C 465 280, 465 130, 750 130" },
  { id: "conn-3", from: "gw-left",       to: "db-postgres",   pathD: "M 180 280 L 440 280" },
  { id: "conn-4", from: "gw-left",       to: "cache-redis",   pathD: "M 180 280 C 310 280, 310 420, 440 420" },
  { id: "conn-5", from: "core-router",   to: "db-postgres",   pathD: "M 440 130 L 440 280" },
  { id: "conn-6", from: "core-router",   to: "auth-keycloak", pathD: "M 440 130 L 750 130" },
  { id: "conn-7", from: "db-postgres",   to: "orbit-entry",   pathD: "M 440 280 C 550 280, 550 320, 635 320" },
  { id: "conn-8", from: "cache-redis",   to: "orbit-entry",   pathD: "M 440 420 C 550 420, 550 320, 635 320" },
];

const BEAM_DELAYS = [0, 0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8];

// ─── Sub-nodes map ─────────────────────────────────────────────────────────────

const subNodesMap: Record<string, SubNode[]> = {
  "core-router": [
    { id: "sub-kong-rl",  name: "Rate Limit", details: "Global request throttling (100 req/min)",   icon: Activity, xOffset: -35, yOffset: -48 },
    { id: "sub-kong-ip",  name: "IP Rules",   details: "WhatsApp webhook whitelist CIDR",             icon: Activity, xOffset: 0,   yOffset: -60 },
    { id: "sub-kong-jwt", name: "JWT Auth",   details: "Validation of Keycloak JWT signatures",       icon: Activity, xOffset: 35,  yOffset: -48 },
  ],
};

interface SleekMapProps {
  serviceNodes: ServiceNode[];
  activeNode: string | null;
  onSelectNode: (nodeId: string) => void;
  activeNodeData: ServiceNode | null;
  gateways: GatewayServiceStatus[];
}

export function OverviewInfrastructureMapSleek({
  serviceNodes: _serviceNodes,
  activeNode,
  onSelectNode,
  activeNodeData,
  gateways,
}: SleekMapProps) {
  const [zoom, setZoom]                         = useState(0.95);
  const [activeOrbitNode, setActiveOrbitNode]     = useState<string | "gw-notification">("gw-notification"); // default Notification highlighted like target image

  const getOrbitCoords = useCallback((gw: GatewayOrbitNode) => {
    const rad = (gw.angle * Math.PI) / 180;
    return {
      x: Math.round(ORBIT_CENTER.x + Math.cos(rad) * ORBIT_RADIUS),
      y: Math.round(ORBIT_CENTER.y + Math.sin(rad) * ORBIT_RADIUS),
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

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="flex flex-col justify-start border-border bg-card p-6 lg:col-span-2 relative select-none overflow-hidden h-full min-h-[560px]">
        {/* ── Top Bar Controls ── */}
        <div className="flex justify-between items-start z-20 pointer-events-none">
          <div>
            <h4 className="text-sm font-semibold text-foreground pointer-events-auto">Infrastructure Dependency Map</h4>
            <p className="mt-0.5 text-[10px] text-muted-foreground pointer-events-auto">
              Interactive 1:1 Blueprint Canvas. Click any service node to highlight dependency flows.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-popover/90 border border-border rounded-lg p-1 pointer-events-auto shadow-xl">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setZoom((z) => Math.min(z + 0.1, 1.4))}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[9px] font-mono font-bold text-muted-foreground px-1">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setZoom((z) => Math.max(z - 0.1, 0.7))}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <div className="w-[1px] h-3 bg-border mx-0.5" />
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setZoom(0.95)}>
              <RefreshCw className="h-3 w-3" />
            </Button>
            <div className="w-[1px] h-3 bg-border mx-0.5" />
            <Button variant="ghost" className="h-6 px-2 text-[9px] font-medium text-muted-foreground hover:text-foreground gap-1" onClick={() => { onSelectNode(""); setActiveOrbitNode("gw-notification"); }}>
              <Minimize2 className="h-3 w-3" />
              <span>Reset</span>
            </Button>
          </div>
        </div>

        {/* ── Viewport Canvas ── */}
        <div className="relative mt-4 flex-1 w-full overflow-hidden rounded-xl border border-border/30 bg-[hsl(var(--card))] min-h-[460px] flex items-center justify-center">
          {/* Subtle Dot Grid Background */}
          <div
            className="absolute inset-0 z-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)",
              backgroundSize: `${26 * zoom}px ${26 * zoom}px`,
            }}
          />

          {/* ── 1:1 SVG Canvas Matching Target Blueprint Image ── */}
          <div
            className="relative w-full h-full transform-gpu transition-transform duration-200 flex items-center justify-center"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
          >
            <svg
              className="w-full h-full overflow-visible pointer-events-auto"
              viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* ── Soft Emerald Radial Glow for Highlighted Orbit Node (Notification) ── */}
                <radialGradient id="notification-spotlight" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor="var(--primary)" stopOpacity="0.35" />
                  <stop offset="45%"  stopColor="var(--primary)" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0"   />
                </radialGradient>

                {/* ── Orbit Area Ambient Aurora Glow ── */}
                <radialGradient id="orbit-ambient-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor="var(--primary)" stopOpacity="0.08" />
                  <stop offset="70%"  stopColor="var(--primary)" stopOpacity="0.02" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0"   />
                </radialGradient>

                {/* ── Soft Comet Tip Glow Filter ── */}
                <filter id="laser-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* ── Orbit Ambient Aurora ── */}
              <ellipse
                cx={ORBIT_CENTER.x}
                cy={ORBIT_CENTER.y}
                rx={ORBIT_RADIUS + 70}
                ry={ORBIT_RADIUS + 70}
                fill="url(#orbit-ambient-glow)"
              />

              {/* ── Concentric Orbit Dashed Rings ── */}
              <ellipse
                cx={ORBIT_CENTER.x}
                cy={ORBIT_CENTER.y}
                rx={ORBIT_RADIUS + 45}
                ry={ORBIT_RADIUS + 45}
                fill="none"
                stroke="var(--primary)"
                strokeOpacity="0.12"
                strokeWidth="1.2"
                strokeDasharray="6 6"
                vectorEffect="non-scaling-stroke"
              />
              <ellipse
                cx={ORBIT_CENTER.x}
                cy={ORBIT_CENTER.y}
                rx={ORBIT_RADIUS}
                ry={ORBIT_RADIUS}
                fill="none"
                stroke="var(--primary)"
                strokeOpacity="0.25"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />

              {/* Orbit Center Text Label */}
              <text
                x={ORBIT_CENTER.x}
                y={ORBIT_CENTER.y + 4}
                textAnchor="middle"
                fill="currentColor"
                className="text-[12px] font-mono font-semibold fill-foreground/70 tracking-wider"
              >
                Go Gateways
              </text>

              {/* ── Base Track Connections ── */}
              {MAP_CONNECTIONS.map((conn) => (
                <path
                  key={`base-${conn.id}`}
                  d={conn.pathD}
                  fill="none"
                  stroke="currentColor"
                  className="text-border/30 dark:text-border/25"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              {/* ── Animated Laser Comet Pulse Flow Beams ── */}
              {MAP_CONNECTIONS.map((conn, idx) => (
                <path
                  key={`beam-${conn.id}`}
                  d={conn.pathD}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="24 140"
                  filter="url(#laser-glow)"
                  vectorEffect="non-scaling-stroke"
                  className="animate-beam-flow"
                  style={{
                    animationDuration: "2.4s",
                    animationDelay: `${BEAM_DELAYS[idx] ?? 0}s`,
                  }}
                />
              ))}

              {/* ── Parent Service Nodes (Pill-style Cards) ── */}
              {Object.entries(NODE_POSITIONS).map(([nodeId, pos]) => {
                const NodeIcon   = pos.icon;
                const isSelected = activeNode === nodeId;
                const isLeft     = nodeId === "gw-left";
                const width      = isLeft ? 140 : 130;
                const height     = 42;

                return (
                  <g
                    key={nodeId}
                    transform={`translate(${pos.x - width / 2}, ${pos.y - height / 2})`}
                    className="cursor-pointer group"
                    onClick={() => onSelectNode(nodeId)}
                  >
                    {/* Node Card Box */}
                    <rect
                      width={width}
                      height={height}
                      rx="12"
                      fill="hsl(var(--card))"
                      fillOpacity="0.9"
                      stroke={isSelected ? "var(--primary)" : "hsl(var(--border))"}
                      strokeOpacity={isSelected ? 0.8 : 0.4}
                      strokeWidth={isSelected ? 1.8 : 1.2}
                      vectorEffect="non-scaling-stroke"
                      className="transition-all duration-200 group-hover:stroke-foreground/30"
                    />

                    {/* Status Dot */}
                    <circle cx="16" cy="21" r="3.5" fill="var(--primary)" className="animate-pulse" />

                    {/* Node Title */}
                    <text
                      x="28"
                      y={pos.subtitle ? "18" : "24"}
                      fill="currentColor"
                      className={cn(
                        "text-[10.5px] font-mono font-semibold tracking-wide select-none",
                        isSelected ? "fill-primary font-bold" : "fill-foreground/90"
                      )}
                    >
                      {pos.title}
                    </text>

                    {/* Subtitle if present */}
                    {pos.subtitle && (
                      <text x="28" y="31" fill="currentColor" className="text-[8.5px] font-mono fill-muted-foreground/60 select-none">
                        {pos.subtitle}
                      </text>
                    )}

                    {/* Right Icon */}
                    <g transform={`translate(${width - 24}, 13)`} className="text-muted-foreground/60">
                      <NodeIcon className="h-3.5 w-3.5" />
                    </g>
                  </g>
                );
              })}

              {/* ── Highlight Glow for Selected Orbit Node (Notification) ── */}
              {activeOrbitGw && (() => {
                const pos = getOrbitCoords(activeOrbitGw);
                return (
                  <ellipse
                    cx={pos.x}
                    cy={pos.y}
                    rx="85"
                    ry="85"
                    fill="url(#notification-spotlight)"
                    className="pointer-events-none"
                  />
                );
              })()}

              {/* ── 9 Gateway Orbit Chips ── */}
              {GATEWAY_ORBIT.map((gw) => {
                const pos        = getOrbitCoords(gw);
                const OrbitIcon  = gw.icon;
                const isActive   = activeOrbitNode === gw.id;
                const chipWidth  = 110;
                const chipHeight = 34;

                return (
                  <g
                    key={gw.id}
                    transform={`translate(${pos.x - chipWidth / 2}, ${pos.y - chipHeight / 2})`}
                    className="cursor-pointer group"
                    onClick={() => { setActiveOrbitNode(gw.id); onSelectNode("gw-cluster"); }}
                  >
                    {/* Chip Pill Container */}
                    <rect
                      width={chipWidth}
                      height={chipHeight}
                      rx="10"
                      fill="hsl(var(--card))"
                      fillOpacity={isActive ? 0.95 : 0.85}
                      stroke={isActive ? "var(--primary)" : "hsl(var(--border))"}
                      strokeOpacity={isActive ? 0.9 : 0.4}
                      strokeWidth={isActive ? 1.8 : 1}
                      vectorEffect="non-scaling-stroke"
                      className="transition-all duration-200 group-hover:stroke-foreground/40"
                    />

                    {/* Status Dot */}
                    <circle cx="14" cy="17" r="3" fill="var(--primary)" className="animate-pulse" />

                    {/* Label */}
                    <text
                      x="24"
                      y="21"
                      fill="currentColor"
                      className={cn(
                        "text-[9.5px] font-mono font-semibold tracking-wide select-none",
                        isActive ? "fill-primary font-bold" : "fill-foreground/80"
                      )}
                    >
                      {gw.name}
                    </text>

                    {/* Right Icon */}
                    <g transform={`translate(${chipWidth - 20}, 10)`}>
                      <OrbitIcon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground/50")} />
                    </g>
                  </g>
                );
              })}

              {/* ── Orbit Entry Chip (Go Gateway on left boundary of orbit ring) ── */}
              <g transform="translate(580, 303)" className="cursor-pointer">
                <rect width="105" height="34" rx="10" fill="hsl(var(--card))" fillOpacity="0.85" stroke="hsl(var(--border))" strokeOpacity="0.5" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <circle cx="14" cy="17" r="3" fill="var(--primary)" className="animate-pulse" />
                <text x="24" y="21" fill="currentColor" className="text-[9.5px] font-mono font-semibold fill-foreground/80 select-none">
                  Go Gateway
                </text>
              </g>
            </svg>
          </div>
        </div>
      </Card>

      {/* Detail Panel */}
      <MapDetailPanel activeNodeData={activeOrbitServiceNode} activeSubNodes={activeSubNodes} />
    </div>
  );
}
