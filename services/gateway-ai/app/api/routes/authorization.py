"""
app/api/routes/authorization.py
K2 Agent Onboarding, Strict Multi-Tenant Authorization, and Granular Permission Management
"""

import logging
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, Header, HTTPException
from sqlalchemy import text

from app.db.session import get_db_session
from app.api.dependencies import TenantContext, verify_gateway_and_tenant
from app.models.schemas import (
    AgentAuthorizationResponse,
    AgentAuthorizationRequest,
    PermissionCatalogResponse,
    PermissionDomainGroup,
    PermissionItem,
    RolePresetsResponse,
    RolePresetItem,
)

logger = logging.getLogger("ai_gateway.authorization")

router = APIRouter(prefix="/api/v1/ai/agent", tags=["Agent Authorization & Permissions"])

DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"
DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000"

# ═══════════════════════════════════════════════════════════════════════════════
# 📋 MASTER PERMISSION CATALOG DEFINITIONS (Strictly Scoped)
# ═══════════════════════════════════════════════════════════════════════════════

INTERNAL_DOMAINS: list[PermissionDomainGroup] = [
    PermissionDomainGroup(
        id="devops_infra",
        title="DevOps & Core Infrastructure",
        icon="Cpu",
        description="Observabilitas metrik Docker, JVM Heap, dan manajemen backup sistem",
        target_scope="PLATFORM_INTERNAL",
        permissions=[
            PermissionItem(id="infra:metrics:read", name="Container & Host Metrics", scope="Read", description="Membaca beban CPU, RAM, JVM Heap, dan log service"),
            PermissionItem(id="infra:services:restart", name="Service Restart Action", scope="Write", description="Mengeksekusi restart service terisolasi saat gagal"),
            PermissionItem(id="infra:backup:read", name="Disaster Recovery Status", scope="Read", description="Melihat status snapshot PostgreSQL, MinIO S3, dan Nextcloud"),
            PermissionItem(id="infra:backup:trigger", name="Trigger On-Demand Backup", scope="Write", description="Memicu eksekusi backup database dan sinkronisasi offsite"),
            PermissionItem(id="infra:kong:read", name="Kong Gateway Routes", scope="Read", description="Melihat konfigurasi rute deklaratif Kong API Gateway"),
            PermissionItem(id="infra:kong:reload", name="Kong Route Reload", scope="Write", description="Memicu hot-reload konfigurasi deklaratif Kong"),
        ],
    ),
    PermissionDomainGroup(
        id="noc_telemetry",
        title="Global NOC & Core Network",
        icon="Activity",
        description="Telemetri OLT lintas-regional, link budget optik, dan upstream network",
        target_scope="PLATFORM_INTERNAL",
        permissions=[
            PermissionItem(id="noc:telemetry:global", name="Global OLT Poller Telemetry", scope="Read", description="Melihat status poller OLT global seluruh site internal"),
            PermissionItem(id="noc:poller:diagnose", name="Live Poller Diagnostics", scope="Write", description="Menjalankan tes SNMP/Telnet poller live pada OLT"),
            PermissionItem(id="noc:upstream:monitor", name="Upstream BGP & Transit Link", scope="Read", description="Memonitor utilisasi bandwidth upstream & transit ISP"),
            PermissionItem(id="noc:link:reboot", name="Core Port Reset", scope="Write", description="Trigger reset port uplink antar core switch"),
        ],
    ),
    PermissionDomainGroup(
        id="gis_topology",
        title="GIS Spatial & Topology Audit",
        icon="MapPin",
        description="Audit topologi spasial PostGIS SRID 4326, deviasi koordinat, dan layer peta",
        target_scope="PLATFORM_INTERNAL",
        permissions=[
            PermissionItem(id="gis:topology:audit", name="PostGIS Boundary & Topology Audit", scope="Read", description="Audit overlap boundary antar-tenant dan validasi PostGIS"),
            PermissionItem(id="gis:basemap:manage", name="Global Mapbox / Tiles Layer", scope="Write", description="Mengonfigurasi provider peta global dan styling layer"),
            PermissionItem(id="gis:boundary:validate", name="Regional Territory Boundary", scope="Read", description="Validasi batas teritorial antar-tenant regional"),
            PermissionItem(id="gis:export:master", name="Master Spatial GeoJSON Export", scope="Write", description="Ekspor data jaringan global ke GeoJSON/Shapefile/KML"),
        ],
    ),
    PermissionDomainGroup(
        id="platform_finance",
        title="Platform Revenue & Subscription Ops",
        icon="Database",
        description="Rekapitulasi pendapatan multi-tenant, kuota paket, dan rekonsiliasi Xendit",
        target_scope="PLATFORM_INTERNAL",
        permissions=[
            PermissionItem(id="finance:revenue:read", name="Multi-Tenant SaaS Revenue Recap", scope="Read", description="Melihat rekap pendapatan platform multi-tenant (HQ)"),
            PermissionItem(id="finance:subscription:write", name="Tenant Quota & Tier Limits", scope="Write", description="Mengatur kuota limit tenant (max OLT, max ODP, max user)"),
            PermissionItem(id="finance:reconcile:write", name="Xendit Payout Reconciliation", scope="Write", description="Rekonsiliasi transaksi pembayaran Xendit manual"),
            PermissionItem(id="finance:invoice:audit", name="HQ Tax & Invoice Audit", scope="Read", description="Audit faktur tagihan dan laporan perpajakan SaaS"),
        ],
    ),
    PermissionDomainGroup(
        id="iam_security",
        title="IAM Master & Compliance Audit",
        icon="ShieldCheck",
        description="Keycloak master realm, user security policies, dan audit trail compliance",
        target_scope="PLATFORM_INTERNAL",
        permissions=[
            PermissionItem(id="iam:sessions:read", name="Keycloak User Active Sessions", scope="Read", description="Melihat sesi user Keycloak aktif dan log LOGIN_ERROR"),
            PermissionItem(id="iam:roles:manage", name="RBAC Policy & Role Assignment", scope="Write", description="Mengatur role RBAC dan hak akses pengguna internal"),
            PermissionItem(id="iam:audit:read", name="Centralized Audit Logging", scope="Read", description="Membaca log audit terpusat dari gateway-audit:5009"),
            PermissionItem(id="iam:audit:export", name="Compliance Export (ISO 27001)", scope="Write", description="Mengekspor log audit kepatuhan ke format CSV/JSON"),
        ],
    ),
    PermissionDomainGroup(
        id="platform_support",
        title="L2/L3 Platform Support & Tickets",
        icon="GitPullRequest",
        description="Manajemen tiket insiden di Linear, sinkronisasi Obsidian, dan SOP master",
        target_scope="PLATFORM_INTERNAL",
        permissions=[
            PermissionItem(id="support:tenant:lookup", name="Tenant Health Score & Error Logs", scope="Read", description="Lookup profil kesehatan tenant & riwayat kendala"),
            PermissionItem(id="support:tickets:sync", name="Linear Bug Tickets & Obsidian Sync", scope="Write", description="Membuat tiket devops baru di Linear & sinkron Obsidian"),
            PermissionItem(id="support:sop:master", name="Master SOP & Knowledge Base", scope="Write", description="Mengelola master dokumen SOP platform internal"),
            PermissionItem(id="support:troubleshoot:exec", name="Interactive Gateway Diagnostics", scope="Write", description="Menjalankan panduan interaktif troubleshooting gateway"),
        ],
    ),
]

