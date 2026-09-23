import { apiClient } from "../api-client";
import type { OLT, ODC, ODP, Customer, PageResponse } from "@k2net/types";

export interface FetchParams {
  page?: number;
  size?: number;
  search?: string;
  sort?: string[];
  projectId?: string;
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface AssetSearchResult {
  id: string;
  code: string;
  type: string;
  lng: number;
  lat: number;
  status: string;
  projectId?: string;
  projectName?: string;
}

export interface FiberCable {
  id: string;
  code: string;
  status: string;
  geometry: {
    type: "LineString";
    coordinates: number[][];
  };
  lengthMeters?: number;
  coreCount?: number;
  startNodeId?: string;
  endNodeId?: string;
}

export interface AssetHistory {
  id: string;
  assetCode: string;
  action: string;
  reason: string;
  notes?: string;
  causer: string;
  createdAt: string;
}

export interface DiagnosticResult {
  status: "UP" | "DOWN" | "WARNING";
  latency?: number;
  packetLoss?: number;
  lastChecked: string;
  details?: Record<string, string | number | boolean | null>;
  overallHealth?: number;
  notes?: string;
}

export interface AssetDetails {
  id: string;
  code: string;
  type: string;
  status: string;
  healthStatus?: string;
  labels?: string[];
  attributes?: Record<string, string | number | boolean | null>;
  lat?: number;
  lng?: number;
  address?: string;
  relatedAssets?: Array<{
    id: string;
    code: string;
    type: string;
    status: string;
  }>;
}

export interface AssetStats {
  totalNodes: number;
  totalOdc: number;
  totalOdp: number;
  totalCableLengthKm: number;
  totalUsers: number;
  growthPercentage: number;
  activeMaintenanceCount: number;
  topCapacities: {
    label: string;
    percentage: number;
    color: string;
  }[];
  activeMaintenances: {
    id: string;
    code: string;
    type: string;
    description: string;
    severity: "critical" | "warning" | "info";
  }[];
}

export interface BoqItem {
  id: string;
  materialCode: string;
  materialName: string;
  category: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  currency: string;
}

export interface BoqSummary {
  projectId: string;
  projectName: string;
  totalEstimatedCost: number;
  currency: string;
  calculatedAt: string;
  items: BoqItem[];
  metadata: {
    totalOdc: number;
    totalOdp: number;
    totalCableLengthKm: number;
    totalSubscribers: number;
  };
}

export const networkApi = {
  // --- FETCHING LISTS ---

  async getOlts(params: FetchParams = {}): Promise<PageResponse<OLT>> {
    return apiClient<PageResponse<OLT>>("/api/v1/network/olts", {
      params: { ...params, sort: params.sort?.join(",") },
    });
  },

  async getOdcs(params: FetchParams = {}): Promise<PageResponse<ODC>> {
    return apiClient<PageResponse<ODC>>("/api/v1/network/odcs", {
      params: { ...params, sort: params.sort?.join(",") },
    });
  },

  async getOdps(params: FetchParams = {}): Promise<PageResponse<ODP>> {
    return apiClient<PageResponse<ODP>>("/api/v1/network/odps", {
      params: { ...params, sort: params.sort?.join(",") },
    });
  },

  async getCustomers(params: FetchParams = {}): Promise<PageResponse<Customer>> {
    return apiClient<PageResponse<Customer>>("/api/v1/network/customers", {
      params: { ...params, sort: params.sort?.join(",") },
    });
  },

  async getCables(params: FetchParams = {}): Promise<PageResponse<FiberCable>> {
    return apiClient<PageResponse<FiberCable>>("/api/v1/network/cables", {
      params: { ...params, sort: params.sort?.join(",") },
    });
  },

  // --- STATS & ANALYTICS ---

  async getStats(projectId?: string): Promise<AssetStats> {
    return apiClient<AssetStats>("/api/v1/network/analytics/stats", {
      params: projectId ? { projectId } : undefined,
    });
  },

  async getBoqEstimation(projectId: string): Promise<BoqSummary> {
    return apiClient<BoqSummary>(`/api/v1/analytics/boq/${projectId}`);
  },

  // --- ASSET DETAILS & DIAGNOSTICS ---

  async searchAssets(query: string, orgId?: string): Promise<AssetSearchResult[]> {
    return apiClient<AssetSearchResult[]>("/api/v1/network/assets/search", {
      params: { q: query, orgId },
    });
  },

  async getAssetByCode(type: string, code: string): Promise<AssetDetails> {
    return apiClient<AssetDetails>(`/api/v1/network/assets/by-code/${type.toLowerCase()}/${code}`);
  },

  async getAssetHistory(type: string, code: string): Promise<AssetHistory[]> {
    return apiClient<AssetHistory[]>(`/api/v1/network/assets/${type.toLowerCase()}/${code}/history`);
  },

  async getDiagnostics(type: string, code: string): Promise<DiagnosticResult> {
    return apiClient<DiagnosticResult>(`/api/v1/network/assets/${type.toLowerCase()}/${code}/diagnostics`);
  },

  // --- TRACE PATH ---

  async tracePath(startNodeId: string, endNodeId: string, projectId?: string): Promise<FiberCable[]> {
    return apiClient<FiberCable[]>("/api/v1/network/trace-path", {
      params: { startNodeId, endNodeId, projectId },
    });
  },

  async traceUpstream(nodeId: string, projectId?: string): Promise<FiberCable[]> {
    return apiClient<FiberCable[]>("/api/v1/network/trace-upstream", {
      params: { nodeId, projectId },
    });
  },

  async checkCode(code: string): Promise<{ exists: boolean }> {
    return apiClient<{ exists: boolean }>("/api/v1/network/assets/check-code", {
      params: { code },
    });
  },

  // --- CRUD OPERATIONS ---

  async createAsset<T = unknown>(type: string, data: Record<string, unknown>, projectId?: string): Promise<T> {
    const endpoint = `/api/v1/network/${type.toLowerCase()}s`;
    const headers: Record<string, string> = {};
    if (projectId) {
      headers["X-Project-ID"] = projectId;
    }
    return apiClient<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      headers,
    });
  },

  async updateAsset<T = unknown>(type: string, id: string, data: Record<string, unknown>, projectId?: string): Promise<T> {
    const endpoint = `/api/v1/network/${type.toLowerCase()}s/${id}`;
    const headers: Record<string, string> = {};
    if (projectId) {
      headers["X-Project-ID"] = projectId;
    }
    return apiClient<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
      headers,
    });
  },

  async deleteAsset(type: string, id: string, reason?: string, projectId?: string): Promise<boolean> {
    const endpoint = `/api/v1/network/${type.toLowerCase()}s/${id}`;
    const headers: Record<string, string> = {};
    if (projectId) {
      headers["X-Project-ID"] = projectId;
    }
    await apiClient(endpoint, {
      method: "DELETE",
      params: reason ? { reason } : undefined,
      headers,
    });
    return true;
  },

  // --- BATCH OPERATIONS ---

  async batchUpdate(data: Record<string, unknown>, projectId?: string) {
    const headers: Record<string, string> = {};
    if (projectId) {
      headers["X-Project-ID"] = projectId;
    }
    return apiClient("/api/v1/network/assets/batch-update", {
      method: "POST",
      body: JSON.stringify(data),
      headers,
    });
  },

  async batchDelete(type: string, ids: string[], reason?: string, projectId?: string) {
    const headers: Record<string, string> = {};
    if (projectId) {
      headers["X-Project-ID"] = projectId;
    }
    return apiClient(`/api/v1/network/assets/batch-delete?type=${type}`, {
      method: "DELETE",
      params: reason ? { reason } : undefined,
      body: JSON.stringify(ids),
      headers,
    });
  },
};
