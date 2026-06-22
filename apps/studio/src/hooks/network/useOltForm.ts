import * as React from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { networkApi } from "@/lib/api/network";
import { oltSchema } from "@/lib/validations/network";
import { OLT } from "@/types/network";

export function useOltForm(
  olt: OLT | null,
  open: boolean,
  onSuccess: () => void,
  onOpenChange: (open: boolean) => void
) {
  const params = useParams();
  const projectId = ((Array.isArray(params?.projectId) ? params.projectId[0] : params?.projectId) || "") as string;
  const { data: session } = useSession();
  
  const [loading, setLoading] = React.useState(false);
  const [showMapPicker, setShowMapPicker] = React.useState(false);
  const isEdit = !!olt;

  const [formData, setFormData] = React.useState({
    code: "",
    name: "",
    ipAddress: "",
    snmpCommunity: "public",
    status: "ACTIVE",
    healthStatus: "UP",
    lat: "-6.9175",
    lng: "107.6191",
    lastNote: "",
    address: "",
  });

  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (olt && open) {
      setFormData({
        code: olt.code || "",
        name: olt.name || "",
        ipAddress: olt.ipAddress || "",
        snmpCommunity: olt.snmpCommunity || "public",
        status: olt.status || "ACTIVE",
        healthStatus: olt.healthStatus || "UP",
        lat: (olt.lat ?? olt.geom?.coordinates?.[1])?.toString() || "-6.9175",
        lng: (olt.lng ?? olt.geom?.coordinates?.[0])?.toString() || "107.6191",
        lastNote: olt.lastNote || "",
        address: olt.address || "",
      });
      setFormErrors({});
    } else if (open) {
      setFormData({
        code: "",
        name: "",
        ipAddress: "",
        snmpCommunity: "public",
        status: "ACTIVE",
        healthStatus: "UP",
        lat: "-6.9175",
        lng: "107.6191",
        lastNote: "",
        address: "",
      });
      setFormErrors({});
    }
  }, [olt, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    try {
      setLoading(true);

      // Validation with Zod
      setFormErrors({});
      try {
        const validationData = { ...formData };
        oltSchema.parse(validationData);
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
        nodeType: "OLT",
        geom: {
          type: "Point",
          coordinates: [parseFloat(formData.lng), parseFloat(formData.lat)],
        },
      };

      if (isEdit) {
        await networkApi.updateAsset("OLT", olt.id, payload, session.accessToken as string, projectId);
      } else {
        await networkApi.createAsset("OLT", payload, session.accessToken as string, projectId);
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

  return {
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    loading,
    showMapPicker,
    setShowMapPicker,
    isEdit,
    handleSubmit
  };
}
