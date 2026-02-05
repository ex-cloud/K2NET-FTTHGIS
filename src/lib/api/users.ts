import { PaginatedResponse, User } from "@/types/user";
import { getBackendBaseUrl } from "../api-config";

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

  const res = await fetch(`${BACKEND_URL}/api/users?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store", // Ensure fresh data
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch users");
  }

  return res.json();
}

export async function updateUser(
  id: number,
  data: { role?: string; status?: string },
  token: string,
): Promise<User> {
  const res = await fetch(`${BACKEND_URL}/api/users/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to update user");
  }

  return res.json();
}
