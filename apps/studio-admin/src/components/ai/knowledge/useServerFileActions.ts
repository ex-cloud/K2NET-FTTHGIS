import { useState } from "react";
import { toast } from "sonner";
import {
  type ServerFilePreview,
  previewAiServerFile,
  rejectAiServerFile,
  indexSingleAiServerFile,
} from "@/lib/actions/gateways";

export function useServerFileActions(onRefresh: () => void) {
  const [previewData, setPreviewData] = useState<ServerFilePreview | null>(null);
  const [previewLoadingPath, setPreviewLoadingPath] = useState<string | null>(null);
  const [actionLoadingPath, setActionLoadingPath] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [fileToReject, setFileToReject] = useState<{
    path: string;
    title: string;
    category?: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const handlePreviewServerFile = async (filePath: string) => {
    setPreviewLoadingPath(filePath);
    try {
      const preview = await previewAiServerFile(filePath);
      setPreviewData(preview);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat pratinjau berkas";
      toast.error(msg);
    } finally {
      setPreviewLoadingPath(null);
    }
  };

  const handleRejectClick = (file: { path: string; title: string; category?: string }) => {
    setFileToReject(file);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!fileToReject) return;
    setIsRejecting(true);
    setActionLoadingPath(fileToReject.path);
    try {
      await rejectAiServerFile({
        path: fileToReject.path,
        title: fileToReject.title,
        category: fileToReject.category,
        reason: rejectReason.trim() || undefined,
      });
      toast.success(`Berkas "${fileToReject.title}" ditolak dan tidak akan diindeks.`);
      setRejectDialogOpen(false);
      setFileToReject(null);
      if (previewData && previewData.path === fileToReject.path) {
        setPreviewData(null);
      }
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menolak berkas";
      toast.error(msg);
    } finally {
      setIsRejecting(false);
      setActionLoadingPath(null);
    }
  };

  const handleIndexSingle = async (file: { path: string; title?: string; category?: string }) => {
    setActionLoadingPath(file.path);
    try {
      const res = await indexSingleAiServerFile({
        path: file.path,
        title: file.title,
        category: file.category,
        scope: "GLOBAL",
      });
      toast.success(`Berkas "${res.title || file.title}" berhasil diindeks ke pgvector!`);
      if (previewData && previewData.path === file.path) {
        setPreviewData(null);
      }
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengindeks berkas";
      toast.error(msg);
    } finally {
      setActionLoadingPath(null);
    }
  };

  return {
    previewData,
    setPreviewData,
    previewLoadingPath,
    actionLoadingPath,
    rejectDialogOpen,
    setRejectDialogOpen,
    fileToReject,
    setFileToReject,
    rejectReason,
    setRejectReason,
    isRejecting,
    handlePreviewServerFile,
    handleRejectClick,
    handleConfirmReject,
    handleIndexSingle,
  };
}
