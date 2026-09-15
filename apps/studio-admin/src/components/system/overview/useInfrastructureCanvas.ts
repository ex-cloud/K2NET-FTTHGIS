import { useState, useRef } from "react";
import { DEFAULT_NODE_POSITIONS } from "./overview-infrastructure-constants";

export function useInfrastructureCanvas(
  onSelectNode: (nodeId: string) => void,
  setActiveGatewayId: (id: string | null) => void,
  toggleCollapse: () => void
) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);

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

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || nodeDragRef.current) return;
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
    if (nodeDragRef.current) {
      const { nodeId, hasMoved } = nodeDragRef.current;
      nodeDragRef.current = null;
      setDraggingNodeId(null);

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

  return {
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
  };
}
