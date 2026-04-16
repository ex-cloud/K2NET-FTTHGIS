"use client";

import * as React from "react";
import { X, Save, Trash2, CheckCircle2, XCircle, Loader2, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useMapStore, type DrawAssetType } from "@/store/map-store";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "next-auth/react";
import { httpClient } from "@/lib/httpClient";
import { Session } from "next-auth";
import { toast } from "sonner";
import type { Point, LineString, Feature } from "geojson";

export function AssetFormSidebar() {
  const { data: session } = useSession();
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
        const res = await httpClient(`${getBackendBaseUrl()}/network/assets/check-code?code=${encodeURIComponent(code)}`, {
          token: session?.accessToken
        });
        if (res.ok) {
          const data = await res.json();
          setCodeStatus(data.exists ? 'exists' : 'available');
        } else {
          setCodeStatus(null);
        }
      } catch (e) {
        console.error("Code check failed", e);
        setCodeStatus(null);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.code, isFormOpen, editingAsset, session]);

  // Global listener for editing from other components (like DetailSlidePanel)
  React.useEffect(() => {
    const handleRemoteEdit = (e: Event) => {
      const customEvent = e as CustomEvent<{ asset: { 
        id: string; 
        type: DrawAssetType; 
        code: string; 
        lat?: number; 
        lng?: number; 
        status?: string;
        properties: Record<string, unknown>;
      } }>;
      const asset = customEvent.detail.asset;
      if (asset) {
        setEditingAsset(asset);
        setIsFormOpen(true);
      }
    };

    window.addEventListener('trigger-asset-edit', handleRemoteEdit);
    return () => window.removeEventListener('trigger-asset-edit', handleRemoteEdit);
  }, [setEditingAsset, setIsFormOpen]);

  // Effect to reset/pre-fill form
  React.useEffect(() => {
    if (isFormOpen) {
      const currentFeatureId = editingAsset?.id || drawnFeature?.id;
      
      // Only reset/pre-fill if the form just opened or the asset itself changed
      if (lastFeatureIdRef.current !== currentFeatureId) {
        lastFeatureIdRef.current = currentFeatureId || null;
        
        if (editingAsset) {
          // Pre-fill with existing asset data
          // 1. Try top-level lat/lng (from our new DTO)
          // 2. Try properties.lat/lng (MVT fallback)
          // 3. Try drawnFeature geometry (Map fallback)
          
          const props = editingAsset.properties;
          let lat = editingAsset.lat || (props['lat'] as number) || (props['latitude'] as number);
          let lng = editingAsset.lng || (props['lng'] as number) || (props['longitude'] as number);
          
          // If still null, try drawnFeature geometry
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

  if (!isFormOpen) return null;

  const handleCoordChange = (field: 'lng' | 'lat', value: string) => {
    const num = parseFloat(value);
    setFormData((prev: Record<string, string | number>) => ({ ...prev, [field]: value })); // keep as string for input
    
    // Also update drawnFeature so if we "Save", it has the new geom
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

    // Validate: if status changed, lastNote is mandatory
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

      // Use either the current geometry or fallback to formData if Point
      let geom: Point | LineString;
      
      if (drawnFeature?.geometry) {
        geom = drawnFeature.geometry as Point | LineString;
      } else if (editingAsset?.properties?.geom) {
        // Fallback to geometry from properties if available
        geom = editingAsset.properties.geom as unknown as Point | LineString;
      } else {
        // Construct from lat/lng if missing
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
      
      interface AssetPayload {
        id?: number;
        code: string;
        name: string;
        status: string;
        geom: Point | LineString;
        totalPort?: number;
        usedPort?: number;
        capacity?: number;
        usedCapacity?: number;
        fiberCount?: number;
        lengthMeters?: number;
        lastNote?: string;
      }

      const payload: AssetPayload = {
        code: formData.code as string,
        name: formData.name as string,
        status: formData.status as string,
        geom: geom,
        ...(lastNote.trim() ? { lastNote: lastNote.trim() } : {})
      };

      if (editingAsset) {
        payload.id = parseInt(editingAsset.id);
      }

      // Add default attributes for new assets if not already present
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
        // preserve existing values if editing
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

      const token = (session as Session)?.accessToken;

      const method = editingAsset ? "PUT" : "POST";
      const url = editingAsset 
        ? `${getBackendBaseUrl()}${endpoint}/${editingAsset.id}`
        : `${getBackendBaseUrl()}${endpoint}`;

      console.log(`Sending ${method} to ${url} with token: ${token ? 'YES' : 'NO'}`);

      const res = await httpClient(url, {
        method: method,
        token: session?.accessToken,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to ${editingAsset ? 'update' : 'save'} asset: ${res.status} ${errText}`);
      }

      // Success
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

  const openDeleteModal = () => {
    setDeleteReason("");
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!editingAsset) return;
    if (!deleteReason.trim()) return;

    setIsSubmitting(true);
    try {
      let endpoint = "";
      if (editingAsset.type === "ODP") endpoint = "/network/odps";
      if (editingAsset.type === "ODC") endpoint = "/network/odcs";
      if (editingAsset.type === "OLT") endpoint = "/network/olts";
      if (editingAsset.type === "CABLE") endpoint = "/network/cables";

      const res = await httpClient(`${getBackendBaseUrl()}${endpoint}/${editingAsset.id}?reason=${encodeURIComponent(deleteReason.trim())}`, {
        method: "DELETE",
        token: session?.accessToken
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Delete failed: ${res.status} ${errText}`);
      }

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

  const closeForm = () => {
    setIsFormOpen(false);
    setDrawnFeature(null);
    setEditingAsset(null);
  };

  const assetType = editingAsset ? editingAsset.type : drawingAssetType;

  return (
    <div className="absolute right-4 top-24 bottom-4 w-80 bg-background border rounded-xl shadow-2xl z-60 flex flex-col transform transition-transform duration-300 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold text-lg leading-none tracking-tight">
            {editingAsset ? "Edit" : "Add"} {assetType}
          </h3>
          <p className="text-xs text-muted-foreground mt-1.5">Configure asset properties</p>
        </div>
        <Button variant="ghost" size="icon" onClick={closeForm}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <form id="asset-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="code">Asset Code</Label>
              {codeStatus === 'checking' && <span className="text-xs text-yellow-500 font-medium flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Checking...</span>}
              {codeStatus === 'available' && <span className="text-xs text-emerald-500 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Available</span>}
              {codeStatus === 'exists' && <span className="text-xs text-red-500 font-medium flex items-center gap-1"><XCircle className="w-3 h-3"/> Already exists</span>}
            </div>
            <Input 
              id="code" 
              value={formData.code as string} 
              onChange={e => setFormData({...formData, code: e.target.value})} 
              placeholder="e.g. ODP-JKT-1A" 
              className={codeStatus === 'exists' ? "border-red-500 focus-visible:ring-red-500" : ""}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Friendly Name</Label>
            <Input 
              id="name" 
              value={formData.name as string} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="e.g. ODP Cempaka Putih" 
            />
          </div>

           <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              value={formData.status as string} 
              onValueChange={v => setFormData({...formData, status: v})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNED">Planned (Construction)</SelectItem>
                <SelectItem value="UP">Active (Live)</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="DOWN">Offline / Down</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mandatory Audit Note on Status Change */}
          {editingAsset && originalStatus && formData.status !== originalStatus && (
            <div className="space-y-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 text-amber-500">
                <FileText className="w-4 h-4" />
                <Label className="text-amber-500 font-semibold text-xs">
                  Catatan Perubahan Status <span className="text-red-500">*</span>
                </Label>
              </div>
              <p className="text-[10px] text-muted-foreground -mt-1">
                Status berubah dari <strong className="text-foreground">{originalStatus}</strong> ke <strong className="text-foreground">{formData.status as string}</strong>. Wajib sertakan alasan.
              </p>
              <textarea
                className="flex min-h-[70px] w-full rounded-md border border-amber-500/30 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 resize-none"
                placeholder="Contoh: Maintenance rutin / Fiber putus di tiang 12 / Upgrade ODP baru"
                value={lastNote}
                onChange={(e) => setLastNote(e.target.value)}
              />
            </div>
          )}

          <div className="p-3 bg-muted/50 rounded-md border border-border">
            <h4 className="text-xs font-semibold mb-2">Spatial Data</h4>
            {drawnFeature?.geometry?.type === "Point" || (formData.lat && formData.lng) ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Longitude</Label>
                  <Input 
                    type="number" 
                    step="0.000001"
                    className="h-7 text-[11px] font-mono px-2"
                    value={formData.lng}
                    onChange={e => handleCoordChange('lng', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Latitude</Label>
                  <Input 
                    type="number" 
                    step="0.000001"
                    className="h-7 text-[11px] font-mono px-2"
                    value={formData.lat}
                    onChange={e => handleCoordChange('lat', e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-muted-foreground font-mono">
                LineString with {(drawnFeature?.geometry as LineString)?.coordinates?.length || 0} points
              </div>
            )}
          </div>
        </form>
      </div>

      <div className="p-4 border-t bg-muted/20 space-y-2">
        <Button 
          type="submit" 
          form="asset-form" 
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          disabled={isSubmitting || codeStatus === 'exists' || codeStatus === 'checking'}
        >
          {isSubmitting ? (
            "Saving..."
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {editingAsset ? "Update Asset" : "Save Asset"}
            </>
          )}
        </Button>

        {editingAsset && (
          <Button 
            variant="outline"
            onClick={openDeleteModal}
            className="w-full text-red-500 border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
            disabled={isSubmitting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Asset
          </Button>
        )}

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <DialogTitle>Hapus Aset</DialogTitle>
                  <DialogDescription>
                    Aset <strong className="text-foreground">{editingAsset?.code}</strong> akan dihapus permanen dari database dan peta.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <label className="text-sm font-medium">Alasan Penghapusan <span className="text-red-500">*</span></label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                placeholder="Contoh: Aset sudah tidak operasional / Duplikasi data / Salah input lokasi"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
              {deleteReason.trim() === "" && (
                <p className="text-xs text-muted-foreground">Alasan wajib diisi sebelum menghapus aset.</p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting || !deleteReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menghapus...</>
                ) : (
                  <><Trash2 className="w-4 h-4 mr-2" /> Ya, Hapus Aset</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
