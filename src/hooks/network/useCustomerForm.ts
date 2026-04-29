import * as React from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { networkApi } from "@/lib/api/network";
import { customerSchema } from "@/lib/validations/network";
import { Customer, ODP } from "@/types/network";

export function useCustomerForm(
  customer: Customer | null,
  open: boolean,
  onSuccess: () => void,
  onOpenChange: (open: boolean) => void
) {
  const params = useParams();
  const projectId = ((Array.isArray(params?.projectId) ? params.projectId[0] : params?.projectId) || "") as string;
  const { data: session } = useSession();
  
  const [loading, setLoading] = React.useState(false);
  const [showMapPicker, setShowMapPicker] = React.useState(false);
  const isEdit = !!customer;

  const [odps, setOdps] = React.useState<ODP[]>([]);

  React.useEffect(() => {
    if (open && session?.accessToken) {
      const fetchOdps = async () => {
        try {
          const data = await networkApi.getOdps({ size: 100 }, session.accessToken as string, projectId);
          setOdps(data.content);
        } catch (e) {
          console.error("Failed to fetch ODPs", e);
        }
      };
      fetchOdps();
    }
  }, [open, session, projectId]);

  const [formData, setFormData] = React.useState({
    code: "",
    name: "",
    address: "",
    status: "ACTIVE",
    healthStatus: "UP",
    lat: "-6.9175",
    lng: "107.6191",
    odpId: "",
    lastNote: "",
  });

  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (customer && open) {
      setFormData({
        code: customer.code || "",
        name: customer.name || "",
        address: customer.address || "",
        status: customer.status || "ACTIVE",
        healthStatus: customer.healthStatus || "UP",
        lat: (customer.lat ?? customer.geom?.coordinates?.[1])?.toString() || "-6.9175",
        lng: (customer.lng ?? customer.geom?.coordinates?.[0])?.toString() || "107.6191",
        odpId: customer.odpId?.toString() || "",
        lastNote: customer.lastNote || "",
      });
      setFormErrors({});
    } else if (open) {
      setFormData({
        code: "",
        name: "",
        address: "",
        status: "ACTIVE",
        healthStatus: "UP",
        lat: "-6.9175",
        lng: "107.6191",
        odpId: "",
        lastNote: "",
      });
      setFormErrors({});
    }
  }, [customer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    try {
      setLoading(true);

      setFormErrors({});
      try {
        const validationData = {
          ...formData,
          parentId: formData.odpId || null,
        };
        customerSchema.parse(validationData);
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
        odpId: formData.odpId || null,
        nodeType: "CUSTOMER",
        geom: {
          type: "Point",
          coordinates: [parseFloat(formData.lng), parseFloat(formData.lat)],
        },
      };

      if (isEdit) {
        await networkApi.updateAsset("CUSTOMER", customer.id, payload, session.accessToken as string, projectId);
      } else {
        await networkApi.createAsset("CUSTOMER", payload, session.accessToken as string, projectId);
      }

      toast.success(
        isEdit
          ? "Customer record updated"
          : "Customer record created",
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

  return {
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
  };
}
