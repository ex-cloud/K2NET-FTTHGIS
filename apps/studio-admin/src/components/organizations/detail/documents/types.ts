export type DocumentCategory = "LEGAL" | "TECHNICAL" | "COMPLIANCE" | "BILLING";

export interface TenantDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  sizeBytes: number;
  format: "PDF" | "ZIP" | "KMZ" | "JSON";
  uploadedBy: string;
  uploadedAt: string;
  expiryDate?: string;
  status: "VERIFIED" | "PENDING_REVIEW" | "ACTIVE" | "EXPIRING_SOON";
  downloadUrl: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
