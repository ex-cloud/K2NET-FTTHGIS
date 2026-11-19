export interface UnifiedUserMembership {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  roleName: string;
  status: string;
  isDefault: boolean;
  joinedAt?: string;
}

export interface UnifiedUserProjectRole {
  projectId: string;
  projectName: string;
  roleName: string;
  roleDisplayName: string;
}

export type UnifiedUserScope = "platform" | "tenant";

export type UnifiedTranslateFn = (
  key: string,
  params?: Record<string, string | number>
) => string;

export interface UnifiedRolePermissionItem {
  id?: number;
  code: string;
  name?: string;
  module?: string;
}

export interface UnifiedRoleOption {
  id: number;
  name: string;
  displayName?: string;
  description?: string;
  code?: string;
  scope?: string;
  isSystemRole?: boolean;
  isTemplate?: boolean;
  permissions?: Array<UnifiedRolePermissionItem | string>;
}

export interface UnifiedProjectOption {
  id: string;
  name: string;
}

export interface UnifiedUserRecord {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  phone?: string;
  jobTitle?: string;
  avatarUrl?: string;
  status: string;
  emailVerified?: boolean;
  mfaEnabled?: boolean;
  roleId?: number | null;
  roleName?: string;
  roleDisplayName?: string;
  roleCode?: string | null;
  organizationId?: string;
  organizationName?: string;
  organizationSlug?: string;
  lastLoginAt?: string | null;
  lastLogin?: string | null;
  lastLoginIp?: string | null;
  createdAt?: string;
  memberships?: UnifiedUserMembership[];
  projectRoles?: UnifiedUserProjectRole[];
}

export interface UnifiedInviteSubmitPayload {
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  roleId: number | null;
  roleName: string;
  creationMode: "INVITE" | "DIRECT";
  customPassword: string;
  projectId: string;
}

export interface UnifiedEditSubmitPayload {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  roleId: number | null;
  roleName: string;
  status: string;
  projectId: string;
  reason: string;
}

export interface UnifiedResetPasswordPayload {
  userId: string;
  email: string;
  newPassword: string;
  temporary: boolean;
}

export interface PermissionCategoryGroup {
  id: string;
  titleKey: string;
  fallbackTitle: string;
  items: Array<{
    code: string;
    label: string;
    description: string;
    enabled: boolean;
  }>;
}

export function trKey(
  t: UnifiedTranslateFn | undefined,
  key: string,
  fallback: string,
  params?: Record<string, string | number>
): string {
  if (t) {
    const res = t(key, params);
    if (res && res !== key) {
      return res;
    }
  }
  if (!params) return fallback;
  return Object.entries(params).reduce(
    (acc, [k, v]) =>
      acc
        .replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v))
        .replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    fallback
  );
}

export function generateStrongCryptoPassword(length = 16): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
  const array = new Uint32Array(length);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * chars.length);
    }
  }
  let pass = "K2!";
  for (let i = 0; i < length - 3; i++) {
    pass += chars[array[i] % chars.length];
  }
  return pass;
}

const DEFAULT_ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin:
    "Can edit any platform setting, manage all tenant organizations, billing subscriptions, catalog packages, and security roles.",
  system_support:
    "Can assist tenant operations, manage support tickets, inspect diagnostics, and initiate step-up impersonation sessions.",
  account_manager:
    "Can manage tenant subscriptions, invoices, commercial renewals, and organization account profiles.",
  system_auditor:
    "Can view platform-wide immutable audit trails, compliance reports, and security telemetry in read-only mode.",
  admin:
    "Can access the full organization workspace, manage FTTH GIS topology, OLT hardware, billing subscriptions, and team memberships.",
  noc:
    "Can manage FTTH network topology, monitor OLT/ONT telemetry, execute SNMP diagnostics, and handle outage operations.",
  technician:
    "Can access assigned field work orders, inspect ODC/ODP splice closures, update customer drops, and resolve trouble tickets.",
  viewer:
    "Can view organization dashboard, GIS map layers, coverage zones, and inventory in strict read-only mode.",
};

