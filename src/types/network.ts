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
