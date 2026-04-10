export interface NetworkNode {
  id: number;
  code: string;
  name: string;
  status: string;
  nodeType: string;
  lastNote?: string;
  lat?: number;
  lng?: number;
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
  oltId: number;
  oltName: string;
  oltCode: string;
}

export interface ODP extends NetworkNode {
  totalPort: number;
  usedPort: number;
  odcId: number;
  odcName: string;
  odcCode: string;
}

export interface Customer extends NetworkNode {
  address: string;
  odpId: number;
  odpCode: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
