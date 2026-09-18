import { useState, useMemo, useCallback, useEffect } from "react";

import { Card } from "@k2net/ui";
import { Move } from "lucide-react";
import type { ServiceNode } from "./overview-types";
import { MapDetailPanel } from "./map-detail-panel";
import type { GatewayServiceStatus } from "@/lib/actions/gateways";
import {
  GATEWAY_MATRIX,
  STAGE_EDGES,
  subNodesMap,
  type NodeStatus,
} from "./overview-infrastructure-constants";
import { InfrastructureSvg } from "./overview-infrastructure-svg";
import {
  InfrastructureTierNodes,
  InfrastructureGatewayCluster,
  InfrastructureSubNodes,
} from "./overview-infrastructure-nodes";
import { MapToolbar } from "./overview-map-toolbar";
import { useInfrastructureCanvas } from "./useInfrastructureCanvas";

export type { GatewayMatrixNode } from "./overview-infrastructure-constants";

interface OverviewInfrastructureMapProps {
  serviceNodes: ServiceNode[];
  activeNode: string | null;
  onSelectNode: (nodeId: string) => void;
  activeNodeData: ServiceNode | null;
  gateways: GatewayServiceStatus[];
}

export function OverviewInfrastructureMap({
  serviceNodes,
  activeNode,
  onSelectNode,
  activeNodeData,
  gateways,
}: OverviewInfrastructureMapProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [activeGatewayId, setActiveGatewayId] = useState<string | null>(null);

  const toggleCollapse = () => {
    setCollapsed((val) => !val);
    if (!collapsed) setActiveGatewayId(null);
  };

  const {
    zoom,
    setZoom,
    pan,
    isPanning,
    nodePositions,
    draggingNodeId,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    handleNodePointerDown,
    handleWheel,
    handleResetAll,
  } = useInfrastructureCanvas(onSelectNode, setActiveGatewayId, toggleCollapse);

  // Auto-fit initial zoom for mobile screens (< 640px) so the full 3-tier
  // architecture diagram is visible without panning on first load.
  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    if (isMobile) {
      setZoom(0.6);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const statusMap = useMemo<Record<string, NodeStatus>>(() => {
    const map: Record<string, NodeStatus> = {};
    for (const n of serviceNodes) {
      map[n.id] = n.status;
    }
    return map;
  }, [serviceNodes]);

  const getGatewayStatus = useCallback(
    (gwName: string): NodeStatus =>
      gateways.find((g) => g.name === gwName)?.active ? "healthy" : "error",
    [gateways]
  );

  const activeGwNode = useMemo(
    () => (activeGatewayId ? GATEWAY_MATRIX.find((g) => g.id === activeGatewayId) ?? null : null),
    [activeGatewayId]
  );

  const activeSelectedServiceNode = useMemo<ServiceNode | null>(() => {
    if (!activeGwNode) return activeNodeData;
    const gw = gateways.find((g) => g.name === activeGwNode.gatewayName);
    const status = getGatewayStatus(activeGwNode.gatewayName);
    return {
      id: activeGwNode.id,
      name: `${activeGwNode.name} Gateway`,
      type: "gateway",
      status,
      port: activeGwNode.port,
      details: `Go microservice gateway handling ${activeGwNode.name.toLowerCase()} operations. Routes requests from Kong API Gateway through Redis/PostgreSQL.`,
      metrics: {
        Throughput: `${gw?.throughput ?? 0} req/min`,
        Latency: `${gw?.latency ?? 0} ms`,
        Status: gw?.active ? "Online" : "Offline",
      },
      x: 0,
      y: 0,
    };
  }, [activeGwNode, activeNodeData, gateways, getGatewayStatus]);

  const activeSubNodes = useMemo(() => {
    if (!activeNode || activeNode === "gw-cluster") return [];
    return subNodesMap[activeNode] || [];
  }, [activeNode]);

  const selectedServices = useMemo(() => {
    if (!activeNode) return null;
    const connected = new Set<string>([activeNode]);
    STAGE_EDGES.forEach((e) => {
      if (e.from === activeNode) connected.add(e.to);
      if (e.to === activeNode) connected.add(e.from);
    });
    return connected;
  }, [activeNode]);

  const isNodeDimmed = useCallback(
    (id: string) => Boolean(selectedServices && !selectedServices.has(id)),
    [selectedServices]
  );

  const onlineGatewayCount = useMemo(
    () => GATEWAY_MATRIX.filter((gw) => gateways.find((g) => g.name === gw.gatewayName)?.active).length,
    [gateways]
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="flex flex-col justify-start border-border bg-card p-6 lg:col-span-2 relative select-none overflow-hidden h-full min-h-[540px]">
        <MapToolbar
          zoom={zoom}
          onZoomIn={() => setZoom((z) => Math.min(Number((z + 0.15).toFixed(2)), 1.8))}
          onZoomOut={() => setZoom((z) => Math.max(Number((z - 0.15).toFixed(2)), 0.5))}
          onResetZoom={() => setZoom(1)}
          onResetAll={handleResetAll}
        />

        {/* Viewport Canvas Stage */}
        <div
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={handleCanvasPointerUp}
          onWheel={handleWheel}
          className={`relative mt-4 flex-1 w-full overflow-hidden rounded-xl border border-border/30 bg-[hsl(var(--card))] min-h-[460px] flex items-center justify-center touch-none select-none ${
            isPanning ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)",
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            className="absolute inset-0 pointer-events-none z-0 opacity-25"
            style={{
              background: `radial-gradient(circle at calc(50% + ${pan.x}px) calc(50% + ${pan.y}px), rgba(38, 230, 161, 0.15), transparent 50%)`,
            }}
          />

          {/* Interactive Transform Canvas Layer */}
          <div
            className="relative w-[920px] h-[500px] transform-gpu will-change-transform"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            <InfrastructureSvg
              statusMap={statusMap}
              isNodeDimmed={isNodeDimmed}
              nodePositions={nodePositions}
              collapsed={collapsed}
              activeGatewayId={activeGatewayId}
            />

            <InfrastructureTierNodes
              activeNode={activeNode}
              statusMap={statusMap}
              isNodeDimmed={isNodeDimmed}
              nodePositions={nodePositions}
              draggingNodeId={draggingNodeId}
              onPointerDownNode={handleNodePointerDown}
              onSelectNode={onSelectNode}
              onSelectGateway={setActiveGatewayId}
            />

            <InfrastructureGatewayCluster
              collapsed={collapsed}
              activeGatewayId={activeGatewayId}
              onlineGatewayCount={onlineGatewayCount}
              isNodeDimmed={isNodeDimmed}
              nodePositions={nodePositions}
              draggingNodeId={draggingNodeId}
              getGatewayStatus={getGatewayStatus}
              onToggleCollapse={toggleCollapse}
              onPointerDownNode={handleNodePointerDown}
              onSelectGateway={setActiveGatewayId}
              onSelectNode={onSelectNode}
            />

            <InfrastructureSubNodes
              activeNode={activeNode}
              activeSubNodes={activeSubNodes}
              nodePositions={nodePositions}
            />
          </div>

          {/* Bottom helper pill — compact on mobile */}
          <div className="absolute bottom-3 left-3 z-20 pointer-events-none flex items-center gap-1.5 rounded-full border border-border/40 bg-popover/80 px-2.5 py-1 text-[9px] font-mono text-muted-foreground backdrop-blur-sm shadow-sm">
            <Move className="h-3 w-3 text-primary animate-pulse" />
            <span className="hidden sm:inline">Drag canvas to pan • Scroll to zoom • Drag nodes to move</span>
            <span className="sm:hidden">Pan · Pinch/Scroll to zoom</span>
          </div>
        </div>
      </Card>

      <MapDetailPanel activeNodeData={activeSelectedServiceNode} activeSubNodes={activeSubNodes} />
    </div>
  );
}
