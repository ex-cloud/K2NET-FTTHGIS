import {
  FolderKanban,
  Users,
  Webhook,
  Activity,
  CreditCard,
  Settings,
  LayoutDashboard,
  Map,
  Layers,
  Server,
  UserCheck,
  AlertTriangle,
  FileSpreadsheet,
  Network,
  Flame,
  PenTool,
  Shield,
  Key,
  ShieldCheck,
  Building,
  UploadCloud,
  UserPlus,
  Radio,
  Router,
  History,
  HardDrive,
  Cpu,
  type LucideIcon,
} from "lucide-react";

export interface SubMenuItem {
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  badge?: string;
  requiredPermission?: string;
}

export interface SecondarySidebarSection {
  title?: string;
  items: SubMenuItem[];
}

export interface SecondarySidebarConfig {
  headerTitle: string;
  headerSubtitle?: string;
  icon: LucideIcon;
  sections: SecondarySidebarSection[];
}

export interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
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
    href: "/projects",
    icon: FolderKanban,
  },
  {
    id: "team",
    title: "Team",
    href: "/team/members",
    icon: Users,
    hasSecondarySidebar: true,
  },
  {
    id: "integrations",
    title: "Integrations",
    href: "/integrations",
    icon: Webhook,
  },
  {
    id: "usage",
    title: "Usage",
    href: "/usage",
    icon: Activity,
  },
  {
    id: "billing",
    title: "Billing",
    href: "/billing",
    icon: CreditCard,
  },
  {
    id: "settings",
    title: "Settings",
    href: "/settings/general",
    icon: Settings,
    hasSecondarySidebar: true,
  },
];

export const ORG_SECONDARY_CONFIGS: Record<string, SecondarySidebarConfig> = {
  team: {
    headerTitle: "Team Management",
    headerSubtitle: "Kelola anggota & peran organisasi",
    icon: Users,
    sections: [
      {
        items: [
          {
            id: "members",
            title: "Anggota Tim",
            href: "/team/members",
            icon: Users,
            description: "Daftar pengguna & undangan aktif",
          },
          {
            id: "roles",
            title: "Peran & Izin",
            href: "/team/roles",
            icon: ShieldCheck,
            description: "Hak akses PBAC organisasi",
          },
          {
            id: "activity",
            title: "Riwayat Aktivitas",
            href: "/team/activity",
            icon: History,
            description: "Log audit tindakan anggota",
          },
        ],
      },
    ],
  },
  settings: {
    headerTitle: "Organization Settings",
    headerSubtitle: "Konfigurasi instansi & kepatuhan",
    icon: Settings,
    sections: [
      {
        title: "Pengaturan Umum",
        items: [
          {
            id: "general",
            title: "Profil Instansi",
            href: "/settings/general",
            icon: Building,
            description: "Nama, domain & kontak resmi",
          },
          {
            id: "branding",
            title: "Kustomisasi & Logo",
            href: "/settings/branding",
            icon: PenTool,
            description: "Identitas visual & logo tenant",
          },
        ],
      },
      {
        title: "Keamanan & Akses",
        items: [
          {
            id: "security",
            title: "Kebijakan MFA / 2FA",
            href: "/settings/security",
            icon: Shield,
            description: "Autentikasi berlapis & sesi",
          },
          {
            id: "sso",
            title: "Single Sign-On (SSO)",
            href: "/settings/sso",
            icon: Key,
            description: "Integrasi SAML / OIDC Keycloak",
          },
          {
            id: "oauth",
            title: "API Keys & OAuth",
            href: "/settings/oauth",
            icon: Webhook,
            description: "Kredensial integrasi gateway",
          },
          {
            id: "audit-logs",
            title: "Audit Trail",
            href: "/settings/audit-logs",
            icon: History,
            description: "Log kepatuhan & rekam jejak",
          },
        ],
      },
    ],
  },
};

// ============================================================================
// LAYER 2: PROJECT SCOPE NAVIGATION CONFIG
// ============================================================================

export function getProjectNavItems(projectId: string): NavItem[] {
  return [
    {
      id: "overview",
      title: "Project Overview",
      href: `/project/${projectId}/overview`,
      icon: LayoutDashboard,
    },
    {
      id: "infrastructure",
      title: "Infrastructure GIS",
      href: `/project/${projectId}/infrastructure/topology`,
      icon: Map,
      hasSecondarySidebar: true,
    },
    {
      id: "inventory",
      title: "Network Inventory",
      href: `/project/${projectId}/inventory/odc`,
      icon: Layers,
      hasSecondarySidebar: true,
    },
    {
      id: "core",
      title: "Core Devices",
      href: `/project/${projectId}/core/olt`,
      icon: Server,
      hasSecondarySidebar: true,
    },
    {
      id: "users",
      title: "Subscribers",
      href: `/project/${projectId}/users/subscribers`,
      icon: UserCheck,
      hasSecondarySidebar: true,
    },
    {
      id: "issues",
      title: "Issues & Maintenance",
      href: `/project/${projectId}/issues/tickets`,
      icon: AlertTriangle,
      hasSecondarySidebar: true,
    },
    {
      id: "settings",
      title: "Project Settings",
      href: `/project/${projectId}/settings/general`,
      icon: Settings,
      hasSecondarySidebar: true,
    },
  ];
}

