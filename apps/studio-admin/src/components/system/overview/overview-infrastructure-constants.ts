import type React from "react";
import {
  Activity,
  Bell,
  CalendarClock,
  ClipboardList,
  CreditCard,
  Cpu,
  Database,
  HardDrive,
  KeyRound,
  Layers,
  Lock,
  Map,
  MessageSquare,
  Network,
  Radio,
  Server,
  Upload,
  Zap,
} from "lucide-react";
import type { SubNode } from "./overview-map-types";

export interface GatewayMatrixNode {
  id: string;
  name: string;
  gatewayName: string;
  port: number;
  icon: React.ElementType;
  column: 1 | 2;
  row: number;
  x: number;
  y: number;
  category: string;
  connectsTo: string[];
}

export const GATEWAY_MATRIX: GatewayMatrixNode[] = [
  // ── Column 1: Core Business & Communication Gateways (X = 645) ──
  { id: "gw-notification", name: "Notification", gatewayName: "ftth-notification-gateway", port: 5001, icon: Bell,          column: 1, row: 1, x: 645, y: 115, category: "Messaging",      connectsTo: ["postgres-db", "redis-cache"] },
  { id: "gw-whatsapp",     name: "WhatsApp",     gatewayName: "ftth-whatsapp-gateway",     port: 5005, icon: MessageSquare, column: 1, row: 2, x: 645, y: 180, category: "Chat WABA",      connectsTo: ["redis-cache"] },
  { id: "gw-payment",      name: "Payment",      gatewayName: "ftth-payment-gateway",      port: 5002, icon: CreditCard,    column: 1, row: 3, x: 645, y: 245, category: "Fintech",        connectsTo: ["postgres-db", "keycloak-iam"] },
  { id: "gw-storage",      name: "Storage S3",   gatewayName: "ftth-storage-gateway",      port: 5004, icon: HardDrive,     column: 1, row: 4, x: 645, y: 310, category: "MinIO S3",       connectsTo: ["postgres-db"] },
  { id: "gw-map",          name: "Spatial Map",  gatewayName: "ftth-map-gateway",          port: 5003, icon: Map,           column: 1, row: 5, x: 645, y: 375, category: "GIS Geocoding",  connectsTo: ["postgres-db", "redis-cache"] },

  // ── Column 2: System & Background Workers (X = 780) ──
  { id: "gw-audit",        name: "Audit Logger", gatewayName: "ftth-audit-gateway",        port: 5009, icon: ClipboardList, column: 2, row: 1, x: 780, y: 115, category: "Security",       connectsTo: ["postgres-db"] },
  { id: "gw-scheduler",    name: "Scheduler",    gatewayName: "ftth-scheduler-gateway",    port: 5006, icon: CalendarClock, column: 2, row: 2, x: 780, y: 180, category: "Cron Automation",connectsTo: ["postgres-db"] },
  { id: "gw-export",       name: "Export Svc",   gatewayName: "ftth-export-gateway",       port: 5007, icon: Upload,        column: 2, row: 3, x: 780, y: 245, category: "Async Worker",   connectsTo: ["postgres-db"] },
  { id: "gw-olt",          name: "OLT Poller",   gatewayName: "ftth-olt-gateway",          port: 5008, icon: Network,       column: 2, row: 4, x: 780, y: 310, category: "SNMP Telemetry", connectsTo: ["postgres-db", "redis-cache"] },
];

export const COLLAPSED_HUB_X = 640;
export const COLLAPSED_HUB_Y = 250;
export const CLUSTER_FRAME_X = 560;
export const CLUSTER_FRAME_Y = 45;
export const CLUSTER_FRAME_W = 345;
export const CLUSTER_FRAME_H = 410;

export interface StageNodePosition {
  x: number;
  y: number;
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  tone?: "green" | "blue" | "red";
  nodeId: string;
}

export const STAGE_NODE_POSITIONS: Record<string, StageNodePosition> = {
  // Tier 1 — Edge Ingress (Spacious Left X = 65)
  "edge-router":   { x: 65,  y: 250, label: "Traefik / Kong API", sublabel: "Edge Router",    icon: Server,   tone: "green", nodeId: "edge-router"  },
  // Tier 2 — Core, AI & IAM (X = 255, generous ~60px gap from Edge)
  "core-backend":  { x: 255, y: 100, label: "Spring Boot Core",   sublabel: "Port 9090",       icon: Cpu,      tone: "green", nodeId: "core-backend"  },
  "ai-gateway":    { x: 255, y: 250, label: "AI Gateway (RAG)",   sublabel: "Python Engine",   icon: Zap,      tone: "green", nodeId: "ai-gateway"    },
  "keycloak-iam":  { x: 255, y: 400, label: "Keycloak IAM",       sublabel: "Keycloak 26",     icon: KeyRound, tone: "green", nodeId: "keycloak-iam"  },
  // Tier 3 — Storage & Data Layer (X = 420, generous ~55px gap from Core)
  "postgres-db":   { x: 420, y: 165, label: "PostgreSQL",         sublabel: "(PostGIS)",        icon: Database, tone: "blue",  nodeId: "postgres-db"   },
  "redis-cache":   { x: 420, y: 335, label: "Redis Cache",        sublabel: "Port 6379",        icon: Activity, tone: "red",   nodeId: "redis-cache"   },
};