TENANT_DOMAINS: list[PermissionDomainGroup] = [
    PermissionDomainGroup(
        id="tenant_olt",
        title="OLT & Redaman Optik Tenant",
        icon="Activity",
        description="Monitoring status OLT lokal dan redaman optik port PON milik tenant",
        target_scope="TENANT",
        permissions=[
            PermissionItem(id="tenant_olt:device:read", name="Local OLT Inventory", scope="Read", description="Melihat daftar OLT milik tenant sendiri"),
            PermissionItem(id="tenant_olt:device:write", name="Local OLT Config", scope="Write", description="Mengubah IP manajemen OLT lokal tenant"),
            PermissionItem(id="tenant_optical:power:read", name="Optical Link Power (dBm)", scope="Read", description="Membaca redaman optik (dBm) dan status port PON"),
            PermissionItem(id="tenant_optical:port:reboot", name="Port PON Remote Reboot", scope="Write", description="Merestart port PON lokal tenant yang bermasalah"),
        ],
    ),
    PermissionDomainGroup(
        id="tenant_gis",
        title="Jaringan Spasial & ODP Lokal",
        icon="MapPin",
        description="Pemetaan tiang ODP, jalur kabel drop core, dan sisa port distribusi",
        target_scope="TENANT",
        permissions=[
            PermissionItem(id="tenant_odp:assets:read", name="Local ODP & Splitter Info", scope="Read", description="Melihat posisi ODP, splitter, dan port kosong tenant"),
            PermissionItem(id="tenant_odp:assets:write", name="Manage ODP Port & Pole", scope="Write", description="Menambah/mengubah data ODP dan tiang distribusi"),
            PermissionItem(id="tenant_cable:route:read", name="Drop Cable Tracing", scope="Read", description="Melihat jalur kabel drop core dan joint closure tenant"),
            PermissionItem(id="tenant_cable:route:write", name="Update Cable Span", scope="Write", description="Memperbarui rute penarikan kabel drop pelanggan"),
        ],
    ),
    PermissionDomainGroup(
        id="tenant_customers",
        title="Pelanggan & Provisioning ONT",
        icon="Zap",
        description="Aktivasi pelanggan baru, verifikasi GPS survey, dan aktivasi ONT OMCI",
        target_scope="TENANT",
        permissions=[
            PermissionItem(id="tenant_ont:customer:read", name="Customer Data & ONT Status", scope="Read", description="Melihat data pelanggan, paket internet, & status ONT"),
            PermissionItem(id="tenant_ont:register:write", name="Register / Deauth ONT", scope="Write", description="Melakukan aktivasi / registrasi ONT baru via OMCI"),
            PermissionItem(id="tenant_survey:gps:read", name="Customer GPS Location Verification", scope="Read", description="Verifikasi lokasi GPS rumah calon pelanggan"),
            PermissionItem(id="tenant_survey:evidence:add", name="Upload Installation Evidence", scope="Write", description="Mengunggah foto bukti instalasi drop core"),
        ],
    ),
    PermissionDomainGroup(
        id="tenant_billing",
        title="Billing & Tagihan Pelanggan",
        icon="Database",
        description="Manajemen tagihan internet pelanggan lokal dan pembuatan tautan bayar",
        target_scope="TENANT",
        permissions=[
            PermissionItem(id="tenant_billing:read", name="Customer Invoices & Arrears", scope="Read", description="Melihat status pembayaran dan tunggakan pelanggan"),
            PermissionItem(id="tenant_billing:link:send", name="Generate Customer Payment Link", scope="Write", description="Membuat tautan pembayaran Xendit untuk pelanggan"),
            PermissionItem(id="tenant_billing:dispute:log", name="Log Payment Complaint", scope="Write", description="Mencatat komplain tagihan pelanggan ke sistem"),
            PermissionItem(id="tenant_billing:recap:read", name="Monthly Branch Revenue", scope="Read", description="Melihat rekap pendapatan bulanan ISP lokal"),
        ],
    ),
    PermissionDomainGroup(
        id="tenant_comms",
        title="Notifikasi & Broadcast Pelanggan",
        icon="Flame",
        description="Kirim pesan broadcast gangguan jaringan atau pengingat tagihan bulanan",
        target_scope="TENANT",
        permissions=[
            PermissionItem(id="tenant_comms:wa:broadcast", name="Send WhatsApp Broadcast", scope="Write", description="Kirim pesan WA broadcast gangguan ke pelanggan lokal"),
            PermissionItem(id="tenant_comms:log:read", name="Delivery History Logs", scope="Read", description="Melihat riwayat pesan notifikasi yang terkirim"),
        ],
    ),
    PermissionDomainGroup(
        id="tenant_sop",
        title="Panduan SOP & Tiket Bantuan",
        icon="Sparkles",
        description="Dokumentasi teknis perangkat OLT/ONT dan pembuatan tiket bantuan ke HQ",
        target_scope="TENANT",
        permissions=[
            PermissionItem(id="tenant_sop:manuals:read", name="Hardware SOP & Manuals", scope="Read", description="Membaca panduan teknis pemasangan hardware"),
            PermissionItem(id="tenant_support:ticket:add", name="Create Ticket to K2NET HQ", scope="Write", description="Membuat tiket eskalasi bantuan ke Tim Support K2NET"),
        ],
    ),
]

