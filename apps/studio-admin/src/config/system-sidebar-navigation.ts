export type MenuItem = {
  title: string;
  url: string;
  icon: string;
  requiredPermission?: string | string[];
};

export type MenuSection = {
  title: string;
  items: MenuItem[];
  requiredPermission?: string | string[];
};

export type SidebarConfig = {
  [key: string]: {
    title: string;
    sections: MenuSection[];
  };
};

export const SYSTEM_SIDEBAR_NAVIGATION: SidebarConfig = {
  organizations: {
    title: "Organizations",
    sections: [
      {
        title: "Tenant Directory",
        requiredPermission: "system.tenant.view",
        items: [
          { title: "All Organizations", url: "/organizations", icon: "Building2", requiredPermission: "system.tenant.view" },
          { title: "Active Tenants", url: "/organizations?status=ACTIVE", icon: "CheckCircle", requiredPermission: "system.tenant.view" },
          { title: "Trial Accounts", url: "/organizations?status=TRIAL", icon: "Clock", requiredPermission: "system.tenant.view" },
          { title: "Provisioning Queue", url: "/organizations?status=PROVISIONING", icon: "UploadCloud", requiredPermission: "system.tenant.view" },
          { title: "Suspended & Inactive", url: "/organizations?status=SUSPENDED", icon: "UserX", requiredPermission: "system.tenant.view" },
        ],
      },
      {
        title: "Support & Forensics",
        requiredPermission: "system.support.impersonate",
        items: [
          { title: "Support Access Center", url: "/organizations/impersonation", icon: "ShieldAlert", requiredPermission: "system.support.impersonate" },
        ],
      },
      {
        title: "Entitlements & Limits",
        requiredPermission: "system.tenant.manage",
        items: [
          { title: "Feature Flags & Add-ons", url: "/organizations/features", icon: "Sliders", requiredPermission: "system.tenant.manage" },
          { title: "FTTH Spatial Quotas", url: "/organizations/quotas", icon: "Network", requiredPermission: "system.tenant.manage" },
        ],
      },
      {
        title: "Domains & Routing",
        requiredPermission: "system.tenant.manage",
        items: [
          { title: "Custom Domains", url: "/organizations/domains", icon: "Globe", requiredPermission: "system.tenant.manage" },
          { title: "VPN & Tunneling", url: "/organizations/vpn", icon: "ShieldCheck", requiredPermission: "system.tenant.manage" },
        ],
      },
    ],
  },
  logs: {
    title: "Global Logs",
    sections: [
      {
        title: "Forensics & Stream",
        requiredPermission: "system.audit.view",
        items: [
          { title: "Logs Explorer", url: "/logs", icon: "Terminal", requiredPermission: "system.audit.view" },
        ],
      },
      {
        title: "System Operations",
        requiredPermission: "system.observability.view",
        items: [
          { title: "Operations Feed", url: "/observability/operations", icon: "History", requiredPermission: "system.observability.view" },
        ],
      },
    ],
  },
  users: {
    title: "User Registry",
    sections: [
      {
        title: "User Management",
        requiredPermission: "system.user.view",
        items: [
          { title: "Global Users", url: "/users", icon: "Users", requiredPermission: "system.user.view" },
        ],
      },
      {
        title: "Access Control",
        requiredPermission: "system.user.manage",
        items: [
          { title: "Global Roles", url: "/users/roles", icon: "ShieldCheck", requiredPermission: "system.user.manage" },
        ],
      },
      {
        title: "Activity",
        requiredPermission: "system.security.manage",
        items: [
          { title: "User Sessions", url: "/users/sessions", icon: "History", requiredPermission: "system.security.manage" },
        ],
      },
    ],
  },
  security: {
    title: "Security Settings",
    sections: [
      {
        title: "Access Control",
        requiredPermission: "system.security.manage",
        items: [
          { title: "Role Templates", url: "/security/roles", icon: "UserCog", requiredPermission: "system.security.manage" },
          { title: "Permissions", url: "/security/permissions", icon: "KeyRound", requiredPermission: "system.security.manage" },
        ],
      },
      {
        title: "Identity & Auth",
        requiredPermission: "system.security.manage",
        items: [
          { title: "Authentication", url: "/security/auth", icon: "ShieldCheck", requiredPermission: "system.security.manage" },
          { title: "SSO Providers", url: "/security/sso", icon: "Fingerprint", requiredPermission: "system.security.manage" },
        ],
      },
      {
        title: "Monitoring",
        items: [
          { title: "Audit Logs", url: "/security/audit", icon: "History", requiredPermission: "system.audit.view" },
          { title: "Security Alerts", url: "/security/alerts", icon: "ShieldAlert", requiredPermission: "system.security.manage" },
        ],
      },
      {
        title: "Policies",
        requiredPermission: "system.security.manage",
        items: [
          { title: "Password Policy", url: "/security/password-policy", icon: "ScrollText", requiredPermission: "system.security.manage" },
          { title: "Compliance", url: "/security/compliance", icon: "FileText", requiredPermission: "system.security.manage" },
        ],
      },
    ],
  },
  gateways: {
    title: "Gateways & Integration",
    sections: [
      {
        title: "Overview",
        requiredPermission: "system.observability.view",
        items: [
          { title: "Status & Metrics", url: "/gateways/overview", icon: "BarChart3", requiredPermission: "system.observability.view" },
        ],
      },
      {
        title: "Services Control",
        requiredPermission: "system.gateway.manage",
        items: [
          { title: "Notification Gateway", url: "/gateways/notification", icon: "MessageSquare", requiredPermission: "system.gateway.manage" },
          { title: "Payment Gateway", url: "/gateways/payment", icon: "CreditCard", requiredPermission: "system.gateway.manage" },
          { title: "Map Gateway", url: "/gateways/map", icon: "Map", requiredPermission: "system.gateway.manage" },
          { title: "Storage Gateway", url: "/gateways/storage", icon: "Database", requiredPermission: "system.gateway.manage" },
          { title: "WhatsApp Gateway", url: "/gateways/whatsapp", icon: "MessageCircle", requiredPermission: "system.gateway.manage" },
          { title: "Scheduler Gateway", url: "/gateways/scheduler", icon: "Clock", requiredPermission: "system.gateway.manage" },
          { title: "Export Gateway", url: "/gateways/export", icon: "Download", requiredPermission: "system.gateway.manage" },
          { title: "OLT Gateway", url: "/gateways/olt", icon: "Network", requiredPermission: "system.gateway.manage" },
          { title: "Audit Gateway", url: "/gateways/audit", icon: "FileText", requiredPermission: "system.gateway.manage" },
          { title: "Poller Gateway", url: "/gateways/poller", icon: "Activity", requiredPermission: "system.gateway.manage" },
        ],
      },
    ],
  },
  observability: {
    title: "Observability",
    sections: [
      {
        title: "General",
        requiredPermission: "system.observability.view",
        items: [
          { title: "Overview", url: "/observability/overview", icon: "LayoutDashboard", requiredPermission: "system.observability.view" },
          { title: "Query Performance", url: "/observability/query-performance", icon: "DatabaseZap", requiredPermission: "system.observability.view" },
          { title: "API Gateway", url: "/observability/api-gateway", icon: "Globe", requiredPermission: "system.observability.view" },
        ],
      },
      {
        title: "Infrastructure & Core",
        requiredPermission: "system.observability.view",
        items: [
          { title: "Compute & Host", url: "/observability/compute", icon: "Server", requiredPermission: "system.observability.view" },
          { title: "Database & Cache", url: "/observability/database", icon: "Database", requiredPermission: "system.observability.view" },
          { title: "Identity (Auth)", url: "/observability/identity", icon: "KeyRound", requiredPermission: "system.observability.view" },
        ],
      },
      {
        title: "Go Gateways",
        requiredPermission: "system.observability.view",
        items: [
          { title: "OLT & Poller", url: "/observability/olt-poller", icon: "Radio", requiredPermission: "system.observability.view" },
          { title: "Spatial Map", url: "/observability/spatial-map", icon: "Map", requiredPermission: "system.observability.view" },
          { title: "Messaging", url: "/observability/messaging", icon: "MessageSquare", requiredPermission: "system.observability.view" },
          { title: "Scheduled Jobs", url: "/observability/scheduler", icon: "CalendarClock", requiredPermission: "system.observability.view" },
        ],
      },
    ],
  },
  ai: {
    title: "AI Assistant & Copilot",
    sections: [
      {
        title: "Basis Pengetahuan (RAG)",
        requiredPermission: "system.ai.manage",
        items: [
          { title: "Daftar Pengetahuan", url: "/ai", icon: "Database", requiredPermission: "system.ai.manage" },
          { title: "Graf Pengetahuan 2D", url: "/ai/graph", icon: "Network", requiredPermission: "system.ai.manage" },
          { title: "Tambah Pengetahuan", url: "/ai/add", icon: "UploadCloud", requiredPermission: "system.ai.manage" },
        ],
      },
      {
        title: "Simulasi & Panduan",
        requiredPermission: "system.ai.manage",
        items: [
          { title: "RAG Simulator", url: "/ai/simulator", icon: "FlaskConical", requiredPermission: "system.ai.manage" },
          { title: "Template & Panduan SOP", url: "/ai/templates", icon: "FileCode", requiredPermission: "system.ai.manage" },
          { title: "Saran Prompt & Trending", url: "/ai/prompts", icon: "Sparkles", requiredPermission: "system.ai.manage" },
        ],
      },
      {
        title: "Engine & Orkestrasi",
        requiredPermission: "system.ai.manage",
        items: [
          { title: "Multi-Provider Hub", url: "/ai/config", icon: "Cpu", requiredPermission: "system.ai.manage" },
        ],
      },
    ],
  },
  tasks: {
    title: "Projects & Issues",
    sections: [
      {
        title: "Workspace",
        requiredPermission: "system.task.manage",
        items: [
          { title: "Projects & Plans", url: "/tasks/projects", icon: "FolderKanban", requiredPermission: "system.task.manage" },
          { title: "Internal Platform Issues", url: "/tasks?scope=PLATFORM_INTERNAL", icon: "Server", requiredPermission: "system.task.manage" },
          { title: "B2B Mitra Escalations", url: "/tasks?scope=TENANT_TO_PLATFORM", icon: "Building2", requiredPermission: "system.task.manage" },
        ],
      },
      {
        title: "Views",
        requiredPermission: "system.task.manage",
        items: [
          { title: "All Issues", url: "/tasks", icon: "LayoutDashboard", requiredPermission: "system.task.manage" },
          { title: "Active Issues", url: "/tasks?quick=active", icon: "Activity", requiredPermission: "system.task.manage" },
          { title: "Overdue", url: "/tasks?quick=overdue", icon: "CalendarClock", requiredPermission: "system.task.manage" },
          { title: "Unassigned", url: "/tasks?quick=no-assignee", icon: "UserX", requiredPermission: "system.task.manage" },
          { title: "Upcoming 7d", url: "/tasks?quick=upcoming", icon: "Clock", requiredPermission: "system.task.manage" },
          { title: "Resolved", url: "/tasks?quick=resolved", icon: "CheckCircle", requiredPermission: "system.task.manage" },
        ],
      },
      {
        title: "Personal",
        requiredPermission: "system.task.manage",
        items: [
          { title: "My Assigned Issues", url: "/tasks?quick=my-issues", icon: "ClipboardList", requiredPermission: "system.task.manage" },
          { title: "Created by Me", url: "/tasks?quick=created-by-me", icon: "UserCheck", requiredPermission: "system.task.manage" },
        ],
      },
    ],
  },
  settings: {
    title: "Global Settings",
    sections: [
      {
        title: "Platform Config",
        requiredPermission: "system.settings.manage",
        items: [
          { title: "General Settings", url: "/settings/general", icon: "Sliders", requiredPermission: "system.settings.manage" },
          { title: "GIS & Spatial Map", url: "/settings/gis-spatial", icon: "MapPin", requiredPermission: "system.settings.manage" },
          { title: "Branding & Whitelabel", url: "/settings/branding", icon: "Palette", requiredPermission: "system.settings.manage" },
          { title: "SMTP Mail Server", url: "/settings/smtp-mail", icon: "Mail", requiredPermission: "system.settings.manage" },
        ],
      },
    ],
  },
  system: {
    title: "System Recovery",
    sections: [
      {
        title: "Data Recovery",
        requiredPermission: "system.trash.manage",
        items: [
          { title: "Recycle Bin", url: "/system/trash", icon: "Trash2", requiredPermission: "system.trash.manage" },
        ],
      },
    ],
  },
};
