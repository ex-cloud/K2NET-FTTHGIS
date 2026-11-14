import {
  Boxes,
  Users,
  Webhook,
  Activity,
  CreditCard,
  Settings,
  ShieldCheck,
  History,
  Building,
  Shield,
  Key,
  Receipt,
  ShoppingBag,
  Plug,
  type LucideIcon,
} from "lucide-react";

import type { TranslationKey } from "@k2net/i18n";

export interface SubMenuItem {
  id: string;
  title: string;
  translationKey?: TranslationKey;
  href: string;
  icon: LucideIcon;
  description?: string;
  badge?: string;
  shortcut?: string;
  requiredPermission?: string | string[];
}

export interface SecondarySidebarSection {
  title?: string;
  translationKey?: TranslationKey;
  items: SubMenuItem[];
}

export interface SecondarySidebarConfig {
  headerTitle: string;
  translationKey?: TranslationKey;
  headerSubtitle?: string;
  icon: LucideIcon;
  sections: SecondarySidebarSection[];
}

export interface NavItem {
  id: string;
  title: string;
  translationKey?: TranslationKey;
  href: string;
  icon: LucideIcon;
  shortcut?: string;
  hasSecondarySidebar?: boolean;
  requiredPermission?: string | string[];
}

// ============================================================================
// LAYER 1: ORGANIZATION SCOPE NAVIGATION CONFIG
// ============================================================================

export const ORG_NAV_ITEMS: NavItem[] = [
  {
    id: "projects",
    title: "Projects",
    translationKey: "nav.tenant_projects",
    href: "/projects",
    icon: Boxes,
    shortcut: "G then P",
    requiredPermission: ["projects.view", "projects.create", "projects.edit"],
  },
  {
    id: "team",
    title: "Team",
    translationKey: "nav.tenant_team",
    href: "/team/members",
    icon: Users,
    shortcut: "G then M",
    hasSecondarySidebar: true,
    requiredPermission: [
      "team.view",
      "team.manage",
      "members.view",
      "members.manage",
      "users.view",
      "roles.view",
      "roles.update",
      "roles.manage",
    ],
  },
  {
    id: "integrations",
    title: "Developer & API",
    translationKey: "nav.tenant_integrations",
    href: "/developer/api-keys",
    icon: Webhook,
    shortcut: "G then I",
    hasSecondarySidebar: true,
    requiredPermission: [
      "organizations.webhooks.manage",
      "feature.integration.open_api",
      "organizations.update",
    ],
  },
  {
    id: "usage",
    title: "Usage",
    translationKey: "nav.tenant_usage",
    href: "/usage",
    icon: Activity,
    shortcut: "G then U",
    requiredPermission: ["billing.view", "billing.manage", "organizations.view"],
  },
  {
    id: "billing",
    title: "Billing",
    translationKey: "nav.tenant_billing",
    href: "/billing/license",
    icon: CreditCard,
    shortcut: "G then B",
    hasSecondarySidebar: true,
    requiredPermission: [
      "billing.view",
      "billing.manage",
      "billing.packages.view",
      "billing.packages.subscribe",
    ],
  },
  {
    id: "audit-logs",
    title: "Audit Trail",
    translationKey: "nav.tenant_audit_logs",
    href: "/audit-logs",
    icon: History,
    shortcut: "G then A",
    requiredPermission: ["audit.view", "organization.audit.view"],
  },
  {
    id: "settings",
    title: "Settings",
    translationKey: "nav.tenant_settings",
    href: "/settings/general",
    icon: Settings,
    shortcut: "G then ,",
    hasSecondarySidebar: true,
    requiredPermission: [
      "organizations.view",
      "organizations.update",
      "security.policy.view",
      "security.policy.manage",
      "security.sso.view",
      "security.sso.manage",
      "organizations.webhooks.manage",
    ],
  },
];

