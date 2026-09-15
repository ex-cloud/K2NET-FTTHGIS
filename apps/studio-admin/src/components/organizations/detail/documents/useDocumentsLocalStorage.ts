import { useState, useEffect, useCallback, useMemo } from "react";
import type { EnrichedOrganization } from "../../types";
import type { TenantDocument } from "./types";

export function getTenantStorageFolder(org: { name: string; slug?: string }): string {
  const cleanName = (org.name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleanName || org.slug || "tenant";
}

function getInitialDocuments(storageFolder: string, org: EnrichedOrganization): TenantDocument[] {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(`k2net_vault_docs_${storageFolder}`);
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse saved vault docs", e);
      }
    }
  }

  const initialList: TenantDocument[] = [
    {
      id: `doc-1-${storageFolder}`,
      name: `MoU-SaaS-Enterprise-Agreement-${storageFolder.toUpperCase()}-2026.pdf`,
      category: "LEGAL",
      sizeBytes: 2450000,
      format: "PDF",
      uploadedBy: "Super Admin (K2NET)",
      uploadedAt: "2026-08-01 10:30 WIB",
      expiryDate: "2027-08-01",
      status: "VERIFIED",
      verifiedBy: "Compliance Legal Lead",
      verifiedAt: "2026-08-01 10:45 WIB",
      downloadUrl: "#",
    },
    {
      id: `doc-2-${storageFolder}`,
      name: `BAST-Serah-Terima-Onboarding-NOC-${storageFolder}.pdf`,
      category: "TECHNICAL",
      sizeBytes: 1820000,
      format: "PDF",
      uploadedBy: "NOC Lead Engineer",
      uploadedAt: "2026-08-02 14:15 WIB",
      status: "VERIFIED",
      verifiedBy: "Lead System Architect",
      verifiedAt: "2026-08-02 15:00 WIB",
      downloadUrl: "#",
    },
    {
      id: `doc-3-${storageFolder}`,
      name: `NPWP-NIB-Legalitas-Badan-Hukum-${storageFolder}.pdf`,
      category: "COMPLIANCE",
      sizeBytes: 950000,
      format: "PDF",
      uploadedBy: org.picName || "Admin Tenant",
      uploadedAt: "2026-08-01 09:12 WIB",
      status: "VERIFIED",
      verifiedBy: "Super Admin",
      verifiedAt: "2026-08-01 09:30 WIB",
      downloadUrl: "#",
    },
    {
      id: `doc-4-${storageFolder}`,
      name: `Topology-Core-Router-BRAS-Interconnect-${storageFolder}.kmz`,
      category: "TECHNICAL",
      sizeBytes: 4200000,
      format: "KMZ",
      uploadedBy: "FTTH Field Team",
      uploadedAt: "2026-08-10 16:45 WIB",
      status: "ACTIVE",
      verifiedBy: "NOC Lead Engineer",
      verifiedAt: "2026-08-10 17:00 WIB",
      downloadUrl: "#",
    },
    {
      id: `doc-5-${storageFolder}`,
      name: `SLA-Commitment-Guarantee-99.5-Tier.pdf`,
      category: "LEGAL",
      sizeBytes: 1100000,
      format: "PDF",
      uploadedBy: "Legal Ops K2NET",
      uploadedAt: "2026-08-01 11:00 WIB",
      expiryDate: "2027-08-01",
      status: "ACTIVE",
      downloadUrl: "#",
    },
  ];

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`k2net_vault_docs_${storageFolder}`, JSON.stringify(initialList));
    } catch (e) {
      console.error("Failed to seed initial vault docs to localStorage", e);
    }
  }

  return initialList;
}

export function useDocumentsLocalStorage(org: EnrichedOrganization) {
  const storageFolder = useMemo(() => getTenantStorageFolder(org), [org]);

  const [documents, setDocuments] = useState<TenantDocument[]>(() =>
    getInitialDocuments(storageFolder, org)
  );

  useEffect(() => {
    setDocuments(getInitialDocuments(storageFolder, org));
  }, [storageFolder, org]);

  const saveDocuments = useCallback(
    (newDocs: TenantDocument[]) => {
      setDocuments(newDocs);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`k2net_vault_docs_${storageFolder}`, JSON.stringify(newDocs));
        } catch (e) {
          console.error("Failed to save vault docs to localStorage", e);
        }
      }
    },
    [storageFolder]
  );

  return {
    storageFolder,
    documents,
    setDocuments,
    saveDocuments,
  };
}
