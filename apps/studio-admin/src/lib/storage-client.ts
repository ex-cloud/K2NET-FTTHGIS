import { httpClient } from "./httpClient";
import { getBackendBaseUrl } from "./api-config";

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  compressed?: boolean;
}

export interface UploadAttachmentOptions {
  bucket?: string;
  folder?: string;
}

/**
 * Uploads an image or document to MinIO S3 via the Go storage-gateway.
 * Images are automatically compressed to WebP by the gateway before persistence.
 *
 * @param file - The browser File object to upload
 * @param token - Keycloak JWT access token
 * @param bucket - Target S3 bucket (defaults to 'public-contents', supports 'tenant-assets')
 * @param folder - Target virtual subfolder (defaults to 'tasks/attachments')
 */
export async function uploadTaskAttachment(
  file: File,
  token?: string,
  bucket = "public-contents",
  folder = "tasks/attachments"
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", bucket);
  if (folder) {
    formData.append("folder", folder);
  }

  const baseUrl = getBackendBaseUrl();
  const res = await httpClient(`${baseUrl}/files/upload`, {
    method: "POST",
    token: token ?? "",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? err.message ?? `Upload failed with status ${res.status}`);
  }

  const data = await res.json();
  return {
    url: data.url ?? data.fileUrl ?? "",
    filename: file.name,
    size: file.size,
    compressed: data.compressed ?? true,
  };
}

/**
 * Initializes the default S3 folder structure for a tenant in MinIO
 * (tenants/<slug>/documents/{legal, technical, compliance, billing})
 */
export async function initTenantVaultFolders(
  slug: string,
  token?: string
): Promise<boolean> {
  try {
    const baseUrl = getBackendBaseUrl();
    const res = await httpClient(`${baseUrl}/files/init-tenant-vault`, {
      method: "POST",
      token: token ?? "",
      body: JSON.stringify({ slug }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return res.ok;
  } catch (e) {
    console.warn("Failed to init tenant vault folders in MinIO:", e);
    return false;
  }
}

