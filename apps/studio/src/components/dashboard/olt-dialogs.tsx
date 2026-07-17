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
import { OLT } from "@/types/network";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, MapPin, Server } from "lucide-react";
import { MapCoordinatePicker } from "./map-coordinate-picker";
import { Textarea } from "@/components/ui/textarea";
import { useOltForm } from "@/hooks/network/useOltForm";

interface OltDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  olt?: OLT | null;
  onSuccess: () => void;
}

export function OltDialog({
  open,
  onOpenChange,
  olt,
  onSuccess,
}: OltDialogProps) {
  const {
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    loading,
    showMapPicker,
    setShowMapPicker,
    isEdit,
    handleSubmit
  } = useOltForm(olt || null, open, onSuccess, onOpenChange);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-950 border-white/10 text-white shadow-2xl rounded-3xl overflow-hidden p-0">
        <DialogHeader className="p-6 bg-zinc-900/50 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Server className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">
                {isEdit ? "Edit Core OLT" : "New OLT Device"}
              </DialogTitle>
              <DialogDescription className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                Backbone Management & SNMP Configuration
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Lifecycle Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger className="bg-zinc-900 border-border focus:ring-primary/50 h-11 rounded-xl font-bold text-xs">
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
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Health Condition</Label>
              <Select
                value={formData.healthStatus}
                onValueChange={(val) => setFormData({ ...formData, healthStatus: val })}
              >
                <SelectTrigger className="bg-zinc-900 border-border focus:ring-blue-500/50 h-11 rounded-xl font-bold text-xs">
                  <SelectValue placeholder="Select health" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10 text-white">
                  <SelectItem value="UP" className="text-primary font-bold">UP - Online</SelectItem>
                  <SelectItem value="DEGRADED" className="text-orange-500 font-bold">DEGRADED</SelectItem>
                  <SelectItem value="DOWN" className="text-red-500 font-bold">DOWN - Critical</SelectItem>
                  <SelectItem value="BROKEN" className="text-red-700 font-black">BROKEN</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Device Code</Label>
              <Input
                id="code"
                placeholder="e.g. OLT-BDG-01"
                value={formData.code}
                onChange={(e) => {
                  setFormData({ ...formData, code: e.target.value });
                  if (formErrors.code) setFormErrors({...formErrors, code: ""});
                }}
                className={cn("bg-zinc-900 border-border focus:border-primary/50 h-11 rounded-xl font-bold text-xs", formErrors.code && "border-red-500 focus:ring-red-500")}
                required
              />
              {formErrors.code && <p className="text-[10px] font-medium text-red-500 ml-1">{formErrors.code}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Location Name</Label>
              <Input
                id="name"
                placeholder="e.g. Dago Main OLT"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name) setFormErrors({...formErrors, name: ""});
                }}
                className={cn("bg-zinc-900 border-border focus:border-primary/50 h-11 rounded-xl font-bold text-xs", formErrors.name && "border-red-500 focus:ring-red-500")}
                required
              />
              {formErrors.name && <p className="text-[10px] font-medium text-red-500 ml-1">{formErrors.name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Management IP</Label>
              <Input
                placeholder="10.0.0.1"
                value={formData.ipAddress}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                className="bg-zinc-900 border-border focus:border-primary/50 h-11 rounded-xl font-mono text-xs"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">SNMP Community</Label>
              <Input
                placeholder="public"
                value={formData.snmpCommunity}
                onChange={(e) => setFormData({ ...formData, snmpCommunity: e.target.value })}
                className="bg-zinc-900 border-border focus:border-primary/50 h-11 rounded-xl font-bold text-xs"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Audit Note / Reason</Label>
              {(formData.status !== "ACTIVE" && formData.status !== "PLAN") && (
                <span className="text-[8px] font-black text-rose-500 uppercase flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Required
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
              className={cn("bg-zinc-900 border-border focus:border-primary/50 min-h-[80px] rounded-xl text-xs resize-none", formErrors.lastNote && "border-red-500 focus:ring-red-500")}
              required={formData.status !== "ACTIVE" && formData.status !== "PLAN"}
            />
            {formErrors.lastNote && <p className="text-[10px] font-medium text-red-500 ml-1">{formErrors.lastNote}</p>}
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Coordinates</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMapPicker(true)}
                className="h-7 px-3 rounded-xl border-blue-500/20 bg-blue-500/5 text-blue-500 hover:bg-blue-500/10 text-[9px] font-black uppercase tracking-widest"
              >
                <MapPin className="w-3 h-3 mr-1.5" />
                Pick Map
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Latitude"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                className="bg-zinc-900 border-border h-10 rounded-xl font-mono text-[10px]"
                required
              />
              <Input
                placeholder="Longitude"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                className="bg-zinc-900 border-border h-10 rounded-xl font-mono text-[10px]"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-border gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-zinc-500 hover:text-white uppercase text-[10px] font-black tracking-widest"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 uppercase text-[10px] font-black tracking-widest shadow-lg shadow-emerald-500/20"
            >
              {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              {isEdit ? "Save Changes" : "Register OLT"}
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
            toast.info(`Location updated`);
          }}
          title={isEdit ? `Update Location` : "Pick OLT Location"}
        />
      </DialogContent>
    </Dialog>
  );
}
