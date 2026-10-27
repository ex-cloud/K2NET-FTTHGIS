import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-compat";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { type NewTaskDefaultValues } from "./NewTaskDialog";
import { type IssueSubtype } from "./configs";

interface UseNewTaskFormParams {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultValues?: NewTaskDefaultValues;
}

interface BuildTaskPayloadParams {
  type: "TICKET" | "PROJECT";
  title: string;
  description: string;
  priority: "URGENT" | "HIGH" | "NORMAL" | "LOW";
  status: string;
  assigneeId: string;
  dueDate: string;
  selectedProject: string | null;
  subtype: IssueSubtype;
  defaultValues?: NewTaskDefaultValues;
}

function buildTaskPayload({
  type,
  title,
  description,
  priority,
  status,
  assigneeId,
  dueDate,
  selectedProject,
  subtype,
  defaultValues,
}: BuildTaskPayloadParams): Record<string, unknown> {
  const isSubtask = Boolean(defaultValues?.parentTaskId);
  const taskType = isSubtask ? "TICKET" : (defaultValues?.type ?? type);
  const resolvedRefType = subtype || defaultValues?.referenceType || (isSubtask ? "TASK" : undefined);

  const payload: Record<string, unknown> = {
    type: taskType,
    title: title.trim(),
    description: description.trim() || undefined,
    priority,
    status,
    assigneeId: assigneeId || undefined,
    scope: defaultValues?.scope ?? "PLATFORM_INTERNAL",
    dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    parentTaskId: defaultValues?.parentTaskId || undefined,
    referenceType: resolvedRefType,
    referenceId: defaultValues?.parentTaskId || undefined,
  };

  if (selectedProject) {
    payload.obsidianRef = selectedProject;
  }
  return payload;
}


export function useNewTaskForm({
  open,
  onOpenChange,
  onSuccess,
  defaultValues,
}: UseNewTaskFormParams) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createMore, setCreateMore] = useState(false);

  // Form states
  const [type, setType] = useState<"TICKET" | "PROJECT">("TICKET");
  const [subtype, setSubtype] = useState<IssueSubtype>("TASK");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"URGENT" | "HIGH" | "NORMAL" | "LOW">("NORMAL");
  const [status, setStatus] = useState("TODO");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (defaultValues) {
        setTitle(defaultValues.title ?? "");
        setDescription(defaultValues.description ?? "");
        setType(defaultValues.type ?? "TICKET");
        setPriority(defaultValues.priority ?? "NORMAL");
        setStatus(defaultValues.status ?? "TODO");
        setSelectedProject(defaultValues.project ?? null);
        if (
          defaultValues.referenceType &&
          ["TASK", "BUG", "FEATURE", "IMPROVEMENT"].includes(defaultValues.referenceType.toUpperCase())
        ) {
          setSubtype(defaultValues.referenceType.toUpperCase() as IssueSubtype);
        } else {
          setSubtype("TASK");
        }
      } else {
        setTitle("");
        setDescription("");
        setType("TICKET");
        setSubtype("TASK");
        setPriority("NORMAL");
        setStatus("TODO");
        setAssigneeId("");
        setDueDate("");
        setSelectedProject(null);
        setSelectedLabels([]);
      }
    }
  }, [open, defaultValues]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsUploadingFile(true);
    toast.info("Uploading file via MinIO storage-gateway...");
    try {
      const { uploadTaskAttachment } = await import("@/lib/storage-client");
      const res = await uploadTaskAttachment(file, session?.accessToken ?? undefined);
      if (res.url) {
        const isImg = file.type.startsWith("image/");
        const markdown = isImg ? `\n\n![${file.name}](${res.url})` : `\n\n[📎 ${file.name}](${res.url})`;
        setDescription((prev) => prev + markdown);
        toast.success(`File ${file.name} successfully uploaded to MinIO`);
      }
    } catch (err: unknown) {
      toast.error("Failed to upload file: " + (err instanceof Error ? err.message : "Storage error"));
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }
    if (!session?.accessToken) {
      toast.error("Your session has expired. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const payload = buildTaskPayload({
        type,
        title,
        description,
        priority,
        status,
        assigneeId,
        dueDate,
        selectedProject,
        subtype,
        defaultValues,
      });

      const res = await httpClient(`${baseUrl}/tasks`, {
        method: "POST",
        token: session.accessToken as string,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to create task");
      }

      const created = await res.json();
      toast.success(
        selectedProject
          ? `Issue registered in ${selectedProject} — Ref: ${created.obsidianRef ?? created.id}`
          : "Issue created successfully"
      );

      if (createMore) {
        setTitle("");
        setDescription("");
        onSuccess();
      } else {
        onOpenChange(false);
        onSuccess();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "A system error occurred while creating task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    type,
    setType,
    subtype,
    setSubtype,
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    status,
    setStatus,
    assigneeId,
    setAssigneeId,
    dueDate,
    setDueDate,
    selectedProject,
    setSelectedProject,
    selectedLabels,
    setSelectedLabels,
    isUploadingFile,
    fileInputRef,
    createMore,
    setCreateMore,
    isSubmitting,
    handleFileUpload,
    handleSubmit,
  };
}

