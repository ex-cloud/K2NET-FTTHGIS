export type MenuItem = {
  title: string;
  url: string; // Relative to baseUrl (e.g., "", "/integrations", "/infrastructure/topology")
  icon: string;
};

export type MenuSection = {
  title: string;
  items: MenuItem[];
};

export type TenantSidebarConfig = {
  [module: string]: {
    title: string;
    sections: MenuSection[];
  };
};

export const TENANT_SIDEBAR_NAVIGATION: TenantSidebarConfig = {
  // --- ORG SETTINGS MODULE ---
  settings: {
    title: "Settings",
    sections: [
      {
        title: "Configuration",
        items: [
          { title: "General", url: "", icon: "Settings2" },
          { title: "Integrations", url: "/integrations", icon: "Blocks" },
          { title: "Usage Stats", url: "/usage", icon: "BarChart3" },
          { title: "Billing & Plans", url: "/billing", icon: "CreditCard" },
        ],
      },
      {
        title: "Security",
        items: [
          { title: "Security", url: "/security", icon: "ShieldCheck" },
          { title: "SSO", url: "/sso", icon: "Fingerprint" },
        ],
      },
      {
        title: "Connections",
        items: [
          { title: "OAuth Apps", url: "/oauth", icon: "Share2" },
        ],
      },
      {
        title: "Compliance",
        items: [
          { title: "Audit Logs", url: "/audit", icon: "History" },
          { title: "Legal Documents", url: "/legal", icon: "FileText" },
        ],
      },
    ],
  },

  // --- ORG TEAM MODULE ---
  team: {
    title: "Team Management",
    sections: [
      {
        title: "Team Management",
        items: [
          { title: "Members", url: "", icon: "Users" },
          { title: "Invite Members", url: "/invite", icon: "UserPlus" },
        ],
      },
      {
        title: "Access Control",
        items: [
          { title: "Roles & Permissions", url: "/roles", icon: "ShieldCheck" },
          { title: "Role Assignments", url: "/assignments", icon: "UserCog" },
        ],
      },
      {
        title: "Activity",
        items: [
          { title: "Activity Log", url: "/activity", icon: "History" },
          { title: "Pending Invites", url: "/invites", icon: "Mail" },
        ],
      },
    ],
  },

  // --- PROJECT SUB-MODULES ---
  "project-infrastructure": {
    title: "Infrastructure",
    sections: [
      {
        title: "Infrastructure",
        items: [
          { title: "Topology View", url: "/infrastructure/topology", icon: "Network" },
          { title: "Heatmap", url: "/infrastructure/heatmap", icon: "Map" },
          { title: "Canvas Visual Builder", url: "/infrastructure/canvas", icon: "LayoutGrid" },
        ],
      },
    ],
  },
  "project-inventory": {
    title: "Network Inventory",
    sections: [
      {
        title: "Network Inventory",
        items: [
          { title: "ODC List", url: "/inventory/odc", icon: "BookOpen" },
          { title: "ODP List", url: "/inventory/odp", icon: "BookOpen" },
          { title: "Cable Management", url: "/inventory/cables", icon: "GitCommit" },
          { title: "Customer Database", url: "/inventory/customer", icon: "Users" },
          { title: "BOQ Generator", url: "/inventory/boq", icon: "Calculator" },
        ],
      },
    ],
  },
  "project-core": {
    title: "Core Infrastructure",
    sections: [
      {
        title: "Core Infrastructure",
        items: [
          { title: "OLT Management", url: "/core/olt", icon: "Cpu" },
          { title: "Routers & Switches", url: "/core/routers", icon: "Network" },
          { title: "Servers & Services", url: "/core/servers", icon: "Server" },
        ],
      },
    ],
  },
  "project-users": {
    title: "User Management",
    sections: [
      {
        title: "User Management",
        items: [
          { title: "All Users", url: "/users", icon: "Users" },
          { title: "Roles & Permissions", url: "/users/roles", icon: "ShieldCheck" },
        ],
      },
    ],
  },
  "project-settings": {
    title: "Settings",
    sections: [
      {
        title: "Settings",
        items: [
          { title: "General", url: "/settings", icon: "Settings2" },
          { title: "Project Members", url: "/settings/team", icon: "Users" },
          { title: "GIS Data Import", url: "/settings/import", icon: "FileUp" },
        ],
      },
    ],
  },
};
