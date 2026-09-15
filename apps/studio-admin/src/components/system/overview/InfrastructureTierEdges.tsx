import { cn } from "@/lib/utils";
import {
  getEdgeHealthColor,
  getParticleClass,
  type NodeStatus,
} from "./overview-infrastructure-constants";

interface DynamicEdge {
  id: string;
  from: string;
  to: string;
  speed?: "normal" | "slow" | "fast";
  path: string;
}

interface InfrastructureTierEdgesProps {
  dynamicEdges: DynamicEdge[];
  statusMap: Record<string, NodeStatus>;
  isNodeDimmed: (id: string) => boolean;
}

export function InfrastructureTierEdges({
  dynamicEdges,
  statusMap,
  isNodeDimmed,
}: InfrastructureTierEdgesProps) {
  return (
    <>
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
    </>
  );
}
