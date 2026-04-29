import * as React from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { networkApi } from "@/lib/api/network";
import { batchUpdateSchema } from "@/lib/validations/network";

interface UseBatchEditFormProps {
  selectedIds: string[];
  assetType: string;
  onSuccess: () => void;
  onOpenChange: (open: boolean) => void;
  mode: "STATUS_UPDATE" | "REASSIGN_PARENT";
}

export function useBatchEditForm({
  selectedIds,
  assetType,
  onSuccess,
  onOpenChange,
  mode
}: UseBatchEditFormProps) {
  const params = useParams();
  const projectId = ((Array.isArray(params?.projectId) ? params.projectId[0] : params?.projectId) || "") as string;
  const { data: session } = useSession();
  
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    status: "",
    healthStatus: "",
    reason: "",
    notes: "",
    newParentId: null as string | null,
    newParentCode: ""
  });
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [isParentSelectorOpen, setIsParentSelectorOpen] = React.useState(false);

  const isReassignMode = mode === "REASSIGN_PARENT";
  
  const getParentType = () => {
    if (assetType === "ODP") return "ODC";
    if (assetType === "ODC") return "OLT";
    if (assetType === "CUSTOMER") return "ODP";
    return "ODP";
  };

  const resetForm = () => {
    setFormData({
      status: "",
      healthStatus: "",
      reason: "",
      notes: "",
      newParentId: null,
      newParentCode: ""
    });
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isReassignMode && !formData.status && !formData.healthStatus) {
      toast.error("Pilih minimal satu status untuk diperbarui");
      return;
    }
    
    if (!formData.reason && !isReassignMode) {
      toast.error("Alasan wajib diisi");
      return;
    }

    if (isReassignMode && !formData.newParentId) {
      toast.error("Pilih parent baru terlebih dahulu");
      return;
    }

    setLoading(true);
    setFormErrors({});

    try {
      const payload = {
        ids: selectedIds,
        type: assetType,
        status: isReassignMode ? undefined : (formData.status || undefined),
        healthStatus: isReassignMode ? undefined : (formData.healthStatus || undefined),
        reason: isReassignMode ? "Bulk Reassignment" : formData.reason,
        notes: formData.notes,
        newParentId: isReassignMode ? formData.newParentId : undefined
      };

      // Validate with Zod
      try {
        batchUpdateSchema.parse(payload);
      } catch (err) {
        if (err instanceof z.ZodError) {
          const errors: Record<string, string> = {};
          err.issues.forEach((issue) => {
            if (issue.path[0]) errors[issue.path[0] as string] = issue.message;
          });
          setFormErrors(errors);
          toast.error("Validasi gagal", { description: "Periksa kembali inputan Anda." });
          setLoading(false);
          return;
        }
        throw err;
      }

      const result = await networkApi.batchUpdate(payload, session?.accessToken as string, projectId);

      toast.success(`Berhasil memperbarui ${result.count} aset`);
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: unknown) {
      console.error("Batch update error:", error);
      const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui aset secara massal";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    formErrors,
    loading,
    isParentSelectorOpen,
    setIsParentSelectorOpen,
    isReassignMode,
    getParentType,
    handleSubmit,
    resetForm
  };
}
