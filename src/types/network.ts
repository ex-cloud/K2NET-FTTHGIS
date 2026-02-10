export interface NetworkNode {
  id: number;
  code: string;
  name: string;
  status: string;
  nodeType: string;
  geom?: {
    type: string;
    coordinates: number[] | number[][];
  };
}

export interface OLT extends NetworkNode {
  ipAddress: string;
  snmpCommunity: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
