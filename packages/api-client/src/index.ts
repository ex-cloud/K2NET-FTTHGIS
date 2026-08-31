import { HttpClient, type ApiClientConfig } from "./http-client";
import { createObservabilityEndpoints } from "./endpoints/observability";
import { createCustomerEndpoints } from "./endpoints/customers";
import { createSubscriptionEndpoints } from "./endpoints/subscription";

export * from "./http-client";
export * from "./endpoints/observability";
export * from "./endpoints/customers";
export * from "./endpoints/subscription";

export interface FtthApiClient {
  http: HttpClient;
  observability: ReturnType<typeof createObservabilityEndpoints>;
  customers: ReturnType<typeof createCustomerEndpoints>;
  subscription: ReturnType<typeof createSubscriptionEndpoints>;
  setAuthToken: (token: string | null) => void;
}

export function createFtthApiClient(config: ApiClientConfig = {}): FtthApiClient {
  const http = new HttpClient(config);

  return {
    http,
    observability: createObservabilityEndpoints(http),
    customers: createCustomerEndpoints(http),
    subscription: createSubscriptionEndpoints(http),
    setAuthToken: (token: string | null) => http.setToken(token),
  };
}

// Global default singleton instance for convenience
export const ftthApi = createFtthApiClient();
