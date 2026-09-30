import type { TranslationKey } from "@k2net/i18n";

export type MenuItem = {
  title: string;
  translationKey?: TranslationKey;
  url: string;
  icon: string;
  requiredPermission?: string | string[];
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
  organizations: {
    title: "Organizations",
    translationKey: "nav.organizations",
    sections: [
      {
        title: "Tenant Directory",
        translationKey: "organizations.title",
        requiredPermission: ["system.organizations.view", "orgs.view"],
        items: [
          { title: "All Organizations", translationKey: "nav.all_organizations", url: "/organizations", icon: "Building2", requiredPermission: ["system.organizations.view", "orgs.view"] },
          { title: "Active Tenants", translationKey: "nav.active_tenants", url: "/organizations?status=ACTIVE", icon: "CheckCircle", requiredPermission: ["system.organizations.view", "orgs.view"] },
          { title: "Trial Accounts", translationKey: "nav.trial_accounts", url: "/organizations?status=TRIAL", icon: "Clock", requiredPermission: ["system.organizations.view", "orgs.view"] },
          { title: "Provisioning Queue", translationKey: "nav.provisioning_queue", url: "/organizations?status=PROVISIONING", icon: "UploadCloud", requiredPermission: ["system.organizations.view", "orgs.view"] },
          { title: "Suspended & Inactive", translationKey: "nav.suspended_inactive", url: "/organizations?status=SUSPENDED", icon: "UserX", requiredPermission: ["system.organizations.view", "orgs.view"] },
        ],
      },
      {
        title: "Support & Forensics",
        translationKey: "nav.support_access_center",
        requiredPermission: "system.support.impersonate",
        items: [
          { title: "Support Access Center", translationKey: "nav.support_access_center", url: "/organizations/impersonation", icon: "ShieldAlert", requiredPermission: "system.support.impersonate" },
        ],
      },
      {
        title: "Entitlements & Limits",
        translationKey: "nav.sec_entitlements",
        requiredPermission: ["system.organizations.manage", "system.quotas.manage"],
        items: [
          { title: "Feature Flags & Add-ons", translationKey: "organizations.feature_flags_title", url: "/organizations/features", icon: "Sliders", requiredPermission: ["system.organizations.manage", "system.organizations.update"] },
          { title: "FTTH Spatial Quotas", translationKey: "organizations.edit_quotas_title", url: "/organizations/quotas", icon: "Network", requiredPermission: ["system.organizations.manage", "system.quotas.manage"] },
        ],
      },
      {
        title: "Domains & Routing",
        translationKey: "nav.sec_domains_routing",
        requiredPermission: ["system.organizations.manage", "system.organizations.update"],
        items: [
          { title: "Custom Domains", translationKey: "organizations.custom_domain_title", url: "/organizations/domains", icon: "Globe", requiredPermission: ["system.organizations.manage", "system.organizations.update"] },
          { title: "VPN & Tunneling", translationKey: "nav.vpn_tunneling", url: "/organizations/vpn", icon: "ShieldCheck", requiredPermission: ["system.organizations.manage", "system.organizations.update"] },
        ],
      },
    ],
  },
  logs: {
    title: "Global Logs",
    translationKey: "nav.global_logs",
    sections: [
      {
        title: "Forensics & Stream",
        translationKey: "nav.global_logs",
        requiredPermission: "system.audit.view",
        items: [
          { title: "Logs Explorer", translationKey: "nav.logs_explorer", url: "/logs", icon: "Terminal", requiredPermission: "system.audit.view" },
        ],
      },
      {
        title: "System Operations",
        translationKey: "nav.operations_feed",
        requiredPermission: "system.observability.view",
        items: [
          { title: "Operations Feed", translationKey: "nav.operations_feed", url: "/observability/operations", icon: "History", requiredPermission: "system.observability.view" },
        ],
      },
    ],
  },
  users: {
    title: "User Registry",
    translationKey: "nav.user_registry",
    sections: [
      {
        title: "User Management",
        translationKey: "nav.user_management",
        requiredPermission: ["system.security.manage", "users.view", "roles.view"],
        items: [
          { title: "Global Users", translationKey: "nav.global_users", url: "/users", icon: "Users", requiredPermission: ["system.security.manage", "users.view", "roles.view"] },
        ],
      },
      {
        title: "Access Control",
        translationKey: "security.roles_matrix",
        requiredPermission: ["system.security.manage", "roles.update", "users.manage"],
        items: [
          { title: "Global Roles", translationKey: "nav.global_roles", url: "/users/roles", icon: "ShieldCheck", requiredPermission: ["system.security.manage", "roles.update", "users.manage"] },
        ],
      },
      {
        title: "Activity",
        translationKey: "nav.user_sessions",
        requiredPermission: "system.security.manage",
        items: [
          { title: "User Sessions", translationKey: "nav.user_sessions", url: "/users/sessions", icon: "History", requiredPermission: "system.security.manage" },
        ],
      },
    ],
  },
  security: {
    title: "Security Settings",
    translationKey: "nav.security",
    sections: [
      {
        title: "Access Control",
        translationKey: "security.roles_matrix",
        requiredPermission: "system.security.manage",
        items: [
          { title: "Role Templates", translationKey: "nav.role_templates", url: "/security/roles", icon: "UserCog", requiredPermission: "system.security.manage" },
          { title: "Permissions", translationKey: "nav.permissions", url: "/security/permissions", icon: "KeyRound", requiredPermission: "system.security.manage" },
        ],
      },
      {
        title: "Identity & Auth",
        translationKey: "nav.authentication",
        requiredPermission: "system.security.manage",
        items: [
          { title: "Authentication", translationKey: "nav.authentication", url: "/security/auth", icon: "ShieldCheck", requiredPermission: "system.security.manage" },
          { title: "SSO Providers", translationKey: "nav.sso_providers", url: "/security/sso", icon: "Fingerprint", requiredPermission: "system.security.manage" },
        ],
      },
      {
        title: "Monitoring",
        translationKey: "nav.sec_monitoring",
        items: [
          { title: "Security Alerts", translationKey: "nav.security_alerts", url: "/security/alerts", icon: "ShieldAlert", requiredPermission: "system.security.manage" },
        ],
      },
      {
        title: "Policies",
        translationKey: "nav.sec_policies",
        requiredPermission: "system.security.manage",
        items: [
          { title: "Password Policy", translationKey: "nav.password_policy", url: "/security/password-policy", icon: "ScrollText", requiredPermission: "system.security.manage" },
          { title: "Compliance", translationKey: "nav.compliance", url: "/security/compliance", icon: "FileText", requiredPermission: "system.security.manage" },
          { title: "Audit Policy & Retention", translationKey: "nav.audit_policy", url: "/security/audit", icon: "ArchiveRestore", requiredPermission: "system.audit.view" },
        ],
      },
    ],
  },
  gateways: {
    title: "Gateways & Integration",
    translationKey: "nav.gateways",
    sections: [
      {
        title: "Overview",
        translationKey: "nav.overview",
        requiredPermission: "system.observability.view",
        items: [
          { title: "Status & Metrics", translationKey: "nav.status_metrics", url: "/gateways/overview", icon: "BarChart3", requiredPermission: "system.observability.view" },
        ],
      },
      {
        title: "Services Control",
        translationKey: "nav.services_control",
        requiredPermission: "system.gateway.manage",
        items: [
          { title: "Notification Gateway", translationKey: "nav.notification_gateway", url: "/gateways/notification", icon: "MessageSquare", requiredPermission: "system.gateway.manage" },
          { title: "Payment Gateway", translationKey: "nav.payment_gateway", url: "/gateways/payment", icon: "CreditCard", requiredPermission: "system.gateway.manage" },
          { title: "Map Gateway", translationKey: "nav.map_gateway", url: "/gateways/map", icon: "Map", requiredPermission: "system.gateway.manage" },
          { title: "Storage Gateway", translationKey: "nav.storage_gateway", url: "/gateways/storage", icon: "Database", requiredPermission: "system.gateway.manage" },
          { title: "WhatsApp Gateway", translationKey: "nav.whatsapp_gateway", url: "/gateways/whatsapp", icon: "MessageCircle", requiredPermission: "system.gateway.manage" },
          { title: "Scheduler Gateway", translationKey: "nav.scheduler_gateway", url: "/gateways/scheduler", icon: "Clock", requiredPermission: "system.gateway.manage" },
          { title: "Export Gateway", translationKey: "nav.export_gateway", url: "/gateways/export", icon: "Download", requiredPermission: "system.gateway.manage" },
          { title: "OLT Gateway", translationKey: "nav.olt_gateway", url: "/gateways/olt", icon: "Network", requiredPermission: "system.gateway.manage" },
          { title: "Audit Gateway", translationKey: "nav.audit_gateway", url: "/gateways/audit", icon: "FileText", requiredPermission: "system.gateway.manage" },
          { title: "Poller Gateway", translationKey: "nav.poller_gateway", url: "/gateways/poller", icon: "Activity", requiredPermission: "system.gateway.manage" },
        ],
      },
    ],
  },
  observability: {
    title: "Observability",
    translationKey: "nav.observability",
    sections: [
      {
        title: "General",
        translationKey: "nav.overview",
        requiredPermission: "system.observability.view",
        items: [
          { title: "Overview", translationKey: "nav.overview", url: "/observability/overview", icon: "LayoutDashboard", requiredPermission: "system.observability.view" },
          { title: "Query Performance", translationKey: "nav.query_performance", url: "/observability/query-performance", icon: "DatabaseZap", requiredPermission: "system.observability.view" },
          { title: "API Gateway", translationKey: "nav.api_gateway", url: "/observability/api-gateway", icon: "Globe", requiredPermission: "system.observability.view" },
        ],
      },
      {
        title: "Infrastructure & Core",
        translationKey: "nav.compute_host",
        requiredPermission: "system.observability.view",
        items: [
          { title: "Compute & Host", translationKey: "nav.compute_host", url: "/observability/compute", icon: "Server", requiredPermission: "system.observability.view" },
          { title: "Database & Cache", translationKey: "nav.database_cache", url: "/observability/database", icon: "Database", requiredPermission: "system.observability.view" },
          { title: "Identity (Auth)", translationKey: "nav.identity_auth", url: "/observability/identity", icon: "KeyRound", requiredPermission: "system.observability.view" },
        ],
      },
      {
        title: "Go Gateways",
        translationKey: "nav.gateways",
        requiredPermission: "system.observability.view",
        items: [
          { title: "OLT & Poller", translationKey: "nav.olt_poller", url: "/observability/olt-poller", icon: "Radio", requiredPermission: "system.observability.view" },
          { title: "Spatial Map", translationKey: "nav.spatial_map", url: "/observability/spatial-map", icon: "Map", requiredPermission: "system.observability.view" },
          { title: "Messaging", translationKey: "nav.messaging", url: "/observability/messaging", icon: "MessageSquare", requiredPermission: "system.observability.view" },
          { title: "Scheduled Jobs", translationKey: "nav.scheduled_jobs", url: "/observability/scheduler", icon: "CalendarClock", requiredPermission: "system.observability.view" },
        ],
      },
    ],
  },
  ai: {
    title: "AI Assistant & Copilot",
    translationKey: "nav.ai_assistant",
    sections: [
      {
        title: "Basis Pengetahuan (RAG)",
        translationKey: "nav.knowledge_base_rag",
        requiredPermission: "system.ai.manage",
        items: [
          { title: "Daftar Pengetahuan", translationKey: "nav.knowledge_list", url: "/ai", icon: "Database", requiredPermission: "system.ai.manage" },
          { title: "Graf Pengetahuan 2D", translationKey: "nav.knowledge_graph_2d", url: "/ai/graph", icon: "Network", requiredPermission: "system.ai.manage" },
          { title: "Tambah Pengetahuan", translationKey: "nav.add_knowledge", url: "/ai/add", icon: "UploadCloud", requiredPermission: "system.ai.manage" },
        ],
      },
      {
        title: "Simulasi & Panduan",
        translationKey: "nav.rag_simulator",
        requiredPermission: "system.ai.manage",
        items: [
          { title: "RAG Simulator", translationKey: "nav.rag_simulator", url: "/ai/simulator", icon: "FlaskConical", requiredPermission: "system.ai.manage" },
          { title: "Template & Panduan SOP", translationKey: "nav.sop_templates", url: "/ai/templates", icon: "FileCode", requiredPermission: "system.ai.manage" },
          { title: "Saran Prompt & Trending", translationKey: "nav.prompt_trending", url: "/ai/prompts", icon: "Sparkles", requiredPermission: "system.ai.manage" },
        ],
      },
      {
        title: "Engine & Orkestrasi",
        translationKey: "nav.multi_provider_hub",
        requiredPermission: "system.ai.manage",
        items: [
          { title: "Multi-Provider Hub", translationKey: "nav.multi_provider_hub", url: "/ai/config", icon: "Cpu", requiredPermission: "system.ai.manage" },
        ],
      },
    ],
  },
  tasks: {
    title: "Projects & Issues",
    translationKey: "nav.projects_issues",
    sections: [
      {
        title: "Workspace",
        translationKey: "nav.projects_plans",
        requiredPermission: "system.task.manage",
        items: [
          { title: "Projects & Plans", translationKey: "nav.projects_plans", url: "/tasks/projects", icon: "FolderKanban", requiredPermission: "system.task.manage" },
          { title: "Internal Platform Issues", translationKey: "nav.internal_platform_issues", url: "/tasks?scope=PLATFORM_INTERNAL", icon: "Server", requiredPermission: "system.task.manage" },
          { title: "B2B Mitra Escalations", translationKey: "nav.b2b_escalations", url: "/tasks?scope=TENANT_TO_PLATFORM", icon: "Building2", requiredPermission: "system.task.manage" },
        ],
      },
      {
        title: "Views",
        translationKey: "nav.all_issues",
        requiredPermission: "system.task.manage",
        items: [
          { title: "All Issues", translationKey: "nav.all_issues", url: "/tasks", icon: "LayoutDashboard", requiredPermission: "system.task.manage" },
          { title: "Active Issues", translationKey: "nav.active_issues", url: "/tasks?quick=active", icon: "Activity", requiredPermission: "system.task.manage" },
          { title: "Overdue", translationKey: "nav.overdue_issues", url: "/tasks?quick=overdue", icon: "CalendarClock", requiredPermission: "system.task.manage" },
          { title: "Unassigned", translationKey: "nav.unassigned_issues", url: "/tasks?quick=no-assignee", icon: "UserX", requiredPermission: "system.task.manage" },
          { title: "Upcoming 7d", translationKey: "nav.upcoming_7d", url: "/tasks?quick=upcoming", icon: "Clock", requiredPermission: "system.task.manage" },
          { title: "Resolved", translationKey: "nav.resolved_issues", url: "/tasks?quick=resolved", icon: "CheckCircle", requiredPermission: "system.task.manage" },
        ],
      },
      {
        title: "Personal",
        translationKey: "nav.my_assigned_issues",
        requiredPermission: "system.task.manage",
        items: [
          { title: "My Assigned Issues", translationKey: "nav.my_assigned_issues", url: "/tasks?quick=my-issues", icon: "ClipboardList", requiredPermission: "system.task.manage" },
          { title: "Created by Me", translationKey: "nav.created_by_me", url: "/tasks?quick=created-by-me", icon: "UserCheck", requiredPermission: "system.task.manage" },
        ],
      },
    ],
  },
  settings: {
    title: "Global Settings",
    translationKey: "nav.settings",
    sections: [
      {
        title: "Platform Config",
        translationKey: "nav.general_settings",
        requiredPermission: "system.settings.manage",
        items: [
          { title: "General Settings", translationKey: "nav.general_settings", url: "/settings/general", icon: "Sliders", requiredPermission: "system.settings.manage" },
          { title: "GIS & Spatial Map", translationKey: "nav.gis_spatial_map", url: "/settings/gis-spatial", icon: "MapPin", requiredPermission: "system.settings.manage" },
          { title: "Branding & Whitelabel", translationKey: "nav.branding_whitelabel", url: "/settings/branding", icon: "Palette", requiredPermission: "system.settings.manage" },
          { title: "SMTP Mail Server", translationKey: "nav.smtp_mail_server", url: "/settings/smtp-mail", icon: "Mail", requiredPermission: "system.settings.manage" },
        ],
      },
    ],
  },
  system: {
    title: "System Recovery",
    translationKey: "nav.recycle_bin",
    sections: [
      {
        title: "Data Recovery",
        translationKey: "nav.recycle_bin",
        requiredPermission: "system.trash.manage",
        items: [
          { title: "Recycle Bin", translationKey: "nav.recycle_bin", url: "/system/trash", icon: "Trash2", requiredPermission: "system.trash.manage" },
        ],
      },
    ],
  },
};
