import { PaginatedResponse, User } from "@/types/user";
import { getBackendBaseUrl } from "../api-config";
import { httpClient } from "../httpClient";

const BACKEND_URL = getBackendBaseUrl();

export async function getUsers(
  page: number = 0,
  size: number = 10,
  search?: string,
  role?: string,
  status?: string,
  token?: string,
): Promise<PaginatedResponse<User>> {
  if (!token) {
    throw new Error("No access token provided");
  }

  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("size", size.toString());
  if (search) params.append("search", search);
  if (role && role !== "all") params.append("role", role);
  if (status && status !== "all") params.append("status", status);

  const res = await httpClient(`${BACKEND_URL}/users?${params.toString()}`, {
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
  data: { role?: string; status?: string },
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
