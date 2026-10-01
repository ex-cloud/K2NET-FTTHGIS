import {
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
  ShieldCheck,
  UploadCloud,
  UserPlus,
  Radio,
  Router,
  Users,
  HardDrive,
  Cpu,
  Settings,
} from "lucide-react";
import type { NavItem, SecondarySidebarConfig } from "./tenant-sidebar-navigation";

// ============================================================================
// LAYER 2: PROJECT SCOPE NAVIGATION CONFIG
// ============================================================================

export function getProjectNavItems(projectId: string): NavItem[] {
  return [
    {
      id: "overview",
      title: "Project Overview",
      translationKey: "nav.project_overview",
      href: `/project/${projectId}/overview`,
      icon: LayoutDashboard,
      shortcut: "G then O",
    },
    {
      id: "infrastructure",
      title: "Infrastructure GIS",
      translationKey: "nav.project_infrastructure",
      href: `/project/${projectId}/infrastructure/topology`,
      icon: Map,
      shortcut: "G then I",
      hasSecondarySidebar: true,
    },
    {
      id: "inventory",
      title: "Network Inventory",
      translationKey: "nav.project_inventory",
      href: `/project/${projectId}/inventory/odc`,
      icon: Layers,
      shortcut: "G then N",
      hasSecondarySidebar: true,
    },
    {
      id: "core",
      title: "Core Devices",
      translationKey: "nav.project_core",
      href: `/project/${projectId}/core/olt`,
      icon: Server,
      shortcut: "G then C",
      hasSecondarySidebar: true,
    },
    {
      id: "users",
      title: "Subscribers",
      translationKey: "nav.project_subscribers",
      href: `/project/${projectId}/users/subscribers`,
      icon: UserCheck,
      shortcut: "G then S",
      hasSecondarySidebar: true,
    },
    {
      id: "issues",
      title: "Issues & Maintenance",
      translationKey: "nav.project_issues",
      href: `/project/${projectId}/issues/tickets`,
      icon: AlertTriangle,
      shortcut: "G then T",
      hasSecondarySidebar: true,
    },
    {
      id: "settings",
      title: "Project Settings",
      translationKey: "nav.project_settings",
      href: `/project/${projectId}/settings/general`,
      icon: Settings,
      shortcut: "G then ,",
      hasSecondarySidebar: true,
    },
  ];
}

function getInfrastructureConfig(projectId: string): SecondarySidebarConfig {
  return {
    headerTitle: "GIS Infrastructure",
    translationKey: "nav.project_infrastructure",
    headerSubtitle: "Visualisasi spasial & topologi",
    icon: Map,
    sections: [
      {
        items: [
          {
            id: "topology",
            title: "Topologi Jaringan Peta",
            translationKey: "nav.infra_topology",
            href: `/project/${projectId}/infrastructure/topology`,
            icon: Network,
            description: "Peta MapLibre & MVT Vector Tiles",
            shortcut: "S then T",
          },
          {
            id: "heatmap",
            title: "Heatmap Redaman Sinyal",
            translationKey: "nav.infra_heatmap",
            href: `/project/${projectId}/infrastructure/heatmap`,
            icon: Flame,
            description: "Distribusi dBm & optical attenuation",
            shortcut: "S then H",
          },
          {
            id: "canvas",
            title: "Desain Canvas Jalur",
            translationKey: "nav.infra_canvas",
            href: `/project/${projectId}/infrastructure/canvas`,
            icon: PenTool,
            description: "Editor CAD & perancangan jalur kabel",
            shortcut: "S then C",
          },
        ],
      },
    ],
  };
}

function getInventoryConfig(projectId: string): SecondarySidebarConfig {
  return {
    headerTitle: "Network Inventory",
    translationKey: "nav.project_inventory",
    headerSubtitle: "Katalog aset fisik FTTH",
    icon: Layers,
    sections: [
      {
        items: [
          {
            id: "odc",
            title: "Data ODC (Kabin)",
            translationKey: "nav.inv_odc",
            href: `/project/${projectId}/inventory/odc`,
            icon: Layers,
            description: "Optical Distribution Cabinet & splitters",
            shortcut: "S then 1",
          },
          {
            id: "odp",
            title: "Data ODP (Kotak)",
            translationKey: "nav.inv_odp",
            href: `/project/${projectId}/inventory/odp`,
            icon: Radio,
            description: "Optical Distribution Point & port drop",
            shortcut: "S then 2",
          },
          {
            id: "cable",
            title: "Kabel Fiber Optik",
            translationKey: "nav.inv_cable",
            href: `/project/${projectId}/inventory/cable`,
            icon: Network,
            description: "Feeder, distribusi, drop & span meter",
            shortcut: "S then 3",
          },
          {
            id: "customers",
            title: "Database Pelanggan",
            translationKey: "nav.inv_customers",
            href: `/project/${projectId}/inventory/customers`,
            icon: UserCheck,
            description: "Homepass, sambungan ODP & signal dBm",
            shortcut: "S then 4",
          },
          {
            id: "boq",
            title: "Kalkulator BOQ Otomatis",
            translationKey: "nav.inv_boq",
            href: `/project/${projectId}/inventory/boq`,
            icon: FileSpreadsheet,
            description: "Bill of Quantities & estimasi material",
            shortcut: "S then 5",
          },
        ],
      },
    ],
  };
}

