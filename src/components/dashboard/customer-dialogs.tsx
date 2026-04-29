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
import { Customer, ODP } from "@/types/network";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { networkApi } from "@/lib/api/network";
import { toast } from "sonner";
import { customerSchema } from "@/lib/validations/network";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, MapPin, UserCheck } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { MapCoordinatePicker } from "./map-coordinate-picker";
import { useCustomerForm } from "@/hooks/network/useCustomerForm";

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSuccess: () => void;
}

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerDialogProps) {
  const {
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    loading,
    showMapPicker,
    setShowMapPicker,
    isEdit,
    odps,
    handleSubmit
  } = useCustomerForm(customer || null, open, onSuccess, onOpenChange);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-950 border-white/10 text-white shadow-2xl rounded-3xl overflow-hidden p-0">
        <DialogHeader className="p-6 bg-zinc-900/50 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">
                {isEdit ? "Edit Subscriber" : "New Subscriber"}
              </DialogTitle>
              <DialogDescription className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                Customer Provisioning & Last-Mile Connection
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Account Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger className="bg-zinc-900 border-white/5 focus:ring-emerald-500/50 h-11 rounded-xl font-bold text-xs">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10 text-white">
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                  <SelectItem value="TERMINATED">TERMINATED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Service Health</Label>
              <Select
                value={formData.healthStatus}
                onValueChange={(val) => setFormData({ ...formData, healthStatus: val })}
              >
                <SelectTrigger className="bg-zinc-900 border-white/5 focus:ring-blue-500/50 h-11 rounded-xl font-bold text-xs">
                  <SelectValue placeholder="Select health" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10 text-white">
                  <SelectItem value="UP" className="text-emerald-500 font-bold">UP - Online</SelectItem>
                  <SelectItem value="DEGRADED" className="text-orange-500 font-bold">DEGRADED</SelectItem>
                  <SelectItem value="DOWN" className="text-red-500 font-bold">DOWN - Outage</SelectItem>
                  <SelectItem value="BROKEN" className="text-red-700 font-black">BROKEN</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Subscriber ID</Label>
              <Input
              id="code"
              placeholder="e.g. CUST-DAGO-001"
              value={formData.code}
              onChange={(e) => {
                setFormData({ ...formData, code: e.target.value });
                if (formErrors.code) setFormErrors({...formErrors, code: ""});
              }}
              className={cn("bg-zinc-900 border-white/5 focus:border-cyan-500/50 h-11 rounded-xl font-bold text-xs", formErrors.code && "border-red-500 focus:ring-red-500")}
              required
            />
            {formErrors.code && <p className="text-[10px] font-medium text-red-500 ml-1">{formErrors.code}</p>}
          </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Subscriber Name</Label>
              <Input
              id="name"
              placeholder="e.g. John Doe / PT. Example"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (formErrors.name) setFormErrors({...formErrors, name: ""});
              }}
              className={cn("bg-zinc-900 border-white/5 focus:border-cyan-500/50 h-11 rounded-xl font-bold text-xs", formErrors.name && "border-red-500 focus:ring-red-500")}
              required
            />
            {formErrors.name && <p className="text-[10px] font-medium text-red-500 ml-1">{formErrors.name}</p>}
          </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Full Installation Address</Label>
            <Input
              id="address"
              placeholder="Full installation address"
              value={formData.address}
              onChange={(e) => {
                setFormData({ ...formData, address: e.target.value });
                if (formErrors.address) setFormErrors({...formErrors, address: ""});
              }}
              className={cn("bg-zinc-900 border-white/5 focus:border-cyan-500/50 h-11 rounded-xl font-bold text-xs", formErrors.address && "border-red-500 focus:ring-red-500")}
              required
            />
            {formErrors.address && <p className="text-[10px] font-medium text-red-500 ml-1">{formErrors.address}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Parent ODP Port</Label>
            <Select
              value={formData.odpId}
              onValueChange={(val) => setFormData({ ...formData, odpId: val })}
            >
              <SelectTrigger className="bg-zinc-900 border-white/5 focus:ring-blue-500/50 h-11 rounded-xl font-bold text-xs">
                <SelectValue placeholder="Select Parent ODP" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-white/10 text-white max-h-60 overflow-y-auto">
                {odps.map((odp) => (
                  <SelectItem key={odp.id} value={odp.id.toString()}>
                    {odp.code} - {odp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Service History Note</Label>
              {(formData.status !== "ACTIVE") && (
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
              className={cn("bg-zinc-900 border-white/5 focus:border-cyan-500/50 min-h-[80px] rounded-xl text-xs resize-none", formErrors.lastNote && "border-red-500 focus:ring-red-500")}
              required={formData.status !== "ACTIVE" && formData.status !== "PLAN"}
            />
            {formErrors.lastNote && <p className="text-[10px] font-medium text-red-500 ml-1">{formErrors.lastNote}</p>}
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Installation Map Point</Label>
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
                className="bg-zinc-900 border-white/5 h-10 rounded-xl font-mono text-[10px]"
                required
              />
              <Input
                placeholder="Longitude"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                className="bg-zinc-900 border-white/5 h-10 rounded-xl font-mono text-[10px]"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-white/5 gap-3">
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
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-8 uppercase text-[10px] font-black tracking-widest shadow-lg shadow-indigo-500/20"
            >
              {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              {isEdit ? "Update Service" : "Register Service"}
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
            toast.info(`Installation location updated`);
          }}
          title={isEdit ? `Update Location` : "Pick Customer Location"}
        />
      </DialogContent>
    </Dialog>
  );
}
