import { cn } from "@/lib/utils";
import { ChevronRight, X } from "lucide-react";
import type { SubNode } from "./overview-map-types";
import {
  GATEWAY_MATRIX,
  COLLAPSED_HUB_X,
  COLLAPSED_HUB_Y,
  CLUSTER_FRAME_X,
  CLUSTER_FRAME_Y,
  STAGE_NODE_POSITIONS,
  statusToColor,
  type NodeStatus,
} from "./overview-infrastructure-constants";

interface InfrastructureTierNodesProps {
  activeNode: string | null;
  statusMap: Record<string, NodeStatus>;
  isNodeDimmed: (id: string) => boolean;
  nodePositions: Record<string, { x: number; y: number }>;
  draggingNodeId: string | null;
  onPointerDownNode: (nodeId: string, e: React.PointerEvent) => void;
  onSelectNode: (nodeId: string) => void;
  onSelectGateway: (gwId: string | null) => void;
}

export function InfrastructureTierNodes({
  activeNode,
  statusMap,
  isNodeDimmed,
  nodePositions,
  draggingNodeId,
  onPointerDownNode,
  onSelectNode,
  onSelectGateway,
}: InfrastructureTierNodesProps) {
  return (
    <>
      {Object.entries(STAGE_NODE_POSITIONS).map(([nodeId, meta]) => {
        const NodeIcon = meta.icon;
        const isSelected = activeNode === nodeId;
        const isDragging = draggingNodeId === nodeId;
        const dimmed = isNodeDimmed(nodeId);
        const nodeStatus = statusMap[nodeId] ?? "healthy";
        const dotColor = statusToColor(nodeStatus);
        const pos = nodePositions[nodeId] || { x: meta.x, y: meta.y };

        const toneClasses =
          nodeStatus === "error"
            ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
            : nodeStatus === "warning"
            ? "bg-yellow-400 shadow-[0_0_8px_#facc15]"
            : meta.tone === "blue"
            ? "bg-sky-400 shadow-[0_0_8px_#38bdf8]"
            : meta.tone === "red"
            ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
            : "bg-primary shadow-[0_0_8px_var(--primary)]";

        return (
          <button
            key={nodeId}
            onPointerDown={(e) => onPointerDownNode(nodeId, e)}
            style={{ left: pos.x, top: pos.y }}
            aria-pressed={isSelected}
            className={cn(
              "absolute flex items-center gap-2 rounded-lg border px-3 py-1.5 cursor-grab active:cursor-grabbing whitespace-nowrap -translate-x-1/2 -translate-y-1/2 select-none z-10 touch-none",
              "bg-gradient-to-b from-[#181d28] via-[#121620] to-[#0c0f17] dark:from-[#181d28] dark:via-[#121620] dark:to-[#0c0f17]",
              "border-[#262e3f] dark:border-white/10 shadow-[0_6px_20px_-3px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.12)]",
              "hover:border-primary/50 hover:shadow-[0_8px_25px_-3px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.2)] text-foreground",
              !isDragging && "transition-transform duration-150 hover:scale-[1.03]",
              isSelected &&
                "border-primary/80 bg-gradient-to-b from-[#152a22] to-[#0a1813] shadow-[0_0_20px_rgba(38,230,161,0.35),inset_0_1px_0_0_rgba(38,230,161,0.4)] scale-105 z-20 text-primary font-bold",
              isDragging &&
                "cursor-grabbing border-primary shadow-[0_0_28px_rgba(38,230,161,0.55),inset_0_1px_0_0_rgba(38,230,161,0.5)] scale-110 z-50 ring-2 ring-primary/60",
              nodeStatus === "error" && "border-rose-500/50",
              nodeStatus === "warning" && "border-yellow-400/50",
              dimmed && !isDragging && "opacity-15 hover:opacity-100"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full flex-shrink-0 ring-2 ring-black/40",
                toneClasses,
                nodeStatus !== "error" && "animate-pulse"
              )}
              style={nodeStatus === "error" ? { backgroundColor: dotColor } : undefined}
            />

            <div className="flex flex-col text-left">
              <span className="text-[11px] font-semibold text-foreground tracking-tight leading-none">
                {meta.label}
              </span>
              {meta.sublabel && (
                <span className="text-[8px] font-mono text-muted-foreground/75 mt-0.5 leading-none">
                  {meta.sublabel}
                </span>
              )}
            </div>

            <NodeIcon
              className={cn(
                "h-3.5 w-3.5 ml-1 text-muted-foreground/50 shrink-0",
                isSelected && "text-primary"
              )}
            />
          </button>
        );
      })}
    </>
  );
}

