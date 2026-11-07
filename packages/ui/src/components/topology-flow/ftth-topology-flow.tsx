import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import {
  Activity,
  Wifi,
  Gauge,
  Server,
  Cpu,
  Layers,
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
    x: 330,
  },
  {
    id: "node-2",
    label: "NODE 2",
    title: "GPON / XGS-PON Chassis",
    metric: "16-Port SFP+ OLT",
    icon: Cpu,
    x: 460,
  },
  {
    id: "node-3",
    label: "NODE 3",
    title: "Passive ODN & Splitter",
    metric: "1:64 Primary PLC",
    icon: Layers,
    x: 590,
  },
];

export function FtthTopologyFlow({
  className,
  tenantName: _tenantName = "PT Nusantara",
  rxPowerDbm: _rxPowerDbm = -19.4,
  realtimeLatencyMs: _realtimeLatencyMs = 12,
  interactive = true,
}: FtthTopologyFlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredTarget, setHoveredTarget] = useState<string | null>(null);

  // GSAP Animation Element References
  const beam1Ref = useRef<SVGPathElement>(null);
  const beam2Ref = useRef<SVGPathElement>(null);
  const beam3Ref = useRef<SVGPathElement>(null);
  const returnBeamRef = useRef<SVGPathElement>(null);
  const matrix1Ref = useRef<HTMLDivElement>(null);
  const matrix2Ref = useRef<HTMLDivElement>(null);
  const matrix3Ref = useRef<HTMLDivElement>(null);
  const returnDotRef = useRef<SVGCircleElement>(null);

  // Linear-Style High-Precision Staggered GSAP Timeline (60/120 FPS Subpixel Compositing)
  useEffect(() => {
    if (!interactive) return;

    const ctx = gsap.context(() => {
      // Set initial element states
      gsap.set([beam1Ref.current, beam2Ref.current, beam3Ref.current, returnBeamRef.current], {
        opacity: 0,
      });
      gsap.set([matrix1Ref.current, matrix2Ref.current, matrix3Ref.current], {
        opacity: 0.2,
      });
      gsap.set(returnDotRef.current, {
        opacity: 0.3,
        scale: 1,
        transformOrigin: "center center",
      });

      const tl = gsap.timeline({
        repeat: -1,
        repeatDelay: 0.5,
      });

      // ─────────────────────────────────────────────────────────────
      // STAGE 1: Beam 1 (Trigger 1 -> Node 3 Passive ODN, len: ~505px)
      // ─────────────────────────────────────────────────────────────
      tl.set(beam1Ref.current, { strokeDashoffset: 44, opacity: 0 })
        .to(beam1Ref.current, { opacity: 1, duration: 0.05 })
        .to(beam1Ref.current, { strokeDashoffset: -505, duration: 1.15, ease: "power1.inOut" })
        .to(beam1Ref.current, { opacity: 0, duration: 0.08 }, "-=0.08")
        .fromTo(
          matrix3Ref.current,
          { opacity: 0.2, filter: "drop-shadow(0 0 0px transparent)" },
          {
            opacity: 1,
            filter: "drop-shadow(0 0 8px hsl(var(--foreground)))",
            duration: 0.25,
            yoyo: true,
            repeat: 1,
            ease: "power2.out",
          },
          "-=0.18"
        )
        .to({}, { duration: 0.35 })

        // ─────────────────────────────────────────────────────────────
        // STAGE 2: Beam 2 (Trigger 2 -> Node 2 GPON Chassis, len: ~320px)
        // ─────────────────────────────────────────────────────────────
        .set(beam2Ref.current, { strokeDashoffset: 44, opacity: 0 })
        .to(beam2Ref.current, { opacity: 1, duration: 0.05 })
        .to(beam2Ref.current, { strokeDashoffset: -320, duration: 0.95, ease: "power1.inOut" })
        .to(beam2Ref.current, { opacity: 0, duration: 0.08 }, "-=0.08")
        .fromTo(
          matrix2Ref.current,
          { opacity: 0.2, filter: "drop-shadow(0 0 0px transparent)" },
          {
            opacity: 1,
            filter: "drop-shadow(0 0 8px hsl(var(--foreground)))",
            duration: 0.25,
            yoyo: true,
            repeat: 1,
            ease: "power2.out",
          },
          "-=0.18"
        )
        .to({}, { duration: 0.35 })

        // ─────────────────────────────────────────────────────────────
        // STAGE 3: Beam 3 (Trigger 3 -> Node 1 BGP Gateway, len: ~135px)
        // ─────────────────────────────────────────────────────────────
        .set(beam3Ref.current, { strokeDashoffset: 40, opacity: 0 })
        .to(beam3Ref.current, { opacity: 1, duration: 0.05 })
        .to(beam3Ref.current, { strokeDashoffset: -135, duration: 0.75, ease: "power1.inOut" })
        .to(beam3Ref.current, { opacity: 0, duration: 0.08 }, "-=0.08")
        .fromTo(
          matrix1Ref.current,
          { opacity: 0.2, filter: "drop-shadow(0 0 0px transparent)" },
          {
            opacity: 1,
            filter: "drop-shadow(0 0 8px hsl(var(--foreground)))",
            duration: 0.25,
            yoyo: true,
            repeat: 1,
            ease: "power2.out",
          },
          "-=0.18"
        )
        .to({}, { duration: 0.35 })

        // ─────────────────────────────────────────────────────────────
        // STAGE 4: Return Loop (Nodes Bottom Bus -> Trigger Panel, len: ~685px)
        // ─────────────────────────────────────────────────────────────
        .set(returnBeamRef.current, { strokeDashoffset: 48, opacity: 0 })
        .to(returnBeamRef.current, { opacity: 1, duration: 0.05 })
        .to(returnBeamRef.current, { strokeDashoffset: -685, duration: 1.35, ease: "power1.inOut" })
        .to(returnBeamRef.current, { opacity: 0, duration: 0.08 }, "-=0.08")
        .fromTo(
          returnDotRef.current,
          { scale: 1, opacity: 0.3 },
          {
            scale: 1.5,
            opacity: 1,
            duration: 0.25,
            yoyo: true,
            repeat: 1,
            ease: "power2.out",
          },
          "-=0.18"
        );
    }, containerRef);

    return () => ctx.revert();
  }, [interactive]);

  // Direct Interactive Click Handler with Instant GSAP Tween
  const handleTriggerClick = (triggerId: string) => {
    if (!interactive) return;

    if (triggerId === "trigger-1" && beam1Ref.current && matrix3Ref.current) {
      gsap.killTweensOf([beam1Ref.current, matrix3Ref.current]);
      gsap.fromTo(
        beam1Ref.current,
        { strokeDashoffset: 44, opacity: 1 },
        {
          strokeDashoffset: -505,
          duration: 0.85,
          ease: "power2.out",
          onComplete: () => {
            gsap.to(beam1Ref.current, { opacity: 0, duration: 0.1 });
            gsap.fromTo(
              matrix3Ref.current,
              { opacity: 0.2, filter: "drop-shadow(0 0 0px transparent)" },
              {
                opacity: 1,
                filter: "drop-shadow(0 0 8px hsl(var(--foreground)))",
                duration: 0.25,
                yoyo: true,
                repeat: 1,
                ease: "power2.out",
              }
            );
          },
        }
      );
    } else if (triggerId === "trigger-2" && beam2Ref.current && matrix2Ref.current) {
      gsap.killTweensOf([beam2Ref.current, matrix2Ref.current]);
      gsap.fromTo(
        beam2Ref.current,
        { strokeDashoffset: 44, opacity: 1 },
        {
          strokeDashoffset: -320,
          duration: 0.7,
          ease: "power2.out",
          onComplete: () => {
            gsap.to(beam2Ref.current, { opacity: 0, duration: 0.1 });
            gsap.fromTo(
              matrix2Ref.current,
              { opacity: 0.2, filter: "drop-shadow(0 0 0px transparent)" },
              {
                opacity: 1,
                filter: "drop-shadow(0 0 8px hsl(var(--foreground)))",
                duration: 0.25,
                yoyo: true,
                repeat: 1,
                ease: "power2.out",
              }
            );
          },
        }
      );
    } else if (triggerId === "trigger-3" && beam3Ref.current && matrix1Ref.current) {
      gsap.killTweensOf([beam3Ref.current, matrix1Ref.current]);
      gsap.fromTo(
        beam3Ref.current,
        { strokeDashoffset: 40, opacity: 1 },
        {
          strokeDashoffset: -135,
          duration: 0.55,
          ease: "power2.out",
          onComplete: () => {
            gsap.to(beam3Ref.current, { opacity: 0, duration: 0.1 });
            gsap.fromTo(
              matrix1Ref.current,
              { opacity: 0.2, filter: "drop-shadow(0 0 0px transparent)" },
              {
                opacity: 1,
                filter: "drop-shadow(0 0 8px hsl(var(--foreground)))",
                duration: 0.25,
                yoyo: true,
                repeat: 1,
                ease: "power2.out",
              }
            );
          },
        }
      );
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full max-w-[880px] xl:max-w-[960px] 2xl:max-w-[1020px] select-none flex flex-col justify-center items-center py-2 px-1",
        className
      )}
    >
      {/* Main Vector Canvas (Linear Staggered Layout with SVG-Anchored foreignObject) */}
      <div className="relative w-full aspect-[720/380]">
        <svg
          viewBox="0 0 720 380"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
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
                d="M 1 7 L 4 1 L 7 7"
                fill="none"
                className="stroke-foreground"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </marker>
          </defs>

          {/* ============================================================== */}
          {/* ORTHOGONAL 90° CONNECTING TRACKS (BASE STATIC VISIBLE LINES)  */}
          {/* ============================================================== */}

          {/* Path 1: Trigger 1 (y:84) -> Node 3 (x:642, y:224) */}
          <path
            d="M 270 84 L 624 84 A 18 18 0 0 1 642 102 L 642 224"
            fill="none"
            className={cn(
              "stroke-foreground/20 transition-all duration-300",
              hoveredTarget === "path-1" && "stroke-foreground/60 stroke-[2px]"
            )}
            strokeWidth="1.5"
          />

          {/* Path 2: Trigger 2 (y:140) -> Node 2 (x:512, y:224) */}
          <path
            d="M 270 140 L 494 140 A 18 18 0 0 1 512 158 L 512 224"
            fill="none"
            className={cn(
              "stroke-foreground/20 transition-all duration-300",
              hoveredTarget === "path-2" && "stroke-foreground/60 stroke-[2px]"
            )}
            strokeWidth="1.5"
          />

          {/* Path 3: Trigger 3 (y:196) -> Node 1 (x:382, y:224) */}
          <path
            d="M 270 196 L 364 196 A 18 18 0 0 1 382 214 L 382 224"
            fill="none"
            className={cn(
              "stroke-foreground/20 transition-all duration-300",
              hoveredTarget === "path-3" && "stroke-foreground/60 stroke-[2px]"
            )}
            strokeWidth="1.5"
          />

          {/* Return Loop Bus: Exits Node 3/2/1 bottom -> Drops -> Bus at y:356 -> Ascends to Trigger (x:100, y:230) */}
          <path
            d="M 642 328 L 642 342 A 14 14 0 0 1 628 356 L 114 356 A 14 14 0 0 1 100 342 L 100 230"
            fill="none"
            className="stroke-foreground/20"
            strokeWidth="1.25"
            strokeDasharray="4 4"
            markerEnd="url(#return-arrow)"
          />

          {/* Node 2 drop into return bus */}
          <path
            d="M 512 328 L 512 342 A 14 14 0 0 1 498 356"
            fill="none"
            className="stroke-foreground/20"
            strokeWidth="1.25"
            strokeDasharray="4 4"
          />

          {/* Node 1 drop into return bus */}
          <path
            d="M 382 328 L 382 342 A 14 14 0 0 1 368 356"
            fill="none"
            className="stroke-foreground/20"
            strokeWidth="1.25"
            strokeDasharray="4 4"
          />

          {/* ============================================================== */}
          {/* ANIMATED PHOTON BEAMS (GSAP HIGH-PRECISION CONTROLLED TRACKS) */}
          {/* ============================================================== */}

          {/* Beam 1: Trigger 1 -> Node 3 */}
          <path
            ref={beam1Ref}
            d="M 270 84 L 624 84 A 18 18 0 0 1 642 102 L 642 224"
            fill="none"
            className="stroke-foreground"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="44 550"
            style={{
              filter: "drop-shadow(0 0 3px hsl(var(--foreground)))",
              opacity: 0,
            }}
          />

          {/* Beam 2: Trigger 2 -> Node 2 */}
          <path
            ref={beam2Ref}
            d="M 270 140 L 494 140 A 18 18 0 0 1 512 158 L 512 224"
            fill="none"
            className="stroke-foreground"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="44 400"
            style={{
              filter: "drop-shadow(0 0 3px hsl(var(--foreground)))",
              opacity: 0,
            }}
          />

          {/* Beam 3: Trigger 3 -> Node 1 */}
          <path
            ref={beam3Ref}
            d="M 270 196 L 364 196 A 18 18 0 0 1 382 214 L 382 224"
            fill="none"
            className="stroke-foreground"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="40 250"
            style={{
              filter: "drop-shadow(0 0 3px hsl(var(--foreground)))",
              opacity: 0,
            }}
          />

          {/* Return Beam along dashed bus */}
          <path
            ref={returnBeamRef}
            d="M 642 328 L 642 342 A 14 14 0 0 1 628 356 L 114 356 A 14 14 0 0 1 100 342 L 100 230"
            fill="none"
            className="stroke-foreground"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="48 750"
            style={{
              filter: "drop-shadow(0 0 3px hsl(var(--foreground)))",
              opacity: 0,
            }}
          />

          {/* Return Loop Target Dot Indicator */}
          <circle
            ref={returnDotRef}
            cx="100"
            cy="230"
            r="3"
            className="fill-foreground"
            style={{ opacity: 0.3 }}
          />

          {/* ============================================================== */}
          {/* PINS & CONNECTION PORTS                                       */}
          {/* ============================================================== */}

          {/* Trigger Output Pins */}
          <circle cx="270" cy="84" r="3.5" className="fill-background stroke-foreground" strokeWidth="1.5" />
          <circle cx="270" cy="140" r="3.5" className="fill-background stroke-foreground" strokeWidth="1.5" />
          <circle cx="270" cy="196" r="3.5" className="fill-background stroke-foreground" strokeWidth="1.5" />

          {/* Processor Input Pins */}
          <circle cx="642" cy="224" r="3.5" className="fill-background stroke-foreground" strokeWidth="1.5" />
          <circle cx="512" cy="224" r="3.5" className="fill-background stroke-foreground" strokeWidth="1.5" />
          <circle cx="382" cy="224" r="3.5" className="fill-background stroke-foreground" strokeWidth="1.5" />

          {/* Processor Output Drops to Return Bus */}
          <circle cx="642" cy="328" r="2.5" className="fill-muted stroke-border" strokeWidth="1" />
          <circle cx="512" cy="328" r="2.5" className="fill-muted stroke-border" strokeWidth="1" />
          <circle cx="382" cy="328" r="2.5" className="fill-muted stroke-border" strokeWidth="1" />

          {/* ============================================================== */}
          {/* LEFT TRIGGER CARD (FOREIGNOBJECT ANCHORED)                     */}
          {/* ============================================================== */}
          <foreignObject x="40" y="56" width="230" height="168" className="overflow-visible">
            <div className="relative w-full h-full rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-sm overflow-hidden flex flex-col justify-between">
              {TRIGGERS.map((trigger, idx) => {
                const Icon = trigger.icon;
                const isHovered =
                  hoveredTarget === trigger.id ||
                  hoveredTarget === trigger.targetNodeId ||
                  (trigger.id === "trigger-1" && hoveredTarget === "path-1") ||
                  (trigger.id === "trigger-2" && hoveredTarget === "path-2") ||
                  (trigger.id === "trigger-3" && hoveredTarget === "path-3");

                return (
                  <div
                    key={trigger.id}
                    onMouseEnter={() => {
                      setHoveredTarget(
                        trigger.id === "trigger-1"
                          ? "path-1"
                          : trigger.id === "trigger-2"
                          ? "path-2"
                          : "path-3"
                      );
                    }}
                    onMouseLeave={() => setHoveredTarget(null)}
                    onClick={() => handleTriggerClick(trigger.id)}
                    className={cn(
                      "relative flex items-center justify-between px-3 py-2 transition-colors cursor-pointer select-none",
                      idx > 0 && "border-t border-border/60",
                      isHovered ? "bg-muted/80" : "hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-6 rounded-md bg-muted border border-border/70 flex items-center justify-center shrink-0">
                        <Icon className="size-3.5 text-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-semibold text-foreground tracking-tight leading-tight truncate">
                          {trigger.label}
                        </div>
                        <div className="text-[8.5px] font-mono text-muted-foreground truncate leading-tight">
                          {trigger.detail}
                        </div>
                      </div>
                    </div>

                    <div className="text-[8px] font-mono text-muted-foreground/80 pl-2 shrink-0">
                      {trigger.sub}
                    </div>
                  </div>
                );
              })}
            </div>
          </foreignObject>

          {/* ============================================================== */}
          {/* 3 BOTTOM PROCESSOR NODES (SQUARE SILICON DIE - LINEAR STYLE)   */}
          {/* ============================================================== */}
          {PROCESSORS.map((node) => {
            const Icon = node.icon;
            const isHovered =
              hoveredTarget === node.id ||
              (node.id === "node-3" && (hoveredTarget === "trigger-1" || hoveredTarget === "path-1")) ||
              (node.id === "node-2" && (hoveredTarget === "trigger-2" || hoveredTarget === "path-2")) ||
              (node.id === "node-1" && (hoveredTarget === "trigger-3" || hoveredTarget === "path-3"));

            const matrixRef =
              node.id === "node-1"
                ? matrix1Ref
                : node.id === "node-2"
                ? matrix2Ref
                : matrix3Ref;

            return (
              <foreignObject
                key={node.id}
                x={node.x}
                y="224"
                width="104"
                height="104"
                className="overflow-visible"
              >
                {/* Outer Dashed Border Wrapper (Linear Style) */}
                <div
                  className={cn(
                    "relative w-full h-full p-1.5 rounded-2xl border border-dashed transition-all duration-300",
                    isHovered ? "border-foreground/60 bg-muted/20" : "border-border/60"
                  )}
                >
                  {/* Inner Solid Node Card */}
                  <div
                    onMouseEnter={() => setHoveredTarget(node.id)}
                    onMouseLeave={() => setHoveredTarget(null)}
                    className={cn(
                      "relative w-full h-full rounded-xl border bg-card/95 p-2 flex flex-col justify-between transition-all duration-300 shadow-2xs cursor-pointer",
                      isHovered
                        ? "border-foreground/60 shadow-sm"
                        : "border-border/80 hover:border-foreground/40"
                    )}
                  >
                    {/* Top Header: 4x4 Micro-LED Silicon Die Matrix */}
                    <div className="flex items-start justify-between">
                      {/* 4x4 LED Matrix Controlled by GSAP */}
                      <div
                        ref={matrixRef}
                        className="grid grid-cols-4 gap-1 p-0.5"
                        style={{ opacity: 0.2 }}
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
                    <div>
                      <div className="text-[10px] font-semibold text-foreground tracking-tight truncate leading-tight">
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
    </div>
  );
}
