

import React from "react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@k2net/ui";
import {
  Sparkles,
  BrainCircuit,
  Search,
  Copy,
  FileCode,
  Trash2,
  BookOpen,
  FileEdit,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AiDocumentItem } from "@/lib/actions/gateways";

interface AiDocumentContextMenuProps {
  document: AiDocumentItem;
  onEdit?: (doc: AiDocumentItem) => void;
  onApprove?: (id: string, title: string) => void;
  onReject?: (id: string, title: string) => void;
  onDelete?: (id: string, title: string) => void;
  onInspectVector?: (doc: AiDocumentItem) => void;
  onTestSimulator?: (title: string) => void;
  children: React.ReactNode;
}

export function AiDocumentContextMenu({
  document,
  onEdit,
  onApprove,
  onReject,
  onDelete,
  onInspectVector,
  onTestSimulator,
  children,
}: AiDocumentContextMenuProps) {
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin ke clipboard!`);
  };

  const handleAskAi = () => {
    // Trigger custom event untuk membuka drawer AI Copilot dengan pertanyaan dokumen terkait
    window.dispatchEvent(
      new CustomEvent("k2net-ai-prompt-input", {
        detail: {
          prompt: `Jelaskan ringkasan dan panduan teknis dari dokumen: "${document.title}" (${document.category})`,
        },
      })
    );
    window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-popover/95 backdrop-blur-xl border-border/80 shadow-2xl text-xs z-[9999] py-1.5 rounded-xl">
        {/* 1. Edit / Revisi Dokumen */}
        <ContextMenuItem
          onClick={() => onEdit?.(document)}
          className="cursor-pointer font-semibold text-foreground"
        >
          <FileEdit className="mr-2 h-3.5 w-3.5 text-primary" />
          <span>Edit / Revisi Dokumen</span>
          <ContextMenuShortcut>Alt+E</ContextMenuShortcut>
        </ContextMenuItem>

        {/* 2. Approve (jika belum INDEXED) */}
        {document.status !== "INDEXED" && onApprove && (
          <ContextMenuItem
            onClick={() => onApprove(document.id, document.title)}
            className="cursor-pointer font-medium text-primary"
          >
            <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-primary" />
            <span>Setujui & Indeks (Approve)</span>
            <ContextMenuShortcut>Ctrl+↵</ContextMenuShortcut>
          </ContextMenuItem>
        )}

        {/* 3. Reject (jika berstatus PENDING_REVIEW) */}
        {document.status === "PENDING_REVIEW" && onReject && (
          <ContextMenuItem
            onClick={() => onReject(document.id, document.title)}
            className="cursor-pointer font-medium text-amber-600 dark:text-amber-400"
          >
            <XCircle className="mr-2 h-3.5 w-3.5 text-amber-500" />
            <span>Tolak Dokumen (Reject)</span>
          </ContextMenuItem>
        )}

        <ContextMenuSeparator className="my-1 bg-border/60" />

        {/* 4. Ask AI Copilot */}
        <ContextMenuItem onClick={handleAskAi} className="cursor-pointer font-semibold text-primary">
          <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
          <span>Tanya AI tentang Dokumen</span>
          <ContextMenuShortcut>Ctrl+J</ContextMenuShortcut>
        </ContextMenuItem>

        {/* 5. Vector Explorer */}
        <ContextMenuItem
          onClick={() => onInspectVector?.(document)}
          className="cursor-pointer"
        >
          <BrainCircuit className="mr-2 h-3.5 w-3.5 text-purple-400" />
          <span>Inspeksi Vektor (Explorer)</span>
          <ContextMenuShortcut>Alt+I</ContextMenuShortcut>
        </ContextMenuItem>

        {/* 6. Simulator Test */}
        <ContextMenuItem
          onClick={() => onTestSimulator?.(document.title)}
          className="cursor-pointer"
        >
          <Search className="mr-2 h-3.5 w-3.5 text-cyan-400" />
          <span>Uji di Semantic Simulator</span>
          <ContextMenuShortcut>Alt+S</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator className="my-1 bg-border/60" />

        {/* 7. Copy Title */}
        <ContextMenuItem
          onClick={() => handleCopy(document.title, "Judul dokumen")}
          className="cursor-pointer"
        >
          <Copy className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>Salin Judul Dokumen</span>
          <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
        </ContextMenuItem>

        {/* 8. Copy File Name */}
        {document.file_name && (
          <ContextMenuItem
            onClick={() => handleCopy(document.file_name || "", "Nama file")}
            className="cursor-pointer"
          >
            <FileCode className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Salin Nama Berkas / Path</span>
          </ContextMenuItem>
        )}

        {/* 9. Copy ID */}
        <ContextMenuItem
          onClick={() => handleCopy(document.id, "ID Dokumen")}
          className="cursor-pointer"
        >
          <BookOpen className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>Salin ID Vektor (UUID)</span>
        </ContextMenuItem>

        <ContextMenuSeparator className="my-1 bg-border/60" />

        {/* 10. Delete */}
        <ContextMenuItem
          onClick={() => onDelete?.(document.id, document.title)}
          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer font-medium"
        >
          <Trash2 className="mr-2 h-3.5 w-3.5 text-destructive" />
          <span>Hapus dari Knowledge Base</span>
          <ContextMenuShortcut className="text-destructive font-mono">Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
