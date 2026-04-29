import * as React from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { networkApi } from "@/lib/api/network";
import { odcSchema } from "@/lib/validations/network";
import { ODC, OLT } from "@/types/network";
import { useQueryClient } from "@tanstack/react-query";

export function useOdcForm(
  odc: ODC | null,
  open: boolean,
  onSuccess: () => void,
  onOpenChange: (open: boolean) => void
) {
  const params = useParams();
  const projectId = ((Array.isArray(params?.projectId) ? params.projectId[0] : params?.projectId) || "") as string;
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  
  const [loading, setLoading] = React.useState(false);
  const [showMapPicker, setShowMapPicker] = React.useState(false);
  const isEdit = !!odc;

  const [olts, setOlts] = React.useState<OLT[]>([]);

  React.useEffect(() => {
    if (open && session?.accessToken) {
      const fetchOlts = async () => {
        try {
          const data = await networkApi.getOlts({ size: 100 }, session.accessToken as string, projectId);
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

  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (odc && open) {
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
      setFormErrors({});
    } else if (open) {
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
  }, [odc, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    try {
      setLoading(true);
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
        await networkApi.updateAsset("ODC", odc.id, payload, session.accessToken as string, projectId);
      } else {
        await networkApi.createAsset("ODC", payload, session.accessToken as string, projectId);
      }

      toast.success(
        isEdit ? "ODC updated successfully" : "ODC created successfully",
      );
      
      // Force instant refresh of stats and inventory cache
      queryClient.invalidateQueries({ queryKey: ["networkStats"] });
      
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
    olts,
    handleSubmit
  };
}