# ═══════════════════════════════════════════════════════════════════════════════
# 🎚️ SMART ROLE PRESETS (Strictly Scoped)
# ═══════════════════════════════════════════════════════════════════════════════

INTERNAL_PRESETS: list[RolePresetItem] = [
    RolePresetItem(
        id="SUPER_ADMIN",
        name="Super Admin (God Mode)",
        badge="Full Access",
        icon="ShieldCheck",
        description="Akses menyeluruh ke seluruh modul internal server dan basis data",
        target_scope="PLATFORM_INTERNAL",
        default_permissions=[p.id for d in INTERNAL_DOMAINS for p in d.permissions],
    ),
    RolePresetItem(
        id="DEVOPS",
        name="DevOps & SRE Lead",
        badge="Infra & DR",
        icon="Cpu",
        description="Fokus pada Docker containers, JVM, Kong, dan Disaster Recovery backup",
        target_scope="PLATFORM_INTERNAL",
        default_permissions=[
            "infra:metrics:read", "infra:services:restart", "infra:backup:read", "infra:backup:trigger",
            "infra:kong:read", "infra:kong:reload", "iam:audit:read", "support:tickets:sync"
        ],
    ),
    RolePresetItem(
        id="NOC",
        name="NOC & Network Lead",
        badge="Network & OLT",
        icon="Activity",
        description="Monitoring OLT poller global, redaman optik PON, dan link transit upstream",
        target_scope="PLATFORM_INTERNAL",
        default_permissions=[
            "noc:telemetry:global", "noc:poller:diagnose", "noc:upstream:monitor", "noc:link:reboot",
            "infra:metrics:read", "support:sop:master"
        ],
    ),
    RolePresetItem(
        id="GIS",
        name="GIS Spatial Planner",
        badge="Spatial & Topology",
        icon="MapPin",
        description="Audit topologi PostGIS, validasi deviasi koordinat, dan layer peta global",
        target_scope="PLATFORM_INTERNAL",
        default_permissions=[
            "gis:topology:audit", "gis:basemap:manage", "gis:boundary:validate", "gis:export:master",
            "support:sop:master"
        ],
    ),
    RolePresetItem(
        id="FINANCE",
        name="Finance & Revenue Ops",
        badge="Billing & Revenue",
        icon="Database",
        description="Monitoring SaaS subscription, rekapitulasi omset, dan rekonsiliasi Xendit",
        target_scope="PLATFORM_INTERNAL",
        default_permissions=[
            "finance:revenue:read", "finance:subscription:write", "finance:reconcile:write", "finance:invoice:audit"
        ],
    ),
    RolePresetItem(
        id="SECURITY",
        name="Security & Compliance",
        badge="IAM & Audit",
        icon="ShieldCheck",
        description="Audit log Keycloak, kepatuhan keamanan ISO 27001, dan kontrol RBAC",
        target_scope="PLATFORM_INTERNAL",
        default_permissions=[
            "iam:sessions:read", "iam:roles:manage", "iam:audit:read", "iam:audit:export"
        ],
    ),
    RolePresetItem(
        id="SUPPORT",
        name="Support & L2/L3 Lead",
        badge="Tickets & SOP",
        icon="GitPullRequest",
        description="Penanganan eskalasi tenant, tiket bug Linear, dan dokumentasi SOP RAG",
        target_scope="PLATFORM_INTERNAL",
        default_permissions=[
            "support:tenant:lookup", "support:tickets:sync", "support:sop:master", "support:troubleshoot:exec"
        ],
    ),
]

