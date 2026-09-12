import React from "react";
import { flexRender, type Table } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import type { AiDocumentItem } from "../types";
import { AiDocumentContextMenu } from "../ai-document-context-menu";
import { KnowledgeTableEmptyState } from "./KnowledgeTableEmptyState";

interface KnowledgeTableBodyProps {
  table: Table<AiDocumentItem>;
  documents: AiDocumentItem[];
  docsLoading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  searchQuery: string;
  isSyncing: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  onEdit?: (doc: AiDocumentItem) => void;
  onApprove?: (id: string, title: string) => void;
  onReject?: (id: string, title: string) => void;
  onDelete: (id: string, title: string) => void;
  onInspectVector?: (doc: AiDocumentItem) => void;
  onTestSimulator?: (title: string) => void;
  onGoToUpload: () => void;
  onSyncServerDocs: () => void;
}

export function KnowledgeTableBody({
  table,
  documents,
  docsLoading,
  loadingMore,
  hasMore,
  searchQuery,
  isSyncing,
  sentinelRef,
  onEdit,
  onApprove,
  onReject,
  onDelete,
  onInspectVector,
  onTestSimulator,
  onGoToUpload,
  onSyncServerDocs,
}: KnowledgeTableBodyProps) {
  if (docsLoading && documents.length === 0) {
    return (
      <div className="divide-y divide-border/40">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="grid grid-cols-[minmax(320px,1.5fr)_200px_165px_105px_130px_140px_140px_90px] items-stretch border-b border-border/40 divide-x divide-border/30 animate-pulse bg-background/30"
          >
            <div className="min-w-0 px-4 py-3 flex items-center gap-2">
              <div className="h-4 w-4 bg-muted/60 rounded-md" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 bg-muted/70 rounded w-3/4" />
                <div className="h-2.5 bg-muted/50 rounded w-1/2" />
              </div>
            </div>
            <div className="px-4 py-3 flex items-center">
              <div className="h-4 bg-muted/60 rounded w-24" />
            </div>
            <div className="px-4 py-3 flex items-center">
              <div className="h-4 bg-muted/60 rounded w-20" />
            </div>
            <div className="px-4 py-3 flex items-center justify-end">
              <div className="h-4 bg-muted/60 rounded w-12" />
            </div>
            <div className="px-4 py-3 flex items-center justify-end">
              <div className="h-4 bg-muted/60 rounded w-16" />
            </div>
            <div className="px-4 py-3 flex items-center">
              <div className="h-4 bg-muted/60 rounded w-16" />
            </div>
            <div className="px-4 py-3 flex items-center">
              <div className="h-4 bg-muted/60 rounded w-24" />
            </div>
            <div className="px-4 py-3 flex items-center justify-end">
              <div className="h-4 bg-muted/60 rounded w-12" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (table.getRowModel().rows.length === 0) {
    return (
      <KnowledgeTableEmptyState
        searchQuery={searchQuery}
        isSyncing={isSyncing}
        onGoToUpload={onGoToUpload}
        onSyncServerDocs={onSyncServerDocs}
      />
    );
  }

  return (
    <div className="divide-y divide-border/40">
      {table.getRowModel().rows.map((row) => (
        <AiDocumentContextMenu
          key={row.id}
          document={row.original}
          onEdit={onEdit}
          onApprove={onApprove}
          onReject={onReject}
          onDelete={onDelete}
          onInspectVector={onInspectVector}
          onTestSimulator={onTestSimulator}
        >
          <div className="grid grid-cols-[minmax(320px,1.5fr)_200px_165px_105px_130px_140px_140px_90px] items-stretch border-b border-border/40 divide-x divide-border/30 hover:bg-muted/30 transition-colors group cursor-context-menu">
            {row.getVisibleCells().map((cell) => {
              const isRightAligned = ["file_size_bytes", "chunk_count", "actions"].includes(
                cell.column.id
              );
              return (
                <div
                  key={cell.id}
                  className={`px-4 py-2.5 flex items-center ${
                    isRightAligned ? "justify-end text-right" : "justify-start text-left"
                  }`}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              );
            })}
          </div>
        </AiDocumentContextMenu>
      ))}

      <div ref={sentinelRef} className="py-3 flex items-center justify-center">
        {loadingMore && (
          <div className="flex items-center gap-2 text-xs text-foreground/75 dark:text-muted-foreground py-2 font-mono">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>Memuat dokumen berikutnya...</span>
          </div>
        )}
        {!hasMore && documents.length > 0 && !docsLoading && (
          <div className="text-[10px] text-foreground/75 dark:text-muted-foreground font-mono py-1">
            — Menampilkan seluruh {documents.length} dokumen terindeks —
          </div>
        )}
      </div>
    </div>
  );
}
