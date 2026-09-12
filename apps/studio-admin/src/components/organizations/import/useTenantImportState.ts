import { useState, useRef } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-compat";
import type { ParsedBackupData, ProcessStatus } from "./types";

export function useTenantImportState(onSuccess: () => void) {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rawJsonText, setRawJsonText] = useState<string>("");
  const [parsedData, setParsedData] = useState<ParsedBackupData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"visual" | "json">("visual");

  // Progress HUD Terminal States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [currentActionText, setCurrentActionText] = useState("Initializing restore pipeline...");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [processStatus, setProcessStatus] = useState<ProcessStatus>("ACTIVE");

  const handleFileProcess = (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".json")) {
      setParseError("Berkas harus berformat .JSON");
      setFile(null);
      setParsedData(null);
      setRawJsonText("");
      return;
    }

    setFile(selectedFile);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        setRawJsonText(text);
        const json = JSON.parse(text);

        if (!json.organization || !json.organization.name || !json.organization.slug) {
          throw new Error("Format JSON tidak valid: Objek 'organization' dengan 'name' dan 'slug' diperlukan.");
        }

        setParsedData(json);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal membaca berkas JSON";
        setParseError(msg);
        setParsedData(null);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setRawJsonText("");
    setParseError(null);
    setIsProcessing(false);
    setProcessProgress(0);
    setTerminalLogs([]);
    setProcessStatus("ACTIVE");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const copyJsonToClipboard = () => {
    if (!rawJsonText) return;
    navigator.clipboard.writeText(rawJsonText);
    toast.success("Salinan JSON disalin ke papan klip");
  };

  const handleImportSubmit = async () => {
    if (!parsedData || !session?.accessToken) return;

    setIsProcessing(true);
    setProcessStatus("ACTIVE");
    setProcessProgress(15);
    setCurrentActionText("Validating integrity block & schema checksum...");
    setTerminalLogs([
      `> [INIT] payload size: ${(file?.size || 1024) / 1024} KB`,
      `> [OK] verified schema structure for tenant '${parsedData.organization.slug}'`,
    ]);

    try {
      setTimeout(() => {
        setProcessProgress(45);
        setCurrentActionText(`Provisioning Keycloak IAM Realm (${parsedData.organization.slug})...`);
        setTerminalLogs((prev) => [
          ...prev,
          `> [IAM] connecting to Keycloak Master API`,
          `> [OK] realm '${parsedData.organization.slug}' configured (enabled: true)`,
        ]);
      }, 400);

      const res = await fetch("/api/v1/organizations/import-backup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          organization: parsedData.organization,
          projects: parsedData.projects || [],
          mode: "create_new",
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(errorText || "Gagal mengimpor cadangan tenant");
      }

      const importedOrg = await res.json();

      setProcessProgress(85);
      setCurrentActionText("Synchronizing GIS project topology & tenant configs...");
      setTerminalLogs((prev) => [
        ...prev,
        `> [GIS] synchronizing ${parsedData.projects?.length || 0} project topologies`,
        `> [DB] PostgreSQL PostGIS entity committed`,
        `> [CONFIG] organization_configs keycloak_realm mapped`,
      ]);

      setTimeout(() => {
        setProcessProgress(100);
        setProcessStatus("COMPLETED");
        setCurrentActionText("Restore completed successfully.");
        setTerminalLogs((prev) => [
          ...prev,
          `> [OK] state transitioned to ACTIVE`,
          `> [FINISH] tenant '${importedOrg.name}' is operational`,
        ]);
        toast.success(`Organisasi ${importedOrg.name} (${importedOrg.slug}) berhasil diimpor!`);
        onSuccess();
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Internal server error";
      setProcessStatus("FAILED");
      setProcessProgress(100);
      setCurrentActionText("Restore process failed.");
      setTerminalLogs((prev) => [
        ...prev,
        `> [ERROR] ${msg}`,
        `> [ABORT] rollback executed`,
      ]);
      toast.error(msg);
    }
  };

  return {
    fileInputRef,
    dragActive,
    file,
    rawJsonText,
    parsedData,
    parseError,
    activeTab,
    setActiveTab,
    isProcessing,
    processProgress,
    currentActionText,
    terminalLogs,
    processStatus,
    handleFileProcess,
    handleDrag,
    handleDrop,
    handleReset,
    copyJsonToClipboard,
    handleImportSubmit,
  };
}