interface InfrastructureGatewayClusterProps {
  collapsed: boolean;
  activeGatewayId: string | null;
  onlineGatewayCount: number;
  isNodeDimmed: (id: string) => boolean;
  nodePositions: Record<string, { x: number; y: number }>;
  draggingNodeId: string | null;
  getGatewayStatus: (gwName: string) => NodeStatus;
  onToggleCollapse: () => void;
  onPointerDownNode: (nodeId: string, e: React.PointerEvent) => void;
  onSelectGateway: (id: string) => void;
  onSelectNode: (nodeId: string) => void;
}

export function InfrastructureGatewayCluster({
  collapsed,
  activeGatewayId,
  onlineGatewayCount,
  isNodeDimmed,
  nodePositions,
  draggingNodeId,
  getGatewayStatus,
  onToggleCollapse,
  onPointerDownNode,
  onSelectGateway,
  onSelectNode,
}: InfrastructureGatewayClusterProps) {
  if (collapsed) {
    const hubPos = nodePositions["gw-cluster"] || { x: COLLAPSED_HUB_X, y: COLLAPSED_HUB_Y };
    const isDragging = draggingNodeId === "gw-cluster";

    return (
      <button
        onPointerDown={(e) => onPointerDownNode("gw-cluster", e)}
        aria-pressed={false}
        aria-expanded={false}
        style={{ left: hubPos.x, top: hubPos.y }}
        className={cn(
          "absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-mono font-semibold cursor-grab active:cursor-grabbing whitespace-nowrap select-none z-20 touch-none",
          "bg-gradient-to-b from-[#181d28] via-[#121620] to-[#0c0f17] dark:from-[#181d28] dark:via-[#121620] dark:to-[#0c0f17]",
          "border-primary/60 text-primary shadow-[0_0_18px_rgba(38,230,161,0.3),inset_0_1px_0_0_rgba(38,230,161,0.3)]",
          !isDragging && "transition-transform duration-150 hover:scale-[1.04]",
          isDragging && "cursor-grabbing scale-110 shadow-[0_0_28px_rgba(38,230,161,0.6)] z-50 ring-2 ring-primary/60"
        )}
      >
        <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)] animate-pulse flex-shrink-0 ring-2 ring-black/40" />
        <span className="text-[11px] font-bold">Go Gateways</span>
        <span className="text-[9px] text-muted-foreground font-mono font-normal">
          +{GATEWAY_MATRIX.length} expand
        </span>
        <ChevronRight
          className="h-3.5 w-3.5 text-primary animate-pulse hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
        />
      </button>
    );
  }

  return (
    <>
      <div
        style={{ left: CLUSTER_FRAME_X + 16, top: CLUSTER_FRAME_Y + 12 }}
        className="absolute z-20 flex items-center justify-between w-[312px] select-none pointer-events-auto"
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)] animate-pulse" />
          <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase">
            GO GATEWAYS CLUSTER
          </span>
        </div>

        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-[9px] font-mono font-semibold transition-all cursor-pointer shadow-sm"
          title="Collapse cluster back to hub node"
        >
          <span>{onlineGatewayCount}/9 Active</span>
          <X className="h-3 w-3 ml-0.5" />
        </button>
      </div>

      {GATEWAY_MATRIX.map((gw, idx) => {
        const isAct = activeGatewayId === gw.id;
        const isDragging = draggingNodeId === gw.id;
        const dimmed = isNodeDimmed(gw.id);
        const GwIcon = gw.icon;
        const gwStatus = getGatewayStatus(gw.gatewayName);
        const isOnline = gwStatus === "healthy";
        const dotCls = isOnline
          ? "bg-primary shadow-[0_0_6px_var(--primary)]"
          : "bg-rose-500 shadow-[0_0_6px_#f43f5e]";
        const pos = nodePositions[gw.id] || { x: gw.x, y: gw.y };

        return (
          <button
            key={gw.id}
            onPointerDown={(e) => onPointerDownNode(gw.id, e)}
            style={{
              left: pos.x,
              top: pos.y,
              animationDelay: `${idx * 20}ms`,
            }}
            aria-pressed={isAct}
            className={cn(
              "absolute flex items-center justify-between gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-mono cursor-grab active:cursor-grabbing whitespace-nowrap -translate-x-1/2 -translate-y-1/2 select-none z-30 touch-none animate-fade-in-scale",
              "w-[120px]",
              "bg-gradient-to-b from-[#181d28] via-[#121620] to-[#0c0f17] dark:from-[#181d28] dark:via-[#121620] dark:to-[#0c0f17]",
              "border-[#262e3f] dark:border-white/10 shadow-[0_4px_14px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.1)] text-foreground/90 hover:border-primary/60",
              !isDragging && "hover:scale-[1.04]",
              isAct &&
                "border-primary bg-gradient-to-b from-[#152a22] to-[#0a1813] text-primary shadow-[0_0_18px_rgba(38,230,161,0.35),inset_0_1px_0_0_rgba(38,230,161,0.3)] scale-105 z-40 font-bold",
              isDragging &&
                "cursor-grabbing border-primary shadow-[0_0_24px_rgba(38,230,161,0.55)] scale-110 z-50 ring-2 ring-primary/60",
              !isOnline && "border-rose-500/30 opacity-70",
              dimmed && !isDragging && "opacity-15 hover:opacity-100"
            )}
          >
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", dotCls)} />
              <span className="truncate font-semibold tracking-tight">{gw.name}</span>
            </div>

            <GwIcon
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                isAct ? "text-primary" : "text-muted-foreground/50",
                !isOnline && "text-rose-400/70"
              )}
            />
          </button>
        );
      })}
    </>
  );
}

