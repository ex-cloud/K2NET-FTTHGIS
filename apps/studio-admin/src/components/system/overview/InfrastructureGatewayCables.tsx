import { cn } from "@/lib/utils";

interface DynamicGatewayCable {
  id: string;
  path: string;
  speed: "normal" | "slow";
  source: string;
  target: string;
}

interface InfrastructureGatewayCablesProps {
  dynamicGatewayCables: DynamicGatewayCable[];
  isNodeDimmed: (id: string) => boolean;
  activeGatewayId: string | null;
}

export function InfrastructureGatewayCables({
  dynamicGatewayCables,
  isNodeDimmed,
  activeGatewayId,
}: InfrastructureGatewayCablesProps) {
  return (
    <>
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
    </>
  );
}
