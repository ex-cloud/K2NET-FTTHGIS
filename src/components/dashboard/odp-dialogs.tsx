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
import { ODC, ODP, PageResponse } from "@/types/network";
import { useSession } from "next-auth/react";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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
  const { data: session } = useSession();
  const [loading, setLoading] = React.useState(false);
  const isEdit = !!odp;

  const [odcs, setOdcs] = React.useState<ODC[]>([]);

  // Fetch ODCs for dropdown
  React.useEffect(() => {
    if (open && session?.accessToken) {
      const fetchOdcs = async () => {
        try {
          const baseUrl = getBackendBaseUrl();
          const res = await fetch(`${baseUrl}/network/odcs?size=100`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          });
          if (res.ok) {
            const data: PageResponse<ODC> = await res.json();
            setOdcs(data.content);
          }
        } catch (e) {
          console.error("Failed to fetch ODCs", e);
        }
      };
      fetchOdcs();
    }
  }, [open, session]);

  const [formData, setFormData] = React.useState({
    code: "",
    name: "",
    status: "PLANNING",
    lat: "",
    lng: "",
    totalPort: "16",
    usedPort: "0",
    odcId: "",
    lastNote: "",
  });

  React.useEffect(() => {
    if (odp) {
      // Robust coordinate extraction
      const lng = odp.geom?.coordinates?.[0] ?? odp.lng ?? "";
      const lat = odp.geom?.coordinates?.[1] ?? odp.lat ?? "";

      setFormData({
        code: odp.code || "",
        name: odp.name || "",
        status: odp.status || "PLANNING",
        lat: lat.toString(),
        lng: lng.toString(),
        totalPort: odp.totalPort?.toString() || "16",
        usedPort: odp.usedPort?.toString() || "0",
        odcId: odp.odcId?.toString() || "",
        lastNote: odp.lastNote || "",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        status: "PLANNING",
        lat: "",
        lng: "",
        totalPort: "16",
        usedPort: "0",
        odcId: "",
        lastNote: "",
      });
    }
  }, [odp, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      const baseUrl = getBackendBaseUrl();
      const url = isEdit
        ? `${baseUrl}/network/odps/${odp.id}`
        : `${baseUrl}/network/odps`;
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...formData,
        totalPort: parseInt(formData.totalPort),
        usedPort: parseInt(formData.usedPort),
        odcId: formData.odcId ? parseInt(formData.odcId) : null,
        nodeType: "ODP",
        geom: {
          type: "Point",
          coordinates: [parseFloat(formData.lng), parseFloat(formData.lat)],
        },
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save ODP");
      }

      toast.success(
        isEdit ? "ODP updated successfully" : "ODP created successfully",
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
                placeholder="e.g. ODP-BDG-01"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                className="bg-zinc-900 border-white/5 focus:border-emerald-500/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="status"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500"
              >
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  setFormData({ ...formData, status: val })
                }
              >
                <SelectTrigger className="bg-zinc-900 border-white/5 focus:ring-emerald-500/50">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10 text-white">
                  <SelectItem value="PLANNING">Planning</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="FAULTY">Faulty</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                className="bg-zinc-900 border-white/5 focus:border-emerald-500/50"
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
                className="bg-zinc-900 border-white/5 focus:border-emerald-500/50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="lastNote"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500"
              >
                Catatan Terakhir / Alasan
              </Label>
              {formData.status !== "ACTIVE" && formData.status !== "PLANNING" && (
                <span className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Reason Required
                </span>
              )}
            </div>
            <Textarea
              id="lastNote"
              placeholder={
                formData.status === "ACTIVE"
                  ? "Optional technical notes..."
                  : "Explain why this ODP is " + formData.status.toLowerCase() + "..."
              }
              value={formData.lastNote}
              onChange={(e) =>
                setFormData({ ...formData, lastNote: e.target.value })
              }
              className="bg-zinc-900 border-white/5 focus:border-emerald-500/50 min-h-[80px] resize-none"
              required={formData.status !== "ACTIVE" && formData.status !== "PLANNING"}
            />
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-transparent border-white/5 text-zinc-400 hover:text-white"
            >
              Discard
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? "Update ODP" : "Create ODP Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
