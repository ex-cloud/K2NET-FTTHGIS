import { 
  OLT, ODC, ODP, Customer, PageResponse 
} from "@/types/network";
import { getBackendBaseUrl } from "../api-config";
import { httpClient } from "../httpClient";

const BACKEND_URL = getBackendBaseUrl();

interface FetchParams {
  page?: number;
  size?: number;
  search?: string;
  sort?: string[];
  [key: string]: string | number | string[] | undefined;
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
  labels?: string[];
  attributes: Record<string, string | number | boolean | null>;
  lat?: number;
  lng?: number;
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

/**
 * Utility to build URL with query params
 */
function buildUrl(path: string, params: FetchParams): string {
  const urlParams = new URLSearchParams();
  if (params.page !== undefined) urlParams.append("page", params.page.toString());
  if (params.size !== undefined) urlParams.append("size", params.size.toString());
  if (params.search) urlParams.append("search", params.search);
  
  if (params.sort && params.sort.length > 0) {
    params.sort.forEach(s => urlParams.append("sort", s));
  }

  // Add extra filters
  Object.keys(params).forEach(key => {
    if (!["page", "size", "search", "sort"].includes(key) && params[key] !== undefined && params[key] !== "") {
      const val = params[key];
      if (Array.isArray(val)) {
        val.forEach(v => urlParams.append(key, v));
      } else {
        urlParams.append(key, String(val));
      }
    }
  });

  const query = urlParams.toString();
  return `${BACKEND_URL}${path}${query ? `?${query}` : ""}`;
}

export const networkApi = {
  // --- FETCHING ---
  
  async getOlts(params: FetchParams, token: string, projectId: string): Promise<PageResponse<OLT>> {
    const res = await httpClient(buildUrl("/network/olts", params), { token, projectId });
    if (!res.ok) throw new Error("Failed to fetch OLTs");
    return res.json();
  },

  async getOdcs(params: FetchParams, token: string, projectId: string): Promise<PageResponse<ODC>> {
    const res = await httpClient(buildUrl("/network/odcs", params), { token, projectId });
    if (!res.ok) throw new Error("Failed to fetch ODCs");
    return res.json();
  },

  async getOdps(params: FetchParams, token: string, projectId: string): Promise<PageResponse<ODP>> {
    const res = await httpClient(buildUrl("/network/odps", params), { token, projectId });
    if (!res.ok) throw new Error("Failed to fetch ODPs");
    return res.json();
  },

  async getCustomers(params: FetchParams, token: string, projectId: string): Promise<PageResponse<Customer>> {
    const res = await httpClient(buildUrl("/network/customers", params), { token, projectId });
    if (!res.ok) throw new Error("Failed to fetch Customers");
    return res.json();
  },

  async searchAssets(query: string, orgId: string, token: string): Promise<AssetSearchResult[]> {
    const res = await httpClient(`${BACKEND_URL}/network/assets/search?q=${query}&orgId=${orgId}`, { token });
    if (!res.ok) throw new Error("Search failed");
    return res.json();
  },

  async getAssetByCode(type: string, code: string, token: string): Promise<AssetDetails> {
    const res = await httpClient(`${BACKEND_URL}/network/assets/by-code/${type.toLowerCase()}/${code}`, { token });
    if (!res.ok) throw new Error("Failed to fetch asset details");
    return res.json();
  },

  async getAssetHistory(type: string, code: string, token: string): Promise<AssetHistory[]> {
    const res = await httpClient(`${BACKEND_URL}/network/assets/${type.toLowerCase()}/${code}/history`, { token });
    if (!res.ok) throw new Error("Failed to fetch asset history");
    return res.json();
  },

  async getDiagnostics(type: string, code: string, token: string): Promise<DiagnosticResult> {
    const res = await httpClient(`${BACKEND_URL}/network/assets/${type.toLowerCase()}/${code}/diagnostics`, { token });
    if (!res.ok) throw new Error("Failed to fetch diagnostics");
    return res.json();
  },

  async getStats(token: string, projectId: string): Promise<AssetStats> {
    const res = await httpClient(`${BACKEND_URL}/network/analytics/stats`, { token, projectId });
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
  },

  async tracePath(startNodeId: string, endNodeId: string, token: string, projectId: string): Promise<unknown[]> {
    const res = await httpClient(`${BACKEND_URL}/network/trace-path?startNodeId=${startNodeId}&endNodeId=${endNodeId}`, { token, projectId });
    if (!res.ok) throw new Error("Trace path failed");
    return res.json();
  },

  async checkCode(code: string, token: string): Promise<{ exists: boolean }> {
    const res = await httpClient(`${BACKEND_URL}/network/assets/check-code?code=${encodeURIComponent(code)}`, { token });
    if (!res.ok) throw new Error("Code check failed");
    return res.json();
  },

  // --- CRUD OPERATIONS ---

  async createAsset(type: string, data: Record<string, unknown>, token: string, projectId: string) {
    const endpoint = `/network/${type.toLowerCase()}s`;
    const res = await httpClient(`${BACKEND_URL}${endpoint}`, {
      method: "POST",
      token,
      projectId,
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || `Failed to create ${type}`);
    }
    return res.json();
  },

  async updateAsset(type: string, id: string, data: Record<string, unknown>, token: string, projectId: string) {
    const endpoint = `/network/${type.toLowerCase()}s/${id}`;
    const res = await httpClient(`${BACKEND_URL}${endpoint}`, {
      method: "PUT",
      token,
      projectId,
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || `Failed to update ${type}`);
    }
    return res.json();
  },

  async deleteAsset(type: string, id: string, reason: string, token: string, projectId: string) {
    const endpoint = `/network/${type.toLowerCase()}s/${id}?reason=${encodeURIComponent(reason)}`;
    const res = await httpClient(`${BACKEND_URL}${endpoint}`, {
      method: "DELETE",
      token,
      projectId
    });
    if (!res.ok) throw new Error(`Failed to delete ${type}`);
    return true;
  },

  // --- BATCH OPERATIONS ---

  async batchUpdate(data: Record<string, unknown>, token: string, projectId: string) {
    const res = await httpClient(`${BACKEND_URL}/network/assets/batch-update`, {
      method: "POST",
      token,
      projectId,
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Batch update failed");
    }
    return res.json();
  },

  async batchDelete(type: string, ids: string[], reason: string, token: string, projectId: string) {
    const res = await httpClient(
      `${BACKEND_URL}/network/assets/batch-delete?type=${type}&reason=${encodeURIComponent(reason)}`, 
      {
        method: "DELETE",
        token,
        projectId,
        body: JSON.stringify(ids)
      }
    );
    if (!res.ok) throw new Error("Batch delete failed");
    return true;
  }
};
