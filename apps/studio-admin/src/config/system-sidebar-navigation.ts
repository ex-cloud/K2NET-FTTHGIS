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
          { title: "Operations", url: "/observability/operations", icon: "Wrench" },
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
        ],
      },
      {
        title: "Security & Routing",
        items: [
          { title: "Security & CORS", url: "/settings/security", icon: "ShieldCheck" },
          { title: "Audit Log Retention", url: "/settings/audit-logs", icon: "History" },
        ],
      },
      {
        title: "System Communications",
        items: [
          { title: "SMTP Mail Server", url: "/settings/smtp-mail", icon: "Mail" },
        ],
      },
    ],
  },
};