export interface StageEdge {
  id: string;
  from: string;
  to: string;
  path: string;
  speed?: "fast" | "normal" | "slow";
}

export const STAGE_EDGES: StageEdge[] = [
  // Edge → Core Layer (Spacious smooth bezier arcs)
  { id: "edge-core",      from: "edge-router",  to: "core-backend", speed: "fast",   path: "M 65 250 C 145 250, 165 100, 255 100" },
  { id: "edge-ai",        from: "edge-router",  to: "ai-gateway",   speed: "fast",   path: "M 65 250 L 255 250" },
  { id: "edge-keycloak",  from: "edge-router",  to: "keycloak-iam", speed: "normal", path: "M 65 250 C 145 250, 165 400, 255 400" },

  // Core Layer → Storage & Data Layer
  { id: "core-postgres",  from: "core-backend", to: "postgres-db",  speed: "normal", path: "M 255 100 C 330 100, 345 165, 420 165" },
  { id: "core-redis",     from: "core-backend", to: "redis-cache",  speed: "slow",   path: "M 255 100 C 330 100, 345 335, 420 335" },
  { id: "ai-postgres",    from: "ai-gateway",   to: "postgres-db",  speed: "normal", path: "M 255 250 C 330 250, 345 165, 420 165" },
  { id: "ai-redis",       from: "ai-gateway",   to: "redis-cache",  speed: "fast",   path: "M 255 250 C 330 250, 345 335, 420 335" },
];

export const subNodesMap: Record<string, SubNode[]> = {
  "edge-router": [
    { id: "sub-kong-rl",  name: "Rate Limit", details: "Global request throttling (100 req/min)",   icon: Zap,    xOffset: -10, yOffset: -34 },
    { id: "sub-kong-jwt", name: "JWT Auth",   details: "Validation of Keycloak JWT signatures",      icon: Lock,   xOffset: -10, yOffset: 34  },
  ],
  "core-backend": [
    { id: "sub-sb-tenant",name: "Tenancy",    details: "X-Tenant-ID header context filter",          icon: Layers, xOffset: 0,   yOffset: -34 },
  ],
  "ai-gateway": [
    { id: "sub-ai-vec",   name: "pgvector",   details: "500-token chunk vector embeddings",         icon: Database, xOffset: 0,  yOffset: -34 },
  ],
  "keycloak-iam": [
    { id: "sub-kc-realm", name: "Realms",     details: "Multi-tenant isolation configurations",      icon: Layers, xOffset: 0,   yOffset: 34  },
  ],
  "postgres-db": [
    { id: "sub-pg-spatial", name: "PostGIS",  details: "Spatial mapping & coordinate functions",    icon: Map,    xOffset: 0,   yOffset: -34 },
  ],
  "redis-cache": [
    { id: "sub-rd-pub",  name: "Pub/Sub",     details: "Event dispatcher channels (network-events)", icon: Radio,  xOffset: 0,   yOffset: 34  },
  ],
};

export type NodeStatus = "healthy" | "warning" | "error";

export function statusToColor(status: NodeStatus): string {
  if (status === "error")   return "hsl(0 84% 60%)";
  if (status === "warning") return "hsl(45 95% 55%)";
  return "var(--primary)";
}

export function getEdgeHealthColor(
  from: string,
  to: string,
  statusMap: Record<string, NodeStatus>
): string {
  const fromS = statusMap[from] ?? "healthy";
  const toS   = statusMap[to]   ?? "healthy";
  if (fromS === "error"   || toS === "error")   return "hsl(0 84% 60%)";
  if (fromS === "warning" || toS === "warning") return "hsl(45 95% 55%)";
  return "var(--primary)";
}

export function getParticleClass(speed: StageEdge["speed"], status: NodeStatus): string {
  if (status === "error") return "animate-flow-particle-slow";
  if (speed === "fast")   return "animate-flow-particle-fast";
  if (speed === "slow")   return "animate-flow-particle-slow";
  return "animate-flow-particle";
}
