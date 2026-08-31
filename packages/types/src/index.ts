import { z } from "zod";
export * from "zod";
export { z };

// ==========================================
// User & Auth Types
// ==========================================
export interface User {
  id: string;
  email: string;
  fullName: string;
  username?: string;
  avatarUrl?: string;
  status: string;
  roleName: string;
  roleDisplayName: string;
  organizationName?: string;
  organizationId?: string;
  organizationSlug?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; // page index (0-based)
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ==========================================
// Network & OLT GIS Types
// ==========================================
export enum LifecycleStatus {
  PLAN = "PLAN",
  DEPLOYING = "DEPLOYING",
  ACTIVE = "ACTIVE",
  MAINTENANCE = "MAINTENANCE",
  RETIRED = "RETIRED"
}

export enum HealthStatus {
  UP = "UP",
  DEGRADED = "DEGRADED",
  DOWN = "DOWN",
  BROKEN = "BROKEN"
}

export interface NetworkNode {
  id: string;
  code: string;
  name: string;
  status: string;
  healthStatus: string;
  nodeType: string;
  lastNote?: string;
  lat?: number;
  lng?: number;
  address?: string;
  geom?: {
    type: string;
    coordinates: number[] | number[][];
  };
}

export interface OLT extends NetworkNode {
  ipAddress: string;
  snmpCommunity: string;
}

export interface ODC extends NetworkNode {
  capacity: number;
  usedCapacity: number;
  oltId: string;
  oltName: string;
  oltCode: string;
}

export interface ODP extends NetworkNode {
  totalPort: number;
  usedPort: number;
  odcId: string;
  odcName: string;
  odcCode: string;
}

export interface Customer extends NetworkNode {
  odpId: string;
  odpCode: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

// ==========================================
// Common Configurations & Schemas (Zod)
// ==========================================
export const PortSchema = z.number().int().min(1).max(65535);

export const GatewayConfigSchema = z.object({
  port: z.string().regex(/^\d+$/, "Port harus berupa angka").transform(Number).pipe(PortSchema),
  redisAddr: z.string().min(1, "Alamat Redis tidak boleh kosong"),
  gatewayToken: z.string().min(16, "Token gateway harus minimal 16 karakter"),
});

export type GatewayConfig = z.infer<typeof GatewayConfigSchema>;
