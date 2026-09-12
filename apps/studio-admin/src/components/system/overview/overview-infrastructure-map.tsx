import { useState, useMemo, useCallback } from "react";
import { Button, Card } from "@k2net/ui";
import {
  Minimize2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { ServiceNode } from "./overview-types";
import { MapDetailPanel } from "./map-detail-panel";
import type { GatewayServiceStatus } from "@/lib/actions/gateways";
import {
  GATEWAY_MATRIX,
  COLLAPSED_HUB_X,
  COLLAPSED_HUB_Y,
  CLUSTER_FRAME_X,
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

export type { GatewayMatrixNode } from "./overview-infrastructure-constants";

interface OverviewInfrastructureMapProps {
  serviceNodes: ServiceNode[];
  activeNode: string | null;
  onSelectNode: (nodeId: string) => void;
  activeNodeData: ServiceNode | null;
  gateways: GatewayServiceStatus[];
}

function MapToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onResetAll,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onResetAll: () => void;
}) {
  return (
    <div className="flex justify-between items-start z-20 pointer-events-none">
      <div>
        <h4 className="text-sm font-semibold text-foreground pointer-events-auto">
          Infrastructure Dependency Map
        </h4>
        <p className="mt-0.5 text-[10px] text-muted-foreground pointer-events-auto">
          3-Tier Enterprise SaaS Architecture. Traffic flows Edge ➔ Core/AI ➔ Storage ➔ Microservices.
        </p>
      </div>
      <div className="flex items-center gap-1 bg-popover/90 border border-border rounded-lg p-1 pointer-events-auto shadow-xl">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={onZoomIn}
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <span className="text-[9px] font-mono font-bold text-muted-foreground px-1">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={onZoomOut}
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <div className="w-[1px] h-3 bg-border mx-0.5" />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={onResetZoom}
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
        <div className="w-[1px] h-3 bg-border mx-0.5" />
        <Button
          variant="ghost"
          className="h-6 px-2 text-[9px] font-medium text-muted-foreground hover:text-foreground gap-1"
          onClick={onResetAll}
        >
          <Minimize2 className="h-3 w-3" />
          <span>Reset</span>
        </Button>
      </div>
    </div>
  );
}

export function OverviewInfrastructureMap({
  serviceNodes,
  activeNode,
  onSelectNode,
  activeNodeData,
  gateways,
}: OverviewInfrastructureMapProps) {
  const [zoom, setZoom] = useState(1);
  const [collapsed, setCollapsed] = useState(true);
  const [activeGatewayId, setActiveGatewayId] = useState<string | null>(null);

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

  const toggleCollapse = () => {
    setCollapsed((val) => !val);
    if (!collapsed) setActiveGatewayId(null);
  };

  const onlineGatewayCount = useMemo(
    () => GATEWAY_MATRIX.filter((gw) => gateways.find((g) => g.name === gw.gatewayName)?.active).length,
    [gateways]
  );

  const incomingDataCables = useMemo(() => {
    if (collapsed) {
      return [
        {
          id: "postgres-hub-col",
          path: `M 420 165 C 500 165, 540 250, ${COLLAPSED_HUB_X - 60} ${COLLAPSED_HUB_Y}`,
          speed: "normal" as const,
        },
        {
          id: "redis-hub-col",
          path: `M 420 335 C 500 335, 540 250, ${COLLAPSED_HUB_X - 60} ${COLLAPSED_HUB_Y}`,
          speed: "slow" as const,
        },
      ];
    }
    return [
      {
        id: "postgres-hub-exp",
        path: `M 420 165 C 480 165, 510 165, ${CLUSTER_FRAME_X} 165`,
        speed: "normal" as const,
      },
      {
        id: "redis-hub-exp",
        path: `M 420 335 C 480 335, 510 335, ${CLUSTER_FRAME_X} 335`,
        speed: "slow" as const,
      },
    ];
  }, [collapsed]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="flex flex-col justify-start border-border bg-card p-6 lg:col-span-2 relative select-none overflow-hidden h-full min-h-[540px]">
        <MapToolbar
          zoom={zoom}
          onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 1.3))}
          onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.7))}
          onResetZoom={() => setZoom(1)}
          onResetAll={() => {
            onSelectNode("");
            setActiveGatewayId(null);
          }}
        />

        {/* Viewport Canvas Stage */}
        <div className="relative mt-4 flex-1 w-full overflow-hidden rounded-xl border border-border/30 bg-[hsl(var(--card))] min-h-[460px] flex items-center justify-center">
          <div
            className="absolute inset-0 z-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.25) 1px, transparent 1px)",
              backgroundSize: `${16 * zoom}px ${16 * zoom}px`,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none z-0 opacity-30"
            style={{
              background: "radial-gradient(circle at 75% 50%, rgba(38, 230, 161, 0.12), transparent 45%)",
            }}
          />

          <div
            className="relative w-[920px] h-[500px] transform-gpu transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
          >
            <InfrastructureSvg
              statusMap={statusMap}
              isNodeDimmed={isNodeDimmed}
              incomingDataCables={incomingDataCables}
              collapsed={collapsed}
            />

            <InfrastructureTierNodes
              activeNode={activeNode}
              statusMap={statusMap}
              isNodeDimmed={isNodeDimmed}
              onSelectNode={onSelectNode}
              onSelectGateway={setActiveGatewayId}
            />

            <InfrastructureGatewayCluster
              collapsed={collapsed}
              activeGatewayId={activeGatewayId}
              onlineGatewayCount={onlineGatewayCount}
              isNodeDimmed={isNodeDimmed}
              getGatewayStatus={getGatewayStatus}
              onToggleCollapse={toggleCollapse}
              onSelectGateway={setActiveGatewayId}
              onSelectNode={onSelectNode}
            />

            <InfrastructureSubNodes
              activeNode={activeNode}
              activeSubNodes={activeSubNodes}
            />
          </div>
        </div>
      </Card>

      <MapDetailPanel activeNodeData={activeSelectedServiceNode} activeSubNodes={activeSubNodes} />
    </div>
  );
}
