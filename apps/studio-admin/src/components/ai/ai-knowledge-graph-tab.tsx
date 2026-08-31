

import React, { useEffect, useRef, useState, useCallback } from "react";
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sparkles, 
  BrainCircuit, 
  Maximize2, 
  Layers, 
  HelpCircle, 
  FlaskConical, 
  Loader2,
  FileText,
  Search,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, Button, Badge, Input } from "@k2net/ui";
import { getKnowledgeGraphData, KnowledgeGraphData } from "@/lib/actions/gateways";
import { CATEGORIES } from "./types";
import { toast } from "sonner";

interface AiKnowledgeGraphTabProps {
  onTestSimulator?: (title: string) => void;
  onOpenExplorer?: () => void;
}

interface SimNode {
  id: string;
  label: string;
  title: string;
  category: string;
  chunk_count: number;
  file_size_bytes: number;
  vendor: string;
  status: string;
  degree: number;
  group: number;
  val: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface SimLink {
  source: string;
  target: string;
  similarity: number;
  value: number;
  relation: string;
}

const CATEGORY_COLORS: Record<string, { main: string; glow: string }> = {
  TROUBLESHOOTING: { main: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)" }, // Amber
  NETWORK_CONFIG: { main: "#3b82f6", glow: "rgba(59, 130, 246, 0.4)" },  // Blue
  GIS_MANUAL: { main: "#10b981", glow: "rgba(16, 185, 129, 0.4)" },      // Emerald
  INFRASTRUCTURE: { main: "#a855f7", glow: "rgba(168, 85, 247, 0.4)" },  // Purple
  PLANS: { main: "#06b6d4", glow: "rgba(6, 182, 212, 0.4)" },            // Cyan
  GENERAL: { main: "#94a3b8", glow: "rgba(148, 163, 184, 0.3)" },        // Slate/Zinc
};

export function AiKnowledgeGraphTab({
  onTestSimulator,
  onOpenExplorer,
}: AiKnowledgeGraphTabProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<SimNode | null>(null);

  // Physics simulation refs
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const isDraggingRef = useRef(false);
  const dragNodeRef = useRef<SimNode | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);

  // ── Load Real Graph Data from PostgreSQL pgvector ─────────────────────────
  const loadGraph = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getKnowledgeGraphData();
      setGraphData(data);

      // Initialize Node Physics Positions in a radial cluster
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