TENANT_PRESETS: list[RolePresetItem] = [
    RolePresetItem(
        id="ISP_OWNER",
        name="ISP Owner / Tenant Admin",
        badge="Full Tenant",
        icon="ShieldCheck",
        description="Akses penuh ke seluruh operasional OLT, GIS, Pelanggan, dan Billing lokal",
        target_scope="TENANT",
        default_permissions=[p.id for d in TENANT_DOMAINS for p in d.permissions],
    ),
    RolePresetItem(
        id="NOC_REGIONAL",
        name="NOC Regional",
        badge="OLT & Power",
        icon="Activity",
        description="Fokus pada performa port PON OLT, redaman dBm, dan diagnosa jaringan",
        target_scope="TENANT",
        default_permissions=[
            "tenant_olt:device:read", "tenant_optical:power:read", "tenant_optical:port:reboot",
            "tenant_odp:assets:read", "tenant_sop:manuals:read"
        ],
    ),
    RolePresetItem(
        id="TECHNICIAN",
        name="Teknisi Lapangan / Splicer",
        badge="Field Ops",
        icon="Zap",
        description="Pengecekan ODP, penarikan kabel drop, registrasi ONT, dan bukti survey",
        target_scope="TENANT",
        default_permissions=[
            "tenant_odp:assets:read", "tenant_odp:assets:write", "tenant_cable:route:read",
            "tenant_cable:route:write", "tenant_ont:customer:read", "tenant_ont:register:write",
            "tenant_survey:gps:read", "tenant_survey:evidence:add", "tenant_sop:manuals:read"
        ],
    ),
    RolePresetItem(
        id="CUSTOMER_SERVICE",
        name="Customer Service / Helpdesk",
        badge="CS & Comms",
        icon="Flame",
        description="Cek status koneksi pelanggan dan kirim broadcast notifikasi gangguan",
        target_scope="TENANT",
        default_permissions=[
            "tenant_ont:customer:read", "tenant_comms:wa:broadcast", "tenant_comms:log:read",
            "tenant_support:ticket:add"
        ],
    ),
    RolePresetItem(
        id="BILLING_STAFF",
        name="Kasir / Billing Staff",
        badge="Invoices & Payments",
        icon="Database",
        description="Pengecekan tunggakan pelanggan dan pembuatan tautan pembayaran Xendit",
        target_scope="TENANT",
        default_permissions=[
            "tenant_billing:read", "tenant_billing:link:send", "tenant_billing:dispute:log",
            "tenant_billing:recap:read"
        ],
    ),
]


# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 ENDPOINTS: AGENT ONBOARDING & PERMISSION MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/authorization", response_model=AgentAuthorizationResponse)
async def get_agent_authorization(
    x_user_scope: Optional[str] = Header("PLATFORM_INTERNAL", alias="X-User-Scope"),
    tenant_ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """
    Memeriksa status otorisasi K2 Agent untuk user dan tenant aktif.
    """
    tenant_uuid = tenant_ctx.tenant_id
    user_uuid = tenant_ctx.actor_id or uuid.UUID(DEFAULT_USER_ID)

    try:
        async with get_db_session() as session:
            sql = """
                SELECT id, user_id, tenant_id, user_scope, user_role, agent_name, 
                       access_tier, role_preset, granted_permissions, is_active, created_at
                FROM ai_agent_authorizations
                WHERE user_id = :user_id AND tenant_id = :tenant_id
            """
            res = await session.execute(text(sql), {"user_id": user_uuid, "tenant_id": tenant_uuid})
            row = res.fetchone()

            if not row or not row[9]:
                # Check root user default fallback
                sql_root = """
                    SELECT id, user_id, tenant_id, user_scope, user_role, agent_name, 
                           access_tier, role_preset, granted_permissions, is_active, created_at
                    FROM ai_agent_authorizations
                    WHERE user_id = :user_id AND is_active = TRUE
                """
                res_root = await session.execute(text(sql_root), {"user_id": uuid.UUID(DEFAULT_USER_ID)})
                root_row = res_root.fetchone()

                if root_row:
                    return AgentAuthorizationResponse(
                        is_authorized=True,
                        agent_name=root_row[5],
                        user_scope=root_row[3],
                        user_role=root_row[4],
                        access_tier=root_row[6],
                        role_preset=root_row[7],
                        granted_permissions=root_row[8] or [],
                        is_active=bool(root_row[9]),
                        authorized_at=root_row[10],
                    )

                return AgentAuthorizationResponse(
                    is_authorized=False,
                    user_scope=x_user_scope or "PLATFORM_INTERNAL",
                    granted_permissions=[],
                )

            return AgentAuthorizationResponse(
                is_authorized=True,
                agent_name=row[5],
                user_scope=row[3],
                user_role=row[4],
                access_tier=row[6],
                role_preset=row[7],
                granted_permissions=row[8] or [],
                is_active=bool(row[9]),
                authorized_at=row[10],
            )
    except Exception as e:
        logger.error(f"Error fetching agent authorization: {e}")
        return AgentAuthorizationResponse(
            is_authorized=False,
            user_scope=x_user_scope or "PLATFORM_INTERNAL",
            granted_permissions=[],
        )


@router.post("/authorization", response_model=AgentAuthorizationResponse)
async def save_agent_authorization(
    req: AgentAuthorizationRequest,
    x_user_role: Optional[str] = Header("SUPER_ADMIN", alias="X-User-Role"),
    tenant_ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """
    Menyimpan atau memperbarui otorisasi K2 Agent (Full, Read-Only, Role Preset, atau Custom).
    """
    tenant_uuid = tenant_ctx.tenant_id
    user_uuid = tenant_ctx.actor_id or uuid.UUID(DEFAULT_USER_ID)

    # Determine granted permissions based on tier/preset if not custom
    granted_perms = req.granted_permissions
    if req.access_tier == "FULL":
        if req.user_scope == "PLATFORM_INTERNAL":
            granted_perms = [p.id for d in INTERNAL_DOMAINS for p in d.permissions]
        else:
            granted_perms = [p.id for d in TENANT_DOMAINS for p in d.permissions]
    elif req.access_tier == "READ_ONLY":
        if req.user_scope == "PLATFORM_INTERNAL":
            granted_perms = [p.id for d in INTERNAL_DOMAINS for p in d.permissions if p.scope == "Read"]
        else:
            granted_perms = [p.id for d in TENANT_DOMAINS for p in d.permissions if p.scope == "Read"]
    elif req.access_tier == "ROLE_PRESET" and req.role_preset:
        presets_list = INTERNAL_PRESETS if req.user_scope == "PLATFORM_INTERNAL" else TENANT_PRESETS
        matching = next((pr for pr in presets_list if pr.id == req.role_preset), None)
        if matching:
            granted_perms = matching.default_permissions

    try:
        async with get_db_session() as session:
            sql = """
                INSERT INTO ai_agent_authorizations (
                    user_id, tenant_id, user_scope, user_role, agent_name, 
                    access_tier, role_preset, granted_permissions, is_active, updated_at
                ) VALUES (
                    :user_id, :tenant_id, :user_scope, :user_role, :agent_name, 
                    :access_tier, :role_preset, :granted_permissions, TRUE, CURRENT_TIMESTAMP
                )
                ON CONFLICT (user_id, tenant_id) DO UPDATE SET
                    user_scope = EXCLUDED.user_scope,
                    user_role = EXCLUDED.user_role,
                    agent_name = EXCLUDED.agent_name,
                    access_tier = EXCLUDED.access_tier,
                    role_preset = EXCLUDED.role_preset,
                    granted_permissions = EXCLUDED.granted_permissions,
                    is_active = TRUE,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id, user_id, tenant_id, user_scope, user_role, agent_name, 
                          access_tier, role_preset, granted_permissions, is_active, created_at
            """
            params = {
                "user_id": user_uuid,
                "tenant_id": tenant_uuid,
                "user_scope": req.user_scope,
                "user_role": x_user_role or "SUPER_ADMIN",
                "agent_name": req.agent_name,
                "access_tier": req.access_tier,
                "role_preset": req.role_preset,
                "granted_permissions": granted_perms,
            }
            res = await session.execute(text(sql), params)
            row = res.fetchone()

            return AgentAuthorizationResponse(
                is_authorized=True,
                agent_name=row[5],
                user_scope=row[3],
                user_role=row[4],
                access_tier=row[6],
                role_preset=row[7],
                granted_permissions=row[8] or [],
                is_active=bool(row[9]),
                authorized_at=row[10],
            )
    except Exception as e:
        logger.error(f"Error saving agent authorization: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal menyimpan otorisasi: {str(e)}")


@router.delete("/authorization")
async def revoke_agent_authorization(
    tenant_ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """
    Mencabut otorisasi akses K2 Agent (Revoke Token).
    """
    tenant_uuid = tenant_ctx.tenant_id
    user_uuid = tenant_ctx.actor_id or uuid.UUID(DEFAULT_USER_ID)

    try:
        async with get_db_session() as session:
            sql = """
                UPDATE ai_agent_authorizations
                SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = :user_id AND tenant_id = :tenant_id
            """
            await session.execute(text(sql), {"user_id": user_uuid, "tenant_id": tenant_uuid})

        return {"status": "ok", "message": "Otorisasi K2 Agent berhasil dicabut."}
    except Exception as e:
        logger.error(f"Error revoking agent authorization: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal mencabut otorisasi: {str(e)}")


@router.get("/catalog", response_model=PermissionCatalogResponse)
async def get_permissions_catalog(
    scope: str = Query("PLATFORM_INTERNAL", description="PLATFORM_INTERNAL vs TENANT"),
    tenant_ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """
    Mengembalikan katalog izin modular terisolasi sesuai scope pengguna.
    """
    domains = INTERNAL_DOMAINS if scope == "PLATFORM_INTERNAL" else TENANT_DOMAINS
    total_count = sum(len(d.permissions) for d in domains)

    return PermissionCatalogResponse(
        scope=scope,
        total_permissions=total_count,
        domains=domains,
    )


@router.get("/presets", response_model=RolePresetsResponse)
async def get_role_presets(
    scope: str = Query("PLATFORM_INTERNAL", description="PLATFORM_INTERNAL vs TENANT"),
    tenant_ctx: TenantContext = Depends(verify_gateway_and_tenant),
):
    """
    Mengembalikan daftar preset peran (Role Presets) sesuai scope pengguna.
    """
    presets = INTERNAL_PRESETS if scope == "PLATFORM_INTERNAL" else TENANT_PRESETS
    return RolePresetsResponse(scope=scope, presets=presets)