interface InfrastructureSubNodesProps {
  activeNode: string | null;
  activeSubNodes: SubNode[];
  nodePositions: Record<string, { x: number; y: number }>;
}

export function InfrastructureSubNodes({
  activeNode,
  activeSubNodes,
  nodePositions,
}: InfrastructureSubNodesProps) {
  if (!activeNode || activeNode === "gw-cluster") return null;

  const parentPos = nodePositions[activeNode] || STAGE_NODE_POSITIONS[activeNode];
  if (!parentPos) return null;

  return (
    <>
      {activeSubNodes.map((sub) => {
        const SubIcon = sub.icon;
        return (
          <div
            key={sub.id}
            style={{ left: parentPos.x + sub.xOffset, top: parentPos.y + sub.yOffset }}
            className="absolute z-30 flex items-center gap-1.5 rounded-md border border-primary/50 bg-gradient-to-b from-[#181d28] via-[#121620] to-[#0c0f17] px-2 py-0.5 shadow-[0_6px_16px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(38,230,161,0.3)] animate-fade-in-scale -translate-x-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none"
            title={sub.details}
          >
            <SubIcon className="h-3 w-3 text-primary flex-shrink-0" />
            <span className="text-[8px] font-mono font-bold text-foreground tracking-wide uppercase select-none">
              {sub.name}
            </span>
          </div>
        );
      })}
    </>
  );
}
