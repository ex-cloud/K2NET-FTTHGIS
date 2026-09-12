import { useState, useEffect, type FormEvent } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-compat";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useTeamUsers } from "@/hooks/useTeamUsers";
import { type TaskScope } from "@/hooks/useTasksQuery";
import { PROJECT_ICONS } from "./new-project-constants";

interface UseNewProjectFormOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultValues?: {
    title?: string;
    summary?: string;
    description?: string;
    scope?: TaskScope;
    priority?: "URGENT" | "HIGH" | "NORMAL" | "LOW";
    status?: string;
    leadId?: string;
    targetDate?: string;
  };
}

export function useNewProjectForm({
  open,
  onOpenChange,
  onSuccess,
  defaultValues,
}: UseNewProjectFormOptions) {
  const { data: session } = useSession();
  const { users: teamUsers } = useTeamUsers();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedIconId, setSelectedIconId] = useState("box");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState<"URGENT" | "HIGH" | "NORMAL" | "LOW">("NORMAL");
  const [leadName, setLeadName] = useState(session?.user?.name || session?.user?.email || "andiansyah");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [milestones, setMilestones] = useState<{ id: string; title: string }[]>([]);
  const [newMilestoneText, setNewMilestoneText] = useState("");
  const [showMilestoneInput, setShowMilestoneInput] = useState(false);

  // Reset or fill defaults
  useEffect(() => {
    if (open) {
      setName(defaultValues?.title || "");
      setSummary(defaultValues?.summary || "");
      setDescription(defaultValues?.description || "");
      setStatus(defaultValues?.status || "TODO");
      setPriority(defaultValues?.priority || "NORMAL");
      setTargetDate(defaultValues?.targetDate || "");
      setMilestones([]);
      setShowMilestoneInput(false);
    }
  }, [open, defaultValues]);

  const activeIconObj = PROJECT_ICONS.find((i) => i.id === selectedIconId) || PROJECT_ICONS[0];

  const handleAddMilestone = () => {
    if (!newMilestoneText.trim()) return;
    setMilestones((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(2, 9), title: newMilestoneText.trim() },
    ]);
    setNewMilestoneText("");
    setShowMilestoneInput(false);
  };

  const handleStartDateChange = (val: string | undefined) => {
    setStartDate(val || "");
    if (val && targetDate && new Date(val) > new Date(targetDate)) {
      setTargetDate(val);
      toast.info("Target date disesuaikan agar sama atau setelah Start date");
    }
  };

  const handleTargetDateChange = (val: string | undefined) => {
    setTargetDate(val || "");
    if (val && startDate && new Date(val) < new Date(startDate)) {
      setStartDate(val);
      toast.info("Start date disesuaikan agar sama atau sebelum Target date");
    }
  };

  const handleUploadImage = async (file: File): Promise<{ url: string; filename?: string }> => {
    try {
      const { uploadTaskAttachment } = await import("@/lib/storage-client");
      const res = await uploadTaskAttachment(file, session?.accessToken ?? undefined);
      if (res && res.url) {
        toast.success(`Gambar ${file.name} berhasil diunggah ke MinIO`);
        return { url: res.url, filename: file.name };
      }
      throw new Error("Invalid storage upload response");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Storage error";
      toast.error("Gagal mengunggah gambar: " + msg);
      throw err;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama project wajib diisi");
      return;
    }
    if (!session?.accessToken) {
      toast.error("Sesi Anda kedaluwarsa. Silakan login kembali.");
      return;
    }

    setIsSubmitting(true);
    try {
      const baseUrl = getBackendBaseUrl();
      let fullDescription = "";
      if (summary.trim()) fullDescription += `> **Summary**: ${summary.trim()}\n\n`;
      if (description.trim()) fullDescription += `${description.trim()}\n\n`;
      if (milestones.length > 0) {
        fullDescription += `### 🎯 Milestones\n`;
        milestones.forEach((m, idx) => {
          fullDescription += `- [ ] **M${idx + 1}**: ${m.title}\n`;
        });
      }

      const payload: Record<string, unknown> = {
        type: "PROJECT",
        title: name.trim(),
        description: fullDescription.trim() || undefined,
        priority: priority === "NORMAL" ? "NORMAL" : priority,
        status: status === "PLANNED" ? "TODO" : status,
        scope: defaultValues?.scope || "PLATFORM_INTERNAL",
        assigneeId: leadName || undefined,
        dueDate: targetDate ? new Date(targetDate).toISOString() : undefined,
      };

      const res = await httpClient(`${baseUrl}/tasks`, {
        method: "POST",
        token: session.accessToken as string,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Gagal membuat master project");
      }

      const created = await res.json();
      toast.success(
        `Project "${created.title}" berhasil dibuat! Ref: ${created.obsidianRef || created.id}`
      );
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem saat membuat project";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    session,
    teamUsers,
    isSubmitting,
    selectedIconId,
    setSelectedIconId,
    activeIconObj,
    name,
    setName,
    summary,
    setSummary,
    description,
    setDescription,
    status,
    setStatus,
    priority,
    setPriority,
    leadName,
    setLeadName,
    selectedLabels,
    setSelectedLabels,
    startDate,
    handleStartDateChange,
    targetDate,
    handleTargetDateChange,
    milestones,
    setMilestones,
    newMilestoneText,
    setNewMilestoneText,
    showMilestoneInput,
    setShowMilestoneInput,
    handleAddMilestone,
    handleUploadImage,
    handleSubmit,
  };
}
