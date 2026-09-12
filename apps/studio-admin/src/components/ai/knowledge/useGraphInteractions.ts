import { useRef } from "react";
import type { SimNode } from "./GraphSubcomponents";

export interface GraphInteractionProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  nodesRef: React.RefObject<SimNode[]>;
  setSelectedNode: (node: SimNode | null) => void;
  setHoveredNode: (node: SimNode | null) => void;
}

export function useGraphInteractions({
  canvasRef,
  nodesRef,
  setSelectedNode,
  setHoveredNode,
}: GraphInteractionProps) {
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const isDraggingRef = useRef(false);
  const dragNodeRef = useRef<SimNode | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { x: panX, y: panY, k: zoom } = transformRef.current;
    const worldX = (e.clientX - rect.left - panX) / zoom;
    const worldY = (e.clientY - rect.top - panY) / zoom;

    const nodes = nodesRef.current || [];
    let clickedNode: SimNode | null = null;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = worldX - n.x;
      const dy = worldY - n.y;
      if (dx * dx + dy * dy <= (n.val + 4) * (n.val + 4)) {
        clickedNode = n;
        break;
      }
    }

    if (clickedNode) {
      dragNodeRef.current = clickedNode;
      setSelectedNode(clickedNode);
    } else {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX - panX, y: e.clientY - panY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { x: panX, y: panY, k: zoom } = transformRef.current;

    if (isDraggingRef.current) {
      transformRef.current.x = e.clientX - dragStartRef.current.x;
      transformRef.current.y = e.clientY - dragStartRef.current.y;
      return;
    }

    if (dragNodeRef.current) {
      dragNodeRef.current.x = (e.clientX - rect.left - panX) / zoom;
      dragNodeRef.current.y = (e.clientY - rect.top - panY) / zoom;
      dragNodeRef.current.vx = 0;
      dragNodeRef.current.vy = 0;
      return;
    }

    const worldX = (e.clientX - rect.left - panX) / zoom;
    const worldY = (e.clientY - rect.top - panY) / zoom;
    const nodes = nodesRef.current || [];
    let foundNode: SimNode | null = null;

    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = worldX - n.x;
      const dy = worldY - n.y;
      if (dx * dx + dy * dy <= (n.val + 6) * (n.val + 6)) {
        foundNode = n;
        break;
      }
    }
    setHoveredNode(foundNode);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    dragNodeRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    transformRef.current.k = Math.max(0.3, Math.min(transformRef.current.k * zoomFactor, 3.5));
  };

  return {
    transformRef,
    dragNodeRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
  };
}
