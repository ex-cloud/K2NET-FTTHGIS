import { z } from "zod";
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
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}
export declare enum LifecycleStatus {
    PLAN = "PLAN",
    DEPLOYING = "DEPLOYING",
    ACTIVE = "ACTIVE",
    MAINTENANCE = "MAINTENANCE",
    RETIRED = "RETIRED"
}
export declare enum HealthStatus {
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
export declare const PortSchema: z.ZodNumber;
export declare const GatewayConfigSchema: z.ZodObject<{
    port: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>, z.ZodNumber>;
    redisAddr: z.ZodString;
    gatewayToken: z.ZodString;
}, z.core.$strip>;
export type GatewayConfig = z.infer<typeof GatewayConfigSchema>;
//# sourceMappingURL=index.d.ts.map