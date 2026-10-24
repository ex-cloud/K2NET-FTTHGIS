import type { TranslationKey } from "@k2net/i18n";

export type MenuItem = {
  title: string;
  translationKey?: TranslationKey;
  url: string;
  icon: string;
  shortcut?: string;
  requiredPermission?: string | string[];
  badge?: TranslationKey;
};

export type MenuSection = {
  title: string;
  translationKey?: TranslationKey;
  items: MenuItem[];
  requiredPermission?: string | string[];
};

export type SidebarConfig = {
  [key: string]: {
    title: string;
    translationKey?: TranslationKey;
    sections: MenuSection[];
  };
};

export const SYSTEM_SIDEBAR_NAVIGATION: SidebarConfig = {
  // ── Operations: Billing ──────────────────────────────────────────────────
  billing: {
    title: "Billing & Invoices",
    translationKey: "nav.billing",
    sections: [
      {
        title: "Billing & Operations",
        translationKey: "nav.billing_ops",
        requiredPermission: ["billing.read", "system.organizations.view"],
        items: [
          { title: "Billing Overview", translationKey: "nav.billing_overview", url: "/billing", icon: "BarChart3", shortcut: "S then B", requiredPermission: ["billing.read", "system.organizations.view"] },
          { title: "Tenant Subscriptions", translationKey: "nav.tenant_subscriptions", url: "/billing/subscriptions", icon: "CreditCard", shortcut: "S then S", requiredPermission: ["billing.read", "system.organizations.manage"] },
          { title: "Invoices & Payments", translationKey: "nav.invoices_payments", url: "/billing/invoices", icon: "Receipt", shortcut: "S then I", requiredPermission: ["billing.read", "system.organizations.view"] },
          { title: "Renewals & Dunning", translationKey: "nav.license_notifications_log", url: "/billing/renewals", icon: "Bell", shortcut: "S then N", requiredPermission: ["billing.read", "system.organizations.view"] },
        ],
      },
    ],
  },

  // ── Operations: Licensing & Entitlements ──────────────────────────────────
  licensing: {
    title: "Licensing & Entitlements",
    translationKey: "nav.licensing_entitlements",
    sections: [
      {
        title: "Licensing & Integrity",
        translationKey: "nav.licensing_security",
        requiredPermission: ["licensing.read", "system.organizations.view"],
        items: [
          { title: "Licenses & Contracts", translationKey: "nav.all_licenses", url: "/licensing/licenses", icon: "KeyRound", shortcut: "S then L", requiredPermission: ["licensing.read", "system.organizations.view"] },
          { title: "Revocations & Kill-Switch", translationKey: "nav.license_kill_switch", url: "/licensing/revocations", icon: "ShieldAlert", shortcut: "S then R", requiredPermission: ["licensing.killswitch", "system.organizations.manage"] },
        ],
      },
    ],
  },

  // ── Product: Product Catalog ──────────────────────────────────────────────
  catalog: {
    title: "Product Catalog",
    translationKey: "nav.product_catalog",
    sections: [
      {
        title: "Master Catalog",
        translationKey: "nav.catalog_plans",
        requiredPermission: ["catalog.plans.read", "system.packages.view", "system.organizations.view"],
        items: [
          { title: "Master Plans", translationKey: "nav.plan_tiers_quotas", url: "/catalog/plans", icon: "Sliders", shortcut: "S then P", requiredPermission: ["catalog.plans.read", "system.organizations.manage"] },
          { title: "Packages & Add-ons", translationKey: "nav.catalog_packages", url: "/catalog/packages", icon: "Boxes", shortcut: "S then K", requiredPermission: ["system.packages.view", "system.organizations.view"] },
          { title: "Billing Policies", translationKey: "nav.billing_policies", url: "/catalog/policies", icon: "ScrollText", shortcut: "S then O", requiredPermission: ["billing.read", "system.organizations.view"] },
          { title: "Message Templates", translationKey: "nav.message_templates", url: "/catalog/templates", icon: "MessageSquare", shortcut: "S then T", requiredPermission: ["system.organizations.manage", "system.gateway.manage"] },
        ],
      },
      {
        title: "Domain Taxonomy",
        translationKey: "nav.packages_domain_taxonomy",
        requiredPermission: ["system.packages.view", "system.organizations.view"],
        items: [
          { title: "Telemetry & OLT Polling", translationKey: "packages.category.TELEMETRY", url: "/catalog/packages?category=TELEMETRY", icon: "Activity", shortcut: "S then T", requiredPermission: ["system.packages.view"] },
          { title: "Field Operations & Workforce", translationKey: "packages.category.FIELD_OPS", url: "/catalog/packages?category=FIELD_OPS", icon: "Wrench", shortcut: "S then F", requiredPermission: ["system.packages.view"] },
          { title: "Capacity Boosters & Quotas", translationKey: "packages.category.CAPACITY_BOOSTER", url: "/catalog/packages?category=CAPACITY_BOOSTER", icon: "DatabaseZap", shortcut: "S then C", requiredPermission: ["system.packages.view"] },
          { title: "Security, SIEM & Forensic", translationKey: "packages.category.SECURITY_GOV", url: "/catalog/packages?category=SECURITY_GOV", icon: "ShieldCheck", shortcut: "S then S", requiredPermission: ["system.packages.view"] },
          { title: "Civil Infra & IoT Handhole", translationKey: "packages.category.CIVIL_INFRA", url: "/catalog/packages?category=CIVIL_INFRA", icon: "Radio", shortcut: "S then I", requiredPermission: ["system.packages.view"] },
          { title: "AI Copilot & Diagnostics", translationKey: "packages.category.AI_COPILOT", url: "/catalog/packages?category=AI_COPILOT", icon: "Sparkles", shortcut: "S then X", requiredPermission: ["system.packages.view"] },
        ],
      },
      {
        title: "Dependency Rules",
        translationKey: "nav.packages_rules_matrix",
        requiredPermission: ["system.packages.view", "system.organizations.manage"],
        items: [
          { title: "3-Layer Compatibility Matrix", translationKey: "nav.packages_compatibility", url: "/catalog/packages?view=rules", icon: "Network", shortcut: "S then M", requiredPermission: ["system.packages.view", "system.organizations.manage"] },
        ],
      },
    ],
  },

  // ── Operations: Organizations / Tenants ──────────────────────────────────
  organizations: {
    title: "Organizations",
    translationKey: "nav.organizations",
    sections: [
      {
        title: "Tenant Directory",
        translationKey: "organizations.title",
        requiredPermission: ["system.organizations.view", "orgs.view"],
        items: [
          { title: "All Organizations", translationKey: "nav.all_organizations", url: "/organizations", icon: "Building2", shortcut: "S then A", requiredPermission: ["system.organizations.view", "orgs.view"] },
          { title: "Active Tenants", translationKey: "nav.active_tenants", url: "/organizations?status=ACTIVE", icon: "CheckCircle", shortcut: "S then 1", requiredPermission: ["system.organizations.view", "orgs.view"] },
          { title: "Trial Accounts", translationKey: "nav.trial_accounts", url: "/organizations?status=TRIAL", icon: "Clock", shortcut: "S then 2", requiredPermission: ["system.organizations.view", "orgs.view"] },
          { title: "Provisioning Queue", translationKey: "nav.provisioning_queue", url: "/organizations?status=PROVISIONING", icon: "UploadCloud", shortcut: "S then 3", requiredPermission: ["system.organizations.view", "orgs.view"] },
          { title: "Suspended & Inactive", translationKey: "nav.suspended_inactive", url: "/organizations?status=SUSPENDED", icon: "UserX", shortcut: "S then 4", requiredPermission: ["system.organizations.view", "orgs.view"] },
        ],
      },
      {
        title: "Support & Forensics",
        translationKey: "nav.support_access_center",
        requiredPermission: "system.support.impersonate",
        items: [
          { title: "Support Access Center", translationKey: "nav.support_access_center", url: "/organizations/impersonation", icon: "ShieldAlert", shortcut: "S then S", requiredPermission: "system.support.impersonate" },
        ],
      },
      {
        title: "Entitlements & Limits",
        translationKey: "nav.sec_entitlements",
        requiredPermission: ["system.organizations.manage", "system.quotas.manage"],
        items: [
          { title: "Feature Flags & Add-ons", translationKey: "organizations.feature_flags_title", url: "/organizations/features", icon: "Sliders", shortcut: "S then F", requiredPermission: ["system.organizations.manage", "system.organizations.update"] },
          { title: "FTTH Spatial Quotas", translationKey: "organizations.edit_quotas_title", url: "/organizations/quotas", icon: "Network", shortcut: "S then Q", requiredPermission: ["system.organizations.manage", "system.quotas.manage"] },
        ],
      },
      {
        title: "Domains & Routing",
        translationKey: "nav.sec_domains_routing",
        requiredPermission: ["system.organizations.manage", "system.organizations.update"],
        items: [
          { title: "Custom Domains", translationKey: "organizations.custom_domain_title", url: "/organizations/domains", icon: "Globe", shortcut: "S then D", requiredPermission: ["system.organizations.manage", "system.organizations.update"] },
          { title: "VPN & Tunneling", translationKey: "nav.vpn_tunneling", url: "/organizations/vpn", icon: "ShieldCheck", shortcut: "S then V", requiredPermission: ["system.organizations.manage", "system.organizations.update"] },
        ],
      },
    ],
  },

  // ── Operations: Support ──────────────────────────────────────────────────
  support: {
    title: "Support",
    translationKey: "nav.support",
    sections: [
      {
        title: "Support Operations",
        translationKey: "nav.support_operations",
        requiredPermission: ["support.tickets.view", "system.task.manage"],
        items: [
          {
            title: "Ticket Queue",
            translationKey: "nav.ticket_queue",
            url: "/support/tickets",
            icon: "Inbox",
            shortcut: "S then T",
            requiredPermission: ["support.tickets.view", "system.task.manage"],
          },
          {
            title: "SLA & Reports",
            translationKey: "nav.sla_reports",
            url: "/support/sla",
            icon: "Clock",
            shortcut: "S then S",
            badge: "nav.coming_soon",
            requiredPermission: ["support.tickets.view", "system.task.manage"],
          },
        ],
      },
    ],
  },

  // ── Platform: Workspace ──────────────────────────────────────────────────
  workspace: {
    title: "Workspace",
    translationKey: "nav.workspace",
    sections: [
      {
        title: "Planning & Knowledge",
        translationKey: "nav.planning_knowledge",
        requiredPermission: ["platform.workspace.view", "system.task.manage"],
        items: [
          {
            title: "Plans, Ideas & Specs",
            translationKey: "nav.plans_ideas_specs",
            url: "/workspace/plans",
            icon: "FolderKanban",
            shortcut: "S then P",
            requiredPermission: ["platform.workspace.view", "system.task.manage"],
          },
          {
            title: "Roadmap",
            translationKey: "nav.roadmap",
            url: "/workspace/roadmap",
            icon: "Map",
            shortcut: "S then R",
            requiredPermission: ["platform.workspace.view", "system.task.manage"],
          },
        ],
      },
      {
        title: "Execution Tracker",
        translationKey: "nav.execution_tracker",
        requiredPermission: ["platform.issues.view", "system.task.manage"],
        items: [
          {
            title: "Issues & Tasks",
            translationKey: "nav.issues_tasks",
            url: "/workspace/issues",
            icon: "CheckSquare",
            shortcut: "S then I",
            requiredPermission: ["platform.issues.view", "system.task.manage"],
          },
        ],
      },
    ],
  },

  // ── Platform: Observability ──────────────────────────────────────────────
  observability: {
    title: "Observability",
    translationKey: "nav.observability",
    sections: [
      {
        title: "General",
        translationKey: "nav.overview",
        requiredPermission: "system.observability.view",
        items: [
          { title: "Overview", translationKey: "nav.overview", url: "/observability/overview", icon: "LayoutDashboard", shortcut: "S then O", requiredPermission: "system.observability.view" },
          { title: "Query Performance", translationKey: "nav.query_performance", url: "/observability/query-performance", icon: "DatabaseZap", shortcut: "S then Q", requiredPermission: "system.observability.view" },
          { title: "API Gateway", translationKey: "nav.api_gateway", url: "/observability/api-gateway", icon: "Globe", shortcut: "S then A", requiredPermission: "system.observability.view" },
        ],
      },
      {
        title: "Forensics & Stream",
        translationKey: "nav.global_logs",
        requiredPermission: ["system.audit.view", "system.observability.view"],
        items: [
          { title: "Logs Explorer", translationKey: "nav.logs_explorer", url: "/logs", icon: "Terminal", shortcut: "S then L", requiredPermission: "system.audit.view" },
          { title: "Operations Feed", translationKey: "nav.operations_feed", url: "/observability/operations", icon: "History", shortcut: "S then O", requiredPermission: "system.observability.view" },
        ],
      },
      {
        title: "Infrastructure & Core",
        translationKey: "nav.compute_host",
        requiredPermission: "system.observability.view",
        items: [
          { title: "Compute & Host", translationKey: "nav.compute_host", url: "/observability/compute", icon: "Server", shortcut: "S then C", requiredPermission: "system.observability.view" },
          { title: "Database & Cache", translationKey: "nav.database_cache", url: "/observability/database", icon: "Database", shortcut: "S then D", requiredPermission: "system.observability.view" },
          { title: "Identity (Auth)", translationKey: "nav.identity_auth", url: "/observability/identity", icon: "KeyRound", shortcut: "S then I", requiredPermission: "system.observability.view" },
        ],
      },
      {
        title: "Go Gateways",
        translationKey: "nav.gateways",
        requiredPermission: "system.observability.view",
        items: [
          { title: "OLT & Poller", translationKey: "nav.olt_poller", url: "/observability/olt-poller", icon: "Radio", shortcut: "S then P", requiredPermission: "system.observability.view" },
          { title: "Spatial Map", translationKey: "nav.spatial_map", url: "/observability/spatial-map", icon: "Map", shortcut: "S then M", requiredPermission: "system.observability.view" },
          { title: "Messaging", translationKey: "nav.messaging", url: "/observability/messaging", icon: "MessageSquare", shortcut: "S then N", requiredPermission: "system.observability.view" },
          { title: "Scheduled Jobs", translationKey: "nav.scheduled_jobs", url: "/observability/scheduler", icon: "CalendarClock", shortcut: "S then S", requiredPermission: "system.observability.view" },
        ],
      },
    ],
  },

  // ── Platform: Integrations & Comms ───────────────────────────────────────
  gateways: {
    title: "Integrations & Comms",
    translationKey: "nav.integrations_comms",
    sections: [
      {
        title: "Overview",
        translationKey: "nav.overview",
        requiredPermission: "system.observability.view",
        items: [
          { title: "Status & Metrics", translationKey: "nav.status_metrics", url: "/gateways/overview", icon: "BarChart3", shortcut: "S then O", requiredPermission: "system.observability.view" },
        ],
      },
      {
        title: "Services Control",
        translationKey: "nav.services_control",
        requiredPermission: "system.gateway.manage",
        items: [
          { title: "Notification Gateway", translationKey: "nav.notification_gateway", url: "/gateways/notification", icon: "MessageSquare", shortcut: "S then N", requiredPermission: "system.gateway.manage" },
          { title: "Payment Gateway", translationKey: "nav.payment_gateway", url: "/gateways/payment", icon: "CreditCard", shortcut: "S then P", requiredPermission: "system.gateway.manage" },
          { title: "Map Gateway", translationKey: "nav.map_gateway", url: "/gateways/map", icon: "Map", shortcut: "S then M", requiredPermission: "system.gateway.manage" },
          { title: "Storage Gateway", translationKey: "nav.storage_gateway", url: "/gateways/storage", icon: "Database", shortcut: "S then S", requiredPermission: "system.gateway.manage" },
          { title: "WhatsApp Gateway", translationKey: "nav.whatsapp_gateway", url: "/gateways/whatsapp", icon: "MessageCircle", shortcut: "S then W", requiredPermission: "system.gateway.manage" },
          { title: "Scheduler Gateway", translationKey: "nav.scheduler_gateway", url: "/gateways/scheduler", icon: "Clock", shortcut: "S then C", requiredPermission: "system.gateway.manage" },
          { title: "Export Gateway", translationKey: "nav.export_gateway", url: "/gateways/export", icon: "Download", shortcut: "S then E", requiredPermission: "system.gateway.manage" },
          { title: "OLT Gateway", translationKey: "nav.olt_gateway", url: "/gateways/olt", icon: "Network", shortcut: "S then H", requiredPermission: "system.gateway.manage" },
          { title: "Audit Gateway", translationKey: "nav.audit_gateway", url: "/gateways/audit", icon: "FileText", shortcut: "S then A", requiredPermission: "system.gateway.manage" },
          { title: "Poller Gateway", translationKey: "nav.poller_gateway", url: "/gateways/poller", icon: "Activity", shortcut: "S then L", requiredPermission: "system.gateway.manage" },
        ],
      },
    ],
  },

  // ── Platform: AI & Spatial Assets ─────────────────────────────────────────
  ai: {
    title: "AI & Spatial Assets",
    translationKey: "nav.ai_spatial_assets",
    sections: [
      {
        title: "Basis Pengetahuan (RAG)",
        translationKey: "nav.knowledge_base_rag",
        requiredPermission: "system.ai.manage",
        items: [
          { title: "Daftar Pengetahuan", translationKey: "nav.knowledge_list", url: "/ai", icon: "Database", shortcut: "S then D", requiredPermission: "system.ai.manage" },
          { title: "Graf Pengetahuan 2D", translationKey: "nav.knowledge_graph_2d", url: "/ai/graph", icon: "Network", shortcut: "S then G", requiredPermission: "system.ai.manage" },
          { title: "Tambah Pengetahuan", translationKey: "nav.add_knowledge", url: "/ai/add", icon: "UploadCloud", shortcut: "S then A", requiredPermission: "system.ai.manage" },
        ],
      },
      {
        title: "Simulasi & Panduan",
        translationKey: "nav.rag_simulator",
        requiredPermission: "system.ai.manage",
        items: [
          { title: "RAG Simulator", translationKey: "nav.rag_simulator", url: "/ai/simulator", icon: "FlaskConical", shortcut: "S then S", requiredPermission: "system.ai.manage" },
          { title: "Template & Panduan SOP", translationKey: "nav.sop_templates", url: "/ai/templates", icon: "FileCode", shortcut: "S then T", requiredPermission: "system.ai.manage" },
          { title: "Saran Prompt & Trending", translationKey: "nav.prompt_trending", url: "/ai/prompts", icon: "Sparkles", shortcut: "S then P", requiredPermission: "system.ai.manage" },
        ],
      },
      {
        title: "Engine & Spatial Assets",
        translationKey: "nav.multi_provider_hub",
        requiredPermission: ["system.ai.manage", "system.settings.manage"],
        items: [
          { title: "Multi-Provider Hub", translationKey: "nav.multi_provider_hub", url: "/ai/config", icon: "Cpu", shortcut: "S then M", requiredPermission: "system.ai.manage" },
          { title: "3D Spatial Assets", translationKey: "nav.three_d_assets", url: "/assets-3d", icon: "Box", shortcut: "S then 3", requiredPermission: "system.settings.manage" },
        ],
      },
    ],
  },

  // ── Platform: Data Protection ─────────────────────────────────────────────
  system: {
    title: "Data Protection",
    translationKey: "nav.data_protection",
    sections: [
      {
        title: "Data Recovery",
        translationKey: "nav.recycle_bin",
        requiredPermission: "system.trash.manage",
        items: [
          { title: "Recycle Bin", translationKey: "nav.recycle_bin", url: "/system/trash", icon: "Trash2", shortcut: "S then R", requiredPermission: "system.trash.manage" },
        ],
      },
    ],
  },

  // ── Governance: Identity & Access ─────────────────────────────────────────
  identity: {
    title: "Identity & Access",
    translationKey: "nav.identity_access",
    sections: [
      {
        title: "User Management",
        translationKey: "nav.user_management",
        requiredPermission: ["system.security.manage", "users.view", "roles.view"],
        items: [
          { title: "Global Users", translationKey: "nav.global_users", url: "/users", icon: "Users", shortcut: "S then U", requiredPermission: ["system.security.manage", "users.view", "roles.view"] },
          { title: "User Sessions", translationKey: "nav.user_sessions", url: "/users/sessions", icon: "History", shortcut: "S then S", requiredPermission: "system.security.manage" },
        ],
      },
      {
        title: "Access Control",
        translationKey: "security.roles_matrix",
        requiredPermission: "system.security.manage",
        items: [
          { title: "Role Templates", translationKey: "nav.role_templates", url: "/security/roles", icon: "UserCog", shortcut: "S then R", requiredPermission: "system.security.manage" },
          { title: "Permissions", translationKey: "nav.permissions", url: "/security/permissions", icon: "KeyRound", shortcut: "S then P", requiredPermission: "system.security.manage" },
        ],
      },
      {
        title: "Identity & Auth",
        translationKey: "nav.authentication",
        requiredPermission: "system.security.manage",
        items: [
          { title: "Authentication", translationKey: "nav.authentication", url: "/security/auth", icon: "ShieldCheck", shortcut: "S then A", requiredPermission: "system.security.manage" },
          { title: "SSO Providers", translationKey: "nav.sso_providers", url: "/security/sso", icon: "Fingerprint", shortcut: "S then F", requiredPermission: "system.security.manage" },
        ],
      },
    ],
  },

  // ── Governance: Security & Compliance ─────────────────────────────────────
  security: {
    title: "Security & Compliance",
    translationKey: "nav.security_compliance",
    sections: [
      {
        title: "Threat & Alerts",
        translationKey: "nav.sec_monitoring",
        requiredPermission: "system.security.manage",
        items: [
          { title: "Security Alerts", translationKey: "nav.security_alerts", url: "/security/alerts", icon: "ShieldAlert", shortcut: "S then M", requiredPermission: "system.security.manage" },
        ],
      },
      {
        title: "Governance & Policies",
        translationKey: "nav.sec_policies",
        requiredPermission: "system.security.manage",
        items: [
          { title: "Password Policy", translationKey: "nav.password_policy", url: "/security/password-policy", icon: "ScrollText", shortcut: "S then W", requiredPermission: "system.security.manage" },
          { title: "Compliance", translationKey: "nav.compliance", url: "/security/compliance", icon: "FileText", shortcut: "S then C", requiredPermission: "system.security.manage" },
          { title: "Audit Policy & Retention", translationKey: "nav.audit_policy", url: "/security/audit", icon: "ArchiveRestore", shortcut: "S then L", requiredPermission: "system.audit.view" },
        ],
      },
    ],
  },

  // ── Platform: Logs (Forensics) ───────────────────────────────────────────
  logs: {
    title: "Global Logs",
    translationKey: "nav.global_logs",
    sections: [
      {
        title: "Forensics & Stream",
        translationKey: "nav.global_logs",
        requiredPermission: "system.audit.view",
        items: [
          { title: "Logs Explorer", translationKey: "nav.logs_explorer", url: "/logs", icon: "Terminal", shortcut: "S then L", requiredPermission: "system.audit.view" },
        ],
      },
      {
        title: "System Operations",
        translationKey: "nav.operations_feed",
        requiredPermission: "system.observability.view",
        items: [
          { title: "Operations Feed", translationKey: "nav.operations_feed", url: "/observability/operations", icon: "History", shortcut: "S then O", requiredPermission: "system.observability.view" },
        ],
      },
    ],
  },

  // ── Bottom: Configuration Center ──────────────────────────────────────────
  settings: {
    title: "Global Settings",
    translationKey: "nav.settings",
    sections: [
      {
        title: "Platform Config",
        translationKey: "nav.general_settings",
        requiredPermission: "system.settings.manage",
        items: [
          { title: "General Settings", translationKey: "nav.general_settings", url: "/settings/general", icon: "Sliders", shortcut: "S then G", requiredPermission: "system.settings.manage" },
          { title: "System Information", translationKey: "nav.system_info", url: "/settings/system-info", icon: "Cpu", shortcut: "S then I", requiredPermission: "system.settings.manage" },
          { title: "GIS & Spatial Map", translationKey: "nav.gis_spatial_map", url: "/settings/gis-spatial", icon: "MapPin", shortcut: "S then M", requiredPermission: "system.settings.manage" },
          { title: "Branding & Whitelabel", translationKey: "nav.branding_whitelabel", url: "/settings/branding", icon: "Palette", shortcut: "S then B", requiredPermission: "system.settings.manage" },
          { title: "SMTP Mail Server", translationKey: "nav.smtp_mail_server", url: "/settings/smtp-mail", icon: "Mail", shortcut: "S then S", requiredPermission: "system.settings.manage" },
        ],
      },
    ],
  },
};

// ── Backwards-Compatibility Aliases ─────────────────────────────────────────
SYSTEM_SIDEBAR_NAVIGATION.licenses = SYSTEM_SIDEBAR_NAVIGATION.licensing;
SYSTEM_SIDEBAR_NAVIGATION.packages = SYSTEM_SIDEBAR_NAVIGATION.catalog;
SYSTEM_SIDEBAR_NAVIGATION.users = SYSTEM_SIDEBAR_NAVIGATION.identity;
SYSTEM_SIDEBAR_NAVIGATION.data_protection = SYSTEM_SIDEBAR_NAVIGATION.system;
SYSTEM_SIDEBAR_NAVIGATION.tasks = SYSTEM_SIDEBAR_NAVIGATION.workspace;
