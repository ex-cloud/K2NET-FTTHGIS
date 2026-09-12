import { CATEGORIES } from "../types";
import { type KnowledgeGraphData } from "@/lib/actions/gateways";
import { Button, Badge, Input } from "@k2net/ui";
import { Network, ZoomIn, ZoomOut, RotateCcw, FlaskConical, Search } from "lucide-react";
import React from "react";

export interface SimNode {
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

export interface SimLink {
  source: string | { id: string };
  target: string | { id: string };
  similarity: number;
  value: number;
  relation: string;
}

export const CATEGORY_COLORS: Record<string, { main: string; glow: string }> = {
  TROUBLESHOOTING: { main: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)" },
  NETWORK_CONFIG: { main: "#3b82f6", glow: "rgba(59, 130, 246, 0.4)" },
  GIS_MANUAL: { main: "#10b981", glow: "rgba(16, 185, 129, 0.4)" },
  INFRASTRUCTURE: { main: "#a855f7", glow: "rgba(168, 85, 247, 0.4)" },
  PLANS: { main: "#06b6d4", glow: "rgba(6, 182, 212, 0.4)" },
  GENERAL: { main: "#94a3b8", glow: "rgba(148, 163, 184, 0.3)" },
};

export function updatePhysicsStep(
  nodes: SimNode[],
  links: SimLink[],
  width: number,
  height: number,
  dragNode: SimNode | null
) {
  if (!nodes.length) return;
  const cx = width / 2;
  const cy = height / 2;
  const nodeMap = new Map<string, SimNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    n.vx += (cx - n.x) * 0.0006;
    n.vy += (cy - n.y) * 0.0006;
  }

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

  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const sId = typeof link.source === "string" ? link.source : link.source.id;
    const tId = typeof link.target === "string" ? link.target : link.target.id;
    const src = nodeMap.get(sId);
    const tgt = nodeMap.get(tId);
    if (!src || !tgt) continue;

    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const desiredDist = 90 / (link.similarity || 0.6);
    const force = (dist - desiredDist) * 0.008;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    src.vx += fx;
    src.vy += fy;
    tgt.vx -= fx;
    tgt.vy -= fy;
  }

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (dragNode === n) continue;
    n.vx *= 0.88;
    n.vy *= 0.88;
    n.x += n.vx;
    n.y += n.vy;
  }
}

export function drawGraphEdges(
  ctx: CanvasRenderingContext2D,
  links: SimLink[],
  nodeMap: Map<string, SimNode>,
  hovered: SimNode | null
) {
  ctx.lineWidth = 1;
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const sId = typeof link.source === "string" ? link.source : link.source.id;
    const tId = typeof link.target === "string" ? link.target : link.target.id;
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
}

export interface DrawNodeConfig {
  ctx: CanvasRenderingContext2D;
  n: SimNode;
  hovered: SimNode | null;
  connectedNodeIds: Set<string>;
  filterCat: string;
  query: string;
  zoom: number;
}

export function drawSingleNode(config: DrawNodeConfig) {
  const { ctx, n, hovered, connectedNodeIds, filterCat, query, zoom } = config;
  const colors = CATEGORY_COLORS[n.category] || CATEGORY_COLORS.GENERAL;
  const isHovered = hovered?.id === n.id;
  const isConnected = connectedNodeIds.has(n.id);
  const isCategoryMatch = filterCat === "ALL" || n.category === filterCat;
  const isSearchMatch = !query || n.title.toLowerCase().includes(query) || n.vendor.toLowerCase().includes(query);

  const isDimmed = (hovered && !isConnected) || !isCategoryMatch || !isSearchMatch;
  const radius = isHovered ? n.val * 1.4 : n.val;

  if (!isDimmed && (isHovered || n.degree >= 4)) {
    ctx.beginPath();
    ctx.arc(n.x, n.y, radius + (isHovered ? 8 : 4), 0, 2 * Math.PI);
    ctx.fillStyle = colors.glow;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = isDimmed ? "rgba(100, 116, 139, 0.25)" : colors.main;
  ctx.fill();

  ctx.lineWidth = isHovered ? 2.5 : 1;
  ctx.strokeStyle = isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.35)";
  ctx.stroke();

  if (!isDimmed && (zoom > 0.8 || isHovered || isConnected || n.val > 10)) {
    ctx.font = `${isHovered ? "bold 11px" : "10px"} -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = isHovered ? "#ffffff" : "rgba(226, 232, 240, 0.85)";
    ctx.textAlign = "center";
    ctx.fillText(n.label, n.x, n.y + radius + 13);
  }
}

export function GraphStatsBadge({ stats }: { stats?: KnowledgeGraphData["stats"] }) {
  return (
    <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-md border border-border/80 px-3 py-2 rounded-xl text-[11px] font-mono space-y-1 shadow-md pointer-events-none">
      <div className="flex items-center gap-2 text-foreground font-bold">
        <Network className="w-3.5 h-3.5 text-primary" />
        <span>Obsidian Semantic Graph</span>
      </div>
      <div className="flex items-center gap-3 text-muted-foreground text-[10px]">
        <span>Nodes: <strong className="text-primary">{stats?.total_nodes || 0}</strong></span>
        <span>Links: <strong className="text-purple-400">{stats?.total_links || 0}</strong></span>
        <span>Clusters: <strong className="text-cyan-400">{stats?.categories_count || 0}</strong></span>
      </div>
    </div>
  );
}

export function GraphNodeInspector({
  selectedNode,
  onClose,
  onTestSimulator,
}: {
  selectedNode: SimNode;
  onClose: () => void;
  onTestSimulator?: (title: string) => void;
}) {
  return (
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
          onClick={onClose}
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
  );
}

export function GraphToolbar({
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}) {
  return (
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
            onClick={onZoomIn}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetZoom}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
