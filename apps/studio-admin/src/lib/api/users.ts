import { type PaginatedResponse, type User } from "@/types/user";
import { getBackendBaseUrl } from "../api-config";
import { httpClient } from "../httpClient";

const BACKEND_URL = getBackendBaseUrl();

export interface GetUsersParams {
  page?: number;
  size?: number;
  search?: string;
  role?: string;
  status?: string;
  org?: string;
  token?: string;
}

export async function getUsers(params?: GetUsersParams): Promise<PaginatedResponse<User>> {
  const {
    page = 0,
    size = 10,
    search,
    role,
    status,
    org,
    token,
  } = params || {};

  if (!token) {
    throw new Error("No access token provided");
  }

  const queryParams = new URLSearchParams();
  queryParams.append("page", page.toString());
  queryParams.append("size", size.toString());
  if (search) queryParams.append("search", search);
  if (role && role !== "all") queryParams.append("role", role);
  if (status && status !== "all") queryParams.append("status", status);
  if (org && org !== "all") queryParams.append("org", org);

  const res = await httpClient(`${BACKEND_URL}/users?${queryParams.toString()}`, {
    token,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }

  return res.json();
}

export async function updateUser(
  id: string,
  data: { role?: string; status?: string; reason?: string },
  token: string,
): Promise<User> {
  const res = await httpClient(`${BACKEND_URL}/users/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to update user");
  }

  return res.json();
}

export async function getUserStats(token: string): Promise<{
  totalUsers: number;
  activeUsers: number;
  pendingRequests: number;
}> {
  if (!token) {
    throw new Error("No access token provided");
  }

  const res = await httpClient(`${BACKEND_URL}/users/stats`, {
    token,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user stats");
  }

  return res.json();
}

export interface GetTenantUsersParams {
  orgId: string;
  page?: number;
  size?: number;
  search?: string;
  role?: string;
  status?: string;
  token?: string;
}

export async function getTenantUsers(params: GetTenantUsersParams): Promise<PaginatedResponse<User>> {
  const {
    orgId,
    page = 0,
    size = 10,
    search,
    role,
    status,
    token,
  } = params;

  if (!token) {
    throw new Error("No access token provided");
  }

  const queryParams = new URLSearchParams();
  queryParams.append("page", page.toString());
  queryParams.append("size", size.toString());
  if (search) queryParams.append("search", search);
  if (role && role !== "all") queryParams.append("role", role);
  if (status && status !== "all") queryParams.append("status", status);

  const res = await httpClient(`${BACKEND_URL}/organizations/${orgId}/users?${queryParams.toString()}`, {
    token,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch tenant users");
  }

  return res.json();
}

export async function getTenantUserStats(orgId: string, token: string): Promise<{
  totalUsers: number;
  activeUsers: number;
  pendingRequests: number;
}> {
  if (!token) {
    throw new Error("No access token provided");
  }

  // TODO: Add backend endpoint for tenant user stats if needed.
  // For now, return dummy data to avoid errors.
  return {
    totalUsers: 0,
    activeUsers: 0,
    pendingRequests: 0,
  };
}
