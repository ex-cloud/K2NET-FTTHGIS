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
import type { LineString } from "geojson";
import { cn } from "@/lib/utils";

import { useAssetSidebarForm } from "@/hooks/network/useAssetSidebarForm";

export function AssetFormSidebar() {
  const {
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
    handleCoordChange,
    handleSubmit,
    handleDeleteConfirm,
    closeForm,
    openDeleteModal
  } = useAssetSidebarForm();

  if (!isFormOpen) return null;

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
              {codeStatus === 'available' && <span className="text-xs text-primary font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Available</span>}
              {codeStatus === 'exists' && <span className="text-xs text-red-500 font-medium flex items-center gap-1"><XCircle className="w-3 h-3"/> Already exists</span>}
            </div>
            <Input 
              id="code" 
              value={formData.code as string} 
              onChange={e => {
                setFormData({...formData, code: e.target.value});
                if (formErrors.code) setFormErrors({...formErrors, code: ""});
              }} 
              placeholder="e.g. ODP-JKT-1A" 
              className={cn((codeStatus === 'exists' || formErrors.code) ? "border-red-500 focus-visible:ring-red-500" : "")}
              required
            />
            {formErrors.code && <p className="text-[10px] font-medium text-red-500 mt-1">{formErrors.code}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Friendly Name</Label>
            <Input 
              id="name" 
              value={formData.name as string} 
              onChange={e => {
                setFormData({...formData, name: e.target.value});
                if (formErrors.name) setFormErrors({...formErrors, name: ""});
              }} 
              placeholder="e.g. ODP Cempaka Putih" 
              className={cn(formErrors.name ? "border-red-500 focus-visible:ring-red-500" : "")}
            />
            {formErrors.name && <p className="text-[10px] font-medium text-red-500 mt-1">{formErrors.name}</p>}
          </div>

           <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              value={formData.status as string} 
              onValueChange={v => {
                setFormData({...formData, status: v});
                if (formErrors.status) setFormErrors({...formErrors, status: ""});
              }}
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
                className={cn(
                  "flex min-h-[70px] w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 resize-none",
                  formErrors.lastNote ? "border-red-500 focus-visible:ring-red-500" : "border-amber-500/30 focus-visible:ring-amber-500"
                )}
                placeholder="Contoh: Maintenance rutin / Fiber putus di tiang 12 / Upgrade ODP baru"
                value={lastNote}
                onChange={(e) => {
                  setLastNote(e.target.value);
                  if (formErrors.lastNote) setFormErrors({...formErrors, lastNote: ""});
                }}
              />
              {formErrors.lastNote && <p className="text-[10px] font-medium text-red-500">{formErrors.lastNote}</p>}
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
