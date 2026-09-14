export type DocumentCategory = "LEGAL" | "TECHNICAL" | "COMPLIANCE" | "BILLING";

export type DocumentStatus =
  | "VERIFIED"
  | "PENDING_REVIEW"
  | "REVISION_REQUIRED"
  | "REJECTED"
  | "ACTIVE"
  | "EXPIRING_SOON";

export interface TenantDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  sizeBytes: number;
  format: "PDF" | "ZIP" | "KMZ" | "JSON";
  uploadedBy: string;
  uploadedAt: string;
  expiryDate?: string;
  status: DocumentStatus;
  reviewNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  downloadUrl: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
