export type MenuItem = {
  title: string;
  url: string;
  icon: string;
};

export type MenuSection = {
  title: string;
  items: MenuItem[];
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
        items: [
          { title: "All Organizations", url: "/organizations", icon: "Building2" },
          { title: "Active Tenants", url: "/organizations?status=ACTIVE", icon: "CheckCircle" },
          { title: "Trial Accounts", url: "/organizations?status=TRIAL", icon: "Clock" },
          { title: "Provisioning Queue", url: "/organizations?status=PROVISIONING", icon: "UploadCloud" },
          { title: "Suspended & Inactive", url: "/organizations?status=SUSPENDED", icon: "ShieldAlert" },
        ],
      },
      {
        title: "Entitlements & Limits",
        items: [
          { title: "Feature Flags & Add-ons", url: "/organizations/features", icon: "Sliders" },
          { title: "FTTH Spatial Quotas", url: "/organizations/quotas", icon: "Network" },
        ],
      },
      {
        title: "Domains & Routing",
        items: [
          { title: "Custom Domains", url: "/organizations/domains", icon: "Globe" },
          { title: "VPN & Tunneling", url: "/organizations/vpn", icon: "ShieldCheck" },
        ],
      },
      {
        title: "Support & Forensics",
        items: [
          { title: "Impersonation Center", url: "/organizations/impersonation", icon: "ShieldAlert" },
        ],
      },
    ],
  },
  logs: {
    title: "Global Logs",
    sections: [
      {
        title: "Forensics & Stream",
        items: [
          { title: "Logs Explorer", url: "/logs", icon: "Terminal" },
        ],
      },
      {
        title: "System Operations",
        items: [
          { title: "Operations Feed", url: "/observability/operations", icon: "History" },
        ],
      },
    ],
  },
  users: {
    title: "User Registry",
    sections: [
      {
        title: "User Management",
        items: [
          { title: "Global Users", url: "/users", icon: "Users" },
        ],
      },
      {
        title: "Access Control",
        items: [
          { title: "Global Roles", url: "/users/roles", icon: "ShieldCheck" },
        ],
      },
      {
        title: "Activity",
        items: [
          { title: "User Sessions", url: "/users/sessions", icon: "History" },
        ],
      },
    ],
  },
  security: {
    title: "Security Settings",
    sections: [
      {
        title: "Access Control",
        items: [
          { title: "Role Templates", url: "/security/roles", icon: "UserCog" },
          { title: "Permissions", url: "/security/permissions", icon: "KeyRound" },
        ],
      },
      {
        title: "Identity & Auth",
        items: [
          { title: "Authentication", url: "/security/auth", icon: "ShieldCheck" },
          { title: "SSO Providers", url: "/security/sso", icon: "Fingerprint" },
        ],
      },
      {
        title: "Monitoring",
        items: [
          { title: "Audit Logs", url: "/security/audit", icon: "History" },
          { title: "Security Alerts", url: "/security/alerts", icon: "ShieldAlert" },
        ],
      },
      {
        title: "Policies",
        items: [
          { title: "Password Policy", url: "/security/password-policy", icon: "ScrollText" },
          { title: "Compliance", url: "/security/compliance", icon: "FileText" },
        ],
      },
    ],
  },
  gateways: {
    title: "Gateways & Integration",
    sections: [
      {
        title: "Overview",
        items: [
          { title: "Status & Metrics", url: "/gateways/overview", icon: "BarChart3" },
        ],
      },
      {
        title: "Services Control",
        items: [
          { title: "Notification Gateway", url: "/gateways/notification", icon: "MessageSquare" },
          { title: "Payment Gateway", url: "/gateways/payment", icon: "CreditCard" },
          { title: "Map Gateway", url: "/gateways/map", icon: "Map" },
          { title: "Storage Gateway", url: "/gateways/storage", icon: "Database" },
          { title: "WhatsApp Gateway", url: "/gateways/whatsapp", icon: "MessageCircle" },
          { title: "Scheduler Gateway", url: "/gateways/scheduler", icon: "Clock" },
          { title: "Export Gateway", url: "/gateways/export", icon: "Download" },
          { title: "OLT Gateway", url: "/gateways/olt", icon: "Network" },
          { title: "Audit Gateway", url: "/gateways/audit", icon: "FileText" },
          { title: "Poller Gateway", url: "/gateways/poller", icon: "Activity" },
        ],
      },
    ],
  },
  observability: {
    title: "Observability",
    sections: [
      {
        title: "General",
        items: [
          { title: "Overview", url: "/observability/overview", icon: "LayoutDashboard" },
          { title: "Query Performance", url: "/observability/query-performance", icon: "DatabaseZap" },
          { title: "API Gateway", url: "/observability/api-gateway", icon: "Globe" },
        ],
      },
      {
        title: "Infrastructure & Core",
        items: [
          { title: "Compute & Host", url: "/observability/compute", icon: "Server" },
          { title: "Database & Cache", url: "/observability/database", icon: "Database" },
          { title: "Identity (Auth)", url: "/observability/identity", icon: "KeyRound" },
        ],
      },
      {
        title: "Go Gateways",
        items: [
          { title: "OLT & Poller", url: "/observability/olt-poller", icon: "Radio" },
          { title: "Spatial Map", url: "/observability/spatial-map", icon: "Map" },
          { title: "Messaging", url: "/observability/messaging", icon: "MessageSquare" },
          { title: "Scheduled Jobs", url: "/observability/scheduler", icon: "CalendarClock" },
        ],
      },
    ],
  },
  ai: {
    title: "AI Assistant & Copilot",
    sections: [
      {
        title: "Basis Pengetahuan (RAG)",
        items: [
          { title: "Daftar Pengetahuan", url: "/ai", icon: "Database" },
          { title: "Graf Pengetahuan 2D", url: "/ai/graph", icon: "Network" },
          { title: "Tambah Pengetahuan", url: "/ai/add", icon: "UploadCloud" },
        ],
      },
      {
        title: "Simulasi & Panduan",
        items: [
          { title: "RAG Simulator", url: "/ai/simulator", icon: "FlaskConical" },
          { title: "Template & Panduan SOP", url: "/ai/templates", icon: "FileCode" },
          { title: "Saran Prompt & Trending", url: "/ai/prompts", icon: "Sparkles" },
        ],
      },
      {
        title: "Engine & Orkestrasi",
        items: [
          { title: "Multi-Provider Hub", url: "/ai/config", icon: "Cpu" },
        ],
      },
    ],
  },
  tasks: {
    title: "Projects & Issues",
    sections: [
      {
        title: "Workspace",
        items: [
          { title: "Projects & Plans", url: "/tasks/projects", icon: "FolderKanban" },
          { title: "Internal Platform Issues", url: "/tasks?scope=PLATFORM_INTERNAL", icon: "Server" },
          { title: "B2B Mitra Escalations", url: "/tasks?scope=TENANT_TO_PLATFORM", icon: "Building2" },
        ],
      },
      {
        title: "Views",
        items: [
          { title: "All Issues", url: "/tasks", icon: "LayoutDashboard" },
          { title: "Active Issues", url: "/tasks?quick=active", icon: "Activity" },
          { title: "Overdue", url: "/tasks?quick=overdue", icon: "CalendarClock" },
          { title: "Unassigned", url: "/tasks?quick=no-assignee", icon: "UserX" },
          { title: "Upcoming 7d", url: "/tasks?quick=upcoming", icon: "Clock" },
          { title: "Resolved", url: "/tasks?quick=resolved", icon: "CheckCircle" },
        ],
      },
      {
        title: "Personal",
        items: [
          { title: "My Assigned Issues", url: "/tasks?quick=my-issues", icon: "ClipboardList" },
          { title: "Created by Me", url: "/tasks?quick=created-by-me", icon: "UserCheck" },
        ],
      },
    ],
  },
  settings: {
    title: "Global Settings",
    sections: [
      {
        title: "Platform Config",
        items: [
          { title: "General Settings", url: "/settings/general", icon: "Sliders" },
          { title: "GIS & Spatial Map", url: "/settings/gis-spatial", icon: "MapPin" },
          { title: "Branding & Whitelabel", url: "/settings/branding", icon: "Palette" },
          { title: "SMTP Mail Server", url: "/settings/smtp-mail", icon: "Mail" },
        ],
      },
    ],
  },
  system: {
    title: "System Recovery",
    sections: [
      {
        title: "Data Recovery",
        items: [
          { title: "Recycle Bin", url: "/system/trash", icon: "Trash2" },
        ],
      },
    ],
  },
};
