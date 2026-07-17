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
import { ODC, OLT } from "@/types/network";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { networkApi } from "@/lib/api/network";
import { toast } from "sonner";
import { odcSchema } from "@/lib/validations/network";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, MapPin, Settings2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { MapCoordinatePicker } from "./map-coordinate-picker";

interface OdcDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  odc?: ODC | null;
  onSuccess: () => void;
}

export function OdcDialog({
  open,
  onOpenChange,
  odc,
  onSuccess,
}: OdcDialogProps) {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { data: session } = useSession();
  const [loading, setLoading] = React.useState(false);
  const [showMapPicker, setShowMapPicker] = React.useState(false);
  const isEdit = !!odc;

  const [olts, setOlts] = React.useState<OLT[]>([]);

  // Fetch OLTs for dropdown
  React.useEffect(() => {
    if (open && session?.accessToken) {
      const fetchOlts = async () => {
        try {
          const data = await networkApi.getOlts({ size: 100 }, session.accessToken as string, projectId as string);
          setOlts(data.content);
        } catch (e) {
          console.error("Failed to fetch OLTs", e);
        }
      };
      fetchOlts();
    }
  }, [open, session, projectId]);

  const [formData, setFormData] = React.useState({
    code: "",
    name: "",
    capacity: "144",
    status: "PLAN",
    healthStatus: "UP",
    lat: "",
    lng: "",
    oltId: "",
    lastNote: "",
    address: "",
  });

  React.useEffect(() => {
    if (odc) {
      const lng = odc.lng ?? odc.geom?.coordinates?.[0] ?? "";
      const lat = odc.lat ?? odc.geom?.coordinates?.[1] ?? "";
      
      setFormData({
        code: odc.code || "",
        name: odc.name || "",
        capacity: odc.capacity?.toString() || "144",
        status: odc.status || "PLAN",
        healthStatus: odc.healthStatus || "UP",
        lat: lat?.toString() || "",
        lng: lng?.toString() || "",
        oltId: odc.oltId?.toString() || "",
        lastNote: odc.lastNote || "",
        address: odc.address || "",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        capacity: "144",
        status: "PLAN",
        healthStatus: "UP",
        lat: "",
        lng: "",
        oltId: "",
        lastNote: "",
        address: "",
      });
      setFormErrors({});
    }
  }, [odc, open, projectId]);

  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      // Validation with Zod
      setFormErrors({});
      try {
        const validationData = {
          ...formData,
          parentId: formData.oltId || null,
        };
        odcSchema.parse(validationData);
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

      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity),
        oltId: formData.oltId || null,
        nodeType: "ODC",
        geom: {
          type: "Point",
          coordinates: [parseFloat(formData.lng), parseFloat(formData.lat)],
        },
      };

      if (isEdit) {
        await networkApi.updateAsset("ODC", odc.id, payload, session.accessToken as string, projectId as string);
      } else {
        await networkApi.createAsset("ODC", payload, session.accessToken as string, projectId as string);
      }

      toast.success(
        isEdit ? "ODC updated successfully" : "ODC created successfully",
      );
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-950 border-white/10 text-white shadow-2xl rounded-3xl overflow-hidden p-0">
        <DialogHeader className="p-6 bg-zinc-900/50 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Settings2 className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">
                {isEdit ? "Edit Cabinet" : "New ODC Asset"}
              </DialogTitle>
              <DialogDescription className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                ODC Configuration & Topology Assignment
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
                  <SelectItem value="UP" className="text-primary font-bold">UP - Healthy</SelectItem>
                  <SelectItem value="DEGRADED" className="text-orange-500 font-bold">DEGRADED</SelectItem>
                  <SelectItem value="DOWN" className="text-red-500 font-bold">DOWN</SelectItem>
                  <SelectItem value="BROKEN" className="text-red-700 font-black">BROKEN</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">ODC Code</Label>
               <Input
                placeholder="e.g. ODC-DAGO-01"
                value={formData.code}
                onChange={(e) => {
                  setFormData({ ...formData, code: e.target.value });
                  if (formErrors.code) setFormErrors({...formErrors, code: ""});
                }}
                className={cn("bg-zinc-900 border-border focus:border-blue-500/50 h-11 rounded-xl font-bold text-xs", formErrors.code && "border-red-500 focus:ring-red-500")}
                required
              />
              {formErrors.code && <p className="text-[10px] font-medium text-red-500 ml-1">{formErrors.code}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Capacity (Core)</Label>
               <Input
                type="number"
                value={formData.capacity}
                onChange={(e) => {
                  setFormData({ ...formData, capacity: e.target.value });
                  if (formErrors.capacity) setFormErrors({...formErrors, capacity: ""});
                }}
                className={cn("bg-zinc-900 border-border focus:border-blue-500/50 h-11 rounded-xl font-bold text-xs", formErrors.capacity && "border-red-500 focus:ring-red-500")}
              />
              {formErrors.capacity && <p className="text-[10px] font-medium text-red-500 ml-1">{formErrors.capacity}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Location Name</Label>
             <Input
              placeholder="e.g. Dago Main Cabinet"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (formErrors.name) setFormErrors({...formErrors, name: ""});
              }}
              className={cn("bg-zinc-900 border-border focus:border-blue-500/50 h-11 rounded-xl font-bold text-xs", formErrors.name && "border-red-500 focus:ring-red-500")}
              required
            />
            {formErrors.name && <p className="text-[10px] font-medium text-red-500 ml-1">{formErrors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Parent OLT</Label>
            <Select
              value={formData.oltId}
              onValueChange={(val) => setFormData({ ...formData, oltId: val })}
            >
              <SelectTrigger className="bg-zinc-900 border-border focus:ring-blue-500/50 h-11 rounded-xl font-bold text-xs">
                <SelectValue placeholder="Select Parent OLT" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-white/10 text-white max-h-60 overflow-y-auto">
                {olts.map((olt) => (
                  <SelectItem key={olt.id} value={olt.id.toString()}>
                    {olt.code} - {olt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              placeholder="Explain the reason for this status change..."
              value={formData.lastNote}
              onChange={(e) => {
                setFormData({ ...formData, lastNote: e.target.value });
                if (formErrors.lastNote) setFormErrors({...formErrors, lastNote: ""});
              }}
              className={cn("bg-zinc-900 border-border focus:border-blue-500/50 min-h-[80px] rounded-xl text-xs resize-none", formErrors.lastNote && "border-red-500 focus:ring-red-500")}
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
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-8 uppercase text-[10px] font-black tracking-widest shadow-lg shadow-blue-500/20"
            >
              {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Asset"}
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
          title={isEdit ? `Update Location` : "Pick ODC Location"}
        />
      </DialogContent>
    </Dialog>
  );
}
