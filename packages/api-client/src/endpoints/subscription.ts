import type { HttpClient } from "../http-client";

export interface SubscriptionPlanDto {
  id: string;
  name: string;
  code: string;
  priceMonthly: number;
  priceYearly: number;
  maxCustomers: number;
  maxOlts: number;
  features: string[];
}

export function createSubscriptionEndpoints(client: HttpClient) {
  return {
    getPlans: () => client.get<SubscriptionPlanDto[]>("/api/v1/organizations/plans"),
    getCurrentSubscription: (orgId: string) =>
      client.get<any>(`/api/v1/organizations/${orgId}/subscription`),
    changePlan: (orgId: string, planCode: string) =>
      client.post(`/api/v1/organizations/${orgId}/subscription/change-plan`, { planCode }),
  };
}
