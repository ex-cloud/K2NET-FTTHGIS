import type { UnifiedRoleOption, PermissionCategoryGroup } from "./user-management-types";

/**
 * Builds permission categories and authority states for SYSTEM / Platform Control Plane roles.
 * Governed strictly under ftth-realm and Scope Air-Gap standards (ADR-0017).
 */
export function buildPlatformPermissionCategories(
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
  const isSupport = roleName === "system_support";
  const isAcctMgr = roleName === "account_manager";
  const isAuditor = roleName === "system_auditor";

  const hasPerm = (code: string, fallbackActive: boolean): boolean => {
    if (isSuper) return true;
    if (explicitCodes.size > 0) {
      return explicitCodes.has(code);
    }
    return fallbackActive;
  };

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
          enabled: hasPerm("system.organizations.manage", isAcctMgr),
        },
        {
          code: "system.organizations.view",
          label: "View Organizations Directory",
          description: "Inspect active, pending, and suspended tenant workspace directories.",
          enabled: hasPerm("system.organizations.view", isAcctMgr || isSupport || isAuditor),
        },
        {
          code: "system.users.manage",
          label: "Global Users & Platform Staff Management",
          description: "Invite platform staff, assign SYSTEM roles, and manage global identities.",
          enabled: hasPerm("system.users.manage", false),
        },
        {
          code: "system.support.impersonate",
          label: "Step-Up Tenant Impersonation Engine",
          description: "Execute time-boxed 30m dual-identity support impersonation with MFA.",
          enabled: hasPerm("system.support.impersonate", isSupport),
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
          enabled: hasPerm("catalog.packages.manage", isAcctMgr),
        },
        {
          code: "billing.subscriptions.manage",
          label: "Subscriptions, Invoices & Renewals",
          description: "Manage tenant billing lifecycles, payment webhooks, and invoice issuance.",
          enabled: hasPerm("billing.subscriptions.manage", isAcctMgr),
        },
        {
          code: "licensing.manage",
          label: "Cryptographic License & Entitlement Control",
          description: "Issue, renew, and revoke online/offline tenant license tokens.",
          enabled: hasPerm("licensing.manage", isAcctMgr),
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
          enabled: hasPerm("system.security.manage", false),
        },
        {
          code: "system.gateway.manage",
          label: "Polyglot Microservices & Kong Gateway Control",
          description: "Configure SMTP, WhatsApp, Payment, OLT, and AI gateway services.",
          enabled: hasPerm("system.gateway.manage", isSupport),
        },
        {
          code: "system.audit.view",
          label: "Immutable Audit Trail & Observability Telemetry",
          description: "Inspect platform-wide security events, Prometheus metrics, and logs.",
          enabled: hasPerm("system.audit.view", isAuditor || isSupport),
        },
      ],
    },
  ];
}
