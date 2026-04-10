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
import { useSession } from "next-auth/react";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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
  const { data: session } = useSession();
  const [loading, setLoading] = React.useState(false);
  const isEdit = !!olt;

  const [formData, setFormData] = React.useState({
    code: "",
    name: "",
    ipAddress: "",
    snmpCommunity: "public",
    status: "UP",
    lat: "-6.9175",
    lng: "107.6191",
    lastNote: "",
  });

  React.useEffect(() => {
    if (olt) {
      setFormData({
        code: olt.code || "",
        name: olt.name || "",
        ipAddress: olt.ipAddress || "",
        snmpCommunity: olt.snmpCommunity || "public",
        status: olt.status || "UP",
        lat: olt.geom?.coordinates?.[1]?.toString() || "-6.9175",
        lng: olt.geom?.coordinates?.[0]?.toString() || "107.6191",
        lastNote: olt.lastNote || "",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        ipAddress: "",
        snmpCommunity: "public",
        status: "UP",
        lat: "-6.9175",
        lng: "107.6191",
        lastNote: "",
      });
    }
  }, [olt, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      const baseUrl = getBackendBaseUrl();
      const url = isEdit
        ? `${baseUrl}/network/olts/${olt.id}`
        : `${baseUrl}/network/olts`;
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...formData,
        nodeType: "OLT",
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
        throw new Error(error.message || "Failed to save OLT");
      }

      toast.success(
        isEdit ? "OLT updated successfully" : "OLT created successfully",
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
            {isEdit ? "Edit Core Device" : "Add Core Device"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Configure backbone network parameters for the Optical Line Terminal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="code"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500"
              >
                Device Code
              </Label>
              <Input
                id="code"
                placeholder="e.g. OLT-BDG-01"
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
                Initial Status
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
                  <SelectItem value="UP">UP / Online</SelectItem>
                  <SelectItem value="DOWN">DOWN / Critical</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
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
              placeholder="e.g. Central Office Bandung"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="bg-zinc-900 border-white/5 focus:border-emerald-500/50"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="ipAddress"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500"
              >
                Management IP
              </Label>
              <Input
                id="ipAddress"
                placeholder="10.0.0.1"
                value={formData.ipAddress}
                onChange={(e) =>
                  setFormData({ ...formData, ipAddress: e.target.value })
                }
                className="bg-zinc-900 border-white/5 focus:border-emerald-500/50 font-mono"
                required
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="snmp"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500"
              >
                SNMP Community
              </Label>
              <Input
                id="snmp"
                placeholder="public"
                value={formData.snmpCommunity}
                onChange={(e) =>
                  setFormData({ ...formData, snmpCommunity: e.target.value })
                }
                className="bg-zinc-900 border-white/5 focus:border-emerald-500/50"
                required
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="lastNote"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500"
              >
                Catatan Terakhir / Alasan
              </Label>
              {formData.status !== "UP" && (
                <span className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Reason Required
                </span>
              )}
            </div>
            <Textarea
              id="lastNote"
              placeholder={
                formData.status === "UP"
                  ? "Optional technical notes..."
                  : "Explain why this OLT is " + formData.status.toLowerCase() + "..."
              }
              value={formData.lastNote}
              onChange={(e) =>
                setFormData({ ...formData, lastNote: e.target.value })
              }
              className="bg-zinc-900 border-white/5 focus:border-emerald-500/50 min-h-[80px] resize-none"
              required={formData.status !== "UP"}
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
              {isEdit ? "Update Device" : "Create Device"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
