import * as React from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { networkApi } from "@/lib/api/network";
import { odpSchema } from "@/lib/validations/network";
import { ODP, ODC } from "@/types/network";

export function useOdpForm(
  odp: ODP | null,
  open: boolean,
  onSuccess: () => void,
  onOpenChange: (open: boolean) => void
) {
  const params = useParams();
  const projectId = ((Array.isArray(params?.projectId) ? params.projectId[0] : params?.projectId) || "") as string;
  const { data: session } = useSession();
  
  const [loading, setLoading] = React.useState(false);
  const [showMapPicker, setShowMapPicker] = React.useState(false);
  const isEdit = !!odp;

  const [odcs, setOdcs] = React.useState<ODC[]>([]);

  React.useEffect(() => {
    if (open && session?.accessToken) {
      const fetchOdcs = async () => {
        try {
          const data = await networkApi.getOdcs({ size: 100 }, session.accessToken as string, projectId);
          setOdcs(data.content);
        } catch (e) {
          console.error("Failed to fetch ODCs", e);
        }
      };
      fetchOdcs();
    }
  }, [open, session, projectId]);

  const [formData, setFormData] = React.useState({
    code: "",
    name: "",
    status: "PLAN",
    healthStatus: "UP",
    lat: "",
    lng: "",
    totalPort: "16",
    usedPort: "0",
    odcId: "",
    lastNote: "",
    address: "",
  });

  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (odp && open) {
      const lng = odp.lng ?? odp.geom?.coordinates?.[0] ?? "";
      const lat = odp.lat ?? odp.geom?.coordinates?.[1] ?? "";

      setFormData({
        code: odp.code || "",
        name: odp.name || "",
        status: odp.status || "PLAN",
        healthStatus: odp.healthStatus || "UP",
        lat: lat.toString(),
        lng: lng.toString(),
        totalPort: odp.totalPort?.toString() || "16",
        usedPort: odp.usedPort?.toString() || "0",
        odcId: odp.odcId?.toString() || "",
        lastNote: odp.lastNote || "",
        address: odp.address || "",
      });
      setFormErrors({});
    } else if (open) {
      setFormData({
        code: "",
        name: "",
        status: "PLAN",
        healthStatus: "UP",
        lat: "",
        lng: "",
        totalPort: "16",
        usedPort: "0",
        odcId: "",
        lastNote: "",
        address: "",
      });
      setFormErrors({});
    }
  }, [odp, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      setFormErrors({});
      try {
        const validationData = {
          ...formData,
          parentId: formData.odcId || null,
        };
        odpSchema.parse(validationData);
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
        totalPort: parseInt(formData.totalPort),
        usedPort: parseInt(formData.usedPort),
        odcId: formData.odcId || null,
        nodeType: "ODP",
        geom: {
          type: "Point",
          coordinates: [parseFloat(formData.lng), parseFloat(formData.lat)],
        },
      };

      if (isEdit) {
        await networkApi.updateAsset("ODP", odp.id, payload, session.accessToken as string, projectId);
      } else {
        await networkApi.createAsset("ODP", payload, session.accessToken as string, projectId);
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

  return {
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
  };
}