function getCoreConfig(projectId: string): SecondarySidebarConfig {
  return {
    headerTitle: "Core Devices",
    translationKey: "nav.project_core",
    headerSubtitle: "Perangkat transmisi utama",
    icon: Server,
    sections: [
      {
        items: [
          {
            id: "olt",
            title: "Perangkat OLT",
            translationKey: "nav.core_olt",
            href: `/project/${projectId}/core/olt`,
            icon: HardDrive,
            description: "GPON/EPON OLT, uplink & SNMP",
            shortcut: "S then O",
          },
          {
            id: "routers",
            title: "Router & Switch",
            translationKey: "nav.core_routers",
            href: `/project/${projectId}/core/routers`,
            icon: Router,
            description: "Core routers, BGP & aggregation",
            shortcut: "S then R",
          },
          {
            id: "servers",
            title: "Server & NMS",
            translationKey: "nav.core_servers",
            href: `/project/${projectId}/core/servers`,
            icon: Cpu,
            description: "Poller engine & radius telemetry",
            shortcut: "S then S",
          },
        ],
      },
    ],
  };
}

function getUsersConfig(projectId: string): SecondarySidebarConfig {
  return {
    headerTitle: "Subscribers & Roles",
    translationKey: "nav.project_subscribers",
    headerSubtitle: "Manajemen pengguna & pelanggan",
    icon: UserCheck,
    sections: [
      {
        items: [
          {
            id: "subscribers",
            title: "Daftar Pelanggan Aktif",
            translationKey: "nav.subscribers_list",
            href: `/project/${projectId}/users/subscribers`,
            icon: UserCheck,
            description: "Status ONT, PPPoE & rx signal gauge",
            shortcut: "S then C",
          },
          {
            id: "roles",
            title: "Peran Akses Proyek",
            translationKey: "nav.project_roles",
            href: `/project/${projectId}/users/roles`,
            icon: ShieldCheck,
            description: "Izin operator, teknisi & surveyor",
            shortcut: "S then R",
          },
        ],
      },
    ],
  };
}

function getIssuesConfig(projectId: string): SecondarySidebarConfig {
  return {
    headerTitle: "Issues & Maintenance",
    translationKey: "nav.project_issues",
    headerSubtitle: "Gangguan & penugasan lapangan",
    icon: AlertTriangle,
    sections: [
      {
        items: [
          {
            id: "tickets",
            title: "Trouble Tickets",
            translationKey: "nav.trouble_tickets",
            href: `/project/${projectId}/issues/tickets`,
            icon: AlertTriangle,
            description: "Tiket putus kabel & redaman tinggi",
            shortcut: "S then T",
          },
          {
            id: "dispatcher",
            title: "Dispatcher Tugas Lapangan",
            translationKey: "nav.field_dispatcher",
            href: `/project/${projectId}/issues/dispatcher`,
            icon: UserPlus,
            description: "Penugasan teknisi JIT & geo-fencing",
            shortcut: "S then D",
          },
        ],
      },
    ],
  };
}

function getSettingsConfig(projectId: string): SecondarySidebarConfig {
  return {
    headerTitle: "Project Settings",
    translationKey: "nav.project_settings",
    headerSubtitle: "Konfigurasi & import proyek",
    icon: Settings,
    sections: [
      {
        items: [
          {
            id: "general",
            title: "Pengaturan Proyek",
            translationKey: "nav.project_general",
            href: `/project/${projectId}/settings/general`,
            icon: Settings,
            description: "Nama, deskripsi, polygon batas area",
            shortcut: "S then G",
          },
          {
            id: "members",
            title: "Anggota & Tim Proyek",
            translationKey: "nav.project_members",
            href: `/project/${projectId}/settings/members`,
            icon: Users,
            description: "Penetapan hak akses ABAC spasial",
            shortcut: "S then M",
          },
          {
            id: "import",
            title: "Import Data GIS & KML",
            translationKey: "nav.project_import",
            href: `/project/${projectId}/settings/import`,
            icon: UploadCloud,
            description: "Upload GeoJSON, KML & Shapefile",
            shortcut: "S then I",
          },
        ],
      },
    ],
  };
}

export function getProjectSecondaryConfigs(projectId: string): Record<string, SecondarySidebarConfig> {
  return {
    infrastructure: getInfrastructureConfig(projectId),
    inventory: getInventoryConfig(projectId),
    core: getCoreConfig(projectId),
    users: getUsersConfig(projectId),
    issues: getIssuesConfig(projectId),
    settings: getSettingsConfig(projectId),
  };
}
