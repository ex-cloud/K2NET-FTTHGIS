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
  PenTool,
  Shield,
  Key,
  Receipt,
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
  requiredPermission?: string;
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
  requiredPermission?: string;
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
  },
  {
    id: "team",
    title: "Team",
    translationKey: "nav.tenant_team",
    href: "/team/members",
    icon: Users,
    shortcut: "G then M",
    hasSecondarySidebar: true,
  },
  {
    id: "integrations",
    title: "Integrations",
    translationKey: "nav.tenant_integrations",
    href: "/integrations",
    icon: Webhook,
    shortcut: "G then I",
  },
  {
    id: "usage",
    title: "Usage",
    translationKey: "nav.tenant_usage",
    href: "/usage",
    icon: Activity,
    shortcut: "G then U",
  },
  {
    id: "billing",
    title: "Billing",
    translationKey: "nav.tenant_billing",
    href: "/billing/license",
    icon: CreditCard,
    shortcut: "G then B",
    hasSecondarySidebar: true,
  },
  {
    id: "audit-logs",
    title: "Audit Trail",
    translationKey: "nav.tenant_audit_logs",
    href: "/audit-logs",
    icon: History,
    shortcut: "G then A",
    requiredPermission: "organization.audit.view",
  },
  {
    id: "settings",
    title: "Settings",
    translationKey: "nav.tenant_settings",
    href: "/settings/general",
    icon: Settings,
    shortcut: "G then ,",
    hasSecondarySidebar: true,
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
          },
          {
            id: "quotas",
            title: "Quota Utilization",
            translationKey: "nav.billing_quota_utilization",
            href: "/billing/quotas",
            icon: Activity,
            description: "OLT, ODP, Storage & API limits",
            shortcut: "S then Q",
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
          },
          {
            id: "invoices",
            title: "Billing Invoices",
            translationKey: "nav.billing_invoices_history",
            href: "/billing/invoices",
            icon: Receipt,
            description: "Official invoices & payment receipts",
            shortcut: "S then I",
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
          },
          {
            id: "roles",
            title: "Roles & Permissions",
            translationKey: "nav.team_roles",
            href: "/team/roles",
            icon: ShieldCheck,
            description: "Organization PBAC access rights",
            shortcut: "S then R",
          },
          {
            id: "activity",
            title: "Activity History",
            translationKey: "nav.team_activity",
            href: "/team/activity",
            icon: History,
            description: "Member action audit logs",
            shortcut: "S then A",
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
            title: "Instance Profile",
            translationKey: "nav.org_profile",
            href: "/settings/general",
            icon: Building,
            description: "Name, domain & official contacts",
            shortcut: "S then G",
          },
          {
            id: "branding",
            title: "Customization & Logo",
            translationKey: "nav.org_branding",
            href: "/settings/branding",
            icon: PenTool,
            description: "Visual identity & tenant logo",
            shortcut: "S then B",
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
          },
          {
            id: "sso",
            title: "Single Sign-On (SSO)",
            translationKey: "nav.org_sso",
            href: "/settings/sso",
            icon: Key,
            description: "Keycloak SAML / OIDC integration",
            shortcut: "S then K",
          },
          {
            id: "oauth",
            title: "API Keys & OAuth",
            translationKey: "nav.org_oauth",
            href: "/settings/oauth",
            icon: Webhook,
            description: "Gateway integration credentials",
            shortcut: "S then O",
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

