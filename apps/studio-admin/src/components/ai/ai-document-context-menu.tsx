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
import { type AiDocumentItem } from "@/lib/actions/gateways";
import { usePermissions } from "@/hooks/use-permissions";
import { useTranslation } from "@k2net/i18n";

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
  const { t } = useTranslation();
  const { canAccess } = usePermissions();
  const canManage = canAccess("system.ai.manage");

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} -> ${t("common.success")}`);
  };

  const handleAskAi = () => {
    // Trigger custom event to open AI Copilot drawer with related document query
    window.dispatchEvent(
      new CustomEvent("k2net-ai-prompt-input", {
        detail: {
          prompt: `Explain technical guide and summary for document: "${document.title}" (${document.category})`,
        },
      })
    );
    window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-popover/95 backdrop-blur-xl border-border/80 shadow-lg text-xs z-[9999] py-1.5 rounded-xl">
        {/* 1. Edit / Revisi Dokumen */}
        <ContextMenuItem
          onClick={() => onEdit?.(document)}
          disabled={!canManage}
          className="cursor-pointer font-semibold text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileEdit className="mr-2 h-3.5 w-3.5 text-primary" />
          <span>{t("ai.edit_doc_title")}</span>
          <ContextMenuShortcut>Alt+E</ContextMenuShortcut>
        </ContextMenuItem>

        {/* 2. Approve (jika belum INDEXED) */}
        {document.status !== "INDEXED" && onApprove && (
          <ContextMenuItem
            onClick={() => onApprove(document.id, document.title)}
            disabled={!canManage}
            className="cursor-pointer font-medium text-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-primary" />
            <span>{t("ai.save_and_publish")}</span>
            <ContextMenuShortcut>Ctrl+↵</ContextMenuShortcut>
          </ContextMenuItem>
        )}

        {/* 3. Reject (jika berstatus PENDING_REVIEW) */}
        {document.status === "PENDING_REVIEW" && onReject && (
          <ContextMenuItem
            onClick={() => onReject(document.id, document.title)}
            disabled={!canManage}
            className="cursor-pointer font-medium text-amber-600 dark:text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="mr-2 h-3.5 w-3.5 text-amber-500" />
            <span>Reject Document</span>
          </ContextMenuItem>
        )}

        <ContextMenuSeparator className="my-1 bg-border/60" />

        {/* 4. Ask AI Copilot */}
        <ContextMenuItem onClick={handleAskAi} className="cursor-pointer font-semibold text-primary">
          <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
          <span>{t("common.ask_ai_copilot")}</span>
          <ContextMenuShortcut>Ctrl+J</ContextMenuShortcut>
        </ContextMenuItem>

        {/* 5. Vector Explorer */}
        <ContextMenuItem
          onClick={() => onInspectVector?.(document)}
          className="cursor-pointer"
        >
          <BrainCircuit className="mr-2 h-3.5 w-3.5 text-purple-400" />
          <span>{t("ai.live_vector_probe")}</span>
          <ContextMenuShortcut>Alt+I</ContextMenuShortcut>
        </ContextMenuItem>

        {/* 6. Simulator Test */}
        <ContextMenuItem
          onClick={() => onTestSimulator?.(document.title)}
          className="cursor-pointer"
        >
          <Search className="mr-2 h-3.5 w-3.5 text-cyan-400" />
          <span>{t("ai.test_in_simulator")}</span>
          <ContextMenuShortcut>Alt+S</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator className="my-1 bg-border/60" />

        {/* 7. Copy Title */}
        <ContextMenuItem
          onClick={() => handleCopy(document.title, t("ai.doc_title"))}
          className="cursor-pointer"
        >
          <Copy className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>{t("ai.copy_title")}</span>
          <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
        </ContextMenuItem>

        {/* 8. Copy File Name */}
        {document.file_name && (
          <ContextMenuItem
            onClick={() => handleCopy(document.file_name || "", t("ai.doc_file_name"))}
            className="cursor-pointer"
          >
            <FileCode className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>{t("ai.copy_file_name")}</span>
          </ContextMenuItem>
        )}

        {/* 9. Copy ID */}
        <ContextMenuItem
          onClick={() => handleCopy(document.id, "ID")}
          className="cursor-pointer"
        >
          <BookOpen className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>Copy Vector UUID</span>
        </ContextMenuItem>

        <ContextMenuSeparator className="my-1 bg-border/60" />

        {/* 10. Delete */}
        <ContextMenuItem
          onClick={() => onDelete?.(document.id, document.title)}
          disabled={!canManage}
          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="mr-2 h-3.5 w-3.5 text-destructive" />
          <span>{t("ai.delete_from_kb")}</span>
          <ContextMenuShortcut className="text-destructive font-mono">Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