export const ORG_SECONDARY_CONFIGS: Record<string, SecondarySidebarConfig> = {
  billing: {
    headerTitle: "Billing & Licenses",
    translationKey: "nav.tenant_billing",
    headerSubtitle: "Manage licenses, quotas, plans & invoices",
    icon: CreditCard,
    sections: [
      {
        title: "License & Quotas",
        translationKey: "nav.billing_sec_license",
        items: [
          {
            id: "license",
            title: "Active License",
            translationKey: "nav.billing_active_license",
            href: "/billing/license",
            icon: Key,
            description: "Cryptographic token & validity",
            shortcut: "S then L",
            requiredPermission: ["billing.view", "billing.manage"],
          },
          {
            id: "quotas",
            title: "Quota Utilization",
            translationKey: "nav.billing_quota_utilization",
            href: "/billing/quotas",
            icon: Activity,
            description: "OLT, ODP, Storage & API limits",
            shortcut: "S then Q",
            requiredPermission: ["billing.view", "billing.manage"],
          },
        ],
      },
      {
        title: "Plans & Invoices",
        translationKey: "nav.billing_sec_plans",
        items: [
          {
            id: "plans",
            title: "Subscription Plans",
            translationKey: "nav.billing_subscription_plans",
            href: "/billing/plans",
            icon: CreditCard,
            description: "Tier catalog & capacity upgrades",
            shortcut: "S then P",
            requiredPermission: [
              "billing.view",
              "billing.manage",
              "billing.packages.view",
              "billing.packages.subscribe",
            ],
          },
          {
            id: "invoices",
            title: "Billing Invoices",
            translationKey: "nav.billing_invoices_history",
            href: "/billing/invoices",
            icon: Receipt,
            description: "Official invoices & payment receipts",
            shortcut: "S then I",
            requiredPermission: ["billing.view", "billing.manage"],
          },
          {
            id: "marketplace",
            title: "Add-on Marketplace",
            translationKey: "nav.billing_marketplace",
            href: "/billing/marketplace",
            icon: ShoppingBag,
            description: "Modular boosters & platform features",
            shortcut: "S then M",
            badge: "NEW",
            requiredPermission: [
              "billing.view",
              "billing.manage",
              "billing.packages.view",
              "billing.packages.subscribe",
            ],
          },
        ],
      },
    ],
  },
  team: {
    headerTitle: "Team Management",
    translationKey: "nav.tenant_team",
    headerSubtitle: "Manage members & organization roles",
    icon: Users,
    sections: [
      {
        items: [
          {
            id: "members",
            title: "Team Members",
            translationKey: "nav.team_members",
            href: "/team/members",
            icon: Users,
            description: "User list & active invitations",
            shortcut: "S then M",
            requiredPermission: [
              "team.view",
              "team.manage",
              "members.view",
              "members.manage",
              "users.view",
            ],
          },
          {
            id: "roles",
            title: "Roles & Permissions",
            translationKey: "nav.team_roles",
            href: "/team/roles",
            icon: ShieldCheck,
            description: "Organization PBAC access rights",
            shortcut: "S then R",
            requiredPermission: [
              "roles.view",
              "roles.update",
              "roles.manage",
              "team.view",
              "team.manage",
            ],
          },
          {
            id: "activity",
            title: "Activity History",
            translationKey: "nav.team_activity",
            href: "/team/activity",
            icon: History,
            description: "Member action audit logs",
            shortcut: "S then A",
            requiredPermission: [
              "audit.view",
              "organization.audit.view",
              "team.view",
              "team.manage",
            ],
          },
        ],
      },
    ],
  },
  settings: {
    headerTitle: "Organization Settings",
    translationKey: "nav.tenant_settings",
    headerSubtitle: "Instance configuration & compliance",
    icon: Settings,
    sections: [
      {
        title: "General Settings",
        translationKey: "nav.general_settings",
        items: [
          {
            id: "general",
            title: "General",
            translationKey: "nav.settings_general",
            href: "/settings/general",
            icon: Building,
            description: "Identity, whitelabel branding & custom domains",
            shortcut: "S then G",
            requiredPermission: ["organizations.view", "organizations.update"],
          },
        ],
      },
      {
        title: "Security & Access",
        translationKey: "nav.security",
        items: [
          {
            id: "security",
            title: "MFA / 2FA Policy",
            translationKey: "nav.org_security",
            href: "/settings/security",
            icon: Shield,
            description: "Multi-factor auth & sessions",
            shortcut: "S then S",
            requiredPermission: [
              "security.policy.view",
              "security.policy.manage",
              "organizations.update",
            ],
          },
          {
            id: "sso",
            title: "Single Sign-On (SSO)",
            translationKey: "nav.org_sso",
            href: "/settings/sso",
            icon: Key,
            description: "Keycloak SAML / OIDC integration",
            shortcut: "S then K",
            requiredPermission: [
              "security.sso.view",
              "security.sso.manage",
              "organizations.update",
            ],
          },
          {
            id: "oauth",
            title: "API Keys & OAuth",
            translationKey: "nav.org_oauth",
            href: "/settings/oauth",
            icon: Webhook,
            description: "Gateway integration credentials",
            shortcut: "S then O",
            requiredPermission: [
              "organizations.webhooks.manage",
              "feature.integration.open_api",
              "organizations.update",
            ],
          },
        ],
      },
    ],
  },
  integrations: {
    headerTitle: "Developer & API",
    translationKey: "nav.tenant_integrations",
    headerSubtitle: "REST API keys & real-time webhooks",
    icon: Webhook,
    sections: [
      {
        items: [
          {
            id: "api-keys",
            title: "API Keys",
            translationKey: "nav.developer_api_keys",
            href: "/developer/api-keys",
            icon: Key,
            description: "Programmatic REST API keys",
            shortcut: "D then K",
            requiredPermission: [
              "organizations.webhooks.manage",
              "feature.integration.open_api",
              "organizations.update",
            ],
          },
          {
            id: "webhooks",
            title: "Webhooks",
            translationKey: "nav.developer_webhooks",
            href: "/developer/webhooks",
            icon: Webhook,
            description: "Outbound event notifications",
            shortcut: "D then W",
            requiredPermission: ["organizations.webhooks.manage", "organizations.update"],
          },
          {
            id: "gateways",
            title: "Gateways",
            translationKey: "nav.developer_gateways",
            href: "/integrations",
            icon: Plug,
            description: "Connected services & SMS/S3",
            shortcut: "D then G",
            requiredPermission: [
              "organizations.webhooks.manage",
              "feature.integration.open_api",
              "organizations.update",
            ],
          },
        ],
      },
    ],
  },
};

// ============================================================================
// LAYER 2: PROJECT SCOPE NAVIGATION CONFIG (Re-exported from tenant-project-navigation)
// ============================================================================

export { getProjectNavItems, getProjectSecondaryConfigs } from "./tenant-project-navigation";

