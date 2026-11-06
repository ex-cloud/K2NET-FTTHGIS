
import React, { useState } from "react";
import {
  Activity,
  Wifi,
  Gauge,
  Radio,
  Server,
  Cpu,
  Layers,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { cn } from "../../utils";

export interface FtthTopologyFlowProps {
  className?: string;
  tenantName?: string;
  rxPowerDbm?: number;
  realtimeLatencyMs?: number;
  interactive?: boolean;
}

interface TriggerItem {
  id: string;
  label: string;
  detail: string;
  sub: string;
  icon: React.ElementType;
  targetNodeId: string;
}

interface ProcessorNode {
  id: string;
  label: string;
  title: string;
  metric: string;
  icon: React.ElementType;
  x: number;
}

const TRIGGERS: TriggerItem[] = [
  {
    id: "trigger-1",
    label: "01. OLT TELEMETRY SYNC",
    detail: "SNMP v3 Polling Engine",
    sub: "SNMP • 10s",
    icon: Activity,
    targetNodeId: "node-3",
  },
  {
    id: "trigger-2",
    label: "02. SUBSCRIBER PROVISIONING",
    detail: "OMCI / TR-069 Auto-Bind",
    sub: "OMCI • Auto",
    icon: Wifi,
    targetNodeId: "node-2",
  },
  {
    id: "trigger-3",
    label: "03. OPTICAL POWER AUDIT",
    detail: "Class B+ dBm Diagnostics",
    sub: "OTDR • Active",
    icon: Gauge,
    targetNodeId: "node-1",
  },
];

const PROCESSORS: ProcessorNode[] = [
  {
    id: "node-1",
    label: "NODE 1",
    title: "BGP Routing Gateway",
    metric: "100G Peering Fabric",
    icon: Server,
    x: 322,
  },
  {
    id: "node-2",
    label: "NODE 2",
    title: "GPON / XGS-PON Chassis",
    metric: "16-Port SFP+ OLT",
    icon: Cpu,
    x: 447,
  },
  {
    id: "node-3",
    label: "NODE 3",
    title: "Passive ODN & Splitter",
    metric: "1:64 Primary PLC",
    icon: Layers,
    x: 572,
  },
];

export function FtthTopologyFlow({
  className,
  tenantName = "PT Nusantara",
  rxPowerDbm = -19.4,
  realtimeLatencyMs = 12,
  interactive = true,
}: FtthTopologyFlowProps) {
  const [hoveredTarget, setHoveredTarget] = useState<string | null>(null);
  const [manualTriggerId, setManualTriggerId] = useState<string | null>(null);

  const handleTriggerClick = (id: string) => {
    if (!interactive) return;
    setManualTriggerId(id);
    setTimeout(() => {
      setManualTriggerId(null);
    }, 1800);
  };

  return (
    <div
      className={cn(
        "relative w-full max-w-[720px] select-none flex flex-col justify-center items-center py-2 px-1",
        className
      )}
    >
      {/* Scope-isolated Keyframes for Linear-Style Orthogonal Staggered Animation */}
      <style>{`
        @keyframes linear-beam-1 {
          0% { stroke-dashoffset: 120; opacity: 0; }
          2% { opacity: 1; }
          23% { stroke-dashoffset: -24; opacity: 1; }
          25% { stroke-dashoffset: -24; opacity: 0; }
          100% { stroke-dashoffset: -24; opacity: 0; }
        }
        @keyframes linear-beam-2 {
          0%, 25% { stroke-dashoffset: 120; opacity: 0; }
          27% { opacity: 1; }
          48% { stroke-dashoffset: -24; opacity: 1; }
          50% { stroke-dashoffset: -24; opacity: 0; }
          100% { stroke-dashoffset: -24; opacity: 0; }
        }
        @keyframes linear-beam-3 {
          0%, 50% { stroke-dashoffset: 120; opacity: 0; }
          52% { opacity: 1; }
          73% { stroke-dashoffset: -24; opacity: 1; }
          75% { stroke-dashoffset: -24; opacity: 0; }
          100% { stroke-dashoffset: -24; opacity: 0; }
        }
        @keyframes linear-return-loop {
          0%, 75% { stroke-dashoffset: 160; opacity: 0; }
          77% { opacity: 1; }
          98% { stroke-dashoffset: -30; opacity: 1; }
          100% { stroke-dashoffset: -30; opacity: 0; }
        }
        @keyframes node-matrix-pulse-3 {
          0%, 22% { opacity: 0.25; filter: drop-shadow(0 0 0px transparent); }
          24%, 32% { opacity: 1; filter: drop-shadow(0 0 4px hsl(var(--foreground))); }
          35%, 100% { opacity: 0.25; filter: drop-shadow(0 0 0px transparent); }
        }
        @keyframes node-matrix-pulse-2 {
          0%, 47% { opacity: 0.25; filter: drop-shadow(0 0 0px transparent); }
          49%, 57% { opacity: 1; filter: drop-shadow(0 0 4px hsl(var(--foreground))); }
          60%, 100% { opacity: 0.25; filter: drop-shadow(0 0 0px transparent); }
        }
        @keyframes node-matrix-pulse-1 {
          0%, 72% { opacity: 0.25; filter: drop-shadow(0 0 0px transparent); }
          74%, 82% { opacity: 1; filter: drop-shadow(0 0 4px hsl(var(--foreground))); }
          85%, 100% { opacity: 0.25; filter: drop-shadow(0 0 0px transparent); }
        }
        @keyframes trigger-loop-indicator {
          0%, 94% { opacity: 0.3; transform: scale(1); }
          96%, 100% { opacity: 1; transform: scale(1.3); filter: drop-shadow(0 0 6px hsl(var(--foreground))); }
        }
      `}</style>

      {/* Top Telemetry Header Bar */}
      <div className="w-full flex items-center justify-between pb-3 px-2 border-b border-border/50 text-[11px] font-mono text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-foreground" />
          </span>
          <span className="font-semibold uppercase tracking-wider text-foreground text-[10px]">
            {tenantName} FTTH AUTOMATION PIPELINE
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10.5px]">
          <span className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded border border-border/70">
            <Activity className="size-3 text-muted-foreground" />
            <span>{realtimeLatencyMs}ms</span>
          </span>
          <span className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded border border-border/70">
            <Radio className="size-3 text-muted-foreground" />
            <span>{rxPowerDbm} dBm (Optimal)</span>
          </span>
        </div>
      </div>

      {/* Main Vector Canvas (Linear Staggered Layout with SVG-Anchored foreignObject) */}
      <div className="relative w-full aspect-[700/360] mt-3">
        <svg
          viewBox="0 0 700 360"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Linear Light Beam Gradient */}
            <linearGradient id="linear-beam-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
              <stop offset="40%" stopColor="hsl(var(--foreground))" stopOpacity="0.4" />
              <stop offset="85%" stopColor="hsl(var(--foreground))" stopOpacity="0.95" />
              <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="1" />
            </linearGradient>

            {/* Return Loop Dashed Gradient */}
            <linearGradient id="linear-return-grad" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
              <stop offset="60%" stopColor="hsl(var(--foreground))" stopOpacity="0.7" />
              <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="1" />
            </linearGradient>

            {/* Upward Arrow Marker for Return Loop */}
            <marker
              id="return-arrow"
              viewBox="0 0 8 8"
              refX="4"
              refY="4"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path
                d="M 1 7 L 4 2 L 7 7"
                fill="none"
                stroke="hsl(var(--foreground))"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </marker>
          </defs>

          {/* ============================================================== */}
          {/* ORTHOGONAL 90° CONNECTING TRACKS (BASE STATIC LINES)          */}
          {/* ============================================================== */}

          {/* Path 1: Trigger 1 (y:78) -> Node 3 (x:630, y:210) */}
          <path
            d="M 260 78 L 612 78 A 18 18 0 0 1 630 96 L 630 210"
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
            strokeOpacity={hoveredTarget === "path-1" ? "1" : "0.5"}
            className="transition-all duration-300"
          />

          {/* Path 2: Trigger 2 (y:134) -> Node 2 (x:505, y:210) */}
          <path
            d="M 260 134 L 487 134 A 18 18 0 0 1 505 152 L 505 210"
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
            strokeOpacity={hoveredTarget === "path-2" ? "1" : "0.5"}
            className="transition-all duration-300"
          />

          {/* Path 3: Trigger 3 (y:190) -> Node 1 (x:380, y:210) */}
          <path
            d="M 260 190 L 362 190 A 18 18 0 0 1 380 208 L 380 210"
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
            strokeOpacity={hoveredTarget === "path-3" ? "1" : "0.5"}
            className="transition-all duration-300"
          />

          {/* Return Loop Bus: Exits Node 3/2/1 bottom -> Drops -> Bus at y:328 -> Ascends to Trigger (x:100, y:222) */}
          <path
            d="M 630 290 L 630 310 A 18 18 0 0 1 612 328 L 118 328 A 18 18 0 0 1 100 310 L 100 224"
            stroke="hsl(var(--border))"
            strokeWidth="1.25"
            strokeDasharray="4 4"
            strokeOpacity="0.45"
            markerEnd="url(#return-arrow)"
          />

          {/* Node 2 drop into return bus */}
          <path
            d="M 505 290 L 505 310 A 18 18 0 0 1 487 328"
            stroke="hsl(var(--border))"
            strokeWidth="1.25"
            strokeDasharray="4 4"
            strokeOpacity="0.45"
          />

          {/* Node 1 drop into return bus */}
          <path
            d="M 380 290 L 380 310 A 18 18 0 0 1 362 328"
            stroke="hsl(var(--border))"
            strokeWidth="1.25"
            strokeDasharray="4 4"
            strokeOpacity="0.45"
          />

          {/* ============================================================== */}
          {/* ANIMATED PHOTON BEAMS (STAGGERED SEQUENTIAL TRAVELING PULSES)  */}
          {/* ============================================================== */}

          {/* Beam 1: Trigger 1 -> Node 3 */}
          <path
            d="M 260 78 L 612 78 A 18 18 0 0 1 630 96 L 630 210"
            stroke="url(#linear-beam-grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="24 120"
            style={{
              animation:
                manualTriggerId === "trigger-1"
                  ? "linear-beam-1 1.8s cubic-bezier(0.4, 0, 0.2, 1) 1 forwards"
                  : "linear-beam-1 6s cubic-bezier(0.4, 0, 0.2, 1) infinite",
            }}
          />

          {/* Beam 2: Trigger 2 -> Node 2 */}
          <path
            d="M 260 134 L 487 134 A 18 18 0 0 1 505 152 L 505 210"
            stroke="url(#linear-beam-grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="24 120"
            style={{
              animation:
                manualTriggerId === "trigger-2"
                  ? "linear-beam-1 1.8s cubic-bezier(0.4, 0, 0.2, 1) 1 forwards"
                  : "linear-beam-2 6s cubic-bezier(0.4, 0, 0.2, 1) infinite",
            }}
          />

          {/* Beam 3: Trigger 3 -> Node 1 */}
          <path
            d="M 260 190 L 362 190 A 18 18 0 0 1 380 208 L 380 210"
            stroke="url(#linear-beam-grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="24 120"
            style={{
              animation:
                manualTriggerId === "trigger-3"
                  ? "linear-beam-1 1.8s cubic-bezier(0.4, 0, 0.2, 1) 1 forwards"
                  : "linear-beam-3 6s cubic-bezier(0.4, 0, 0.2, 1) infinite",
            }}
          />

          {/* Return Beam along dashed bus */}
          <path
            d="M 630 290 L 630 310 A 18 18 0 0 1 612 328 L 118 328 A 18 18 0 0 1 100 310 L 100 224"
            stroke="url(#linear-return-grad)"
            strokeWidth="2"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="26 140"
            style={{
              animation: "linear-return-loop 6s cubic-bezier(0.4, 0, 0.2, 1) infinite",
            }}
          />

          {/* ============================================================== */}
          {/* PINS & CONNECTION PORTS                                       */}
          {/* ============================================================== */}

          {/* Trigger Output Pins */}
          <circle cx="260" cy="78" r="3.5" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <circle cx="260" cy="134" r="3.5" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <circle cx="260" cy="190" r="3.5" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />

          {/* Processor Input Pins */}
          <circle cx="380" cy="210" r="3.5" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <circle cx="505" cy="210" r="3.5" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <circle cx="630" cy="210" r="3.5" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />

          {/* Processor Output Return Pins */}
          <circle cx="380" cy="290" r="2.5" fill="hsl(var(--border))" />
          <circle cx="505" cy="290" r="2.5" fill="hsl(var(--border))" />
          <circle cx="630" cy="290" r="2.5" fill="hsl(var(--border))" />

          {/* ============================================================== */}
          {/* SVG FOREIGN OBJECTS: 100% MATHEMATICALLY ANCHORED UI CARDS   */}
          {/* ============================================================== */}

          {/* Left Stacked Container (3 Trigger Items) */}
          <foreignObject x="40" y="50" width="220" height="168" className="overflow-visible">
            <div className="relative w-full h-full rounded-xl border border-border/80 bg-card/95 backdrop-blur-md shadow-sm overflow-hidden flex flex-col justify-between">
              {TRIGGERS.map((trigger, idx) => {
                const Icon = trigger.icon;
                const isHovered =
                  hoveredTarget === `path-${idx + 1}` || hoveredTarget === trigger.targetNodeId;

                return (
                  <div
                    key={trigger.id}
                    onMouseEnter={() => setHoveredTarget(`path-${idx + 1}`)}
                    onMouseLeave={() => setHoveredTarget(null)}
                    onClick={() => handleTriggerClick(trigger.id)}
                    className={cn(
                      "relative flex items-center justify-between px-3 py-2.5 transition-colors cursor-pointer select-none",
                      idx > 0 && "border-t border-border/60",
                      isHovered ? "bg-muted/80" : "hover:bg-muted/40"
                    )}
                    style={{ height: "56px" }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="size-6 rounded-md bg-muted border border-border flex items-center justify-center shrink-0">
                        <Icon className="size-3.5 text-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 leading-none mb-1">
                          <span className="text-[9.5px] font-mono font-semibold tracking-wider text-muted-foreground uppercase">
                            {trigger.label}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-foreground tracking-tight truncate">
                          {trigger.detail}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center shrink-0">
                      <span className="text-[9px] font-mono text-muted-foreground/80 bg-muted/50 px-1 py-0.5 rounded border border-border/50">
                        {trigger.sub.split(" • ")[0]}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Trigger Return Port Indicator (Pulsing feedback dot at bottom left) */}
              <div
                className="absolute bottom-1.5 left-2.5 size-1.5 rounded-full bg-foreground"
                style={{ animation: "trigger-loop-indicator 6s infinite" }}
              />
            </div>
          </foreignObject>

          {/* Right 3 Square Processor Cards */}
          {PROCESSORS.map((node, idx) => {
            const Icon = node.icon;
            const isHovered = hoveredTarget === node.id || hoveredTarget === `path-${3 - idx}`;
            const pulseAnimationName =
              idx === 0
                ? "node-matrix-pulse-1 6s infinite"
                : idx === 1
                ? "node-matrix-pulse-2 6s infinite"
                : "node-matrix-pulse-3 6s infinite";

            return (
              <foreignObject
                key={node.id}
                x={node.x}
                y="202"
                width="116"
                height="96"
                className="overflow-visible"
              >
                {/* Outer Dashed Border Wrapper (Linear Style) */}
                <div
                  className={cn(
                    "relative w-full h-full p-1.5 rounded-xl border border-dashed transition-all duration-300",
                    isHovered ? "border-foreground/60 bg-muted/20" : "border-border/50"
                  )}
                >
                  {/* Inner Solid Node Card */}
                  <div
                    onMouseEnter={() => setHoveredTarget(node.id)}
                    onMouseLeave={() => setHoveredTarget(null)}
                    className={cn(
                      "relative w-full h-full rounded-lg border bg-card p-2 flex flex-col justify-between transition-all duration-300 shadow-2xs cursor-pointer",
                      isHovered
                        ? "border-foreground/60 shadow-sm"
                        : "border-border/80 hover:border-foreground/40"
                    )}
                  >
                    {/* Top Header: 4x4 Micro-LED Silicon Die Matrix */}
                    <div className="flex items-center justify-between">
                      {/* 4x4 LED Matrix */}
                      <div
                        className="grid grid-cols-4 gap-0.5"
                        style={{ animation: pulseAnimationName }}
                      >
                        {Array.from({ length: 16 }).map((_, i) => (
                          <span
                            key={i}
                            className="size-1 rounded-[0.5px] bg-foreground transition-all duration-200"
                          />
                        ))}
                      </div>

                      <div className="size-5 rounded-md bg-muted border border-border/70 flex items-center justify-center shrink-0">
                        <Icon className="size-3 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Bottom Text & Metrics */}
                    <div className="mt-1">
                      <div className="text-[9.5px] font-semibold text-foreground tracking-tight truncate">
                        {node.title}
                      </div>
                      <div className="flex items-center justify-between text-[8.5px] font-mono text-muted-foreground mt-0.5">
                        <span className="truncate pr-1">{node.metric}</span>
                        <span className="size-1.5 rounded-full bg-foreground/80 inline-block shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </foreignObject>
            );
          })}
        </svg>
      </div>

      {/* Footer Network Automation Insight */}
      <div className="w-full flex items-center justify-between pt-2 px-2 text-[10px] font-mono text-muted-foreground border-t border-border/40 mt-1">
        <span className="flex items-center gap-1.5">
          <Sparkles className="size-3 text-foreground" />
          <span>Real-time Topology • Orthogonal Staggered Routing</span>
        </span>
        <span className="hover:text-foreground transition-colors cursor-pointer flex items-center gap-1">
          <RefreshCw className="size-2.5 animate-spin" />
          <span>Autonomous Sync Active</span>
        </span>
      </div>
    </div>
  );
}
