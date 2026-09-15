import {
  CLUSTER_FRAME_X,
  CLUSTER_FRAME_Y,
  CLUSTER_FRAME_W,
  CLUSTER_FRAME_H,
} from "./overview-infrastructure-constants";

export function InfrastructureClusterFrame() {
  return (
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
  );
}
