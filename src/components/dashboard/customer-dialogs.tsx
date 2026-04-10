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
import { Customer, ODP, PageResponse } from "@/types/network";
import { useSession } from "next-auth/react";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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
  const { data: session } = useSession();
  const [loading, setLoading] = React.useState(false);
  const isEdit = !!customer;

  const [odps, setOdps] = React.useState<ODP[]>([]);

  // Fetch ODPs for dropdown
  React.useEffect(() => {
    if (open && session?.accessToken) {
      const fetchOdps = async () => {
        try {
          const baseUrl = getBackendBaseUrl();
          const res = await fetch(`${baseUrl}/network/odps?size=100`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          });
          if (res.ok) {
            const data: PageResponse<ODP> = await res.json();
            setOdps(data.content);
          }
        } catch (e) {
          console.error("Failed to fetch ODPs", e);
        }
      };
      fetchOdps();
    }
  }, [open, session]);

  const [formData, setFormData] = React.useState({
    code: "",
    name: "",
    address: "",
    status: "ACTIVE",
    lat: "-6.9175",
    lng: "107.6191",
    odpId: "",
    lastNote: "",
  });

  React.useEffect(() => {
    if (customer) {
      setFormData({
        code: customer.code || "",
        name: customer.name || "",
        address: customer.address || "",
        status: customer.status || "ACTIVE",
        lat: customer.geom?.coordinates?.[1]?.toString() || "-6.9175",
        lng: customer.geom?.coordinates?.[0]?.toString() || "107.6191",
        odpId: customer.odpId?.toString() || "",
        lastNote: customer.lastNote || "",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        address: "",
        status: "ACTIVE",
        lat: "-6.9175",
        lng: "107.6191",
        odpId: "",
        lastNote: "",
      });
    }
  }, [customer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      const baseUrl = getBackendBaseUrl();
      const url = isEdit
        ? `${baseUrl}/network/customers/${customer.id}`
        : `${baseUrl}/network/customers`;
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...formData,
        odpId: formData.odpId ? parseInt(formData.odpId) : null,
        nodeType: "CUSTOMER",
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
        throw new Error(error.message || "Failed to save customer");
      }

      toast.success(
        isEdit
          ? "Customer updated successfully"
          : "Customer created successfully",
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
            {isEdit ? "Edit Customer" : "Add Customer"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Configure customer details and assign to an ODP.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="code"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500"
              >
                Customer ID / Code
              </Label>
              <Input
                id="code"
                placeholder="e.g. CUST-001"
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
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="TERMINATED">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-xs font-bold uppercase tracking-wider text-zinc-500"
            >
              Customer Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="bg-zinc-900 border-white/5 focus:border-emerald-500/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="address"
              className="text-xs font-bold uppercase tracking-wider text-zinc-500"
            >
              Address
            </Label>
            <Input
              id="address"
              placeholder="e.g. Dago St. No. 123"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="bg-zinc-900 border-white/5 focus:border-emerald-500/50"
              required
            />
          </div>

          {/* ODP Parent Select */}
          <div className="space-y-2">
            <Label
              htmlFor="odp"
              className="text-xs font-bold uppercase tracking-wider text-zinc-500"
            >
              Parent ODP
            </Label>
            <Select
              value={formData.odpId}
              onValueChange={(val) => setFormData({ ...formData, odpId: val })}
            >
              <SelectTrigger className="bg-zinc-900 border-white/5 focus:ring-emerald-500/50">
                <SelectValue placeholder="Select Parent ODP" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-white/10 text-white max-h-60 overflow-y-auto">
                {odps.map((odp) => (
                  <SelectItem key={odp.id} value={odp.id.toString()}>
                    {odp.code}
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
              {formData.status !== "ACTIVE" && (
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
                  ? "Optional technical/customer notes..."
                  : "Explain why this customer is " + formData.status.toLowerCase() + "..."
              }
              value={formData.lastNote}
              onChange={(e) =>
                setFormData({ ...formData, lastNote: e.target.value })
              }
              className="bg-zinc-900 border-white/5 focus:border-emerald-500/50 min-h-[80px] resize-none"
              required={formData.status !== "ACTIVE"}
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
              {isEdit ? "Update Customer" : "Create Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
