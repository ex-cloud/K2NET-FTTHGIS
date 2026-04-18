import { useMapStore, type DrawAssetType } from "@/store/map-store";
import { useCallback } from "react";

export interface EditAssetPayload {
  id: string;
  type: DrawAssetType;
  code: string;
  lat?: number;
  lng?: number;
  status?: string;
  name?: string;
  properties: Record<string, unknown>;
}

/**
 * Custom hook to centralize asset editing logic.
 * Replaces the old 'trigger-asset-edit' CustomEvent pattern.
 */
export function useAssetEdit() {
  const { setEditingAsset, setIsFormOpen } = useMapStore();

  const openEdit = useCallback((asset: EditAssetPayload) => {
    console.log("🛠️ Opening edit form for asset:", asset.code);
    setEditingAsset(asset);
    setIsFormOpen(true);
  }, [setEditingAsset, setIsFormOpen]);

  return {
    openEdit,
  };
}
