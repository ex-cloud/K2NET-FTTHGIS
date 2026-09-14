import { useState, useMemo, useCallback, useRef } from "react";
import { Button, Card } from "@k2net/ui";
import {
  Minimize2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Move,
} from "lucide-react";
import type { ServiceNode } from "./overview-types";
import { MapDetailPanel } from "./map-detail-panel";
import type { GatewayServiceStatus } from "@/lib/actions/gateways";
import {
  GATEWAY_MATRIX,
  DEFAULT_NODE_POSITIONS,
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
        <h4 className="text-sm font-semibold text-foreground pointer-events-auto flex items-center gap-2">
          <span>Infrastructure Dependency Map</span>
        </h4>
        <p className="mt-0.5 text-[10px] text-muted-foreground pointer-events-auto">
          3-Tier Enterprise SaaS Architecture. Traffic flows Edge ➔ Core/AI ➔ Storage ➔ Microservices.
        </p>
      </div>
      <div className="flex items-center gap-1 bg-popover/90 border border-border rounded-lg p-1 pointer-events-auto shadow-xl">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={onZoomIn}
          title="Zoom In (+)"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <span className="text-[9px] font-mono font-bold text-muted-foreground px-1 select-none">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={onZoomOut}
          title="Zoom Out (-)"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <div className="w-[1px] h-3 bg-border mx-0.5" />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={onResetZoom}
          title="Reset Zoom (100%)"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
        <div className="w-[1px] h-3 bg-border mx-0.5" />
        <Button
          variant="ghost"
          className="h-6 px-2 text-[9px] font-medium text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
          onClick={onResetAll}
          title="Reset View & Node Positions"
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
  // Canvas Viewport Transformation (Pan & Zoom)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);

  // Draggable Node Positions
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>(DEFAULT_NODE_POSITIONS);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const nodeDragRef = useRef<{
    nodeId: string;
    clientX: number;
    clientY: number;
    origX: number;
    origY: number;
    hasMoved: boolean;
  } | null>(null);

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

  // ── Canvas Panning Event Handlers ──────────────────────────────────────────
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag canvas with primary click on empty canvas area
    if (e.button !== 0 || nodeDragRef.current) return;
    
    // Ignore clicks on buttons, links, or other interactive elements
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("[role='button']")) {
      return;
    }

    panStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    setIsPanning(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Safe ignore
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Handle Node Dragging
    if (nodeDragRef.current) {
      const { nodeId, clientX, clientY, origX, origY } = nodeDragRef.current;
      const deltaX = (e.clientX - clientX) / zoom;
      const deltaY = (e.clientY - clientY) / zoom;

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        nodeDragRef.current.hasMoved = true;
      }

      if (nodeDragRef.current.hasMoved) {
        const newX = Math.round(Math.max(20, Math.min(900, origX + deltaX)));
        const newY = Math.round(Math.max(20, Math.min(480, origY + deltaY)));
        setNodePositions((prev) => ({
          ...prev,
          [nodeId]: { x: newX, y: newY },
        }));
      }
      return;
    }

    // Handle Canvas Viewport Panning
    if (panStartRef.current && isPanning) {
      const deltaX = e.clientX - panStartRef.current.clientX;
      const deltaY = e.clientY - panStartRef.current.clientY;
      setPan({
        x: Math.round(panStartRef.current.panX + deltaX),
        y: Math.round(panStartRef.current.panY + deltaY),
      });
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    // Release Node Drag
    if (nodeDragRef.current) {
      const { nodeId, hasMoved } = nodeDragRef.current;
      nodeDragRef.current = null;
      setDraggingNodeId(null);

      // If user clicked without dragging, select node
      if (!hasMoved) {
        if (nodeId === "gw-cluster") {
          toggleCollapse();
        } else if (nodeId.startsWith("gw-")) {
          setActiveGatewayId(nodeId);
          onSelectNode("gw-cluster");
        } else {
          onSelectNode(nodeId);
          setActiveGatewayId(null);
        }
      }
      return;
    }

    // Release Canvas Panning
    if (panStartRef.current) {
      panStartRef.current = null;
      setIsPanning(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Safe ignore
      }
    }
  };

  // ── Node Dragging Initiator ────────────────────────────────────────────────
  const handleNodePointerDown = (nodeId: string, e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    const currentPos = nodePositions[nodeId] || DEFAULT_NODE_POSITIONS[nodeId] || { x: 0, y: 0 };
    nodeDragRef.current = {
      nodeId,
      clientX: e.clientX,
      clientY: e.clientY,
      origX: currentPos.x,
      origY: currentPos.y,
      hasMoved: false,
    };
    setDraggingNodeId(nodeId);
  };

  // ── Mouse Wheel Zooming ───────────────────────────────────────────────────
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((z) => Math.min(Math.max(Number((z + zoomDelta).toFixed(2)), 0.5), 1.8));
  };

  const handleResetAll = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setNodePositions(DEFAULT_NODE_POSITIONS);
    onSelectNode("");
    setActiveGatewayId(null);
  };

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

        {/* Viewport Canvas Stage (Interactive Panning & Zooming) */}
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

          {/* Bottom helper pill */}
          <div className="absolute bottom-3 left-3 z-20 pointer-events-none flex items-center gap-1.5 rounded-full border border-border/40 bg-popover/80 px-2.5 py-1 text-[9px] font-mono text-muted-foreground backdrop-blur-sm shadow-sm">
            <Move className="h-3 w-3 text-primary animate-pulse" />
            <span>Drag canvas to pan • Scroll to zoom • Drag nodes to move</span>
          </div>
        </div>
      </Card>

      <MapDetailPanel activeNodeData={activeSelectedServiceNode} activeSubNodes={activeSubNodes} />
    </div>
  );
}
