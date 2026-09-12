import React, { useEffect, useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Card } from "@k2net/ui";
import { getKnowledgeGraphData, type KnowledgeGraphData } from "@/lib/actions/gateways";
import { toast } from "sonner";
import {
  type SimNode,
  type SimLink,
  updatePhysicsStep,
  drawGraphEdges,
  drawSingleNode,
  GraphStatsBadge,
  GraphNodeInspector,
  GraphToolbar,
} from "./knowledge/GraphSubcomponents";
import { useGraphInteractions } from "./knowledge/useGraphInteractions";

interface AiKnowledgeGraphTabProps {
  onTestSimulator?: (title: string) => void;
  onOpenExplorer?: () => void;
}

export function AiKnowledgeGraphTab({
  onTestSimulator,
  onOpenExplorer: _onOpenExplorer,
}: AiKnowledgeGraphTabProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<SimNode | null>(null);

  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const {
    transformRef,
    dragNodeRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
  } = useGraphInteractions({
    canvasRef,
    nodesRef,
    setSelectedNode,
    setHoveredNode,
  });

  const loadGraph = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getKnowledgeGraphData();
      setGraphData(data);

      const width = containerRef.current?.clientWidth || 900;
      const height = containerRef.current?.clientHeight || 600;
      const centerX = width / 2;
      const centerY = height / 2;

      const simNodes: SimNode[] = data.nodes.map((n, i) => {
        const angle = (i / data.nodes.length) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;
        const radius = 120 + Math.random() * 220;
        return {
          ...n,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
        };
      });

      nodesRef.current = simNodes;
      linksRef.current = data.links as SimLink[];
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memuat graph data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  const runSimulationStep = useCallback(() => {
    const width = containerRef.current?.clientWidth || 900;
    const height = containerRef.current?.clientHeight || 600;
    updatePhysicsStep(nodesRef.current, linksRef.current, width, height, dragNodeRef.current);
  }, [dragNodeRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;
      const width = containerRef.current?.clientWidth || 900;
      const height = containerRef.current?.clientHeight || 600;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const { x: panX, y: panY, k: zoom } = transformRef.current;
      ctx.translate(panX, panY);
      ctx.scale(zoom, zoom);

      runSimulationStep();

      const nodes = nodesRef.current;
      const links = linksRef.current;
      const nodeMap = new Map<string, SimNode>();
      nodes.forEach((n) => nodeMap.set(n.id, n));

      const hovered = hoveredNode;
      const connectedNodeIds = new Set<string>();
      if (hovered) {
        connectedNodeIds.add(hovered.id);
        links.forEach((l) => {
          const sId = typeof l.source === "string" ? l.source : l.source.id;
          const tId = typeof l.target === "string" ? l.target : l.target.id;
          if (sId === hovered.id) connectedNodeIds.add(tId);
          if (tId === hovered.id) connectedNodeIds.add(sId);
        });
      }

      drawGraphEdges(ctx, links, nodeMap, hovered);

      const query = searchQuery.trim().toLowerCase();
      for (let i = 0; i < nodes.length; i++) {
        drawSingleNode({
          ctx,
          n: nodes[i],
          hovered,
          connectedNodeIds,
          filterCat: selectedCategory,
          query,
          zoom,
        });
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [runSimulationStep, hoveredNode, selectedCategory, searchQuery, transformRef]);

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-280px)] min-h-[580px]">
      <GraphToolbar
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onZoomIn={() => (transformRef.current.k = Math.min(transformRef.current.k * 1.2, 3.5))}
        onZoomOut={() => (transformRef.current.k = Math.max(transformRef.current.k * 0.8, 0.3))}
        onResetZoom={() => (transformRef.current.k = 1)}
      />

      <Card className="flex-1 min-h-0 border-border bg-[#0d1117] rounded-xl overflow-hidden relative shadow-inner flex flex-col">
        <div 
          ref={containerRef} 
          className="w-full h-full relative cursor-grab active:cursor-grabbing flex-1"
        >
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d1117]/80 z-20 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-mono">
                Menghitung matriks kemiripan semantik pgvector...
              </p>
            </div>
          )}

          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            className="w-full h-full block"
          />

          <GraphStatsBadge stats={graphData?.stats} />

          {selectedNode && (
            <GraphNodeInspector
              selectedNode={selectedNode}
              onClose={() => setSelectedNode(null)}
              onTestSimulator={onTestSimulator}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
