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

interface MatrixFrame {
  high: number[];
  mid: number[];
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

/**
 * DISTINCT 4x4 (16-Dot) MATRIX ANIMATION STYLES PER PROCESSOR NODE
 * Grid indices:
 *   0  1  2  3
 *   4  5  6  7
 *   8  9 10 11
 *  12 13 14 15
 */

// Node 1 (Left Box — Optical OTDR Audit):
// Style A: "Corner-to-Core Radar, X-Crosshair & Perimeter Ring Scan"
const NODE_1_OPTICAL_FRAMES: MatrixFrame[] = [
  // Frame 1: Top-left ingress spark
  { high: [0, 1, 4], mid: [2, 5, 8] },
  // Frame 2: Diagonal X-Crosshair Lock
  { high: [0, 3, 5, 6, 9, 10, 12, 15], mid: [1, 2, 4, 7, 8, 11, 13, 14] },
  // Frame 3: Inner 2x2 Core Compression
  { high: [5, 6, 9, 10], mid: [0, 3, 12, 15] },
  // Frame 4: Outer Perimeter Ring Expansion
  { high: [0, 1, 2, 3, 4, 7, 8, 11, 12, 13, 14, 15], mid: [5, 6, 9, 10] },
  // Frame 5: Four Corner Brackets
  { high: [0, 1, 4, 2, 3, 7, 8, 12, 13, 11, 14, 15], mid: [5, 6, 9, 10] },
  // Frame 6: Plus (+) Axis Crosshair
  { high: [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14], mid: [0, 3, 12, 15] },
  // Frame 7: Diamond Cluster Synthesis
  { high: [1, 2, 4, 7, 8, 11, 13, 14], mid: [5, 6, 9, 10] },
  // Frame 8: Center Core Convergence
  { high: [5, 6, 9, 10], mid: [8, 9, 10, 11, 13, 14] },
  // Frame 9: Bottom Egress Funnel toward Return Pin
  { high: [9, 10, 13, 14], mid: [12, 15] },
];

// Node 2 (Middle Box — Subscriber OMCI Provisioning):
// Style B: "Sliding 2x2 Quadrant Window & Checkerboard Parity Synthesis"
const NODE_2_PROVISION_FRAMES: MatrixFrame[] = [
  // Frame 1: Top-Left 2x2 Quadrant
  { high: [0, 1, 4, 5], mid: [2, 6, 8, 9] },
  // Frame 2: Shift Right -> Top-Center 2x2
  { high: [1, 2, 5, 6], mid: [0, 3, 4, 7] },
  // Frame 3: Shift Right -> Top-Right 2x2 Quadrant
  { high: [2, 3, 6, 7], mid: [1, 5, 10, 11] },
  // Frame 4: Shift Down -> Bottom-Right 2x2 Quadrant
  { high: [10, 11, 14, 15], mid: [6, 7, 9, 13] },
  // Frame 5: Shift Left -> Bottom-Center 2x2
  { high: [9, 10, 13, 14], mid: [5, 6, 8, 11, 12, 15] },
  // Frame 6: Shift Left -> Bottom-Left 2x2 Quadrant
  { high: [8, 9, 12, 13], mid: [4, 5, 10, 14] },
  // Frame 7: Checkerboard Parity Verification A
  { high: [0, 2, 5, 7, 8, 10, 13, 15], mid: [1, 4, 6, 9, 11, 14] },
  // Frame 8: Checkerboard Parity Verification B (Inverse)
  { high: [1, 3, 4, 6, 9, 11, 12, 14], mid: [0, 2, 5, 7, 8, 10, 13, 15] },
  // Frame 9: Bottom Output Dispatch
  { high: [8, 9, 12, 13, 14], mid: [4, 5, 10, 15] },
];

// Node 3 (Right Box — OLT Telemetry Sync):
// Style C: "Sequential Scanline Cascade & Column Equalizer Sweep"
const NODE_3_TELEMETRY_FRAMES: MatrixFrame[] = [
  // Frame 1: Row 1 Top Ingress Scanline
  { high: [0, 1, 2, 3], mid: [4, 5, 6, 7] },
  // Frame 2: Row 2 Horizontal Scanline
  { high: [4, 5, 6, 7], mid: [0, 1, 2, 3, 8, 9, 10, 11] },
  // Frame 3: Row 3 Horizontal Scanline
  { high: [8, 9, 10, 11], mid: [4, 5, 6, 7, 12, 13, 14, 15] },
  // Frame 4: Row 4 Bottom Horizontal Scanline
  { high: [12, 13, 14, 15], mid: [8, 9, 10, 11] },
  // Frame 5: Column 1 & 2 Vertical Sweep
  { high: [0, 4, 8, 12, 1, 5, 9, 13], mid: [2, 6, 10, 14] },
  // Frame 6: Column 2 & 3 Vertical Sweep
  { high: [1, 5, 9, 13, 2, 6, 10, 14], mid: [0, 4, 8, 12, 3, 7, 11, 15] },
  // Frame 7: Column 3 & 4 Right Vertical Sweep
  { high: [2, 6, 10, 14, 3, 7, 11, 15], mid: [1, 5, 9, 13] },
  // Frame 8: Telemetry Bar Graph Spectrum
  { high: [4, 8, 9, 11, 12, 13, 14, 15], mid: [0, 5, 7, 10] },
  // Frame 9: Bottom Egress Dispatch Pulse
  { high: [12, 13, 14, 15], mid: [8, 9, 10, 11] },
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

  // Forward Beam Refs (Tail + Core Head for smooth 1px gradient comet)
  const beam1TailRef = useRef<SVGPathElement>(null);
  const beam1HeadRef = useRef<SVGPathElement>(null);
  const beam2TailRef = useRef<SVGPathElement>(null);
  const beam2HeadRef = useRef<SVGPathElement>(null);
  const beam3TailRef = useRef<SVGPathElement>(null);
  const beam3HeadRef = useRef<SVGPathElement>(null);

  // Return Loop Beam Refs (One per Processor Node: Node 3, Node 2, Node 1)
  const ret3TailRef = useRef<SVGPathElement>(null);
  const ret3HeadRef = useRef<SVGPathElement>(null);
  const ret2TailRef = useRef<SVGPathElement>(null);
  const ret2HeadRef = useRef<SVGPathElement>(null);
  const ret1TailRef = useRef<SVGPathElement>(null);
  const ret1HeadRef = useRef<SVGPathElement>(null);

  // Pin Refs for realistic arrival/departure handoff illumination
  const trigPin1Ref = useRef<SVGCircleElement>(null);
  const trigPin2Ref = useRef<SVGCircleElement>(null);
  const trigPin3Ref = useRef<SVGCircleElement>(null);
  const node1InPinRef = useRef<SVGPolygonElement>(null);
  const node2InPinRef = useRef<SVGPolygonElement>(null);
  const node3InPinRef = useRef<SVGPolygonElement>(null);
  const node1OutPinRef = useRef<SVGCircleElement>(null);
  const node2OutPinRef = useRef<SVGCircleElement>(null);
  const node3OutPinRef = useRef<SVGCircleElement>(null);
  const returnArrowRef = useRef<SVGPolygonElement>(null);

  // 16 Individual LED Dot Refs per Processor Node (4x4 Matrix)
  const node1DotsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const node2DotsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const node3DotsRef = useRef<(HTMLSpanElement | null)[]>([]);

  // Processor Inner Card Refs & Trigger Pill Refs
  const node1CardRef = useRef<HTMLDivElement>(null);
  const node2CardRef = useRef<HTMLDivElement>(null);
  const node3CardRef = useRef<HTMLDivElement>(null);
  const pill1Ref = useRef<HTMLDivElement>(null);
  const pill2Ref = useRef<HTMLDivElement>(null);
  const pill3Ref = useRef<HTMLDivElement>(null);

  /**
   * Schedule a Realistic Gradient Comet Pulse along an SVG Path.
   * Locks the bright `head` to the exact leading tip of `tail` (`s_front_head === s_front_tail`)
   * and uses `sine.inOut` easing so the pulse decelerates naturally as it drains into the target pin.
   */
  const scheduleBeamPulse = (
    tl: gsap.core.Timeline,
    tailEl: SVGPathElement | null,
    headEl: SVGPathElement | null,
    originPinEl: SVGElement | null,
    targetPinEl: SVGElement | null,
    exactLen: number,
    duration: number,
    startTime: number
  ) => {
    if (!tailEl || !headEl) return;
    const len = tailEl.getTotalLength() || exactLen;
    const tailDash = 96;
    const headDash = 28;
    const totalTravel = len + tailDash;
    const gap = Math.ceil(totalTravel + 240);

    gsap.set(tailEl, {
      strokeDasharray: `${tailDash} ${gap}`,
      strokeDashoffset: tailDash,
      opacity: 0,
    });
    gsap.set(headEl, {
      strokeDasharray: `${headDash} ${gap}`,
      strokeDashoffset: headDash,
      opacity: 0,
    });

    // Subtle origin pin spark on departure
    if (originPinEl) {
      tl.fromTo(
        originPinEl,
        { opacity: 0.55 },
        { opacity: 1, duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut" },
        startTime
      );
    }

    // Both tail and head travel exact `totalTravel` distance in lockstep with `sine.inOut`
    tl.set([tailEl, headEl], { opacity: 1 }, startTime)
      .fromTo(
        tailEl,
        { strokeDashoffset: tailDash },
        {
          strokeDashoffset: tailDash - totalTravel,
          duration,
          ease: "sine.inOut",
          immediateRender: false,
        },
        startTime
      )
      .fromTo(
        headEl,
        { strokeDashoffset: headDash },
        {
          strokeDashoffset: headDash - totalTravel,
          duration,
          ease: "sine.inOut",
          immediateRender: false,
        },
        startTime
      )
      .set([tailEl, headEl], { opacity: 0 }, startTime + duration);

    // Target pin illuminates smoothly as the comet tip arrives and drains into the pin
    if (targetPinEl) {
      const arrivalTime = startTime + duration * 0.78;
      tl.fromTo(
        targetPinEl,
        { opacity: 0.5 },
        { opacity: 1, duration: duration * 0.24, yoyo: true, repeat: 1, ease: "sine.inOut" },
        arrivalTime
      );
    }
  };

  /**
   * Schedule Node-Specific 4x4 Silicon Matrix Processing Choreography.
   * Starts after the comet has realistically absorbed into the node's input pin.
   */
  const scheduleMatrixCompute = (
    tl: gsap.core.Timeline,
    dots: (HTMLSpanElement | null)[],
    frames: MatrixFrame[],
    startTime: number,
    stepDuration = 0.24
  ): number => {
    const validDots = dots.filter((d): d is HTMLSpanElement => d !== null);
    if (validDots.length === 0) return startTime;

    frames.forEach((frame, fIdx) => {
      const frameTime = startTime + fIdx * stepDuration;
      validDots.forEach((dot, dotIdx) => {
        const targetOpacity = frame.high.includes(dotIdx)
          ? 1
          : frame.mid.includes(dotIdx)
          ? 0.48
          : 0.16;
        tl.to(
          dot,
          {
            opacity: targetOpacity,
            duration: stepDuration * 0.85,
            ease: "sine.inOut",
          },
          frameTime
        );
      });
    });

    // Smoothly settle all 16 LEDs back to idle dim state before dispatching return beam
    const endTime = startTime + frames.length * stepDuration;
    tl.to(
      validDots,
      {
        opacity: 0.18,
        duration: 0.3,
        ease: "power2.out",
      },
      endTime
    );

    return endTime + 0.18;
  };

  // Continuous Overlapping 3-Pipeline GSAP Master Timeline
  useEffect(() => {
    if (!interactive) return;

    const ctx = gsap.context(() => {
      const allDots = [
        ...node1DotsRef.current,
        ...node2DotsRef.current,
        ...node3DotsRef.current,
      ].filter((d): d is HTMLSpanElement => d !== null);

      gsap.set(allDots, { opacity: 0.18 });

      const tl = gsap.timeline({
        repeat: -1,
        repeatDelay: 0.25,
      });

      // ─────────────────────────────────────────────────────────────────
      // PIPELINE 1: Trigger 1 (TELEMETRY) -> Line 1 (789px) -> Node 3 (Scanline & Equalizer) -> Return 3
      // ─────────────────────────────────────────────────────────────────
      const p1Start = 0.0;
      const p1ForwardDur = 2.45;
      scheduleBeamPulse(
        tl,
        beam1TailRef.current,
        beam1HeadRef.current,
        trigPin1Ref.current,
        node3InPinRef.current,
        789,
        p1ForwardDur,
        p1Start
      );
      // Handoff to Node 3 Matrix right as comet tail finishes absorbing into pin
      const p1ComputeEnd = scheduleMatrixCompute(
        tl,
        node3DotsRef.current,
        NODE_3_TELEMETRY_FRAMES,
        p1Start + p1ForwardDur - 0.12,
        0.24
      );
      // Dispatch Return Beam 3 from Node 3 bottom pin back to Trigger Box
      scheduleBeamPulse(
        tl,
        ret3TailRef.current,
        ret3HeadRef.current,
        node3OutPinRef.current,
        returnArrowRef.current,
        975,
        2.65,
        p1ComputeEnd
      );

      // ─────────────────────────────────────────────────────────────────
      // PIPELINE 2: Trigger 2 (PROVISION) -> Line 2 (552px) -> Node 2 (Sliding 2x2 & Checkerboard) -> Return 2
      // ─────────────────────────────────────────────────────────────────
      const p2Start = 1.95;
      const p2ForwardDur = 1.95;
      scheduleBeamPulse(
        tl,
        beam2TailRef.current,
        beam2HeadRef.current,
        trigPin2Ref.current,
        node2InPinRef.current,
        552,
        p2ForwardDur,
        p2Start
      );
      const p2ComputeEnd = scheduleMatrixCompute(
        tl,
        node2DotsRef.current,
        NODE_2_PROVISION_FRAMES,
        p2Start + p2ForwardDur - 0.12,
        0.24
      );
      scheduleBeamPulse(
        tl,
        ret2TailRef.current,
        ret2HeadRef.current,
        node2OutPinRef.current,
        returnArrowRef.current,
        783,
        2.25,
        p2ComputeEnd
      );

      // ─────────────────────────────────────────────────────────────────
      // PIPELINE 3: Trigger 3 (OPTICAL) -> Line 3 (314px) -> Node 1 (Crosshair & Perimeter Ring) -> Return 1
      // ─────────────────────────────────────────────────────────────────
      const p3Start = 3.85;
      const p3ForwardDur = 1.50;
      scheduleBeamPulse(
        tl,
        beam3TailRef.current,
        beam3HeadRef.current,
        trigPin3Ref.current,
        node1InPinRef.current,
        314,
        p3ForwardDur,
        p3Start
      );
      const p3ComputeEnd = scheduleMatrixCompute(
        tl,
        node1DotsRef.current,
        NODE_1_OPTICAL_FRAMES,
        p3Start + p3ForwardDur - 0.12,
        0.24
      );
      scheduleBeamPulse(
        tl,
        ret1TailRef.current,
        ret1HeadRef.current,
        node1OutPinRef.current,
        returnArrowRef.current,
        591,
        1.90,
        p3ComputeEnd
      );
    }, containerRef);

    return () => ctx.revert();
  }, [interactive]);

  // Direct Interactive Click Handler: Fires Smooth Beam + Node-Specific Data Processing Wave
  const handleTriggerClick = (triggerId: string) => {
    if (!interactive) return;

    const clickTl = gsap.timeline();
    if (triggerId === "trigger-1") {
      scheduleBeamPulse(
        clickTl,
        beam1TailRef.current,
        beam1HeadRef.current,
        trigPin1Ref.current,
        node3InPinRef.current,
        789,
        1.75,
        0
      );
      const end = scheduleMatrixCompute(
        clickTl,
        node3DotsRef.current,
        NODE_3_TELEMETRY_FRAMES,
        1.65,
        0.2
      );
      scheduleBeamPulse(
        clickTl,
        ret3TailRef.current,
        ret3HeadRef.current,
        node3OutPinRef.current,
        returnArrowRef.current,
        975,
        1.9,
        end
      );
    } else if (triggerId === "trigger-2") {
      scheduleBeamPulse(
        clickTl,
        beam2TailRef.current,
        beam2HeadRef.current,
        trigPin2Ref.current,
        node2InPinRef.current,
        552,
        1.45,
        0
      );
      const end = scheduleMatrixCompute(
        clickTl,
        node2DotsRef.current,
        NODE_2_PROVISION_FRAMES,
        1.35,
        0.2
      );
      scheduleBeamPulse(
        clickTl,
        ret2TailRef.current,
        ret2HeadRef.current,
        node2OutPinRef.current,
        returnArrowRef.current,
        783,
        1.65,
        end
      );
    } else if (triggerId === "trigger-3") {
      scheduleBeamPulse(
        clickTl,
        beam3TailRef.current,
        beam3HeadRef.current,
        trigPin3Ref.current,
        node1InPinRef.current,
        314,
        1.15,
        0
      );
      const end = scheduleMatrixCompute(
        clickTl,
        node1DotsRef.current,
        NODE_1_OPTICAL_FRAMES,
        1.05,
        0.2
      );
      scheduleBeamPulse(
        clickTl,
        ret1TailRef.current,
        ret1HeadRef.current,
        node1OutPinRef.current,
        returnArrowRef.current,
        591,
        1.4,
        end
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
              hoveredTarget === "path-1" && "stroke-foreground/45"
            )}
            strokeWidth="1"
          />

          {/* Path 2: Trigger 2 Dot (x:278, y:111) -> Node 2 Arrow Base (x:748, y:201) */}
          <path
            d="M 278 111 L 728 111 A 20 20 0 0 1 748 131 L 748 201"
            fill="none"
            className={cn(
              "stroke-foreground/20 transition-all duration-300",
              hoveredTarget === "path-2" && "stroke-foreground/45"
            )}
            strokeWidth="1"
          />

          {/* Path 3: Trigger 3 Dot (x:278, y:156.5) -> Node 1 Arrow Base (x:556, y:201) */}
          <path
            d="M 278 156.5 L 536 156.5 A 20 20 0 0 1 556 176.5 L 556 201"
            fill="none"
            className={cn(
              "stroke-foreground/20 transition-all duration-300",
              hoveredTarget === "path-3" && "stroke-foreground/45"
            )}
            strokeWidth="1"
          />

          {/* Return Loop Bus 3: Exits Node 3 (y:316) -> Bus at y:363 -> Ascends to Trigger Arrow Base (x:153, y:205) */}
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
          {/* ANIMATED GRADIENT COMET BEAMS (ALL 3 FORWARD + ALL 3 RETURN)   */}
          {/* ============================================================== */}

          {/* Forward Beam 1 (Trigger 1 -> Node 3) */}
          <path
            ref={beam1TailRef}
            d="M 278 65.5 L 920 65.5 A 20 20 0 0 1 940 85.5 L 940 201"
            fill="none"
            className="stroke-foreground/40"
            strokeWidth="1"
            strokeLinecap="round"
            style={{ opacity: 0 }}
          />
          <path
            ref={beam1HeadRef}
            d="M 278 65.5 L 920 65.5 A 20 20 0 0 1 940 85.5 L 940 201"
            fill="none"
            className="stroke-foreground"
            strokeWidth="1.25"
            strokeLinecap="round"
            style={{ opacity: 0 }}
          />

          {/* Forward Beam 2 (Trigger 2 -> Node 2) */}
          <path
            ref={beam2TailRef}
            d="M 278 111 L 728 111 A 20 20 0 0 1 748 131 L 748 201"
            fill="none"
            className="stroke-foreground/40"
            strokeWidth="1"
            strokeLinecap="round"
            style={{ opacity: 0 }}
          />
          <path
            ref={beam2HeadRef}
            d="M 278 111 L 728 111 A 20 20 0 0 1 748 131 L 748 201"
            fill="none"
            className="stroke-foreground"
            strokeWidth="1.25"
            strokeLinecap="round"
            style={{ opacity: 0 }}
          />

          {/* Forward Beam 3 (Trigger 3 -> Node 1) */}
          <path
            ref={beam3TailRef}
            d="M 278 156.5 L 536 156.5 A 20 20 0 0 1 556 176.5 L 556 201"
            fill="none"
            className="stroke-foreground/40"
            strokeWidth="1"
            strokeLinecap="round"
            style={{ opacity: 0 }}
          />
          <path
            ref={beam3HeadRef}
            d="M 278 156.5 L 536 156.5 A 20 20 0 0 1 556 176.5 L 556 201"
            fill="none"
            className="stroke-foreground"
            strokeWidth="1.25"
            strokeLinecap="round"
            style={{ opacity: 0 }}
          />

          {/* Return Beam 3 (Node 3 Bottom Pin -> Trigger Bottom Arrow) */}
          <path
            ref={ret3TailRef}
            d="M 940 316 L 940 343 A 20 20 0 0 1 920 363 L 173 363 A 20 20 0 0 1 153 343 L 153 205"
            fill="none"
            className="stroke-foreground/35"
            strokeWidth="1"
            strokeLinecap="round"
            style={{ opacity: 0 }}
          />
          <path
            ref={ret3HeadRef}
            d="M 940 316 L 940 343 A 20 20 0 0 1 920 363 L 173 363 A 20 20 0 0 1 153 343 L 153 205"
            fill="none"
            className="stroke-foreground/90"
            strokeWidth="1.2"
            strokeLinecap="round"
            style={{ opacity: 0 }}
          />

          {/* Return Beam 2 (Node 2 Bottom Pin -> Trigger Bottom Arrow) */}
          <path
            ref={ret2TailRef}
            d="M 748 316 L 748 343 A 20 20 0 0 1 728 363 L 173 363 A 20 20 0 0 1 153 343 L 153 205"
            fill="none"
            className="stroke-foreground/35"
            strokeWidth="1"
            strokeLinecap="round"
            style={{ opacity: 0 }}
          />
          <path
            ref={ret2HeadRef}
            d="M 748 316 L 748 343 A 20 20 0 0 1 728 363 L 173 363 A 20 20 0 0 1 153 343 L 153 205"
            fill="none"
            className="stroke-foreground/90"
            strokeWidth="1.2"
            strokeLinecap="round"
            style={{ opacity: 0 }}
          />

          {/* Return Beam 1 (Node 1 Bottom Pin -> Trigger Bottom Arrow) */}
          <path
            ref={ret1TailRef}
            d="M 556 316 L 556 343 A 20 20 0 0 1 536 363 L 173 363 A 20 20 0 0 1 153 343 L 153 205"
            fill="none"
            className="stroke-foreground/35"
            strokeWidth="1"
            strokeLinecap="round"
            style={{ opacity: 0 }}
          />
          <path
            ref={ret1HeadRef}
            d="M 556 316 L 556 343 A 20 20 0 0 1 536 363 L 173 363 A 20 20 0 0 1 153 343 L 153 205"
            fill="none"
            className="stroke-foreground/90"
            strokeWidth="1.2"
            strokeLinecap="round"
            style={{ opacity: 0 }}
          />

          {/* ============================================================== */}
          {/* UNIFORM 16PX AIR-GAPPED PINS & DIRECTIONAL CHEVRON ARROWS      */}
          {/* ============================================================== */}

          {/* Trigger Output Dots: Exact 16px air-gap to the right of Trigger Box (x:262 -> x:278) */}
          <circle ref={trigPin1Ref} cx="278" cy="65.5" r="1.75" className="fill-muted-foreground/75" />
          <circle ref={trigPin2Ref} cx="278" cy="111" r="1.75" className="fill-muted-foreground/75" />
          <circle ref={trigPin3Ref} cx="278" cy="156.5" r="1.75" className="fill-muted-foreground/75" />

          {/* Processor Input Arrowheads: Exact 16px air-gap above Processor Boxes (y:206 -> y:222) */}
          <polygon
            ref={node1InPinRef}
            points="553.5,201 558.5,201 556,206"
            className="fill-muted-foreground/65"
          />
          <polygon
            ref={node2InPinRef}
            points="745.5,201 750.5,201 748,206"
            className="fill-muted-foreground/65"
          />
          <polygon
            ref={node3InPinRef}
            points="937.5,201 942.5,201 940,206"
            className="fill-muted-foreground/65"
          />

          {/* Processor Output Dots: Exact 16px air-gap below Processor Boxes (y:300 -> y:316) */}
          <circle ref={node1OutPinRef} cx="556" cy="316" r="1.75" className="fill-muted-foreground/60" />
          <circle ref={node2OutPinRef} cx="748" cy="316" r="1.75" className="fill-muted-foreground/60" />
          <circle ref={node3OutPinRef} cx="940" cy="316" r="1.75" className="fill-muted-foreground/60" />

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
              {TRIGGERS.map((trigger, idx) => {
                const Icon = trigger.icon;
                const isHovered =
                  hoveredTarget === trigger.id ||
                  hoveredTarget === trigger.targetNodeId ||
                  hoveredTarget === trigger.pathId;
                const pillRef = idx === 0 ? pill1Ref : idx === 1 ? pill2Ref : pill3Ref;

                return (
                  <div
                    key={trigger.id}
                    ref={pillRef}
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

            const dotsArrayRef =
              node.id === "node-1"
                ? node1DotsRef
                : node.id === "node-2"
                ? node2DotsRef
                : node3DotsRef;

            const cardRef =
              node.id === "node-1"
                ? node1CardRef
                : node.id === "node-2"
                ? node2CardRef
                : node3CardRef;

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
                    ref={cardRef}
                    onMouseEnter={() => setHoveredTarget(node.pathId)}
                    onMouseLeave={() => setHoveredTarget(null)}
                    className={cn(
                      "w-full h-full rounded-lg border bg-card/95 p-2.5 flex items-start justify-start transition-all duration-300 cursor-pointer",
                      isHovered
                        ? "border-foreground/50"
                        : "border-border/85 hover:border-foreground/30"
                    )}
                  >
                    {/* Top-Left: 4x4 (16-Dot) Micro-LED Matrix with Node-Specific GSAP Choreography */}
                    <div className="grid grid-cols-4 gap-[3px] w-fit">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <span
                          key={i}
                          ref={(el) => {
                            dotsArrayRef.current[i] = el;
                          }}
                          className="size-[2.75px] rounded-[0.5px] bg-foreground"
                          style={{ opacity: 0.18 }}
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
