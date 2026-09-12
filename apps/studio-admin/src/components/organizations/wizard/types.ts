export type PlanType = "FREE" | "PRO" | "ENTERPRISE";

export interface PlanSpec {
  name: string;
  badge: string;
  price: string;
  olts: number;
  odps: number;
  storageGb: number;
  sla: string;
  features: string[];
}

export const PLAN_SPECS: Record<PlanType, PlanSpec> = {
  FREE: {
    name: "Starter Trial",
    badge: "7 Days Trial",
    price: "Free",
    olts: 2,
    odps: 500,
    storageGb: 10,
    sla: "99.0% SLA",
    features: ["2 OLT Nodes", "500 ODPs", "10 GB MinIO", "Community Support"],
  },
  PRO: {
    name: "Professional",
    badge: "Popular",
    price: "Rp 4.900.000/mo",
    olts: 5,
    odps: 2500,
    storageGb: 25,
    sla: "99.5% SLA",
    features: ["5 OLT Nodes", "2,500 ODPs", "25 GB MinIO", "Dedicated Poller Engine", "Priority Support"],
  },
  ENTERPRISE: {
    name: "Enterprise Core",
    badge: "Maximum SLA",
    price: "Rp 14.500.000/mo",
    olts: 20,
    odps: 10000,
    storageGb: 100,
    sla: "99.9% SLA",
    features: ["20 OLT Nodes", "10,000 ODPs", "100 GB MinIO", "AI Fiber Copilot", "Custom POP Gateway", "24/7 Phone Support"],
  },
};

export interface WizardFormData {
  // Step 1: Identity & Domains
  name: string;
  slug: string;
  slugMode: "random" | "custom";
  customDomain: string;
  description: string;
  website: string;
  address: string;

  // Step 2: Plan & Quotas
  plan: PlanType;

  // Step 3: Network & VPN Integration
  wireguardIp: string;
  popGateway: string;
  ldapEnabled: boolean;
  ldapUrl: string;
  ldapBaseDn: string;
  ldapBindDn: string;
  ldapBindPassword: string;

  // Step 4: Admin PIC & Keycloak Setup
  picName: string;
  adminEmail: string;
  adminUsername: string;
}

export const INITIAL_FORM_DATA: WizardFormData = {
  name: "",
  slug: "",
  slugMode: "custom",
  customDomain: "",
  description: "",
  website: "",
  address: "",
  plan: "PRO",
  wireguardIp: "100.110.205.10",
  popGateway: "POP-ID-CGK-01",
  ldapEnabled: false,
  ldapUrl: "",
  ldapBaseDn: "",
  ldapBindDn: "",
  ldapBindPassword: "",
  picName: "",
  adminEmail: "",
  adminUsername: "",
};
