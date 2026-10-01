export type PlanType = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

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
    badge: "14 Days Trial",
    price: "Rp 0 (14 Days)",
    olts: 1,
    odps: 50,
    storageGb: 2,
    sla: "99.0% SLA",
    features: ["1 OLT Device", "50 ODP Nodes", "2 GB MinIO S3", "100 Customers", "500 RPM API Rate Limit"],
  },
  STARTER: {
    name: "Starter ISP",
    badge: "Commercial Mini",
    price: "Rp 990,000/mo",
    olts: 2,
    odps: 300,
    storageGb: 15,
    sla: "99.0% SLA",
    features: ["2 OLT Devices", "300 ODP Nodes", "15 GB MinIO S3", "500 Customers", "2,000 RPM API Rate Limit"],
  },
  PRO: {
    name: "Professional",
    badge: "Popular / Best Value",
    price: "Rp 3,900,000/mo",
    olts: 6,
    odps: 2500,
    storageGb: 100,
    sla: "99.5% SLA",
    features: ["6 OLT Devices", "2,500 ODP Nodes", "100 GB MinIO S3", "5,000 Customers", "8,000 RPM API Limit", "Live SNMP Poller & Heatmap", "Keycloak SSO"],
  },
  ENTERPRISE: {
    name: "Enterprise Core",
    badge: "Maximum SLA",
    price: "Rp 12,500,000/mo",
    olts: 25,
    odps: 12000,
    storageGb: 500,
    sla: "99.9% SLA",
    features: ["25 OLT Devices", "12,000 ODP Nodes", "500 GB MinIO S3", "25,000 Customers", "30,000 RPM API Limit", "AI Fiber Copilot", "Keycloak SSO + SAML", "Custom Domain"],
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

export interface ProvisioningStageInfo {
  id: number;
  label: string;
  detail: string;
}

export const PROVISIONING_STAGES: ProvisioningStageInfo[] = [
  { id: 1, label: "Validasi Konfigurasi & Subdomain", detail: "Memeriksa keunikan slug dan otorisasi sistem..." },
  { id: 2, label: "Inisialisasi Database & PostGIS", detail: "Membuat profil organisasi dan menyiapkan skema isolasi data..." },
  { id: 3, label: "Setup Keycloak 26 Security Realm", detail: "Membuat realm terisolasi, client OIDC, dan protokol otentikasi..." },
  { id: 4, label: "Registrasi Akun Admin PIC", detail: "Mendaftarkan user pengelola teknis dan binding hak akses master..." },
  { id: 5, label: "Finalisasi Workspace & Audit Trail", detail: "Menyelesaikan sinkronisasi metadata dan menyiapkan portal tenant..." },
];

