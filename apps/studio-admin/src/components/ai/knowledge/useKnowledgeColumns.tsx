import React, { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Copy, Check, FileEdit, CheckCircle2, Trash2, BrainCircuit } from "lucide-react";
import { Button } from "@k2net/ui";
import {
  type AiDocumentItem,
  CATEGORIES,
  KNOWLEDGE_SCOPES,
  STATUS_ITEMS,
  type KnowledgeScope,
  type KnowledgeStatus,
  formatBytes,
} from "../types";

const columnHelper = createColumnHelper<AiDocumentItem>();

interface UseKnowledgeColumnsProps {
  copiedId: string | null;
  handleCopy: (text: string, id: string) => void;
  onEdit?: (doc: AiDocumentItem) => void;
  onApprove?: (id: string, title: string) => void;
  onDelete: (id: string, title: string) => void;
}

export function useKnowledgeColumns({
  copiedId,
  handleCopy,
  onEdit,
  onApprove,
  onDelete,
}: UseKnowledgeColumnsProps) {
  return useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Judul Pengetahuan",
        cell: (info) => {
          const doc = info.row.original;
          return (
            <div className="min-w-0 flex items-center gap-2.5 py-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(doc.file_name || doc.title, doc.id);
                }}
                className="p-1 rounded-md hover:bg-muted/80 text-foreground/75 dark:text-muted-foreground hover:text-foreground shrink-0 transition-colors cursor-pointer"
                title="Salin nama file / judul"
              >
                {copiedId === doc.id ? (
                  <Check className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div
                  onClick={() => onEdit?.(doc)}
                  className="text-xs font-semibold text-foreground truncate hover:text-primary transition-colors cursor-pointer"
                  title="Klik untuk melihat / edit revisi"
                >
                  {doc.title}
                </div>
                {doc.file_name && (
                  <div className="text-[10px] text-foreground/75 dark:text-muted-foreground font-mono truncate max-w-[260px]">
                    {doc.file_name}
                  </div>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("category", {
        header: "Kategori",
        cell: (info) => {
          const catMeta = CATEGORIES.find((c) => c.id === info.getValue());
          return (
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border whitespace-nowrap ${
                catMeta?.color || "text-foreground/80 border-border bg-muted/60"
              }`}
            >
              {catMeta?.label || info.getValue()}
            </span>
          );
        },
      }),
      columnHelper.accessor("scope", {
        header: "Visibilitas / Scope",
        cell: (info) => {
          const scopeVal = (info.getValue() || "GLOBAL") as KnowledgeScope;
          const meta = KNOWLEDGE_SCOPES.find((s) => s.id === scopeVal) || KNOWLEDGE_SCOPES[2];
          const Icon = meta.icon;
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border whitespace-nowrap ${meta.accentBg} ${meta.accentBorder}`}
            >
              <Icon className="h-3 w-3 shrink-0" />
              <span>{meta.shortLabel}</span>
            </span>
          );
        },
      }),
      columnHelper.accessor("file_size_bytes", {
        header: "Ukuran Berkas",
        cell: (info) => (
          <span className="block text-xs font-mono text-foreground/75 dark:text-muted-foreground text-right">
            {formatBytes(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("chunk_count", {
        header: "Vector Chunks",
        cell: (info) => {
          const count = info.getValue();
          return (
            <div className="flex flex-col gap-1 items-end w-full">
              <div className="flex items-center justify-end gap-1.5 text-xs font-mono font-semibold text-purple-500 dark:text-purple-400">
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>{count} Chunks</span>
              </div>
              <div className="h-1.5 w-20 bg-muted/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(count * 15, 100)}%` }}
                />
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: "Status Indeks",
        cell: (info) => {
          const status = (info.getValue() || "INDEXED") as KnowledgeStatus;
          const statusMeta = STATUS_ITEMS[status] || STATUS_ITEMS.INDEXED;
          const Icon = statusMeta.icon;
          return (
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${statusMeta.badge}`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${status === "PROCESSING" ? "animate-spin" : ""}`}
                />
                <span>{statusMeta.label}</span>
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("updated_at", {
        header: "Tanggal Diperbarui",
        cell: (info) => {
          const raw = info.getValue() || info.row.original.created_at;
          return (
            <span className="block text-[11px] text-foreground/75 dark:text-muted-foreground font-mono">
              {new Date(raw).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Aksi",
        cell: (info) => {
          const doc = info.row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(doc)}
                  className="h-7 w-7 p-0 text-foreground/75 dark:text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md cursor-pointer"
                  title="Edit & Revisi Pengetahuan"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                </Button>
              )}

              {doc.status !== "INDEXED" && onApprove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onApprove(doc.id, doc.title)}
                  className="h-7 w-7 p-0 text-primary hover:bg-primary/10 rounded-md cursor-pointer"
                  title="Setujui & Publikasikan (Approve)"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(doc.id, doc.title)}
                className="h-7 w-7 p-0 text-foreground/75 dark:text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-md cursor-pointer"
                title="Hapus dari memori AI"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          );
        },
      }),
    ],
    [copiedId, handleCopy, onDelete, onEdit, onApprove]
  );
}
