export interface TrashItem {
  id: string;
  name: string;
  type: "ORGANIZATION" | "PROJECT" | "TASK" | "NETWORK_NODE" | "NETWORK_EDGE" | "DOCUMENT";
  identifier: string;
  originName: string;
  deletedAt: string;
  deletedBy: string;
  daysRemaining: number;
  details?: Record<string, unknown>;
}

export interface TrashStats {
  total: number;
  organizations: number;
  projects: number;
  tasks: number;
  networkAssets: number;
  documents: number;
}

export function getLocalTrashItems(): TrashItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("k2net_system_trash");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to parse k2net_system_trash", e);
    return [];
  }
}

export function saveLocalTrashItems(items: TrashItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("k2net_system_trash", JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save k2net_system_trash", e);
  }
}

export function filterTrashItems(items: TrashItem[], searchQuery: string): TrashItem[] {
  if (!searchQuery.trim()) return items;
  const q = searchQuery.toLowerCase().trim();
  return items.filter((item) => {
    const nameMatch = item.name.toLowerCase().includes(q);
    const idMatch = item.identifier.toLowerCase().includes(q);
    const orgMatch = item.originName.toLowerCase().includes(q);
    const pathMatch =
      item.details?.path &&
      typeof item.details.path === "string" &&
      item.details.path.toLowerCase().includes(q);
    return nameMatch || idMatch || orgMatch || pathMatch;
  });
}

export function restoreDocumentLocal(id: string): { success: boolean; originName?: string } {
  try {
    const localTrash = getLocalTrashItems();
    const target = localTrash.find((item) => item.id === id || item.identifier === id);

    if (target && target.details) {
      const orgSlug = (target.details.orgSlug as string) || "tenant";
      const docData = target.details.docData as Record<string, unknown> | undefined;

      if (docData && typeof window !== "undefined") {
        const rawVault = localStorage.getItem(`k2net_vault_docs_${orgSlug}`);
        const vaultDocs = rawVault ? JSON.parse(rawVault) : [];
        vaultDocs.unshift(docData);
        localStorage.setItem(`k2net_vault_docs_${orgSlug}`, JSON.stringify(vaultDocs));
      }
    }

    const remaining = localTrash.filter((item) => item.id !== id && item.identifier !== id);
    saveLocalTrashItems(remaining);
    return { success: true, originName: target?.originName };
  } catch (e) {
    console.error("Failed to restore document local", e);
    return { success: false };
  }
}

export function deleteDocumentLocal(id: string): boolean {
  try {
    const localTrash = getLocalTrashItems();
    const remaining = localTrash.filter((item) => item.id !== id && item.identifier !== id);
    saveLocalTrashItems(remaining);
    return true;
  } catch (e) {
    console.error("Failed to delete document local", e);
    return false;
  }
}

export async function fetchApiTrash(
  category: string,
  searchQuery: string,
  token: string
): Promise<{ items: TrashItem[]; stats: Partial<TrashStats> }> {
  if (category === "documents") {
    return { items: [], stats: {} };
  }

  const queryParams = new URLSearchParams();
  if (category && category !== "all") {
    queryParams.set("category", category);
  }
  if (searchQuery.trim()) {
    queryParams.set("query", searchQuery.trim());
  }

  try {
    const res = await fetch(`/api/v1/system/trash?${queryParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return {
        items: data.items || [],
        stats: data.stats || {},
      };
    }
  } catch (e) {
    console.warn("Failed to fetch API trash items:", e);
  }

  return { items: [], stats: {} };
}
