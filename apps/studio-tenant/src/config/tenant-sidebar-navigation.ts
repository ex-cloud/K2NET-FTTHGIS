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
    href: "/billing",
    icon: CreditCard,
    shortcut: "G then B",
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
  team: {
    headerTitle: "Team Management",
    translationKey: "nav.tenant_team",
    headerSubtitle: "Kelola anggota & peran organisasi",
    icon: Users,
    sections: [
      {
        items: [
          {
            id: "members",
            title: "Anggota Tim",
            translationKey: "nav.team_members",
            href: "/team/members",
            icon: Users,
            description: "Daftar pengguna & undangan aktif",
            shortcut: "S then M",
          },
          {
            id: "roles",
            title: "Peran & Izin",
            translationKey: "nav.team_roles",
            href: "/team/roles",
            icon: ShieldCheck,
            description: "Hak akses PBAC organisasi",
            shortcut: "S then R",
          },
          {
            id: "activity",
            title: "Riwayat Aktivitas",
            translationKey: "nav.team_activity",
            href: "/team/activity",
            icon: History,
            description: "Log audit tindakan anggota",
            shortcut: "S then A",
          },
        ],
      },
    ],
  },
  settings: {
    headerTitle: "Organization Settings",
    translationKey: "nav.tenant_settings",
    headerSubtitle: "Konfigurasi instansi & kepatuhan",
    icon: Settings,
    sections: [
      {
        title: "Pengaturan Umum",
        translationKey: "nav.general_settings",
        items: [
          {
            id: "general",
            title: "Profil Instansi",
            translationKey: "nav.org_profile",
            href: "/settings/general",
            icon: Building,
            description: "Nama, domain & kontak resmi",
            shortcut: "S then G",
          },
          {
            id: "branding",
            title: "Kustomisasi & Logo",
            translationKey: "nav.org_branding",
            href: "/settings/branding",
            icon: PenTool,
            description: "Identitas visual & logo tenant",
            shortcut: "S then B",
          },
        ],
      },
      {
        title: "Keamanan & Akses",
        translationKey: "nav.security",
        items: [
          {
            id: "security",
            title: "Kebijakan MFA / 2FA",
            translationKey: "nav.org_security",
            href: "/settings/security",
            icon: Shield,
            description: "Autentikasi berlapis & sesi",
            shortcut: "S then S",
          },
          {
            id: "sso",
            title: "Single Sign-On (SSO)",
            translationKey: "nav.org_sso",
            href: "/settings/sso",
            icon: Key,
            description: "Integrasi SAML / OIDC Keycloak",
            shortcut: "S then K",
          },
          {
            id: "oauth",
            title: "API Keys & OAuth",
            translationKey: "nav.org_oauth",
            href: "/settings/oauth",
            icon: Webhook,
            description: "Kredensial integrasi gateway",
            shortcut: "S then O",
          },
          {
            id: "audit-logs",
            title: "Audit Trail",
            translationKey: "nav.org_audit_logs",
            href: "/settings/audit-logs",
            icon: History,
            description: "Log kepatuhan & rekam jejak",
            shortcut: "S then L",
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

