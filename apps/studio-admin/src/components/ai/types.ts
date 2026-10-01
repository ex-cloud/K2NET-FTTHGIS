import { 
  Zap, 
  Layers, 
  Database, 
  ShieldCheck, 
  type LucideIcon,
  Lock,
  Building2,
  Globe2,
  CheckCircle2,
  Clock,
  FileEdit,
  XCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";
import type { AiDocumentItem } from "@/lib/actions/gateways";
export type { AiDocumentItem };


export type AiTabType = "KNOWLEDGE" | "GRAPH" | "ADD_KNOWLEDGE" | "SIMULATOR" | "TEMPLATES" | "CONFIG";

export type KnowledgeScope = "PLATFORM_INTERNAL" | "TENANT_INTERNAL" | "GLOBAL";

export type KnowledgeStatus = "INDEXED" | "PENDING_REVIEW" | "DRAFT" | "PROCESSING" | "PENDING" | "REJECTED" | "FAILED";

export interface ScopeItem {
  id: KnowledgeScope;
  label: string;
  shortLabel: string;
  badge: string;
  description: string;
  icon: LucideIcon;
  color: string;
  accentBorder: string;
  accentBg: string;
}

export const KNOWLEDGE_SCOPES: ScopeItem[] = [
  {
    id: "PLATFORM_INTERNAL",
    label: "Platform Internal (Super Admin)",
    shortLabel: "Platform Super Admin",
    badge: "Super Admin Only",
    description: "Confidential internal K2NET documents (DRP, Kong/Traefik Server Architecture, Topology Host, Keycloak IAM). Strictly isolated from tenants.",
    icon: Lock,
    color: "text-rose-500 dark:text-rose-400",
    accentBorder: "border-rose-500/30",
    accentBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  {
    id: "TENANT_INTERNAL",
    label: "ISP Partner / Tenant Internal (NOC & Technicians)",
    shortLabel: "Tenant NOC ISP",
    badge: "ISP Partner Scope",
    description: "Technical documents specifically for Tenant NOC technicians (OLT ZTE/Huawei optical attenuation SOP, FO splicing guide, LOS alarm troubleshooting).",
    icon: Building2,
    color: "text-sky-500 dark:text-sky-400",
    accentBorder: "border-sky-500/30",
    accentBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    id: "GLOBAL",
    label: "Public / Global (All Users)",
    shortLabel: "Global / General",
    badge: "Global Knowledge",
    description: "General knowledge accessible to all users (GIS User Manual, FTTH Glossary, General Application Guide).",
    icon: Globe2,
    color: "text-primary",
    accentBorder: "border-primary/30",
    accentBg: "bg-primary/10 text-primary",
  },
];

export interface StatusItem {
  id: KnowledgeStatus;
  label: string;
  badge: string;
  icon: LucideIcon;
  color: string;
}

export const STATUS_ITEMS: Record<KnowledgeStatus, StatusItem> = {
  INDEXED: {
    id: "INDEXED",
    label: "Indexed & Active",
    badge: "bg-primary/10 text-primary border-primary/20",
    icon: CheckCircle2,
    color: "text-primary",
  },
  PENDING_REVIEW: {
    id: "PENDING_REVIEW",
    label: "Pending Review",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Clock,
    color: "text-amber-500",
  },
  DRAFT: {
    id: "DRAFT",
    label: "Draft Revision",
    badge: "bg-muted text-muted-foreground border-border",
    icon: FileEdit,
    color: "text-muted-foreground",
  },
  PROCESSING: {
    id: "PROCESSING",
    label: "Processing Vectors",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: Loader2,
    color: "text-blue-500",
  },
  PENDING: {
    id: "PENDING",
    label: "Index Queue",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Clock,
    color: "text-amber-500",
  },
  REJECTED: {
    id: "REJECTED",
    label: "Rejected / Draft",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    icon: XCircle,
    color: "text-destructive",
  },
  FAILED: {
    id: "FAILED",
    label: "Index Failed",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    icon: AlertTriangle,
    color: "text-destructive",
  },
};

export interface CategoryItem {
  id: string;
  label: string;
  color?: string;
}

export const CATEGORIES: CategoryItem[] = [
  { id: "ALL", label: "All Categories" },
  { id: "TROUBLESHOOTING", label: "Troubleshooting OLT/Optical", color: "text-amber-500 dark:text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { id: "NETWORK_CONFIG", label: "Architecture & Networking", color: "text-sky-500 dark:text-sky-400 border-sky-500/30 bg-sky-500/10" },
  { id: "GIS_MANUAL", label: "GIS & Spatial Survey", color: "text-primary border-primary/30 bg-primary/10" },
  { id: "INFRASTRUCTURE", label: "DevOps & Infrastructure", color: "text-purple-500 dark:text-purple-400 border-purple-500/30 bg-purple-500/10" },
  { id: "PLANS", label: "Plans & Roadmap", color: "text-cyan-500 dark:text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
  { id: "GENERAL", label: "General & SOP", color: "text-foreground/80 border-border bg-muted/60" },
];

export interface KnowledgeTemplateItem {
  id: string;
  title: string;
  category: string;
  icon: LucideIcon;
  description: string;
  content: string;
}

export const KNOWLEDGE_TEMPLATES: KnowledgeTemplateItem[] = [
  {
    id: "olt-troubleshooting",
    title: "SOP Troubleshooting OLT ZTE C320 (PON LOS)",
    category: "TROUBLESHOOTING",
    icon: Zap,
    description: "Procedures for handling LOS alarms, SFP optical power verification, and offline ONU diagnostics.",
    content: `# SOP Alarm Handling for OLT ZTE C320 — PON LOS Status

## 1. Initial Identification
- **Symptom**: LOS (Loss of Signal) alarm illuminated on the GTGO/GTGH card.
- **Impact**: All ONUs connected to the corresponding PON port are offline.

## 2. CLI Diagnostic Steps
\`\`\`bash
# Enter OLT privilege mode
enable
show gpon onu state gpon-olt_1/1/1
show pon power attenuation gpon-olt_1/1/1
\`\`\`

## 3. Optical Power Thresholds
- Minimum Sensitivity Threshold: **-27.0 dBm**
- Ideal Operating Range: **-15.0 to -22.0 dBm**
- Saturation (Overload) Threshold: **-8.0 dBm**

## 4. Corrective Actions
1. Perform power measurements using an Optical Power Meter (OPM) at the ODF port.
2. If power is below -27 dBm, inspect patch cords and SC/UPC connectors (clean with alcohol swab).
3. If signal is completely absent (0 mW), conduct OTDR tracing from feeder ODC toward the OLT.`,
  },
  {
    id: "link-budget-gpon",
    title: "Optical Link Budget & GPON 1:64 Attenuation Standard",
    category: "NETWORK_CONFIG",
    icon: Layers,
    description: "Calculations for nominal splitter attenuation, cable loss per km, and fusion splicing loss.",
    content: `# Optical Link Budget Standards for FTTH GPON (1:64 Ratio)

## 1. Passive Attenuation Parameters (Passive Loss)
- **Fiber Cable G.652.D (1310nm / 1490nm)**: 0.35 dB/km
- **Fusion Splicing Joint**: Max 0.05 dB per splice point
- **SC/APC Connector Adaptor**: Max 0.3 dB per mated pair

## 2. Nominal Optical Splitter Attenuation (PLC)
| Splitter Ratio | Nominal Loss | Max Tolerance Loss |
| :--- | :--- | :--- |
| **Splitter 1:2** | 3.0 dB | 3.5 dB |
| **Splitter 1:4** | 6.8 dB | 7.2 dB |
| **Splitter 1:8** | 10.2 dB | 10.5 dB |
| **Splitter 1:16** | 13.5 dB | 14.0 dB |
| **Splitter 1:64** | 20.1 dB | 20.5 dB |

## 3. Total Link Budget Formula
\`\`\`
Total Loss = (Cable Length × 0.35) + (Splice Count × 0.05) + (Connector Count × 0.3) + Splitter Loss + Safety Margin (3 dB)
\`\`\``,
  },
  {
    id: "postgis-odp-guide",
    title: "PostGIS EPSG:4326 Spatial Guide & ODP Placement",
    category: "GIS_MANUAL",
    icon: Database,
    description: "Spatial SRID rules, 150m service radius tolerance, and PostGIS distance queries.",
    content: `# PostGIS Spatial Database Guide & ODP Placement

## 1. Coordinate System Rules (Spatial Reference System)
- **Mandatory SRID**: \`EPSG:4326\` (WGS 84 Longitude/Latitude decimal degrees).
- **Point Data Types**: \`GEOMETRY(Point, 4326)\` for Pole, ODP, ODC, and Customer Premise.
- **Line Data Types**: \`GEOMETRY(LineString, 4326)\` for Feeder and Distribution cables.

## 2. ODP (Optical Distribution Point) Placement Rules
1. **Maximum Service Radius**: Drop-core cable distance from ODP to customer premise must not exceed **150 meters**.
2. **Port Capacity Guidelines**:
   - ODP-8 (Splitter 1:8): Medium-density residential clusters.
   - ODP-16 (Splitter 1:16): High-density housing estates / commercial shophouses.
3. **Nearest PostGIS Distance Query**:
\`\`\`sql
SELECT id, code, name, ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(106.8456, -6.2088), 4326)::geography) AS distance_meters
FROM ftth_odp
WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(106.8456, -6.2088), 4326)::geography, 150)
ORDER BY distance_meters ASC;
\`\`\``,
  },
  {
    id: "disaster-recovery",
    title: "Disaster Recovery 3-Layer Backup & Nextcloud WebDAV",
    category: "INFRASTRUCTURE",
    icon: ShieldCheck,
    description: "3-Layer backup architecture for databases, MinIO S3, and offsite Nextcloud replication.",
    content: `# K2NET Enterprise 3-Layer Backup Standard Operating Procedure

## 1. 3-Layer Disaster Recovery Architecture
1. **Layer 1 (Local NVMe Storage)**: \`/opt/project5/backups/\` — 7-day local retention for rapid restoration (< 5 min).
2. **Layer 2 (On-Premise MinIO S3)**: Port \`9005\` Tailscale — Buckets \`db-backups\`, \`code-backups\`, \`docker-backups\`.
3. **Layer 3 (Offsite Cloud Nextcloud WebDAV)**: Daily encrypted replication via rclone to Nextcloud Server.

## 2. Server Crontab Schedule
- \`00:00\` — PostgreSQL dump for \`ftth_gis\` & \`keycloak_db\` (\`backup.sh\`)
- \`01:00\` — MinIO S3 snapshot archive (\`backup-minio.sh\`)
- \`02:00\` — Source code & configuration snapshot (\`backup-code.sh\`)
- \`04:00\` — Offsite Cloud Nextcloud synchronization (\`sync-nextcloud.sh\`)

## 3. Backup Integrity Verification
Verify backup snapshot status via the REST API endpoint:
\`\`\`bash
GET /api/v1/system/devops-stats
\`\`\``,
  },
];

export function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
