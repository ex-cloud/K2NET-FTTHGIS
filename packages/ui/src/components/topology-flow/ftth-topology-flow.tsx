"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Globe2,
  Network,
  Server,
  Layers,
  Box,
  Radio,
  Wifi,
  Activity,
  CheckCircle2,
  Zap,
  Cable,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../utils";

export interface FtthTopologyFlowProps {
  className?: string;
  tenantName?: string;
  rxPowerDbm?: number;
  realtimeLatencyMs?: number;
  interactive?: boolean;
}

interface NodeData {
  id: string;
  column: number; // 0, 1, 2, 3
  row: number; // 0, 1
  label: string;
  sublabel: string;
  category: string;
  icon: React.ElementType;
  badge?: string;
  metric?: string;
  status: "ONLINE" | "ACTIVE" | "OPTIMAL" | "STANDBY";
}

interface CableConnection {
  id: string;
  from: string;
  to: string;
}

export function FtthTopologyFlow({
  className,
  tenantName = "PT Nusantara",
  rxPowerDbm = -19.4,
  realtimeLatencyMs = 12,
  interactive = true,
}: FtthTopologyFlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [activeSignalIndex, setActiveSignalIndex] = useState(0);
  const [liveLatency, setLiveLatency] = useState(realtimeLatencyMs);

  // Subtle real-time ping jitter for ultra-realistic telemetry feel
  useEffect(() => {
    const interval = setInterval(() => {
      const jitter = Math.floor(Math.random() * 5) - 2; // -2 to +2
      setLiveLatency((prev) => Math.max(7, Math.min(24, prev + jitter)));
      setActiveSignalIndex((prev) => (prev + 1) % 6);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // ── Node Definitions (FTTH End-to-End Pipeline) ────────────────────────
  const nodes: NodeData[] = useMemo(
    () => [
      // ── Stage 0: Core & Upstream
      {
        id: "ixp-upstream",
        column: 0,
        row: 0,
        label: "Tier-1 Upstream IXP",
        sublabel: "OpenIXP / Dual 100G Trunk",
        category: "CORE BACKBONE",
        icon: Globe2,
        badge: "100G QSFP28",
        metric: "99.99% SLA",
        status: "ONLINE",
      },
      {
        id: "bgp-router",
        column: 0,
        row: 1,
        label: "Core BGP Router",
        sublabel: "AS-59310 Peering Fabric",
        category: "ROUTING GATEWAY",
        icon: Network,
        badge: "0.2ms Core",
        metric: "10G SFP+ Link",
        status: "ONLINE",
      },

      // ── Stage 1: Central Office / OLT Core
      {
        id: "olt-chassis",
        column: 1,
        row: 0,
        label: "OLT Core Chassis",
        sublabel: `${tenantName} Aggregation OLT`,
        category: "CENTRAL OFFICE",
        icon: Server,
        badge: "GPON 2.5G",
        metric: "16 PON Ports",
        status: "ONLINE",
      },
      {
        id: "odf-bay",
        column: 1,
        row: 1,
        label: "ODF Main Bay",
        sublabel: "Optical Trunk SC/APC Patch",
        category: "OPTICAL INTERFACE",
        icon: Cable,
        badge: "0.12 dB Loss",
        metric: "Feeder 96-Core",
        status: "ACTIVE",
      },

      // ── Stage 2: Passive ODN (Outside Plant)
      {
        id: "fdt-cabinet",
        column: 2,
        row: 0,
        label: "FDT Street Cabinet",
        sublabel: "FDT-04 • Primary 1:4 PLC Splitter",
        category: "PASSIVE ODN",
        icon: Layers,
        badge: "1:4 PLC",
        metric: "Trunk Feeder",
        status: "ACTIVE",
      },
      {
        id: "fat-pole",
        column: 2,
        row: 1,
        label: "FAT Pole Terminal",
        sublabel: "FAT-12 • Secondary 1:8 Splitter",
        category: "DISTRIBUTION",
        icon: Box,
        badge: "1:8 Drop",
        metric: "Aerial Fiber",
        status: "ACTIVE",
      },

      // ── Stage 3: Subscriber & Edge Diagnostics
      {
        id: "customer-ont",
        column: 3,
        row: 0,
        label: "Customer ONT Gateway",
        sublabel: "Dual-Band WiFi 6 GPON ONT",
        category: "CUSTOMER PREMISES",
        icon: Wifi,
        badge: "Active Client",
        metric: `${liveLatency}ms Ping`,
        status: "ACTIVE",
      },
      {
        id: "rx-power",
        column: 3,
        row: 1,
        label: "Optical Rx Telemetry",
        sublabel: `${rxPowerDbm} dBm (Optimal Class B+)`,
        category: "SIGNAL DIAGNOSTICS",
        icon: Activity,
        badge: "0 Frame Loss",
        metric: "Optic Pass",
        status: "OPTIMAL",
      },
    ],
    [tenantName, rxPowerDbm, liveLatency]
  );

  // ── Network Cable Interconnections ────────────────────────────────────
  const connections: CableConnection[] = useMemo(
    () => [
      // Core -> OLT
      { id: "c1", from: "ixp-upstream", to: "olt-chassis" },
      { id: "c2", from: "bgp-router", to: "olt-chassis" },

      // OLT -> ODF
      { id: "c3", from: "olt-chassis", to: "odf-bay" },

      // ODF -> FDT
      { id: "c4", from: "odf-bay", to: "fdt-cabinet" },

      // FDT -> FAT
      { id: "c5", from: "fdt-cabinet", to: "fat-pole" },

      // FAT -> ONT & Rx Telemetry
      { id: "c6", from: "fat-pole", to: "customer-ont" },
      { id: "c7", from: "fat-pole", to: "rx-power" },
    ],
    []
  );

  // Calculate if a cable is connected to the hovered node (highlight path)
  const isCableHighlighted = (cable: CableConnection) => {
    if (!hoveredNode) return false;
    return cable.from === hoveredNode || cable.to === hoveredNode;
  };

  // Node position coordinates for SVG Bezier connectors (Normalized on 820 x 380 canvas)
  // 4 columns: x = 110, 310, 510, 710. Rows: y = 95, 265
  const getNodeAnchor = (nodeId: string, side: "input" | "output") => {
    const colX = [105, 305, 505, 705];
    const rowY = [90, 260];
    const cardWidth = 160;

    const n = nodes.find((item) => item.id === nodeId);
    if (!n) return { x: 0, y: 0 };

    const baseY = rowY[n.row] + 45; // center of card height
    if (side === "input") {
      return { x: colX[n.column], y: baseY };
    }
    return { x: colX[n.column] + cardWidth, y: baseY };
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full max-w-4xl mx-auto flex flex-col items-center select-none font-sans",
        className
      )}
    >
      {/* ── Top Telemetry Status Header Bar ──────────────────────────────── */}
      <div className="w-full flex items-center justify-between pb-3 mb-2 px-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </div>
          <span className="text-[11px] font-bold font-mono tracking-wider uppercase text-foreground">
            FTTH Optical & Physical Network Topology
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
          <span className="hidden sm:inline-flex items-center gap-1 bg-accent/80 px-2 py-0.5 rounded border border-border/60">
            <Zap className="h-3 w-3 text-primary" />
            Latency: <strong className="text-foreground">{liveLatency}ms</strong>
          </span>
          <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/25 font-semibold">
            <CheckCircle2 className="h-3 w-3" />
            Signal: Optimal (-19.4 dBm)
          </span>
        </div>
      </div>

      {/* ── Main Topology Grid Viewport (SVG Connectors + Node Cards) ─────── */}
      <div className="relative w-full h-[360px] overflow-visible">
        {/* Background SVG Canvas for Precision Bezier Curved Optical Fibers */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0"
          viewBox="0 0 820 380"
          preserveAspectRatio="xMidYMid meet"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Glow Filter for Active Fiber Line */}
            <filter id="fiberGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Gradient for Laser Optical Path */}
            <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#bef264" stopOpacity="1" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="passiveFiberGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Render All Cable Curves */}
          {connections.map((cable) => {
            const p1 = getNodeAnchor(cable.from, "output");
            const p2 = getNodeAnchor(cable.to, "input");
            const isHighlighted = isCableHighlighted(cable);

            // Calculate natural S-curve cubic bezier control points
            const dx = Math.abs(p2.x - p1.x) * 0.55;
            const pathData = `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;

            return (
              <g key={cable.id} className="transition-all duration-300">
                {/* Base Optical Cable Line (Subtle Neutral Seam) */}
                <path
                  d={pathData}
                  stroke="currentColor"
                  strokeWidth={isHighlighted ? "2" : "1.2"}
                  className={cn(
                    "transition-colors duration-300 text-border",
                    isHighlighted ? "text-primary opacity-90" : "opacity-35"
                  )}
                />

                {/* Animated Pulsing Laser Data Beam Flowing through Fiber */}
                <path
                  d={pathData}
                  stroke="url(#laserGrad)"
                  strokeWidth={isHighlighted ? "3" : "1.8"}
                  strokeDasharray="6 14"
                  className={cn(
                    "animate-fiber-pulse transition-opacity duration-300",
                    isHighlighted ? "opacity-100" : "opacity-60"
                  )}
                  style={{
                    filter: isHighlighted ? "url(#fiberGlow)" : undefined,
                  }}
                />

                {/* Connection Pin Terminal Dots */}
                <circle
                  cx={p1.x}
                  cy={p1.y}
                  r={isHighlighted ? "3.5" : "2.5"}
                  className={cn(
                    "transition-all duration-300",
                    isHighlighted
                      ? "fill-primary stroke-background stroke-2"
                      : "fill-border/80"
                  )}
                />
                <circle
                  cx={p2.x}
                  cy={p2.y}
                  r={isHighlighted ? "3.5" : "2.5"}
                  className={cn(
                    "transition-all duration-300",
                    isHighlighted
                      ? "fill-primary stroke-background stroke-2"
                      : "fill-border/80"
                  )}
                />
              </g>
            );
          })}
        </svg>

        {/* ── Overlay Interactive HTML Node Cards ─────────────────────────── */}
        <div className="absolute inset-0 grid grid-cols-4 gap-4 px-2 z-10 pointer-events-none">
          {[0, 1, 2, 3].map((colIndex) => {
            const colNodes = nodes.filter((n) => n.column === colIndex);
            const stageTitles = [
              "1. CORE UPLINK",
              "2. CENTRAL OFFICE",
              "3. PASSIVE ODN",
              "4. EDGE PREMISES",
            ];

            return (
              <div
                key={colIndex}
                className="flex flex-col justify-between h-full py-1"
              >
                {/* Column Section Tag */}
                <div className="text-[9px] font-mono font-bold tracking-wider uppercase text-muted-foreground/75 px-1 pb-1">
                  {stageTitles[colIndex]}
                </div>

                {colNodes.map((node) => {
                  const Icon = node.icon;
                  const isHovered = hoveredNode === node.id;
                  const isDimmed = hoveredNode !== null && !isHovered;

                  return (
                    <div
                      key={node.id}
                      onMouseEnter={() => interactive && setHoveredNode(node.id)}
                      onMouseLeave={() => interactive && setHoveredNode(null)}
                      className={cn(
                        "pointer-events-auto group relative w-full rounded-xl border p-2.5 transition-all duration-300 cursor-pointer shadow-xs",
                        "bg-card/90 backdrop-blur-md",
                        isHovered
                          ? "border-primary/80 shadow-md shadow-primary/10 -translate-y-0.5 scale-[1.02]"
                          : isDimmed
                          ? "opacity-50 border-border/50 scale-[0.98]"
                          : "border-border/80 hover:border-primary/60"
                      )}
                    >
                      {/* Card Header Row: Icon + Label + Badge */}
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div
                            className={cn(
                              "h-6 w-6 rounded-md flex items-center justify-center shrink-0 transition-colors",
                              isHovered
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "bg-primary/10 border border-primary/25 text-primary"
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-[11px] font-bold text-foreground truncate font-sans tracking-tight">
                            {node.label}
                          </span>
                        </div>

                        {node.badge && (
                          <span
                            className={cn(
                              "text-[9px] font-mono px-1 py-0.2 rounded border shrink-0 font-medium",
                              isHovered
                                ? "bg-primary/20 text-primary border-primary/40 font-semibold"
                                : "bg-muted/70 text-muted-foreground border-border/60"
                            )}
                          >
                            {node.badge}
                          </span>
                        )}
                      </div>

                      {/* Card Body: Subtitle Description */}
                      <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1 mb-2 font-mono">
                        {node.sublabel}
                      </p>

                      {/* Card Footer: Category Tag & Metric */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-border/40 text-[9px] font-mono">
                        <span className="text-muted-foreground/75 truncate">
                          {node.category}
                        </span>
                        <span
                          className={cn(
                            "font-semibold flex items-center gap-0.5 text-primary"
                          )}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                          {node.metric}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Micro-Legend: Guide for Optical Flow ───────────────────── */}
      <div className="w-full flex items-center justify-between pt-3 mt-1 text-[10px] font-mono text-muted-foreground border-t border-border/40">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-4 rounded-full bg-primary inline-block" />
            Laser Optical Path
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full border border-primary inline-block" />
            Active SC/APC Port
          </span>
        </div>

        <div className="flex items-center gap-1 text-[9px] text-muted-foreground/80">
          <span>Hover node to trace optical fiber route</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
}

