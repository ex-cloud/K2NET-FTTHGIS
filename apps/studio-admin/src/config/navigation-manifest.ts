import type { ElementType } from "react";
import type { TranslationKey } from "@k2net/i18n";
import {
  LayoutDashboard,
  Inbox,
  Building2,
  Receipt,
  KeyRound,
  ClipboardList,
  Boxes,
  ScanLine,
  Cpu,
  Sparkles,
  ShieldCheck,
  Users,
  Lock,
  Settings,
} from "lucide-react";

export type NavigationPlane =
  | "HOME"
  | "OPERATIONS"
  | "PRODUCT"
  | "PLATFORM"
  | "GOVERNANCE"
  | "BOTTOM";

export type ManifestNavItem = {
  id: string;
  plane: NavigationPlane;
  title: string;
  translationKey: TranslationKey;
  icon: ElementType;
  href: string;
  shortcut?: string;
  requiredPermission?: string | string[];
  badgeKey?: "unreadB2B";
  activePrefixes: string[];
};

/**
 * Single Typed Navigation Manifest for K2NET FTTH GIS System Admin
 * 13 Main Navigation Items organized into 5 Semantic Planes + Bottom Configuration Center.
 */
export const NAVIGATION_MANIFEST: ManifestNavItem[] = [
  // ── 1. HOME PLANE ──────────────────────────────────────────────────────────
  {
    id: "overview",
    plane: "HOME",
    title: "Overview",
    translationKey: "nav.overview",
    icon: LayoutDashboard,
    href: "/overview",
    shortcut: "G then O",
    requiredPermission: "system.observability.view",
    activePrefixes: ["/overview"],
  },
  {
    id: "inbox",
    plane: "HOME",
    title: "Inbox & Approvals",
    translationKey: "nav.inbox_approvals",
    icon: Inbox,
    href: "/inbox",
    shortcut: "G then I",
    requiredPermission: ["system.support.impersonate", "system.organizations.manage", "licensing.killswitch"],
    activePrefixes: ["/inbox"],
  },

  // ── 2. OPERATIONS PLANE (Run the business) ─────────────────────────────────
  {
    id: "tenants",
    plane: "OPERATIONS",
    title: "Tenants",
    translationKey: "nav.tenants",
    icon: Building2,
    href: "/organizations",
    shortcut: "G then T",
    requiredPermission: "system.organizations.view",
    activePrefixes: ["/organizations", "/vpn"],
  },
  {
    id: "billing",
    plane: "OPERATIONS",
    title: "Billing",
    translationKey: "nav.billing",
    icon: Receipt,
    href: "/billing",
    shortcut: "G then B",
    requiredPermission: ["billing.read", "system.organizations.view"],
    activePrefixes: ["/billing"],
  },
  {
    id: "licensing",
    plane: "OPERATIONS",
    title: "Licensing & Entitlements",
    translationKey: "nav.licensing_entitlements",
    icon: KeyRound,
    href: "/licensing/licenses",
    shortcut: "G then L",
    requiredPermission: ["licensing.read", "system.organizations.view"],
    activePrefixes: ["/licensing", "/licenses"],
  },
  {
    id: "tasks",
    plane: "OPERATIONS",
    title: "Support & Issues",
    translationKey: "nav.projects_issues",
    icon: ClipboardList,
    href: "/tasks",
    shortcut: "G then P",
    requiredPermission: ["system.task.manage", "system.observability.view"],
    badgeKey: "unreadB2B",
    activePrefixes: ["/tasks"],
  },

  // ── 3. PRODUCT PLANE (Define the business — Control Plane) ────────────────
  {
    id: "catalog",
    plane: "PRODUCT",
    title: "Product Catalog",
    translationKey: "nav.product_catalog",
    icon: Boxes,
    href: "/catalog/plans",
    shortcut: "G then K",
    requiredPermission: ["catalog.plans.read", "system.packages.view", "system.organizations.view"],
    activePrefixes: ["/catalog", "/packages"],
  },

  // ── 4. PLATFORM PLANE (Run the system — Infrastructure & Health) ───────────
  {
    id: "observability",
    plane: "PLATFORM",
    title: "Observability",
    translationKey: "nav.observability",
    icon: ScanLine,
    href: "/observability/overview",
    shortcut: "G then V",
    requiredPermission: "system.observability.view",
    activePrefixes: ["/observability", "/logs"],
  },
  {
    id: "gateways",
    plane: "PLATFORM",
    title: "Integrations & Comms",
    translationKey: "nav.integrations_comms",
    icon: Cpu,
    href: "/gateways/overview",
    shortcut: "G then G",
    requiredPermission: ["system.observability.view", "system.gateway.manage"],
    activePrefixes: ["/gateways"],
  },
  {
    id: "ai",
    plane: "PLATFORM",
    title: "AI & Spatial Assets",
    translationKey: "nav.ai_spatial_assets",
    icon: Sparkles,
    href: "/ai",
    shortcut: "G then A",
    requiredPermission: ["system.ai.manage", "system.settings.manage"],
    activePrefixes: ["/ai", "/assets-3d"],
  },
  {
    id: "data_protection",
    plane: "PLATFORM",
    title: "Data Protection",
    translationKey: "nav.data_protection",
    icon: ShieldCheck,
    href: "/system/trash",
    shortcut: "G then D",
    requiredPermission: ["system.trash.manage", "system.backup.manage"],
    activePrefixes: ["/system/trash"],
  },

  // ── 5. GOVERNANCE PLANE (Protect the business) ────────────────────────────
  {
    id: "identity",
    plane: "GOVERNANCE",
    title: "Identity & Access",
    translationKey: "nav.identity_access",
    icon: Users,
    href: "/security/roles",
    shortcut: "G then U",
    requiredPermission: ["system.security.manage", "users.view", "roles.view"],
    activePrefixes: [
      "/users",
      "/security/roles",
      "/security/permissions",
      "/security/auth",
      "/security/password-policy",
    ],
  },
  {
    id: "security",
    plane: "GOVERNANCE",
    title: "Security & Compliance",
    translationKey: "nav.security_compliance",
    icon: Lock,
    href: "/security/alerts",
    shortcut: "G then S",
    requiredPermission: "system.security.manage",
    activePrefixes: ["/security/alerts", "/security/audit", "/security/compliance"],
  },

  // ── 6. BOTTOM (Configuration Center) ───────────────────────────────────────
  {
    id: "settings",
    plane: "BOTTOM",
    title: "Configuration Center",
    translationKey: "nav.configuration_center",
    icon: Settings,
    href: "/settings",
    shortcut: "G then ,",
    requiredPermission: "system.settings.manage",
    activePrefixes: ["/settings"],
  },
];

/**
 * Plane groupings for visual section rendering in the primary sidebar
 */
export const NAVIGATION_PLANES: { plane: NavigationPlane; labelKey?: TranslationKey }[] = [
  { plane: "HOME", labelKey: "nav.plane_home" },
  { plane: "OPERATIONS", labelKey: "nav.plane_operations" },
  { plane: "PRODUCT", labelKey: "nav.plane_product" },
  { plane: "PLATFORM", labelKey: "nav.plane_platform" },
  { plane: "GOVERNANCE", labelKey: "nav.plane_governance" },
  { plane: "BOTTOM", labelKey: "nav.plane_bottom" },
];

/**
 * Checks if a given nav item is active based on activePrefixes matching current pathname
 */
export const isNavItemActive = (item: ManifestNavItem, pathname: string): boolean => {
  if (!pathname) return false;
  return item.activePrefixes.some((prefix) => {
    if (pathname === prefix) return true;
    return pathname.startsWith(prefix + "/") || pathname.startsWith(prefix + "?");
  });
};
