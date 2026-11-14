export interface TenantPermissionItem {
  id: number;
  code: string;
  name: string;
  module?: string;
  scope?: string;
}

export interface EditableTenantRole {
  id: number;
  name: string;
  displayName?: string;
  code?: string;
  description?: string;
  isSystemRole?: boolean;
  permissions?: Array<{ id: number; code: string; name?: string; module?: string }>;
}

export const TENANT_ROLE_PRESETS: Record<string, { labelKey: string; codes: string[] }> = {
  noc: {
    labelKey: "security.preset_noc",
    codes: [
      "dashboard.view",
      "projects.view",
      "map.view",
      "map.edit",
      "zones.view",
      "zones.edit",
      "coverage.view",
      "network.view",
      "network.manage",
      "network.manage.all-projects",
      "network.monitor",
      "network.nodes",
      "network.audit",
      "inventory.view",
      "inventory.edit",
      "inventory.manage",
      "inventory.export",
      "customer.view",
      "ticket.view",
      "ticket.create",
      "ticket.update",
      "ticket.assign",
      "report.view",
      "audit.view",
    ],
  },
  viewer: {
    labelKey: "security.preset_viewer",
    codes: [
      "dashboard.view",
      "projects.view",
      "map.view",
      "zones.view",
      "coverage.view",
      "network.view",
      "inventory.view",
    ],
  },
  technician: {
    labelKey: "security.preset_technician",
    codes: [
      "dashboard.view",
      "projects.view",
      "map.view",
      "map.edit",
      "zones.view",
      "coverage.view",
      "network.view",
      "inventory.view",
      "customer.view",
      "ticket.view",
      "ticket.create",
      "ticket.update",
      "ticket.assign",
      "task.update",
    ],
  },
  surveyor: {
    labelKey: "security.preset_surveyor",
    codes: [
      "dashboard.view",
      "projects.view",
      "map.view",
      "map.edit",
      "zones.view",
      "coverage.view",
      "survey.create",
      "network.view",
      "inventory.view",
    ],
  },
  finance: {
    labelKey: "security.preset_finance",
    codes: [
      "dashboard.view",
      "billing.view",
      "billing.manage",
      "billing.packages.view",
      "billing.packages.subscribe",
      "report.view",
      "report.export",
      "customer.view",
    ],
  },
  helpdesk: {
    labelKey: "security.preset_helpdesk",
    codes: [
      "dashboard.view",
      "projects.view",
      "map.view",
      "zones.view",
      "coverage.view",
      "network.view",
      "customer.view",
      "customer.manage",
      "ticket.view",
      "ticket.create",
      "ticket.update",
      "ticket.assign",
    ],
  },
};
