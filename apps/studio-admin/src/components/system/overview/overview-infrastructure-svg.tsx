import { useMemo } from "react";
import {
  STAGE_EDGES,
  GATEWAY_MATRIX,
  DEFAULT_NODE_POSITIONS,
  calculateDynamicBezier,
  type NodeStatus,
} from "./overview-infrastructure-constants";
import { InfrastructureTierEdges } from "./InfrastructureTierEdges";
import { InfrastructureGatewayCables } from "./InfrastructureGatewayCables";
import { InfrastructureClusterFrame } from "./InfrastructureClusterFrame";

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
      <InfrastructureTierEdges
        dynamicEdges={dynamicEdges}
        statusMap={statusMap}
        isNodeDimmed={isNodeDimmed}
      />

      <InfrastructureGatewayCables
        dynamicGatewayCables={dynamicGatewayCables}
        isNodeDimmed={isNodeDimmed}
        activeGatewayId={activeGatewayId}
      />

      {!collapsed && <InfrastructureClusterFrame />}
    </svg>
  );
}
