import { useState, useEffect, type FormEvent } from "react";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import { useSession } from "@/lib/auth-compat";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useTeamUsers } from "@/hooks/useTeamUsers";
import { type TaskScope } from "@/hooks/useTasksQuery";
import {
  type WorkspaceSubtype,
  PROJECT_ICONS,
  TEMPLATE_IDEA_RFC,
  TEMPLATE_PLAN_SPEC,
  TEMPLATE_PROJECT_CHARTER,
  TEMPLATE_DOC_SOP,
} from "./new-project-constants";

interface UseNewProjectFormOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultValues?: {
    subtype?: WorkspaceSubtype;
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

function getDefaultTemplate(subtype: WorkspaceSubtype): string {
  switch (subtype) {
    case "IDEA":
      return TEMPLATE_IDEA_RFC;
    case "PROJECT":
      return TEMPLATE_PROJECT_CHARTER;
    case "DOC":
      return TEMPLATE_DOC_SOP;
    case "PLAN":
    default:
      return TEMPLATE_PLAN_SPEC;
  }
}

function isDefaultTemplate(text: string): boolean {
  return (
    !text ||
    text === TEMPLATE_IDEA_RFC ||
    text === TEMPLATE_PLAN_SPEC ||
    text === TEMPLATE_PROJECT_CHARTER ||
    text === TEMPLATE_DOC_SOP
  );
}

function buildFullDescription(
  summary: string,
  description: string,
  milestones: { title: string }[],
  subtype: WorkspaceSubtype
): string {
  let full = "";
  if (summary.trim()) full += `> **Summary**: ${summary.trim()}\n\n`;
  if (description.trim()) full += `${description.trim()}\n\n`;
  if (milestones.length > 0 && (subtype === "PROJECT" || subtype === "PLAN")) {
    full += `### 🎯 Milestones\n`;
    milestones.forEach((m, idx) => {
      full += `- [ ] **M${idx + 1}**: ${m.title}\n`;
    });
  }
  return full.trim();
}

interface CreateWorkspacePlanParams {
  baseUrl: string;
  token: string;
  subtype: WorkspaceSubtype;
  name: string;
  summary: string;
  description: string;
  priority: "URGENT" | "HIGH" | "NORMAL" | "LOW";
  status: string;
  scope?: TaskScope;
  leadName?: string;
  targetDate?: string;
  milestones: { title: string }[];
  fallbackErrorMessage?: string;
}

async function submitCreateWorkspacePlan(params: CreateWorkspacePlanParams) {
  const fullDescription = buildFullDescription(
    params.summary,
    params.description,
    params.milestones,
    params.subtype
  );

  const isMilestoneOrDateAllowed = params.subtype === "PROJECT" || params.subtype === "PLAN";
  const isAssigneeAllowed = params.subtype !== "IDEA" && params.subtype !== "DOC";

  const payload: Record<string, unknown> = {
    type: "PROJECT",
    referenceType: params.subtype,
    title: params.name.trim(),
    description: fullDescription || undefined,
    priority: params.priority === "NORMAL" ? "NORMAL" : params.priority,
    status: params.status === "PLANNED" ? "TODO" : params.status,
    scope: params.scope || "PLATFORM_INTERNAL",
    assigneeId: isAssigneeAllowed ? (params.leadName || undefined) : undefined,
    dueDate: isMilestoneOrDateAllowed && params.targetDate ? new Date(params.targetDate).toISOString() : undefined,
  };

  let res = await httpClient(`${params.baseUrl}/api/v1/system/workspace/plans`, {
    method: "POST",
    token: params.token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok && res.status === 404) {
    res = await httpClient(`${params.baseUrl}/tasks`, {
      method: "POST",
      token: params.token,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? (params.fallbackErrorMessage || "Failed to create workspace document"));
  }

  return res.json();
}

export function useNewProjectForm({
  open,
  onOpenChange,
  onSuccess,
  defaultValues,
}: UseNewProjectFormOptions) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { users: teamUsers } = useTeamUsers();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subtype state (IDEA, PLAN, PROJECT, DOC)
  const [subtype, setSubtype] = useState<WorkspaceSubtype>(defaultValues?.subtype || "PLAN");

  // Form State
  const [selectedIconId, setSelectedIconId] = useState("box");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState<"URGENT" | "HIGH" | "NORMAL" | "LOW">("NORMAL");
  const [leadName, setLeadName] = useState(session?.user?.name || session?.user?.email || "");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [milestones, setMilestones] = useState<{ id: string; title: string }[]>([]);
  const [newMilestoneText, setNewMilestoneText] = useState("");
  const [showMilestoneInput, setShowMilestoneInput] = useState(false);

  // Reset or fill defaults on open
  useEffect(() => {
    if (open) {
      const initialSubtype = defaultValues?.subtype || "PLAN";
      setSubtype(initialSubtype);
      setName(defaultValues?.title || "");
      setSummary(defaultValues?.summary || "");
      setDescription(defaultValues?.description || getDefaultTemplate(initialSubtype));
      setStatus(defaultValues?.status || "TODO");
      setPriority(defaultValues?.priority || "NORMAL");
      setTargetDate(defaultValues?.targetDate || "");
      if (!leadName && (session?.user?.name || session?.user?.email)) {
        setLeadName(session.user.name || session.user.email || "");
      }
      setMilestones([]);
      setShowMilestoneInput(false);
    }
  }, [open, defaultValues, leadName, session?.user?.name, session?.user?.email]);

  // Handle subtype change
  const handleSubtypeChange = (newSubtype: WorkspaceSubtype) => {
    setSubtype(newSubtype);
    if (isDefaultTemplate(description)) {
      setDescription(getDefaultTemplate(newSubtype));
    }
  };

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
      toast.info(t("workspace.toast_target_date_adjusted"));
    }
  };

  const handleTargetDateChange = (val: string | undefined) => {
    setTargetDate(val || "");
    if (val && startDate && new Date(val) < new Date(startDate)) {
      setStartDate(val);
      toast.info(t("workspace.toast_start_date_adjusted"));
    }
  };

  const handleUploadImage = async (file: File): Promise<{ url: string; filename?: string }> => {
    try {
      const { uploadTaskAttachment } = await import("@/lib/storage-client");
      const res = await uploadTaskAttachment(file, session?.accessToken ?? undefined);
      if (res && res.url) {
        toast.success(t("workspace.toast_image_upload_success", { name: file.name }));
        return { url: res.url, filename: file.name };
      }
      throw new Error("Invalid storage upload response");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Storage error";
      toast.error(t("workspace.toast_image_upload_failed", { error: msg }));
      throw err;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("workspace.toast_title_required"));
      return;
    }
    if (!session?.accessToken) {
      toast.error(t("workspace.toast_session_expired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await submitCreateWorkspacePlan({
        baseUrl: getBackendBaseUrl(),
        token: session.accessToken as string,
        subtype,
        name,
        summary,
        description,
        priority,
        status,
        scope: defaultValues?.scope,
        leadName,
        targetDate,
        milestones,
        fallbackErrorMessage: t("workspace.error_create_failed"),
      });

      toast.success(
        t("workspace.toast_create_success", {
          title: created.title,
          ref: created.obsidianRef || created.id,
        })
      );
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(msg || t("workspace.toast_create_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    session,
    teamUsers,
    isSubmitting,
    subtype,
    handleSubtypeChange,
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