export function resolveRoleDescription(role: UnifiedRoleOption): string {
  if (role.description && role.description.trim().length > 0) {
    return role.description;
  }
  const key = (role.name || "").toLowerCase();
  return (
    DEFAULT_ROLE_DESCRIPTIONS[key] ||
    `Grants operational permissions associated with the ${role.displayName || role.name} role.`
  );
}

export function resolveCanonicalRoleCode(
  roleName?: string,
  roleCode?: string | null,
  scope: UnifiedUserScope = "tenant"
): string {
  if (roleCode && roleCode.trim().length > 0) {
    return roleCode.trim().toUpperCase();
  }
  const clean = (roleName || "").toLowerCase();
  if (clean === "super_admin") return "SYS-01";
  if (clean === "system_support") return "SYS-02";
  if (clean === "account_manager") return "SYS-03";
  if (clean === "system_auditor") return "SYS-04";
  if (clean === "admin" || clean === "tenant_admin") return "TENT-01";
  if (clean === "noc") return "TENT-02";
  if (clean === "technician") return "TENT-03";
  if (clean === "viewer") return "TENT-04";
  return scope === "platform" ? "SYS-ROLE" : "CUST-ROLE";
}

export function buildPermissionCategoriesForRole(
  scope: UnifiedUserScope,
  selectedRole: UnifiedRoleOption | null
): PermissionCategoryGroup[] {
  const roleName = (selectedRole?.name || "").toLowerCase();
  const explicitCodes = new Set<string>();
  if (selectedRole?.permissions) {
    for (const p of selectedRole.permissions) {
      if (typeof p === "string") explicitCodes.add(p);
      else if (p?.code) explicitCodes.add(p.code);
    }
  }

  const isSuper = roleName === "super_admin";
  const isTenantAdmin = roleName === "admin" || roleName === "tenant_admin";
  const isNoc = roleName === "noc" || roleName.includes("noc");
  const isTech = roleName === "technician" || roleName.includes("tech");
  const isSupport = roleName === "system_support";
  const isAcctMgr = roleName === "account_manager";
  const isAuditor = roleName === "system_auditor";

  const hasPerm = (code: string, defaultActive: boolean): boolean => {
    if (explicitCodes.size > 0) {
      return explicitCodes.has(code) || isSuper || isTenantAdmin;
    }
    return defaultActive;
  };

  if (scope === "platform") {
    return [
      {
        id: "org_team",
        titleKey: "users.cf_cat_org_team",
        fallbackTitle: "Organization, Team & IAM",
        items: [
          {
            code: "system.organizations.manage",
            label: "Tenant Organizations Administration",
            description: "Provision, suspend, approve, and configure multi-tenant ISP workspaces.",
            enabled: hasPerm("system.organizations.manage", isSuper || isAcctMgr),
          },
          {
            code: "system.users.manage",
            label: "Global Users & Platform Staff Management",
            description: "Invite platform staff, assign SYSTEM roles, and manage global identities.",
            enabled: hasPerm("system.users.manage", isSuper),
          },
          {
            code: "system.support.impersonate",
            label: "Step-Up Tenant Impersonation Engine",
            description: "Execute time-boxed 30m dual-identity support impersonation with MFA.",
            enabled: hasPerm("system.support.impersonate", isSuper || isSupport),
          },
        ],
      },
      {
        id: "billing_licensing",
        titleKey: "users.cf_cat_billing_licensing",
        fallbackTitle: "Billing, Catalog & Licensing",
        items: [
          {
            code: "catalog.packages.manage",
            label: "Marketplace Catalog & Plan Policies",
            description: "Configure subscription tiers, add-on packages, and quota policies.",
            enabled: hasPerm("catalog.packages.manage", isSuper || isAcctMgr),
          },
          {
            code: "billing.subscriptions.manage",
            label: "Subscriptions, Invoices & Renewals",
            description: "Manage tenant billing lifecycles, payment webhooks, and invoice issuance.",
            enabled: hasPerm("billing.subscriptions.manage", isSuper || isAcctMgr),
          },
          {
            code: "licensing.manage",
            label: "Cryptographic License & Entitlement Control",
            description: "Issue, renew, and revoke online/offline tenant license tokens.",
            enabled: hasPerm("licensing.manage", isSuper || isAcctMgr),
          },
        ],
      },
      {
        id: "security_audit",
        titleKey: "users.cf_cat_security_audit",
        fallbackTitle: "Security, Observability & Audit",
        items: [
          {
            code: "system.security.manage",
            label: "PBAC Roles, Permissions & Password Policy",
            description: "Manage 2-Realm Keycloak security templates and global authentication policies.",
            enabled: hasPerm("system.security.manage", isSuper),
          },
          {
            code: "system.gateway.manage",
            label: "Polyglot Microservices & Kong Gateway Control",
            description: "Configure SMTP, WhatsApp, Payment, OLT, and AI gateway services.",
            enabled: hasPerm("system.gateway.manage", isSuper || isSupport),
          },
          {
            code: "system.audit.view",
            label: "Immutable Audit Trail & Observability Telemetry",
            description: "Inspect platform-wide security events, Prometheus metrics, and logs.",
            enabled: hasPerm("system.audit.view", isSuper || isAuditor || isSupport),
          },
        ],
      },
    ];
  }

  return [
    {
      id: "network_gis",
      titleKey: "users.cf_cat_network_gis",
      fallbackTitle: "Network & GIS Topology",
      items: [
        {
          code: "map.view",
          label: "Spatial GIS Map & Coverage Read",
          description: "View FTTH fiber routes, OLT/ODC/ODP nodes, and service coverage polygons.",
          enabled: hasPerm("map.view", true),
        },
        {
          code: "network.manage",
          label: "Network Topology & Fiber Core Design",
          description: "Create, edit, and splice OLT, ODC, ODP, and distribution fiber cables.",
          enabled: hasPerm("network.manage", isTenantAdmin || isNoc),
        },
        {
          code: "inventory.manage",
          label: "Optical Inventory & Asset Management",
          description: "Manage physical hardware stock, splitters, and warehouse materials.",
          enabled: hasPerm("inventory.manage", isTenantAdmin || isNoc || isTech),
        },
      ],
    },
    {
      id: "operations_olt",
      titleKey: "users.cf_cat_operations_olt",
      fallbackTitle: "Operations, OLT & Field",
      items: [
        {
          code: "olt.manage",
          label: "SNMP OLT Hardware & PON Terminal Control",
          description: "Provision ONTs, monitor optical Rx/Tx power, and run OLT CLI diagnostics.",
          enabled: hasPerm("olt.manage", isTenantAdmin || isNoc),
        },
        {
          code: "workorders.manage",
          label: "Field Work Orders & Installation Dispatch",
          description: "Assign, update, and verify field technician installation & repair tasks.",
          enabled: hasPerm("workorders.manage", isTenantAdmin || isNoc || isTech),
        },
        {
          code: "tickets.manage",
          label: "Customer Outage & Trouble Tickets",
          description: "Handle subscriber incident reports and automated outage broadcasts.",
          enabled: hasPerm("tickets.manage", isTenantAdmin || isNoc || isTech),
        },
      ],
    },
    {
      id: "org_team",
      titleKey: "users.cf_cat_org_team",
      fallbackTitle: "Organization, Team & IAM",
      items: [
        {
          code: "team.manage",
          label: "Team Members & Custom Role Builder",
          description: "Invite organization staff, assign workspace roles, and manage project access.",
          enabled: hasPerm("team.manage", isTenantAdmin),
        },
        {
          code: "org.sso.manage",
          label: "Enterprise Corporate SSO & Security Policy",
          description: "Configure OIDC/SAML Identity Providers, Enforce MFA, and Social Login policy.",
          enabled: hasPerm("org.sso.manage", isTenantAdmin),
        },
      ],
    },
    {
      id: "billing_licensing",
      titleKey: "users.cf_cat_billing_licensing",
      fallbackTitle: "Billing, Catalog & Licensing",
      items: [
        {
          code: "billing.manage",
          label: "Workspace Subscription & Marketplace Add-ons",
          description: "Manage organization plan upgrades, capacity boosters, and billing invoices.",
          enabled: hasPerm("billing.manage", isTenantAdmin),
        },
      ],
    },
  ];
}
