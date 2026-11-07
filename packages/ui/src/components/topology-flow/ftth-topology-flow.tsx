import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { Activity, Wifi, Gauge } from "lucide-react";
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
  primaryText: string;
  secondaryText: string;
  icon: React.ElementType;
  targetNodeId: string;
  pathId: string;
}

interface ProcessorNode {
  id: string;
  x: number;
  centerX: number;
  pathId: string;
  triggerId: string;
}

const TRIGGERS: TriggerItem[] = [
  {
    id: "trigger-1",
    primaryText: "TELEMETRY",
    secondaryText: "SNMP CHECK",
    icon: Activity,
    targetNodeId: "node-3",
    pathId: "path-1",
  },
  {
    id: "trigger-2",
    primaryText: "PROVISION",
    secondaryText: "OMCI BIND",
    icon: Wifi,
    targetNodeId: "node-2",
    pathId: "path-2",
  },
  {
    id: "trigger-3",
    primaryText: "OPTICAL",
    secondaryText: "OTDR AUDIT",
    icon: Gauge,
    targetNodeId: "node-1",
    pathId: "path-3",
  },
];

// Exact pixel positions from Linear reference (78x78 outer dashed square, 192px center-to-center)
const PROCESSORS: ProcessorNode[] = [
  {
    id: "node-1",
    x: 517,
    centerX: 556,
    pathId: "path-3",
    triggerId: "trigger-3",
  },
  {
    id: "node-2",
    x: 709,
    centerX: 748,
    pathId: "path-2",
    triggerId: "trigger-2",
  },
  {
    id: "node-3",
    x: 901,
    centerX: 940,
    pathId: "path-1",
    triggerId: "trigger-1",
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
  const returnArrowRef = useRef<SVGPolygonElement>(null);

  // Linear-Style High-Precision Staggered GSAP Timeline (1:1 Pixel Blueprint)
  useEffect(() => {
    if (!interactive) return;

    const ctx = gsap.context(() => {
      gsap.set([beam1Ref.current, beam2Ref.current, beam3Ref.current, returnBeamRef.current], {
        opacity: 0,
      });
      gsap.set([matrix1Ref.current, matrix2Ref.current, matrix3Ref.current], {
        opacity: 0.25,
      });
      gsap.set(returnArrowRef.current, {
        opacity: 0.5,
      });

      const tl = gsap.timeline({
        repeat: -1,
        repeatDelay: 0.45,
      });

      // ─────────────────────────────────────────────────────────────
      // STAGE 1: Beam 1 (Trigger 1 -> Node 3, exact length: 789px)
      // ─────────────────────────────────────────────────────────────
      tl.set(beam1Ref.current, { strokeDashoffset: 56, opacity: 0 })
        .to(beam1Ref.current, { opacity: 1, duration: 0.06 })
        .to(beam1Ref.current, { strokeDashoffset: -789, duration: 1.25, ease: "power1.inOut" })
        .to(beam1Ref.current, { opacity: 0, duration: 0.08 }, "-=0.08")
        .fromTo(
          matrix3Ref.current,
          { opacity: 0.25, filter: "drop-shadow(0 0 0px transparent)" },
          {
            opacity: 1,
            filter: "drop-shadow(0 0 6px hsl(var(--foreground)))",
            duration: 0.25,
            yoyo: true,
            repeat: 1,
            ease: "power2.out",
          },
          "-=0.18"
        )
        .to({}, { duration: 0.35 })

        // ─────────────────────────────────────────────────────────────
        // STAGE 2: Beam 2 (Trigger 2 -> Node 2, exact length: 552px)
        // ─────────────────────────────────────────────────────────────
        .set(beam2Ref.current, { strokeDashoffset: 52, opacity: 0 })
        .to(beam2Ref.current, { opacity: 1, duration: 0.06 })
        .to(beam2Ref.current, { strokeDashoffset: -552, duration: 1.05, ease: "power1.inOut" })
        .to(beam2Ref.current, { opacity: 0, duration: 0.08 }, "-=0.08")
        .fromTo(
          matrix2Ref.current,
          { opacity: 0.25, filter: "drop-shadow(0 0 0px transparent)" },
          {
            opacity: 1,
            filter: "drop-shadow(0 0 6px hsl(var(--foreground)))",
            duration: 0.25,
            yoyo: true,
            repeat: 1,
            ease: "power2.out",
          },
          "-=0.18"
        )
        .to({}, { duration: 0.35 })

        // ─────────────────────────────────────────────────────────────
        // STAGE 3: Beam 3 (Trigger 3 -> Node 1, exact length: 314px)
        // ─────────────────────────────────────────────────────────────
        .set(beam3Ref.current, { strokeDashoffset: 44, opacity: 0 })
        .to(beam3Ref.current, { opacity: 1, duration: 0.06 })
        .to(beam3Ref.current, { strokeDashoffset: -314, duration: 0.85, ease: "power1.inOut" })
        .to(beam3Ref.current, { opacity: 0, duration: 0.08 }, "-=0.08")
        .fromTo(
          matrix1Ref.current,
          { opacity: 0.25, filter: "drop-shadow(0 0 0px transparent)" },
          {
            opacity: 1,
            filter: "drop-shadow(0 0 6px hsl(var(--foreground)))",
            duration: 0.25,
            yoyo: true,
            repeat: 1,
            ease: "power2.out",
          },
          "-=0.18"
        )
        .to({}, { duration: 0.35 })

        // ─────────────────────────────────────────────────────────────
        // STAGE 4: Return Loop (Nodes Bottom Bus -> Trigger Box, len: 975px)
        // ─────────────────────────────────────────────────────────────
        .set(returnBeamRef.current, { strokeDashoffset: 60, opacity: 0 })
        .to(returnBeamRef.current, { opacity: 1, duration: 0.06 })
        .to(returnBeamRef.current, { strokeDashoffset: -975, duration: 1.4, ease: "power1.inOut" })
        .to(returnBeamRef.current, { opacity: 0, duration: 0.08 }, "-=0.08")
        .fromTo(
          returnArrowRef.current,
          { opacity: 0.5 },
          {
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
        { strokeDashoffset: 56, opacity: 1 },
        {
          strokeDashoffset: -789,
          duration: 0.85,
          ease: "power2.out",
          onComplete: () => {
            gsap.to(beam1Ref.current, { opacity: 0, duration: 0.1 });
            gsap.fromTo(
              matrix3Ref.current,
              { opacity: 0.25, filter: "drop-shadow(0 0 0px transparent)" },
              {
                opacity: 1,
                filter: "drop-shadow(0 0 6px hsl(var(--foreground)))",
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
        { strokeDashoffset: 52, opacity: 1 },
        {
          strokeDashoffset: -552,
          duration: 0.7,
          ease: "power2.out",
          onComplete: () => {
            gsap.to(beam2Ref.current, { opacity: 0, duration: 0.1 });
            gsap.fromTo(
              matrix2Ref.current,
              { opacity: 0.25, filter: "drop-shadow(0 0 0px transparent)" },
              {
                opacity: 1,
                filter: "drop-shadow(0 0 6px hsl(var(--foreground)))",
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
        { strokeDashoffset: 44, opacity: 1 },
        {
          strokeDashoffset: -314,
          duration: 0.55,
          ease: "power2.out",
          onComplete: () => {
            gsap.to(beam3Ref.current, { opacity: 0, duration: 0.1 });
            gsap.fromTo(
              matrix1Ref.current,
              { opacity: 0.25, filter: "drop-shadow(0 0 0px transparent)" },
              {
                opacity: 1,
                filter: "drop-shadow(0 0 6px hsl(var(--foreground)))",
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
        "relative w-full max-w-[956px] select-none flex flex-col justify-center items-center py-2 px-1",
        className
      )}
    >
      {/* 1:1 Pixel Coordinate SVG Canvas Matching Linear's Exact Blueprint (viewBox="36 20 956 360") */}
      <div className="relative w-full aspect-[956/360]">
        <svg
          viewBox="36 20 956 360"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* ============================================================== */}
          {/* ORTHOGONAL 90° CONNECTING TRACKS (1PX CRISP LINEAR HAIRLINES)  */}
          {/* ============================================================== */}

          {/* Path 1: Trigger 1 Dot (x:278, y:65.5) -> Node 3 Arrow Base (x:940, y:201) */}
          <path
            d="M 278 65.5 L 920 65.5 A 20 20 0 0 1 940 85.5 L 940 201"
            fill="none"
            className={cn(
              "stroke-foreground/20 transition-all duration-300",
              hoveredTarget === "path-1" && "stroke-foreground/50"
            )}
            strokeWidth="1"
          />

          {/* Path 2: Trigger 2 Dot (x:278, y:111) -> Node 2 Arrow Base (x:748, y:201) */}
          <path
            d="M 278 111 L 728 111 A 20 20 0 0 1 748 131 L 748 201"
            fill="none"
            className={cn(
              "stroke-foreground/20 transition-all duration-300",
              hoveredTarget === "path-2" && "stroke-foreground/50"
            )}
            strokeWidth="1"
          />

          {/* Path 3: Trigger 3 Dot (x:278, y:156.5) -> Node 1 Arrow Base (x:556, y:201) */}
          <path
            d="M 278 156.5 L 536 156.5 A 20 20 0 0 1 556 176.5 L 556 201"
            fill="none"
            className={cn(
              "stroke-foreground/20 transition-all duration-300",
              hoveredTarget === "path-3" && "stroke-foreground/50"
            )}
            strokeWidth="1"
          />

          {/* Return Loop Bus: Exits Node 3/2/1 (y:316) -> Bus at y:363 -> Ascends to Trigger Arrow Base (x:153, y:205) */}
          <path
            d="M 940 316 L 940 343 A 20 20 0 0 1 920 363 L 173 363 A 20 20 0 0 1 153 343 L 153 205"
            fill="none"
            className="stroke-foreground/20"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Node 2 drop into return bus */}
          <path
            d="M 748 316 L 748 343 A 20 20 0 0 1 728 363"
            fill="none"
            className="stroke-foreground/20"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Node 1 drop into return bus */}
          <path
            d="M 556 316 L 556 343 A 20 20 0 0 1 536 363"
            fill="none"
            className="stroke-foreground/20"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* ============================================================== */}
          {/* ANIMATED PHOTON BEAMS (GSAP CONTROLLED OPTICAL PULSES)         */}
          {/* ============================================================== */}

          {/* Beam 1: Trigger 1 -> Node 3 */}
          <path
            ref={beam1Ref}
            d="M 278 65.5 L 920 65.5 A 20 20 0 0 1 940 85.5 L 940 201"
            fill="none"
            className="stroke-foreground"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="56 850"
            style={{
              filter: "drop-shadow(0 0 2.5px hsl(var(--foreground)))",
              opacity: 0,
            }}
          />

          {/* Beam 2: Trigger 2 -> Node 2 */}
          <path
            ref={beam2Ref}
            d="M 278 111 L 728 111 A 20 20 0 0 1 748 131 L 748 201"
            fill="none"
            className="stroke-foreground"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="52 620"
            style={{
              filter: "drop-shadow(0 0 2.5px hsl(var(--foreground)))",
              opacity: 0,
            }}
          />

          {/* Beam 3: Trigger 3 -> Node 1 */}
          <path
            ref={beam3Ref}
            d="M 278 156.5 L 536 156.5 A 20 20 0 0 1 556 176.5 L 556 201"
            fill="none"
            className="stroke-foreground"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="44 380"
            style={{
              filter: "drop-shadow(0 0 2.5px hsl(var(--foreground)))",
              opacity: 0,
            }}
          />

          {/* Return Beam along dashed bus */}
          <path
            ref={returnBeamRef}
            d="M 940 316 L 940 343 A 20 20 0 0 1 920 363 L 173 363 A 20 20 0 0 1 153 343 L 153 205"
            fill="none"
            className="stroke-foreground"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="60 1050"
            style={{
              filter: "drop-shadow(0 0 2.5px hsl(var(--foreground)))",
              opacity: 0,
            }}
          />

          {/* ============================================================== */}
          {/* UNIFORM 16PX AIR-GAPPED PINS & DIRECTIONAL CHEVRON ARROWS      */}
          {/* ============================================================== */}

          {/* Trigger Output Dots: Exact 16px air-gap to the right of Trigger Box (x:262 -> x:278) */}
          <circle cx="278" cy="65.5" r="1.75" className="fill-muted-foreground/75" />
          <circle cx="278" cy="111" r="1.75" className="fill-muted-foreground/75" />
          <circle cx="278" cy="156.5" r="1.75" className="fill-muted-foreground/75" />

          {/* Processor Input Arrowheads: Exact 16px air-gap above Processor Boxes (y:206 -> y:222) */}
          <polygon points="553.5,201 558.5,201 556,206" className="fill-muted-foreground/65" />
          <polygon points="745.5,201 750.5,201 748,206" className="fill-muted-foreground/65" />
          <polygon points="937.5,201 942.5,201 940,206" className="fill-muted-foreground/65" />

          {/* Processor Output Dots: Exact 16px air-gap below Processor Boxes (y:300 -> y:316) */}
          <circle cx="556" cy="316" r="1.75" className="fill-muted-foreground/60" />
          <circle cx="748" cy="316" r="1.75" className="fill-muted-foreground/60" />
          <circle cx="940" cy="316" r="1.75" className="fill-muted-foreground/60" />

          {/* Return Loop Upward Arrowhead: Exact 16px air-gap below Trigger Box (y:184 -> y:200) */}
          <polygon
            ref={returnArrowRef}
            points="150.5,205 155.5,205 153,200"
            className="fill-muted-foreground/75"
          />

          {/* ============================================================== */}
          {/* LEFT TRIGGER BOX: BLACK OUTER WRAPPER + 3 INNER PILL NODES     */}
          {/* ============================================================== */}
          <foreignObject x="44" y="38" width="218" height="146" className="overflow-visible">
            {/* Outer Black Container Frame (x:44..262, y:38..184, 10px padding) */}
            <div className="w-full h-full rounded-xl border border-border/60 bg-background p-[10px] flex flex-col justify-between">
              {TRIGGERS.map((trigger) => {
                const Icon = trigger.icon;
                const isHovered =
                  hoveredTarget === trigger.id ||
                  hoveredTarget === trigger.targetNodeId ||
                  hoveredTarget === trigger.pathId;

                return (
                  <div
                    key={trigger.id}
                    onMouseEnter={() => setHoveredTarget(trigger.pathId)}
                    onMouseLeave={() => setHoveredTarget(null)}
                    onClick={() => handleTriggerClick(trigger.id)}
                    className={cn(
                      "h-[35px] px-3 rounded-md border flex items-center gap-2.5 transition-all duration-200 cursor-pointer select-none",
                      isHovered
                        ? "border-foreground/45 bg-muted/60"
                        : "border-border/85 bg-card/95 hover:border-foreground/30 hover:bg-muted/35"
                    )}
                  >
                    <Icon className="size-3.5 text-muted-foreground shrink-0" />
                    <div className="font-mono text-[10px] tracking-[0.05em] uppercase whitespace-nowrap leading-none">
                      <span className="text-foreground font-medium">{trigger.primaryText}</span>{" "}
                      <span className="text-muted-foreground">{trigger.secondaryText}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </foreignObject>

          {/* ============================================================== */}
          {/* 3 BOTTOM PROCESSOR NODES (EXACT 78x78 OUTER / 58x58 INNER)     */}
          {/* ============================================================== */}
          {PROCESSORS.map((node) => {
            const isHovered =
              hoveredTarget === node.id ||
              hoveredTarget === node.triggerId ||
              hoveredTarget === node.pathId;

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
                y="222"
                width="78"
                height="78"
                className="overflow-visible"
              >
                {/* Outer 78x78 Dashed Square (10px inset to 58x58 inner square) */}
                <div
                  className={cn(
                    "w-full h-full p-[10px] rounded-xl border border-dashed bg-background/50 transition-all duration-300",
                    isHovered ? "border-foreground/50" : "border-border/65"
                  )}
                >
                  {/* Inner 58x58 Solid Silicon Square */}
                  <div
                    onMouseEnter={() => setHoveredTarget(node.pathId)}
                    onMouseLeave={() => setHoveredTarget(null)}
                    className={cn(
                      "w-full h-full rounded-lg border bg-card/95 p-2.5 flex items-start justify-start transition-all duration-300 cursor-pointer",
                      isHovered
                        ? "border-foreground/50"
                        : "border-border/85 hover:border-foreground/30"
                    )}
                  >
                    {/* Top-Left: 4x4 Micro-LED Matrix Controlled by GSAP */}
                    <div
                      ref={matrixRef}
                      className="grid grid-cols-4 gap-[2.5px] w-fit"
                      style={{ opacity: 0.25 }}
                    >
                      {Array.from({ length: 16 }).map((_, i) => (
                        <span
                          key={i}
                          className="size-[2px] rounded-[0.5px] bg-foreground"
                        />
                      ))}
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
