import type { HttpClient } from "../http-client";

export interface CustomerDto {
  id: string;
  name: string;
  pppoeUser: string;
  email?: string;
  phone?: string;
  odpCode: string;
  portNumber: number;
  packageSpeed: string;
  rxPower: string;
  status: "ACTIVE" | "ISOLIR" | "SUSPENDED";
  address?: string;
  lat?: number;
  lng?: number;
}

export function createCustomerEndpoints(client: HttpClient) {
  return {
    list: (params?: { page?: number; size?: number; search?: string; status?: string }) =>
      client.get<CustomerDto[]>("/api/v1/customers", { params }),
    getById: (id: string) => client.get<CustomerDto>(`/api/v1/customers/${id}`),
    create: (data: Partial<CustomerDto>) => client.post<CustomerDto>("/api/v1/customers", data),
    update: (id: string, data: Partial<CustomerDto>) =>
      client.put<CustomerDto>(`/api/v1/customers/${id}`, data),
    toggleIsolir: (id: string, isIsolir: boolean) =>
      client.patch<CustomerDto>(`/api/v1/customers/${id}/isolir`, { isolir: isIsolir }),
  };
}