  // ── Physics Simulation Step (60 FPS Force-Directed Graph) ─────────────────
  const runSimulationStep = useCallback(() => {
    const nodes = nodesRef.current;
    const links = linksRef.current;
    if (!nodes.length) return;

    const width = containerRef.current?.clientWidth || 900;
    const height = containerRef.current?.clientHeight || 600;
    const cx = width / 2;
    const cy = height / 2;

    const nodeMap = new Map<string, SimNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    // 1. Center Gravitation Force
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const dx = cx - n.x;
      const dy = cy - n.y;
      n.vx += dx * 0.0006;
      n.vy += dy * 0.0006;
    }

    // 2. Node-to-Node Repulsion Force (Coulomb's Law)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const distSq = dx * dx + dy * dy || 1;
        const dist = Math.sqrt(distSq);

        if (dist < 320) {
          const force = 180 / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          n1.vx -= fx;
          n1.vy -= fy;
          n2.vx += fx;
          n2.vy += fy;
        }
      }
    }

    // 3. Link Spring Attraction Force (Hooke's Law)
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const sourceId = typeof link.source === "string" ? link.source : (link.source as any).id;
      const targetId = typeof link.target === "string" ? link.target : (link.target as any).id;

      const src = nodeMap.get(sourceId);
      const tgt = nodeMap.get(targetId);
      if (!src || !tgt) continue;

      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const desiredDist = 90 / (link.similarity || 0.6);
      const diff = dist - desiredDist;
      const force = diff * 0.008;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      src.vx += fx;
      src.vy += fy;
      tgt.vx -= fx;
      tgt.vy -= fy;
    }

    // 4. Apply Velocities & Velocity Damping
    const friction = 0.88;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (dragNodeRef.current === n) continue;

      n.vx *= friction;
      n.vy *= friction;
      n.x += n.vx;
      n.y += n.vy;
    }
  }, []);

  // ── Canvas Render Loop (High-DPI Retina Canvas) ───────────────────────────
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

      // Apply Pan & Zoom Transform
      const { x: panX, y: panY, k: zoom } = transformRef.current;
      ctx.translate(panX, panY);
      ctx.scale(zoom, zoom);

      // Run 1 simulation tick
      runSimulationStep();

      const nodes = nodesRef.current;
      const links = linksRef.current;
      const nodeMap = new Map<string, SimNode>();
      nodes.forEach((n) => nodeMap.set(n.id, n));

      const hovered = hoveredNode;
      const filterCat = selectedCategory;
      const query = searchQuery.trim().toLowerCase();

      // Set of connected neighbor IDs to highlighted node
      const connectedNodeIds = new Set<string>();
      if (hovered) {
        connectedNodeIds.add(hovered.id);
        links.forEach((l) => {
          const sId = typeof l.source === "string" ? l.source : (l.source as any).id;
          const tId = typeof l.target === "string" ? l.target : (l.target as any).id;
          if (sId === hovered.id) connectedNodeIds.add(tId);
          if (tId === hovered.id) connectedNodeIds.add(sId);
        });
      }

      // ── Draw Edges (Links) ────────────────────────────────────────────────
      ctx.lineWidth = 1;
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const sId = typeof link.source === "string" ? link.source : (link.source as any).id;
        const tId = typeof link.target === "string" ? link.target : (link.target as any).id;

        const src = nodeMap.get(sId);
        const tgt = nodeMap.get(tId);
        if (!src || !tgt) continue;

        const isHighlighted = hovered && (sId === hovered.id || tId === hovered.id);
        const isDimmed = hovered && !isHighlighted;

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);

        if (isHighlighted) {
          ctx.strokeStyle = "rgba(16, 185, 129, 0.85)";
          ctx.lineWidth = 2.2;
        } else if (isDimmed) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
          ctx.lineWidth = 0.6;
        } else {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
          ctx.lineWidth = 0.8;
        }
        ctx.stroke();
      }

      // ── Draw Nodes ────────────────────────────────────────────────────────
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const colors = CATEGORY_COLORS[n.category] || CATEGORY_COLORS.GENERAL;
        const isHovered = hovered?.id === n.id;
        const isConnected = connectedNodeIds.has(n.id);
        const isCategoryMatch = filterCat === "ALL" || n.category === filterCat;
        const isSearchMatch = !query || n.title.toLowerCase().includes(query) || n.vendor.toLowerCase().includes(query);

        const isDimmed = (hovered && !isConnected) || !isCategoryMatch || !isSearchMatch;
        const radius = isHovered ? n.val * 1.4 : n.val;

        // Draw Outer Glow for Hub Nodes
        if (!isDimmed && (isHovered || n.degree >= 4)) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius + (isHovered ? 8 : 4), 0, 2 * Math.PI);
          ctx.fillStyle = colors.glow;
          ctx.fill();
        }

        // Draw Main Node Circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = isDimmed ? "rgba(100, 116, 139, 0.25)" : colors.main;
        ctx.fill();

        // Node Border
        ctx.lineWidth = isHovered ? 2.5 : 1;
        ctx.strokeStyle = isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.35)";
        ctx.stroke();

        // Draw Node Labels for Major Nodes or when Zoomed In
        if (!isDimmed && (zoom > 0.8 || isHovered || isConnected || n.val > 10)) {
          ctx.font = `${isHovered ? "bold 11px" : "10px"} -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          ctx.fillStyle = isHovered ? "#ffffff" : "rgba(226, 232, 240, 0.85)";
          ctx.textAlign = "center";
          ctx.fillText(n.label, n.x, n.y + radius + 13);
        }
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [runSimulationStep, hoveredNode, selectedCategory, searchQuery]);

  // ── Mouse & Pan Interaction Handlers ──────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const { x: panX, y: panY, k: zoom } = transformRef.current;
    const worldX = (clientX - panX) / zoom;
    const worldY = (clientY - panY) / zoom;

    // Check if clicked on a node
    const nodes = nodesRef.current;
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
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const { x: panX, y: panY, k: zoom } = transformRef.current;

    // Handle Pan
    if (isDraggingRef.current) {
      transformRef.current.x = e.clientX - dragStartRef.current.x;
      transformRef.current.y = e.clientY - dragStartRef.current.y;
      return;
    }

    // Handle Node Drag
    if (dragNodeRef.current) {
      const worldX = (clientX - panX) / zoom;
      const worldY = (clientY - panY) / zoom;
      dragNodeRef.current.x = worldX;
      dragNodeRef.current.y = worldY;
      dragNodeRef.current.vx = 0;
      dragNodeRef.current.vy = 0;
      return;
    }

    // Hover detection
    const worldX = (clientX - panX) / zoom;
    const worldY = (clientY - panY) / zoom;
    const nodes = nodesRef.current;
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
    const nextZoom = Math.max(0.3, Math.min(transformRef.current.k * zoomFactor, 3.5));
    transformRef.current.k = nextZoom;
  };

  const handleResetZoom = () => {
    transformRef.current = { x: 0, y: 0, k: 1 };
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-280px)] min-h-[580px]">
      {/* ── Top Filter Bar & Graph Toolbar ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border p-3.5 rounded-xl shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-xs px-3 py-1 rounded-lg border cursor-pointer font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filter node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-7 h-8 bg-background border-border"
            />
          </div>

          <div className="flex items-center bg-muted/40 border border-border rounded-lg p-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (transformRef.current.k = Math.min(transformRef.current.k * 1.2, 3.5))}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (transformRef.current.k = Math.max(transformRef.current.k * 0.8, 0.3))}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetZoom}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Main Canvas Viewport (Obsidian Universe) ───────────────────────── */}
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

          {/* ── Top-Left Graph Stats Badge ─────────────────────────────────── */}
          <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-md border border-border/80 px-3 py-2 rounded-xl text-[11px] font-mono space-y-1 shadow-md pointer-events-none">
            <div className="flex items-center gap-2 text-foreground font-bold">
              <Network className="w-3.5 h-3.5 text-primary" />
              <span>Obsidian Semantic Graph</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground text-[10px]">
              <span>Nodes: <strong className="text-primary">{graphData?.stats.total_nodes || 0}</strong></span>
              <span>Links: <strong className="text-purple-400">{graphData?.stats.total_links || 0}</strong></span>
              <span>Clusters: <strong className="text-cyan-400">{graphData?.stats.categories_count || 0}</strong></span>
            </div>
          </div>

          {/* ── Node Detail Popup / Inspector on Click ─────────────────────── */}
          {selectedNode && (
            <div className="absolute bottom-4 right-4 w-80 bg-background/95 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-2xl space-y-3 z-30 animate-in fade-in slide-in-from-bottom-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge className="text-[9px] font-mono bg-primary/10 text-primary border-primary/20">
                    {selectedNode.category}
                  </Badge>
                  <h4 className="text-xs font-bold text-foreground mt-1 leading-snug">
                    {selectedNode.title}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-muted-foreground hover:text-foreground text-xs p-1 rounded-md hover:bg-muted"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-muted/30 p-2.5 rounded-xl border border-border/60">
                <div>
                  <span className="text-muted-foreground block">Vector Chunks:</span>
                  <span className="text-purple-400 font-bold">{selectedNode.chunk_count} Chunks</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Vendor Tag:</span>
                  <span className="text-primary font-bold">{selectedNode.vendor}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">File Size:</span>
                  <span className="text-foreground">{(selectedNode.file_size_bytes / 1024).toFixed(1)} KB</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Keterhubungan:</span>
                  <span className="text-cyan-400 font-bold">{selectedNode.degree} Connections</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {onTestSimulator && (
                  <Button
                    size="sm"
                    onClick={() => onTestSimulator(selectedNode.title)}
                    className="text-xs flex-1 gap-1.5 cursor-pointer font-semibold"
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>Uji di Simulator</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
