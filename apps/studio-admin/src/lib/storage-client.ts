import { httpClient } from "./httpClient";
import { getBackendBaseUrl } from "./api-config";

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  compressed?: boolean;
}

/**
 * Uploads an image or document to MinIO S3 via the Go storage-gateway.
 * Images are automatically compressed to WebP by the gateway before persistence.
 *
 * @param file - The browser File object to upload
 * @param token - Keycloak JWT access token
 * @param bucket - Target S3 bucket (defaults to 'task-attachments')
 */
export async function uploadTaskAttachment(
  file: File,
  token?: string,
  bucket = "task-attachments"
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", bucket);

  const baseUrl = getBackendBaseUrl();
  const res = await httpClient(`${baseUrl}/upload`, {
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
