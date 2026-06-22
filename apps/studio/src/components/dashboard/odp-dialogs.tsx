"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ODP } from "@/types/network";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, MapPin } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { MapCoordinatePicker } from "./map-coordinate-picker";
import { useOdpForm } from "@/hooks/network/useOdpForm";

interface OdpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  odp?: ODP | null;
  onSuccess: () => void;
}

export function OdpDialog({
  open,
  onOpenChange,
  odp,
  onSuccess,
}: OdpDialogProps) {
  const {
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    loading,
    showMapPicker,
    setShowMapPicker,
    isEdit,
    odcs,
    handleSubmit
  } = useOdpForm(odp || null, open, onSuccess, onOpenChange);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-950 border-white/10 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">
            {isEdit ? "Edit ODP" : "Add ODP Asset"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Configure ODP port properties and geographical position.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="code"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500"
              >
                ODP Code
              </Label>
              <Input
                id="code"
                placeholder="e.g. ODP-DAGO-01"
                value={formData.code}
                onChange={(e) => {
                  setFormData({ ...formData, code: e.target.value });
                  if (formErrors.code) setFormErrors({...formErrors, code: ""});
                }}
                className={cn("bg-zinc-900 border-white/5 focus:border-blue-500/50 h-11 rounded-xl font-bold text-xs", formErrors.code && "border-red-500 focus:ring-red-500")}
                required
              />
              {formErrors.code && <p className="text-[10px] font-medium text-red-500 ml-1">{formErrors.code}</p>}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="status"
                className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500"
              >
                Lifecycle Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  setFormData({ ...formData, status: val })
                }
              >
                <SelectTrigger className="bg-zinc-900 border-white/5 focus:ring-emerald-500/50 h-11 rounded-xl font-bold text-xs">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10 text-white">
                  <SelectItem value="PLAN">PLAN</SelectItem>
                  <SelectItem value="DEPLOYING">DEPLOYING</SelectItem>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                  <SelectItem value="RETIRED">RETIRED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="healthStatus"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500"
            >
              Operational Health Condition
            </Label>
            <Select
              value={formData.healthStatus}
              onValueChange={(val) =>
                setFormData({ ...formData, healthStatus: val })
              }
            >
              <SelectTrigger className="bg-zinc-900 border-white/5 focus:ring-blue-500/50 h-11 rounded-xl font-bold text-xs">
                <SelectValue placeholder="Select health" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-white/10 text-white">
                <SelectItem value="UP" className="text-emerald-500 font-bold">UP - Normal Signal</SelectItem>
                <SelectItem value="DEGRADED" className="text-orange-500 font-bold">DEGRADED - Warning</SelectItem>
                <SelectItem value="DOWN" className="text-red-500 font-bold">DOWN - Offline</SelectItem>
                <SelectItem value="BROKEN" className="text-red-700 font-black">BROKEN - Damage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="totalPort"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500"
              >
                Total Ports
              </Label>
              <Input
                id="totalPort"
                type="number"
                value={formData.totalPort}
                onChange={(e) =>
                  setFormData({ ...formData, totalPort: e.target.value })
                }
                className="bg-zinc-900 border-white/5 focus:border-emerald-500/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="usedPort"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500"
              >
                Used Ports
              </Label>
              <Input
                id="usedPort"
                type="number"
                value={formData.usedPort}
                onChange={(e) =>
                  setFormData({ ...formData, usedPort: e.target.value })
                }
                className="bg-zinc-900 border-white/5 focus:border-emerald-500/50"
                required
              />
            </div>
          </div>

          {/* ODC Parent Select */}
          <div className="space-y-2">
            <Label
              htmlFor="odc"
              className="text-xs font-bold uppercase tracking-wider text-zinc-500"
            >
              Parent ODC
            </Label>
            <Select
              value={formData.odcId}
              onValueChange={(val) => setFormData({ ...formData, odcId: val })}
            >
              <SelectTrigger className="bg-zinc-900 border-white/5 focus:ring-emerald-500/50">
                <SelectValue placeholder="Select Parent ODC" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-white/10 text-white max-h-60 overflow-y-auto">
                {odcs.map((odc) => (
                  <SelectItem key={odc.id} value={odc.id.toString()}>
                    {odc.code} - {odc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Geographical Position</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMapPicker(true)}
              className="h-7 px-3 rounded-xl border-blue-500/20 bg-blue-500/5 text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/40 text-[9px] font-black uppercase tracking-widest transition-all"
            >
              <MapPin className="w-3 h-3 mr-1.5" />
              Pick from Map
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="lat"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500"
              >
                Latitude
              </Label>
              <Input
                id="lat"
                placeholder="Enter latitude"
                value={formData.lat}
                onChange={(e) =>
                  setFormData({ ...formData, lat: e.target.value })
                }
                className="bg-zinc-900 border-white/5 focus:border-emerald-500/50 font-mono text-[11px]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="lng"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500"
              >
                Longitude
              </Label>
              <Input
                id="lng"
                placeholder="Enter longitude"
                value={formData.lng}
                onChange={(e) =>
                  setFormData({ ...formData, lng: e.target.value })
                }
                className="bg-zinc-900 border-white/5 focus:border-emerald-500/50 font-mono text-[11px]"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="address"
              className="text-xs font-bold uppercase tracking-wider text-zinc-500"
            >
              Full Address
            </Label>
            <Input
              id="address"
              placeholder="Captured address from map..."
              value={formData.address || ""}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="bg-zinc-900 border-white/5 focus:border-emerald-500/50 text-xs italic"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="lastNote"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500"
              >
                Catatan Terakhir / Alasan
              </Label>
              {formData.status !== "ACTIVE" && formData.status !== "PLAN" && (
                <span className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Reason Required
                </span>
              )}
            </div>
            <Textarea
              id="lastNote"
              placeholder="Explain the reason for this status change..."
              value={formData.lastNote}
              onChange={(e) => {
                setFormData({ ...formData, lastNote: e.target.value });
                if (formErrors.lastNote) setFormErrors({...formErrors, lastNote: ""});
              }}
              className={cn("bg-zinc-900 border-white/5 focus:border-blue-500/50 min-h-[80px] rounded-xl text-xs resize-none", formErrors.lastNote && "border-red-500 focus:ring-red-500")}
              required={formData.status !== "ACTIVE" && formData.status !== "PLAN"}
            />
            {formErrors.lastNote && <p className="text-[10px] font-medium text-red-500 ml-1">{formErrors.lastNote}</p>}
          </div>

          <DialogFooter className="pt-4 border-t border-white/5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[100px]"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create ODP"}
            </Button>
          </DialogFooter>
        </form>

        <MapCoordinatePicker
          open={showMapPicker}
          onOpenChange={setShowMapPicker}
          initialLat={formData.lat}
          initialLng={formData.lng}
          onConfirm={(lat, lng, address) => {
            setFormData({ ...formData, lat, lng, address: address || formData.address });
            toast.info(`Location updated to ${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}`);
          }}
          title={isEdit ? `Update Location for ${formData.code}` : "Pick ODP Location"}
        />
      </DialogContent>
    </Dialog>
  );
}
