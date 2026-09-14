import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  STAGE_EDGES,
  GATEWAY_MATRIX,
  DEFAULT_NODE_POSITIONS,
  CLUSTER_FRAME_X,
  CLUSTER_FRAME_Y,
  CLUSTER_FRAME_W,
  CLUSTER_FRAME_H,
  getEdgeHealthColor,
  getParticleClass,
  calculateDynamicBezier,
  type NodeStatus,
} from "./overview-infrastructure-constants";

interface InfrastructureSvgProps {
  statusMap: Record<string, NodeStatus>;
  isNodeDimmed: (id: string) => boolean;
  nodePositions: Record<string, { x: number; y: number }>;
  collapsed: boolean;
  activeGatewayId: string | null;
}

export function InfrastructureSvg({
  statusMap,
  isNodeDimmed,
  nodePositions,
  collapsed,
  activeGatewayId,
}: InfrastructureSvgProps) {
  // Compute dynamic inter-tier edges based on live node positions
  const dynamicEdges = useMemo(() => {
    return STAGE_EDGES.map((edge) => {
      const p1 = nodePositions[edge.from] || DEFAULT_NODE_POSITIONS[edge.from] || { x: 0, y: 0 };
      const p2 = nodePositions[edge.to] || DEFAULT_NODE_POSITIONS[edge.to] || { x: 0, y: 0 };
      return {
        ...edge,
        path: calculateDynamicBezier(p1, p2),
      };
    });
  }, [nodePositions]);

  // Compute dynamic cables connecting Storage to Gateway Cluster or individual Gateways
  const dynamicGatewayCables = useMemo(() => {
    const pPostgres = nodePositions["postgres-db"] || DEFAULT_NODE_POSITIONS["postgres-db"] || { x: 420, y: 165 };
    const pRedis = nodePositions["redis-cache"] || DEFAULT_NODE_POSITIONS["redis-cache"] || { x: 420, y: 335 };
    const pKeycloak = nodePositions["keycloak-iam"] || DEFAULT_NODE_POSITIONS["keycloak-iam"] || { x: 255, y: 400 };

    if (collapsed) {
      const pHub = nodePositions["gw-cluster"] || DEFAULT_NODE_POSITIONS["gw-cluster"] || { x: 640, y: 250 };
      return [
        {
          id: "postgres-hub-col",
          path: calculateDynamicBezier(pPostgres, pHub),
          speed: "normal" as const,
          source: "postgres-db",
          target: "gw-cluster",
        },
        {
          id: "redis-hub-col",
          path: calculateDynamicBezier(pRedis, pHub),
          speed: "slow" as const,
          source: "redis-cache",
          target: "gw-cluster",
        },
      ];
    }

    // Expanded mode: Cables from storage nodes to each gateway based on connectsTo
    const cables: {
      id: string;
      path: string;
      speed: "normal" | "slow";
      source: string;
      target: string;
    }[] = [];

    GATEWAY_MATRIX.forEach((gw) => {
      const pGw = nodePositions[gw.id] || { x: gw.x, y: gw.y };
      gw.connectsTo.forEach((src) => {
        const pSrc =
          src === "postgres-db"
            ? pPostgres
            : src === "redis-cache"
            ? pRedis
            : src === "keycloak-iam"
            ? pKeycloak
            : nodePositions[src] || { x: 0, y: 0 };

        cables.push({
          id: `${src}-${gw.id}`,
          path: calculateDynamicBezier(pSrc, pGw),
          speed: src === "redis-cache" ? "slow" : "normal",
          source: src,
          target: gw.id,
        });
      });
    });

    return cables;
  }, [collapsed, nodePositions]);
  return (
    <svg
      className="absolute inset-0 w-[920px] h-[500px] overflow-visible pointer-events-none z-0"
      viewBox="0 0 920 500"
      role="img"
      aria-label="Animated service dependencies"
    >
      {/* Static & Animated Inter-Tier Edges */}
      {dynamicEdges.map((edge, edgeIdx) => {
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

      {/* Dynamic Incoming PostgreSQL, Redis & IAM Gateway Cables */}
      {dynamicGatewayCables.map((cable, idx) => {
        const dimmed = isNodeDimmed(cable.source) || isNodeDimmed(cable.target);
        const isFocused = activeGatewayId === cable.target;
        return (
          <g
            key={cable.id}
            className={cn(
              "transition-opacity duration-300",
              dimmed ? "opacity-10" : "opacity-100"
            )}
          >
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
              strokeWidth={isFocused ? "2" : "1.2"}
              strokeLinecap="round"
              strokeOpacity={isFocused ? "0.8" : "0.3"}
              className="animate-glow-pulse"
            />
            <path
              d={cable.path}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="14 140"
              className={cable.speed === "slow" ? "animate-flow-particle-slow" : "animate-flow-particle-fast"}
              style={{ animationDelay: `${-(idx * 0.35)}s` }}
            />
          </g>
        );
      })}

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
