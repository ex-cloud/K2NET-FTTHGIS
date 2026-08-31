import {
  getGatewayToken,
  verifySuperAdmin,
  GATEWAY_URL_MAP,
} from "../common";
import type {
  ServerSyncStatus,
  ServerFilePreview,
} from "./ai-types";

export async function triggerServerDocsSync(): Promise<{ status: string; message: string }> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/documents/sync-server-docs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Gagal memicu sinkronisasi berkas server");
  }

  return res.json();
}

export async function getAiServerSyncStatus(): Promise<ServerSyncStatus> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  try {
    const res = await fetch(`${aiGatewayUrl}/api/v1/ai/documents/sync-status`, {
      method: "GET",
      headers: {
        "X-Gateway-Token": token,
        "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        status: "IDLE",
        total_server_files: 0,
        indexed_count: 0,
        unindexed_count: 0,
        unindexed_files: [],
        is_synced: true,
      };
    }

    return res.json();
  } catch (err) {
    console.warn("Gagal memuat status sync dokumen server:", err);
    return {
      status: "IDLE",
      total_server_files: 0,
      indexed_count: 0,
      unindexed_count: 0,
      unindexed_files: [],
      is_synced: true,
    };
  }
}

export async function previewAiServerFile(filePath: string): Promise<ServerFilePreview> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(
    `${aiGatewayUrl}/api/v1/ai/documents/server-file/preview?path=${encodeURIComponent(filePath)}`,
    {
      headers: {
        "X-Gateway-Token": token,
        "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Gagal mempratinjau berkas server");
  }

  return res.json();
}

export async function rejectAiServerFile(payload: {
  path: string;
  title?: string;
  category?: string;
  reason?: string;
}): Promise<{ status: string; message: string; id: string }> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/documents/server-file/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Gagal menolak berkas server");
  }

  return res.json();
}

export async function indexSingleAiServerFile(payload: {
  path: string;
  title?: string;
  category?: string;
  scope?: string;
}): Promise<{ id: string; status: string; title: string }> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const aiGatewayUrl = GATEWAY_URL_MAP["ai"];

  const res = await fetch(`${aiGatewayUrl}/api/v1/ai/documents/server-file/index-single`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Gagal mengindeks berkas server");
  }

  return res.json();
}

export async function uploadKnowledgeImage(formData: FormData): Promise<{ url: string; filename: string }> {
  await verifySuperAdmin();
  const token = getGatewayToken();
  const storageGatewayUrl = GATEWAY_URL_MAP["storage"];

  if (!formData.has("bucket")) {
    formData.append("bucket", "public-contents");
  }
  if (!formData.has("folder")) {
    formData.append("folder", "knowledge/images");
  }

  const uploadEndpoint = storageGatewayUrl.endsWith("/api/v1/storage")
    ? `${storageGatewayUrl}/upload`
    : `${storageGatewayUrl}/api/v1/upload`;

  const res = await fetch(uploadEndpoint, {
    method: "POST",
    headers: {
      "X-Gateway-Token": token,
      "X-Tenant-ID": "00000000-0000-0000-0000-000000000000",
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Gagal mengunggah gambar ke MinIO S3");
  }

  return res.json();
}
