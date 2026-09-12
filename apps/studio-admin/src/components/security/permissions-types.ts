export interface Permission {
  id: number;
  code: string;
  name: string;
  description?: string;
  module: string;
  scope: string;
}

export interface NewPermissionForm {
  code: string;
  name: string;
  description: string;
  module: string;
  scope: string;
}

export interface EndpointUsage {
  controller: string;
  method: string;
  httpMethod: string;
  path: string;
  authorizationExpression: string;
}

export interface PermissionUsageResponse {
  code: string;
  usages: EndpointUsage[];
  totalUsages: number;
}

export const SCOPE_OPTIONS = ["SYSTEM", "TENANT"] as const;

export const MODULE_SUGGESTIONS = [
  "nodes",
  "network",
  "customers",
  "projects",
  "roles",
  "users",
  "reports",
  "billing",
  "settings",
  "audit",
];

export function scopeBadge(scope: string) {
  return scope === "SYSTEM"
    ? "bg-primary/15 text-primary border border-primary/30"
    : "bg-sky-500/15 text-sky-400 border border-sky-500/30";
}
