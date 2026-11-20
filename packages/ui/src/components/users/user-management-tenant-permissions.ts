import type { UnifiedRoleOption, PermissionCategoryGroup } from "./user-management-types";

/**
 * Builds permission categories and authority states for TENANT Workspace roles.
 * Governed strictly under k2net-tenants realm (ADR-0017).
 */
export function buildTenantPermissionCategories(
  selectedRole: UnifiedRoleOption | null
): PermissionCategoryGroup[] {
  const roleName = (selectedRole?.name || "").toLowerCase();
  const explicitCodes = new Set<string>();
  if (selectedRole?.permissions) {
    for (const p of selectedRole.permissions) {
      if (typeof p === "string") explicitCodes.add(p);
      else if (p?.code) explicitCodes.add(p.code);
    }
  }

  const isTenantAdmin = roleName === "admin" || roleName === "tenant_admin";
  const isNoc = roleName === "noc" || roleName.includes("noc");
  const isTech = roleName === "technician" || roleName.includes("tech");

  const hasPerm = (code: string, fallbackActive: boolean): boolean => {
    if (isTenantAdmin) return true;
    if (explicitCodes.size > 0) {
      return explicitCodes.has(code);
    }
    return fallbackActive;
  };

  return [
    {
      id: "network_gis",
      titleKey: "users.cf_cat_network_gis",
      fallbackTitle: "Network & GIS Topology",
      items: [
        {
          code: "map.view",
          label: "Spatial GIS Map & Coverage Read",
          description: "View FTTH fiber routes, OLT/ODC/ODP nodes, and service coverage polygons.",
          enabled: hasPerm("map.view", true),
        },
        {
          code: "map.edit",
          label: "Edit Map Layers & Cable Routes",
          description: "Modify spatial coordinates, fiber lines, and GIS distribution pathways.",
          enabled: hasPerm("map.edit", isNoc),
        },
        {
          code: "network.view",
          label: "View Network Topology",
          description: "Inspect end-to-end network hierarchy and optical distribution circuits.",
          enabled: hasPerm("network.view", true),
        },
        {
          code: "network.monitor",
          label: "Monitor Network Status & Telemetry",
          description: "Live telemetry inspection of active fiber cores, loss, and PON ports.",
          enabled: hasPerm("network.monitor", isNoc),
        },
        {
          code: "network.manage",
          label: "Network Topology & Fiber Core Design",
          description: "Create, edit, and splice OLT, ODC, ODP, and distribution fiber cables.",
          enabled: hasPerm("network.manage", isNoc),
        },
        {
          code: "network.nodes",
          label: "Manage Network Nodes (ODC/ODP)",
          description: "Configure optical distribution cabinets, terminals, and splitter ratios.",
          enabled: hasPerm("network.nodes", isNoc),
        },
        {
          code: "network.audit",
          label: "Audit Network Changes & Splice Log",
          description: "Review historical fiber splicing modifications and physical adjustments.",
          enabled: hasPerm("network.audit", isNoc),
        },
      ],
    },
    {
      id: "projects_zones",
      titleKey: "users.cf_cat_projects",
      fallbackTitle: "Projects & Coverage Zones",
      items: [
        {
          code: "projects.view",
          label: "View Infrastructure Projects",
          description: "View FTTH rollout project areas, milestones, and assigned work packages.",
          enabled: hasPerm("projects.view", true),
        },
        {
          code: "projects.create",
          label: "Create Infrastructure Projects",
          description: "Initialize new geographic deployment projects and designate area boundaries.",
          enabled: hasPerm("projects.create", false),
        },
        {
          code: "projects.edit",
          label: "Edit Project Details & Scope",
          description: "Update project metadata, schedules, target home passes, and budgets.",
          enabled: hasPerm("projects.edit", false),
        },
        {
          code: "coverage.view",
          label: "View Coverage Polygons & Service Areas",
          description: "Inspect commercial coverage boundaries and service availability polygons.",
          enabled: hasPerm("coverage.view", true),
        },
        {
          code: "zones.view",
          label: "View Project Coverage Zones",
          description: "View micro-zones, feeder boundaries, and planned cluster polygons.",
          enabled: hasPerm("zones.view", true),
        },
        {
          code: "zones.create",
          label: "Create Project Coverage Zone",
          description: "Draw and register new fiber service clusters and distribution cells.",
          enabled: hasPerm("zones.create", false),
        },
        {
          code: "zones.promote",
          label: "Promote / Demote Zone Lifecycle Stage",
          description: "Transition coverage zones through Planning, Survey, Build, and Ready for Service.",
          enabled: hasPerm("zones.promote", isNoc),
        },
        {
          code: "survey.create",
          label: "Create Field Survey & Feasibility",
          description: "Conduct on-site pole, duct, and customer premise feasibility assessments.",
          enabled: hasPerm("survey.create", isNoc || isTech),
        },
      ],
    },
    {
      id: "operations_olt",
      titleKey: "users.cf_cat_operations_olt",
      fallbackTitle: "Operations, OLT & Field",
      items: [
        {
          code: "olt.manage",
          label: "SNMP OLT Hardware & PON Terminal Control",
          description: "Provision ONTs, monitor optical Rx/Tx power, and run OLT CLI diagnostics.",
          enabled: hasPerm("olt.manage", isNoc),
        },
        {
          code: "workorders.manage",
          label: "Field Work Orders & Installation Dispatch",
          description: "Assign, update, and verify field technician installation & repair tasks.",
          enabled: hasPerm("workorders.manage", isNoc || isTech),
        },
        {
          code: "ticket.view",
          label: "View Trouble Tickets",
          description: "Inspect subscriber trouble reports, network alarm incidents, and outages.",
          enabled: hasPerm("ticket.view", isNoc || isTech),
        },
        {
          code: "ticket.create",
          label: "Create Trouble Ticket",
          description: "Report new network outages, fiber cuts, and subscriber degradation tickets.",
          enabled: hasPerm("ticket.create", isNoc || isTech),
        },
        {
          code: "ticket.update",
          label: "Update Trouble Ticket & Resolution",
          description: "Log optical diagnostic measurements, root cause notes, and resolve tickets.",
          enabled: hasPerm("ticket.update", isNoc || isTech),
        },
        {
          code: "ticket.assign",
          label: "Assign Trouble Ticket to Staff",
          description: "Dispatch urgent fiber restoration work orders to field teams.",
          enabled: hasPerm("ticket.assign", isNoc),
        },
        {
          code: "task.update",
          label: "Update Operational Task Status",
          description: "Record completion milestones for field deployment checklists.",
          enabled: hasPerm("task.update", isNoc || isTech),
        },
        {
          code: "customer.view",
          label: "View Customer Account & Location",
          description: "Lookup subscriber drop point, optical power history, and ONT serial number.",
          enabled: hasPerm("customer.view", isNoc),
        },
      ],
    },
    {
      id: "inventory",
      titleKey: "users.cf_cat_network_gis",
      fallbackTitle: "Optical Inventory & Materials",
      items: [
        {
          code: "inventory.view",
          label: "View Optical Inventory & Stocks",
          description: "Check stock availability of ONTs, patch cords, splitters, and drop cables.",
          enabled: hasPerm("inventory.view", true),
        },
        {
          code: "inventory.edit",
          label: "Edit Inventory Items & Splitters",
          description: "Update serial numbers, barcode tags, and warehouse asset quantities.",
          enabled: hasPerm("inventory.edit", isNoc),
        },
        {
          code: "inventory.manage",
          label: "Warehouse Stock Control & Ingestion",
          description: "Authorise inbound material shipments and inter-warehouse stock transfers.",
          enabled: hasPerm("inventory.manage", false),
        },
      ],
    },
    {
      id: "org_team",
      titleKey: "users.cf_cat_org_team",
      fallbackTitle: "Organization, Team & Security",
      items: [
        {
          code: "team.view",
          label: "View Team Members & Directory",
          description: "View workspace staff member roster, assigned roles, and contact cards.",
          enabled: hasPerm("team.view", false),
        },
        {
          code: "team.invite",
          label: "Invite New Team Members",
          description: "Send invitation links and directly provision staff accounts.",
          enabled: hasPerm("team.invite", false),
        },
        {
          code: "team.manage",
          label: "Team Members & Custom Role Builder",
          description: "Manage roles, edit permissions, suspend users, and remove members.",
          enabled: hasPerm("team.manage", false),
        },
        {
          code: "roles.view",
          label: "View Roles & Permissions Catalog",
          description: "Inspect tenant role definitions and assigned authority matrices.",
          enabled: hasPerm("roles.view", false),
        },
        {
          code: "security.policy.manage",
          label: "Manage Security Policy (MFA & Social Login)",
          description: "Enforce multi-factor authentication, session timeout, and social login policy.",
          enabled: hasPerm("security.policy.manage", false),
        },
        {
          code: "security.sso.manage",
          label: "Enterprise Corporate SSO & Identity Provider",
          description: "Configure SAML 2.0 / OIDC federation, domain discovery, and Break-Glass.",
          enabled: hasPerm("security.sso.manage", false),
        },
      ],
    },
    {
      id: "billing_licensing",
      titleKey: "users.cf_cat_billing_licensing",
      fallbackTitle: "Billing & Subscriptions",
      items: [
        {
          code: "billing.view",
          label: "View Billing Profiles & Invoices",
          description: "Inspect current subscription plan, payment invoices, and billing history.",
          enabled: hasPerm("billing.view", false),
        },
        {
          code: "billing.manage",
          label: "Workspace Subscription & Marketplace Add-ons",
          description: "Upgrade plan tiers, purchase capacity boosters, and update payment methods.",
          enabled: hasPerm("billing.manage", false),
        },
      ],
    },
    {
      id: "reports_audit",
      titleKey: "users.cf_cat_reports_audit",
      fallbackTitle: "Reports & Audit Trail",
      items: [
        {
          code: "report.view",
          label: "View Operational Reports",
          description: "Access network SLA reports, ticket resolution metrics, and inventory valuations.",
          enabled: hasPerm("report.view", isNoc),
        },
        {
          code: "report.export",
          label: "Export Network & Trouble Reports",
          description: "Download XLSX / PDF summaries of fiber infrastructure and ticket audits.",
          enabled: hasPerm("report.export", false),
        },
        {
          code: "audit.view",
          label: "Immutable Workspace Audit Trail",
          description: "Inspect immutable security audit events, logins, and administrative actions.",
          enabled: hasPerm("audit.view", false),
        },
      ],
    },
  ];
}
