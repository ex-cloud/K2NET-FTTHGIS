import { cn } from "@/lib/utils";
import {
  STAGE_EDGES,
  CLUSTER_FRAME_X,
  CLUSTER_FRAME_Y,
  CLUSTER_FRAME_W,
  CLUSTER_FRAME_H,
  getEdgeHealthColor,
  getParticleClass,
  type NodeStatus,
} from "./overview-infrastructure-constants";

interface InfrastructureSvgProps {
  statusMap: Record<string, NodeStatus>;
  isNodeDimmed: (id: string) => boolean;
  incomingDataCables: { id: string; path: string; speed: "normal" | "slow" }[];
  collapsed: boolean;
}

export function InfrastructureSvg({
  statusMap,
  isNodeDimmed,
  incomingDataCables,
  collapsed,
}: InfrastructureSvgProps) {
  return (
    <svg
      className="absolute inset-0 w-[920px] h-[500px] overflow-visible pointer-events-none z-0"
      viewBox="0 0 920 500"
      role="img"
      aria-label="Animated service dependencies"
    >
      {/* Static & Animated Inter-Tier Edges */}
      {STAGE_EDGES.map((edge, edgeIdx) => {
        const dimmed = isNodeDimmed(edge.from) || isNodeDimmed(edge.to);
        const edgeColor = getEdgeHealthColor(edge.from, edge.to, statusMap);
        const fromStatus = statusMap[edge.from] ?? "healthy";
        const toStatus = statusMap[edge.to] ?? "healthy";
        const edgeStatus: NodeStatus =
          fromStatus === "error" || toStatus === "error"
            ? "error"
            : fromStatus === "warning" || toStatus === "warning"
            ? "warning"
            : "healthy";
        const particleClass = getParticleClass(edge.speed, edgeStatus);

        return (
          <g
            key={edge.id}
            className={cn(
              "transition-opacity duration-300",
              dimmed ? "opacity-10" : "opacity-100"
            )}
          >
            <path
              d={edge.path}
              fill="none"
              stroke="currentColor"
              className="text-border/40 dark:text-border/30"
              strokeWidth="1"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />

            <path
              d={edge.path}
              fill="none"
              stroke={edgeColor}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeOpacity="0.25"
              vectorEffect="non-scaling-stroke"
              className={cn(
                edgeStatus === "error"
                  ? "animate-glow-pulse-warn"
                  : edgeStatus === "warning"
                  ? "animate-glow-pulse-warn"
                  : "animate-glow-pulse"
              )}
              style={{ animationDelay: `${edgeIdx * 0.25}s` }}
            />

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

      {/* Dynamic Incoming PostgreSQL & Redis Trunk Cables */}
      {incomingDataCables.map((cable, idx) => (
        <g key={cable.id}>
          <path
            d={cable.path}
            fill="none"
            stroke="currentColor"
            className="text-border/40 dark:text-border/30"
            strokeWidth="1"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={cable.path}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeOpacity="0.3"
            className="animate-glow-pulse"
          />
          <path
            d={cable.path}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="14 140"
            className="animate-flow-particle-fast"
            style={{ animationDelay: `${-(idx * 0.5)}s` }}
          />
        </g>
      ))}

      {/* ── Matrix Cluster Frame & Branching Bus (When Expanded) ── */}
      {!collapsed && (
        <g className="animate-fade-in">
          {/* Bounding Outer Frame */}
          <rect
            x={CLUSTER_FRAME_X}
            y={CLUSTER_FRAME_Y}
            width={CLUSTER_FRAME_W}
            height={CLUSTER_FRAME_H}
            rx="14"
            fill="currentColor"
            className="text-primary/5"
            stroke="var(--primary)"
            strokeOpacity={0.3}
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Frame Header Baseline Separator */}
          <line
            x1={CLUSTER_FRAME_X}
            y1="82"
            x2={CLUSTER_FRAME_X + CLUSTER_FRAME_W}
            y2="82"
            stroke="var(--primary)"
            strokeOpacity={0.2}
            strokeWidth="1"
          />

          {/* Vertical Main Ingress Bus Rail (X = 560) */}
          <line
            x1={CLUSTER_FRAME_X}
            y1="115"
            x2={CLUSTER_FRAME_X}
            y2="375"
            stroke="var(--primary)"
            strokeOpacity={0.6}
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Branching Horizontal Feeder Lines to Each Row */}
          {[115, 180, 245, 310, 375].map((yRow, rIdx) => (
            <g key={`feeder-${rIdx}`}>
              {/* Feeder to Column 1 (X = 585) */}
              <line
                x1={CLUSTER_FRAME_X}
                y1={yRow}
                x2="585"
                y2={yRow}
                stroke="var(--primary)"
                strokeOpacity={0.35}
                strokeWidth="1"
              />
              {/* Inter-Column Bridge to Column 2 (except row 5) */}
              {yRow <= 310 && (
                <line
                  x1="705"
                  y1={yRow}
                  x2="720"
                  y2={yRow}
                  stroke="currentColor"
                  className="text-border/30"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
              )}
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