export function getProjectSecondaryConfigs(projectId: string): Record<string, SecondarySidebarConfig> {
  return {
    infrastructure: {
      headerTitle: "GIS Infrastructure",
      headerSubtitle: "Visualisasi spasial & topologi",
      icon: Map,
      sections: [
        {
          items: [
            {
              id: "topology",
              title: "Topologi Jaringan Peta",
              href: `/project/${projectId}/infrastructure/topology`,
              icon: Network,
              description: "Peta MapLibre & MVT Vector Tiles",
            },
            {
              id: "heatmap",
              title: "Heatmap Redaman Sinyal",
              href: `/project/${projectId}/infrastructure/heatmap`,
              icon: Flame,
              description: "Distribusi dBm & optical attenuation",
            },
            {
              id: "canvas",
              title: "Desain Canvas Jalur",
              href: `/project/${projectId}/infrastructure/canvas`,
              icon: PenTool,
              description: "Editor CAD & perancangan jalur kabel",
            },
          ],
        },
      ],
    },
    inventory: {
      headerTitle: "Network Inventory",
      headerSubtitle: "Katalog aset fisik FTTH",
      icon: Layers,
      sections: [
        {
          items: [
            {
              id: "odc",
              title: "Data ODC (Kabin)",
              href: `/project/${projectId}/inventory/odc`,
              icon: Layers,
              description: "Optical Distribution Cabinet & splitters",
            },
            {
              id: "odp",
              title: "Data ODP (Kotak)",
              href: `/project/${projectId}/inventory/odp`,
              icon: Radio,
              description: "Optical Distribution Point & port drop",
            },
            {
              id: "cable",
              title: "Kabel Fiber Optik",
              href: `/project/${projectId}/inventory/cable`,
              icon: Network,
              description: "Feeder, distribusi, drop & span meter",
            },
            {
              id: "customers",
              title: "Database Pelanggan",
              href: `/project/${projectId}/inventory/customers`,
              icon: UserCheck,
              description: "Homepass, sambungan ODP & signal dBm",
            },
            {
              id: "boq",
              title: "Kalkulator BOQ Otomatis",
              href: `/project/${projectId}/inventory/boq`,
              icon: FileSpreadsheet,
              description: "Bill of Quantities & estimasi material",
            },
          ],
        },
      ],
    },
    core: {
      headerTitle: "Core Devices",
      headerSubtitle: "Perangkat transmisi utama",
      icon: Server,
      sections: [
        {
          items: [
            {
              id: "olt",
              title: "Perangkat OLT",
              href: `/project/${projectId}/core/olt`,
              icon: HardDrive,
              description: "GPON/EPON OLT, uplink & SNMP",
            },
            {
              id: "routers",
              title: "Router & Switch",
              href: `/project/${projectId}/core/routers`,
              icon: Router,
              description: "Core routers, BGP & aggregation",
            },
            {
              id: "servers",
              title: "Server & NMS",
              href: `/project/${projectId}/core/servers`,
              icon: Cpu,
              description: "Poller engine & radius telemetry",
            },
          ],
        },
      ],
    },
    users: {
      headerTitle: "Subscribers & Roles",
      headerSubtitle: "Manajemen pengguna & pelanggan",
      icon: UserCheck,
      sections: [
        {
          items: [
            {
              id: "subscribers",
              title: "Daftar Pelanggan Aktif",
              href: `/project/${projectId}/users/subscribers`,
              icon: UserCheck,
              description: "Status ONT, PPPoE & rx signal gauge",
            },
            {
              id: "roles",
              title: "Peran Akses Proyek",
              href: `/project/${projectId}/users/roles`,
              icon: ShieldCheck,
              description: "Izin operator, teknisi & surveyor",
            },
          ],
        },
      ],
    },
    issues: {
      headerTitle: "Issues & Maintenance",
      headerSubtitle: "Gangguan & penugasan lapangan",
      icon: AlertTriangle,
      sections: [
        {
          items: [
            {
              id: "tickets",
              title: "Trouble Tickets",
              href: `/project/${projectId}/issues/tickets`,
              icon: AlertTriangle,
              description: "Tiket putus kabel & redaman tinggi",
            },
            {
              id: "dispatcher",
              title: "Dispatcher Tugas Lapangan",
              href: `/project/${projectId}/issues/dispatcher`,
              icon: UserPlus,
              description: "Penugasan teknisi JIT & geo-fencing",
            },
          ],
        },
      ],
    },
    settings: {
      headerTitle: "Project Settings",
      headerSubtitle: "Konfigurasi & import proyek",
      icon: Settings,
      sections: [
        {
          items: [
            {
              id: "general",
              title: "Pengaturan Proyek",
              href: `/project/${projectId}/settings/general`,
              icon: Settings,
              description: "Nama, deskripsi, polygon batas area",
            },
            {
              id: "members",
              title: "Anggota & Tim Proyek",
              href: `/project/${projectId}/settings/members`,
              icon: Users,
              description: "Penetapan hak akses ABAC spasial",
            },
            {
              id: "import",
              title: "Import Data GIS & KML",
              href: `/project/${projectId}/settings/import`,
              icon: UploadCloud,
              description: "Upload GeoJSON, KML & Shapefile",
            },
          ],
        },
      ],
    },
  };
}
