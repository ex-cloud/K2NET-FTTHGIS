import {
  Zap,
  MapPin,
  Activity,
  Database,
  GitPullRequest,
  ShieldCheck,
  Flame,
  Sparkles,
  Cpu,
  Layers,
  HelpCircle,
} from "lucide-react";

export const AVAILABLE_ICONS = [
  { id: "Zap", label: "Zap (Listrik/Optik)", icon: Zap },
  { id: "MapPin", label: "MapPin (Spasial/GIS)", icon: MapPin },
  { id: "Activity", label: "Activity (Health/Metrics)", icon: Activity },
  { id: "Database", label: "Database (Storage/Backup)", icon: Database },
  { id: "GitPullRequest", label: "Git / Task (DevOps)", icon: GitPullRequest },
  { id: "ShieldCheck", label: "Shield (Security/RBAC)", icon: ShieldCheck },
  { id: "Flame", label: "Flame (Trending/Popular)", icon: Flame },
  { id: "Sparkles", label: "Sparkles (AI/Smart)", icon: Sparkles },
  { id: "Cpu", label: "Cpu (Hardware/Server)", icon: Cpu },
  { id: "Layers", label: "Layers (Arsitektur)", icon: Layers },
  { id: "HelpCircle", label: "Help (Bantuan/FAQ)", icon: HelpCircle },
];

export const PROMPT_CATEGORIES = [
  { id: "ALL", label: "Semua Kategori" },
  { id: "OLT_TROUBLESHOOTING", label: "OLT & Redaman Optik" },
  { id: "GIS_SPATIAL", label: "GIS Spasial & ODP" },
  { id: "DEVOPS_INFRA", label: "DevOps & Infrastruktur" },
  { id: "BACKUP_RECOVERY", label: "Backup & Pemulihan" },
  { id: "RBAC_SECURITY", label: "Keamanan & Multi-Tenant" },
  { id: "GENERAL", label: "Umum / Bantuan" },
];

export const PROMPT_ROLES = [
  { id: "ALL", label: "Semua Pengguna (Global)" },
  { id: "SUPER_ADMIN", label: "Super Admin Only" },
  { id: "TENANT_ADMIN", label: "Tenant Admin" },
  { id: "TECHNICIAN", label: "Teknisi Lapangan" },
];
