import { 
  Zap, 
  Layers, 
  Database, 
  ShieldCheck, 
  LucideIcon 
} from "lucide-react";

export type AiTabType = "KNOWLEDGE" | "SIMULATOR" | "TEMPLATES" | "UPLOAD" | "MANUAL" | "CONFIG";

export interface CategoryItem {
  id: string;
  label: string;
  color?: string;
}

export const CATEGORIES: CategoryItem[] = [
  { id: "ALL", label: "Semua Kategori" },
  { id: "TROUBLESHOOTING", label: "Troubleshooting OLT/Optical", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { id: "NETWORK_CONFIG", label: "Arsitektur & Jaringan", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  { id: "GIS_MANUAL", label: "GIS & Survey Spasial", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { id: "INFRASTRUCTURE", label: "DevOps & Server", color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  { id: "PLANS", label: "Plans & Roadmap", color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
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
    description: "Prosedur penanganan alarm LOS, verifikasi optical power SFP, dan diagnosa ONU offline.",
    content: `# SOP Penanganan Alarm OLT ZTE C320 — Status PON LOS

## 1. Identifikasi Awal
- **Gejala**: Alarm LOS (Loss of Signal) menyala pada kartu GTGO/GTGH.
- **Dampak**: Seluruh ONU pada port PON terkait offline.

## 2. Langkah Diagnosa CLI
\`\`\`bash
# Masuk ke mode privilege OLT
enable
show gpon onu state gpon-olt_1/1/1
show pon power attenuation gpon-olt_1/1/1
\`\`\`

## 3. Ambang Batas Optical Power
- Batas Minimum Sensitivitas: **-27.0 dBm**
- Batas Ideal: **-15.0 s/d -22.0 dBm**
- Batas Saturasi (Overload): **-8.0 dBm**

## 4. Tindakan Korektif
1. Lakukan pengukuran daya dengan Optical Power Meter (OPM) di port ODF.
2. Jika daya di bawah -27 dBm, periksa kabel patchcord dan konektor SC/UPC (bersihkan dengan alcohol swab).
3. Jika sinyal mati total (0 mW), lakukan OTDR tracing dari feeder ODC menuju OLT.`,
  },
  {
    id: "link-budget-gpon",
    title: "Standar Optical Link Budget & Redaman GPON 1:64",
    category: "NETWORK_CONFIG",
    icon: Layers,
    description: "Kalkulasi batas redaman nominal splitter, redaman kabel/km, dan splicing loss.",
    content: `# Standar Optical Link Budget FTTH GPON (Rasio 1:64)

## 1. Parameter Redaman Pasif (Passive Loss)
- **Kabel Fiber G.652.D (1310nm / 1490nm)**: 0.35 dB/km
- **Sambungan Fusion Splicing**: Maks 0.05 dB per titik sambung
- **Konektor Adaptor SC/APC**: Maks 0.3 dB per pasang

## 2. Redaman Nominal Optical Splitter (PLC)
| Rasio Splitter | Redaman Nominal | Redaman Toleransi Max |
| :--- | :--- | :--- |
| **Splitter 1:2** | 3.0 dB | 3.5 dB |
| **Splitter 1:4** | 6.8 dB | 7.2 dB |
| **Splitter 1:8** | 10.2 dB | 10.5 dB |
| **Splitter 1:16** | 13.5 dB | 14.0 dB |
| **Splitter 1:64** | 20.1 dB | 20.5 dB |

## 3. Rumus Link Budget Total
\`\`\`
Total Loss = (Panjang Kabel × 0.35) + (N Splicing × 0.05) + (N Konektor × 0.3) + Splitter Loss + Safety Margin (3 dB)
\`\`\``,
  },
  {
    id: "postgis-odp-guide",
    title: "Panduan Spasial PostGIS EPSG:4326 & ODP Placement",
    category: "GIS_MANUAL",
    icon: Database,
    description: "Aturan SRID spasial, toleransi radius survey 50m, dan integrasi Leaflet/MapLibre.",
    content: `# Panduan Basis Data Spasial PostGIS & Penempatan ODP

## 1. Aturan Koordinat (Spatial Reference System)
- **SRID Wajib**: \`EPSG:4326\` (WGS 84 Koordinat Bujur/Lintang derajat desimal).
- **Tipe Data Titik**: \`GEOMETRY(Point, 4326)\` untuk Pole, ODP, ODC, dan Pelanggan.
- **Tipe Data Jalur**: \`GEOMETRY(LineString, 4326)\` untuk Kabel Feeder dan Distribusi.

## 2. Aturan Penempatan ODP (Optical Distribution Point)
1. **Radius Layanan Maksimum**: Jarak kabel drop-core dari ODP ke rumah pelanggan tidak boleh melebihi **150 meter**.
2. **Kapasitas Port**:
   - ODP-8 (Splitter 1:8): Area pemukiman padat sedang.
   - ODP-16 (Splitter 1:16): Area perumahan klaster / ruko.
3. **Kueri PostGIS Radius Terdekat**:
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
    description: "Arsitektur 3 lapis backup database, MinIO S3, dan replikasi offsite Nextcloud.",
    content: `# Standar Operasional Backup 3-Layer K2NET Enterprise

## 1. Arsitektur 3 Lapis (Disaster Recovery)
1. **Layer 1 (Local NVMe Storage)**: \`/opt/project5/backups/\` — Retensi 7 hari lokal untuk recovery instan (< 5 menit).
2. **Layer 2 (On-Premise MinIO S3)**: Port \`9005\` Tailscale — Bucket \`db-backups\`, \`code-backups\`, \`docker-backups\`.
3. **Layer 3 (Offsite Cloud Nextcloud WebDAV)**: Replikasi terenkripsi harian via rclone ke Nextcloud Server.

## 2. Jadwal Crontab Server
- \`00:00\` — Dump PostgreSQL \`ftth_gis\` & \`keycloak_db\` (\`backup.sh\`)
- \`01:00\` — Arsip MinIO S3 Snapshot (\`backup-minio.sh\`)
- \`02:00\` — Backup Snapshot Source Code & Config (\`backup-code.sh\`)
- \`04:00\` — Sinkronisasi Offsite Cloud Nextcloud (\`sync-nextcloud.sh\`)

## 3. Verifikasi Integritas Backup
Jalankan verifikasi status backup melalui endpoint:
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
