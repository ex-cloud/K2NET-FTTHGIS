import * as React from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import type { Point, LineString, Feature } from "geojson";
import { networkApi } from "@/lib/api/network";
import { oltSchema, odcSchema, odpSchema, baseAssetSchema } from "@/lib/validations/network";
import { useMapStore } from "@/store/map-store";

export function useAssetSidebarForm() {
  const { data: session } = useSession();
  const params = useParams();
  
  const { 
    isFormOpen, drawnFeature, drawingAssetType, 
    setIsFormOpen, setDrawnFeature, triggerTileRefresh,
    editingAsset, setEditingAsset
  } = useMapStore();
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState<Record<string, string | number>>({
    code: "",
    name: "",
    status: "PLANNED",
    lng: "",
    lat: ""
  });
  
  const [originalStatus, setOriginalStatus] = React.useState<string>("");
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [lastNote, setLastNote] = React.useState<string>("");

  const [codeStatus, setCodeStatus] = React.useState<'checking' | 'available' | 'exists' | null>(null);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleteReason, setDeleteReason] = React.useState("");

  const lastFeatureIdRef = React.useRef<string | number | null>(null);

  // Effect to validate code existence
  React.useEffect(() => {
    const code = formData.code as string;
    if (!code || !isFormOpen) {
      setCodeStatus(null);
      return;
    }
    
    // If editing and code hasn't changed from original, it's valid
    if (editingAsset && editingAsset.code === code) {
      setCodeStatus('available');
      return;
    }

    setCodeStatus('checking');
    
    const timeoutId = setTimeout(async () => {
      try {
        const token = session?.accessToken || "";
        const data = await networkApi.checkCode(code, token);
        setCodeStatus(data.exists ? 'exists' : 'available');
      } catch (e) {
        console.error("Code check failed", e);
        setCodeStatus(null);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.code, isFormOpen, editingAsset, session]);

  // Effect to reset/pre-fill form
  React.useEffect(() => {
    if (isFormOpen) {
      const currentFeatureId = editingAsset?.id || drawnFeature?.id;
      
      // Only reset/pre-fill if the form just opened or the asset itself changed
      if (lastFeatureIdRef.current !== currentFeatureId) {
        lastFeatureIdRef.current = currentFeatureId || null;
        
        if (editingAsset) {
          const props = editingAsset.properties;
          let lat = editingAsset.lat || (props['lat'] as number) || (props['latitude'] as number);
          let lng = editingAsset.lng || (props['lng'] as number) || (props['longitude'] as number);
          
          if (!lat && !lng && drawnFeature && drawnFeature.geometry?.type === "Point") {
            const coords = (drawnFeature.geometry as Point).coordinates;
            lng = coords[0];
            lat = coords[1];
          }
          
          const initialStatus = (editingAsset.properties?.status as string) || editingAsset.status || "UP";
          setOriginalStatus(initialStatus);
          setLastNote("");
          setFormData({
            code: editingAsset.code || "",
            name: (editingAsset.properties?.name as string) || (editingAsset.properties?.code as string) || editingAsset.name || "",
            status: initialStatus,
            lng: lng ? Number(lng) : "",
            lat: lat ? Number(lat) : ""
          });
        } else if (drawnFeature) {
          // New drawing
          const coords = drawnFeature.geometry.type === "Point" 
            ? (drawnFeature.geometry as Point).coordinates 
            : [0, 0];
            
          setOriginalStatus("");
          setLastNote("");
          setFormData({
            code: `NEW-${drawingAssetType}-${Math.floor(Math.random() * 1000)}`,
            name: `New ${drawingAssetType}`,
            status: "PLANNED",
            lng: coords[0] || "",
            lat: coords[1] || ""
          });
        }
      }
    } else {
      lastFeatureIdRef.current = null;
    }
  }, [isFormOpen, editingAsset, drawnFeature, drawingAssetType]);

  const closeForm = () => {
    setIsFormOpen(false);
    setDrawnFeature(null);
    setEditingAsset(null);
  };

  const handleCoordChange = (field: 'lng' | 'lat', value: string) => {
    const num = parseFloat(value);
    setFormData((prev: Record<string, string | number>) => ({ ...prev, [field]: value })); 
    
    if (!isNaN(num) && drawnFeature?.geometry?.type === "Point") {
      const newGeom = JSON.parse(JSON.stringify(drawnFeature.geometry));
      if (newGeom.coordinates) {
        if (field === 'lng') newGeom.coordinates[0] = num;
        if (field === 'lat') newGeom.coordinates[1] = num;
      }
      
      setDrawnFeature({
        ...drawnFeature,
        type: "Feature",
        geometry: newGeom,
        properties: drawnFeature.properties || {}
      } as Feature);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const statusChanged = editingAsset && originalStatus && formData.status !== originalStatus;
    if (statusChanged && !lastNote.trim()) {
      toast.error("Catatan wajib diisi", {
        description: "Perubahan status memerlukan catatan/alasan dari teknisi.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let endpoint = "";
      const type = editingAsset ? editingAsset.type : drawingAssetType;

      if (type === "ODP") endpoint = "/network/odps";
      if (type === "ODC") endpoint = "/network/odcs";
      if (type === "OLT") endpoint = "/network/olts";
      if (type === "CABLE") endpoint = "/network/cables";

      if (!endpoint) throw new Error("Unknown asset type");

      let geom: Point | LineString;
      
      if (drawnFeature?.geometry) {
        geom = drawnFeature.geometry as Point | LineString;
      } else if (editingAsset?.properties?.geom) {
        geom = editingAsset.properties.geom as unknown as Point | LineString;
      } else {
        geom = {
          type: "Point",
          coordinates: [parseFloat(formData.lng.toString()), parseFloat(formData.lat.toString())]
        };
      }

      if (geom.type === "Point") {
        geom = {
          type: "Point",
          coordinates: [parseFloat(formData.lng.toString()), parseFloat(formData.lat.toString())]
        };
      }

      const payload: Record<string, unknown> = {
        code: formData.code as string,
        name: formData.name as string,
        status: formData.status as string,
        geom: geom,
        ...(lastNote.trim() ? { lastNote: lastNote.trim() } : {})
      };

      // Validation
      setFormErrors({});
      try {
        let schema;
        if (type === "OLT") schema = oltSchema;
        else if (type === "ODC") schema = odcSchema;
        else if (type === "ODP") schema = odpSchema;
        else schema = baseAssetSchema;

        const validationData = { ...payload };

        if (editingAsset && originalStatus && formData.status !== originalStatus) {
            if (!lastNote.trim()) {
                setFormErrors({ lastNote: "Alasan perubahan status wajib diisi" });
                toast.error("Alasan wajib diisi", { description: "Sertakan alasan perubahan status." });
                return;
            }
        }

        if (type === "ODP") {
            validationData.totalPort = editingAsset?.properties?.total_port;
            validationData.usedPort = editingAsset?.properties?.used_port;
        } else if (type === "ODC") {
            validationData.capacity = editingAsset?.properties?.capacity;
            validationData.usedCapacity = editingAsset?.properties?.used_capacity;
        }
        
        validationData.lat = formData.lat;
        validationData.lng = formData.lng;

        schema.parse(validationData);
      } catch (err) {
        if (err instanceof z.ZodError) {
          const errors: Record<string, string> = {};
          err.issues.forEach((issue) => {
            if (issue.path[0]) errors[issue.path[0] as string] = issue.message;
          });
          setFormErrors(errors);
          toast.error("Validasi gagal", { description: "Periksa kembali inputan Anda." });
          return;
        }
        throw err;
      }

      if (!editingAsset) {
        if (geom.type === "Point") {
          if (type === "ODP") {
            payload.totalPort = 8;
            payload.usedPort = 0;
          } else if (type === "ODC") {
            payload.capacity = 144;
            payload.usedCapacity = 0;
          }
        } else if (geom.type === "LineString") {
          payload.fiberCount = 24;
          payload.lengthMeters = 0;
        }
      } else {
        if (type === "ODP") {
          payload.totalPort = editingAsset.properties?.total_port as number;
          payload.usedPort = editingAsset.properties?.used_port as number;
        } else if (type === "ODC") {
          payload.capacity = editingAsset.properties?.capacity as number;
          payload.usedCapacity = editingAsset.properties?.used_capacity as number;
        } else if (type === "CABLE") {
          payload.fiberCount = editingAsset.properties?.fiber_count as number;
        }
      }

      const token = ((session as { accessToken?: string })?.accessToken || "") as string;
      const projId = ((Array.isArray(params?.projectId) ? params.projectId[0] : params?.projectId) || "") as string;

      if (editingAsset) {
        await networkApi.updateAsset(type as string, editingAsset.id as string, payload, token, projId);
      } else {
        await networkApi.createAsset(type as string, payload, token, projId);
      }

      const actionLabel = editingAsset ? 'diupdate' : 'disimpan';
      toast.success(`Aset berhasil ${actionLabel}`, {
        description: `${formData.code} telah berhasil ${actionLabel}.`,
        duration: 4000,
      });
      closeForm();
      triggerTileRefresh();
    } catch (error) {
      console.error(error);
      toast.error(`Gagal menyimpan aset`, {
        description: String(error),
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!editingAsset) return;
    if (!deleteReason.trim()) return;

    setIsSubmitting(true);
    try {
      const type = editingAsset.type;
      const id = editingAsset.id as string;
      const token = ((session as { accessToken?: string })?.accessToken || "") as string;
      const projId = ((Array.isArray(params?.projectId) ? params.projectId[0] : params?.projectId) || "") as string;

      await networkApi.deleteAsset(type as string, id, deleteReason.trim(), token, projId);

      const deletedCode = editingAsset.code;
      setShowDeleteModal(false);
      closeForm();
      triggerTileRefresh();
      toast.success(`Aset berhasil dihapus`, {
        description: `${deletedCode} telah dihapus. Alasan: ${deleteReason.trim()}`,
        duration: 5000,
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(`Gagal menghapus aset`, {
        description: String(error),
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const assetType = editingAsset ? editingAsset.type : drawingAssetType;

  return {
    // State
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    lastNote,
    setLastNote,
    codeStatus,
    showDeleteModal,
    setShowDeleteModal,
    deleteReason,
    setDeleteReason,
    isSubmitting,
    originalStatus,
    assetType,
    editingAsset,
    drawnFeature,
    isFormOpen,

    // Actions
    handleCoordChange,
    handleSubmit,
    handleDeleteConfirm,
    closeForm,
    openDeleteModal: () => {
      setDeleteReason("");
      setShowDeleteModal(true);
    }
  };
}
