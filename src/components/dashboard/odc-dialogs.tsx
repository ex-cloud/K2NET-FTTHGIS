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
import { ODC, OLT, PageResponse } from "@/types/network";
import { useSession } from "next-auth/react";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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
  const { data: session } = useSession();
  const [loading, setLoading] = React.useState(false);
  const isEdit = !!odc;

  const [olts, setOlts] = React.useState<OLT[]>([]);

  // Fetch OLTs for dropdown
  React.useEffect(() => {
    if (open && session?.accessToken) {
      const fetchOlts = async () => {
        try {
          const baseUrl = getBackendBaseUrl();
          const res = await fetch(`${baseUrl}/network/olts?size=100`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          });
          if (res.ok) {
            const data: PageResponse<OLT> = await res.json();
            setOlts(data.content);
          }
        } catch (e) {
          console.error("Failed to fetch OLTs", e);
        }
      };
      fetchOlts();
    }
  }, [open, session]);

  const [formData, setFormData] = React.useState({
    code: "",
    name: "",
    capacity: "144",
    status: "PLANNING",
    lat: "-6.9175",
    lng: "107.6191",
    oltId: "",
    lastNote: "",
  });

  React.useEffect(() => {
    if (odc) {
      setFormData({
        code: odc.code || "",
        name: odc.name || "",
        capacity: odc.capacity?.toString() || "144",
        status: odc.status || "PLANNING",
        lat: odc.geom?.coordinates?.[1]?.toString() || "-6.9175",
        lng: odc.geom?.coordinates?.[0]?.toString() || "107.6191",
        oltId: odc.oltId?.toString() || "",
        lastNote: odc.lastNote || "",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        capacity: "144",
        status: "PLANNING",
        lat: "-6.9175",
        lng: "107.6191",
        oltId: "",
        lastNote: "",
      });
    }
  }, [odc, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      const baseUrl = getBackendBaseUrl();
      const url = isEdit
        ? `${baseUrl}/network/odcs/${odc.id}`
        : `${baseUrl}/network/odcs`;
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity),
        oltId: formData.oltId ? parseInt(formData.oltId) : null,
        nodeType: "ODC",
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
        throw new Error(error.message || "Failed to save ODC");
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
      <DialogContent className="max-w-md bg-zinc-950 border-white/10 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">
            {isEdit ? "Edit Cabinet" : "Add Cabinet"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Configure ODC details and assign to an OLT.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="code"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500"
              >
                ODC Code
              </Label>
              <Input
                id="code"
                placeholder="e.g. ODC-DAGO-01"
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
                  <SelectItem value="BROKEN">Broken / Down</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-xs font-bold uppercase tracking-wider text-zinc-500"
            >
              Location Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Dago Main Cabinet"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="bg-zinc-900 border-white/5 focus:border-emerald-500/50"
              required
            />
          </div>

          {/* OLT Parent Select */}
          <div className="space-y-2">
            <Label
              htmlFor="olt"
              className="text-xs font-bold uppercase tracking-wider text-zinc-500"
            >
              Parent OLT
            </Label>
            <Select
              value={formData.oltId}
              onValueChange={(val) => setFormData({ ...formData, oltId: val })}
            >
              <SelectTrigger className="bg-zinc-900 border-white/5 focus:ring-emerald-500/50">
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
                  : "Explain why this asset is " + formData.status.toLowerCase() + "..."
              }
              value={formData.lastNote}
              onChange={(e) =>
                setFormData({ ...formData, lastNote: e.target.value })
              }
              className="bg-zinc-900 border-white/5 focus:border-emerald-500/50 min-h-[80px] resize-none"
              required={formData.status !== "ACTIVE" && formData.status !== "PLANNING"}
            />
            <p className="text-[10px] text-zinc-500 italic">
              This note will be visible in the Network Intelligence Advisor.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="capacity"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500"
              >
                Capacity (Core)
              </Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: e.target.value })
                }
                className="bg-zinc-900 border-white/5 focus:border-emerald-500/50"
              />
            </div>
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
                placeholder="-6.9175"
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
                placeholder="107.6191"
                value={formData.lng}
                onChange={(e) =>
                  setFormData({ ...formData, lng: e.target.value })
                }
                className="bg-zinc-900 border-white/5 focus:border-emerald-500/50"
                required
              />
            </div>
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
              {isEdit ? "Update Cabinet" : "Create Cabinet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
