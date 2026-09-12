import React, { useState, useRef, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
} from "@tanstack/react-table";
import {
  type AiDocumentItem,
  type ServerSyncStatus,
} from "@/lib/actions/gateways";
import { AiKnowledgeSummaryBar } from "./ai-knowledge-summary-bar";
import { AiKnowledgeToolbar } from "./ai-knowledge-toolbar";
import { AiUnindexedFilesModal } from "./ai-unindexed-files-modal";
import { AiServerFilePreviewModal } from "./ai-server-file-preview-modal";
import { AiServerFileRejectModal } from "./ai-server-file-reject-modal";
import { useKnowledgeColumns } from "./knowledge/useKnowledgeColumns";
import { useServerFileActions } from "./knowledge/useServerFileActions";
import { KnowledgeTableHeader } from "./knowledge/KnowledgeTableHeader";
import { KnowledgeTableBody } from "./knowledge/KnowledgeTableBody";

interface AiKnowledgeTableProps {
  documents: AiDocumentItem[];
  docsLoading: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  totalCount: number;
  totalChunks: number;
  totalBytes: number;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedScope?: string;
  setSelectedScope?: (scope: string) => void;
  selectedStatus?: string;
  setSelectedStatus?: (status: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onEdit?: (doc: AiDocumentItem) => void;
  onApprove?: (id: string, title: string) => void;
  onReject?: (id: string, title: string) => void;
  onDelete: (id: string, title: string) => void;
  onGoToUpload: () => void;
  onSyncServerDocs: () => void;
  onRefresh: () => void;
  onFetchMore?: () => void;
  isSyncing?: boolean;
  syncStatus?: ServerSyncStatus | null;
  syncStatusLoading?: boolean;
  onInspectVector?: (doc: AiDocumentItem) => void;
  onTestSimulator?: (title: string) => void;
}

export function AiKnowledgeTable({
  documents,
  docsLoading,
  loadingMore = false,
  hasMore = false,
  totalCount,
  totalChunks,
  totalBytes,
  selectedCategory,
  setSelectedCategory,
  selectedScope = "ALL",
  setSelectedScope,
  selectedStatus = "ALL",
  setSelectedStatus,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onEdit,
  onApprove,
  onReject,
  onDelete,
  onGoToUpload,
  onSyncServerDocs,
  onRefresh,
  onFetchMore,
  isSyncing = false,
  syncStatus,
  syncStatusLoading: _syncStatusLoading = false,
  onInspectVector,
  onTestSimulator,
}: AiKnowledgeTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isUnindexedModalOpen, setIsUnindexedModalOpen] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    previewData,
    setPreviewData,
    previewLoadingPath,
    actionLoadingPath,
    rejectDialogOpen,
    setRejectDialogOpen,
    fileToReject,
    rejectReason,
    setRejectReason,
    isRejecting,
    handlePreviewServerFile,
    handleRejectClick,
    handleConfirmReject,
    handleIndexSingle,
  } = useServerFileActions(onRefresh);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    const rootEl = scrollContainerRef.current;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore && !docsLoading && onFetchMore) {
          onFetchMore();
        }
      },
      {
        root: rootEl || null,
        rootMargin: "150px",
        threshold: 0.1,
      }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, loadingMore, docsLoading, onFetchMore]);

  const columns = useKnowledgeColumns({
    copiedId,
    handleCopy,
    onEdit,
    onApprove,
    onDelete,
  });

  const table = useReactTable({
    data: documents,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <AiKnowledgeSummaryBar
        totalCount={totalCount}
        totalChunks={totalChunks}
        totalBytes={totalBytes}
        syncStatus={syncStatus}
        isSyncing={isSyncing}
        onSyncServerDocs={onSyncServerDocs}
        onOpenUnindexedModal={() => setIsUnindexedModalOpen(true)}
      />

      <div className="border border-border bg-card/20 rounded-xl overflow-hidden flex flex-col shadow-xs w-full">
        <div className="p-3 px-4 border-b border-border bg-card/40">
          <AiKnowledgeToolbar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearchSubmit={onSearchSubmit}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedScope={selectedScope}
            setSelectedScope={setSelectedScope}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            docsLoading={docsLoading}
            isSyncing={isSyncing}
            onSyncServerDocs={onSyncServerDocs}
            onRefresh={onRefresh}
            onGoToUpload={onGoToUpload}
          />
        </div>

        <div className="relative flex-1 min-h-0 flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden z-30 pointer-events-none">
            <div
              className={`h-full w-1/4 bg-gradient-to-r from-transparent via-primary/80 to-transparent transition-opacity duration-300 will-change-transform ${
                docsLoading || loadingMore || isSyncing ? "animate-shimmer-line opacity-100" : "opacity-0"
              }`}
            />
          </div>

          <div ref={scrollContainerRef} className="max-h-[620px] overflow-auto custom-scrollbar-thin">
            <div className="min-w-[1300px] flex flex-col">
              <KnowledgeTableHeader headerGroups={table.getHeaderGroups()} />

              <KnowledgeTableBody
                table={table}
                documents={documents}
                docsLoading={docsLoading}
                loadingMore={loadingMore}
                hasMore={hasMore}
                searchQuery={searchQuery}
                isSyncing={isSyncing}
                sentinelRef={sentinelRef}
                onEdit={onEdit}
                onApprove={onApprove}
                onReject={onReject}
                onDelete={onDelete}
                onInspectVector={onInspectVector}
                onTestSimulator={onTestSimulator}
                onGoToUpload={onGoToUpload}
                onSyncServerDocs={onSyncServerDocs}
              />
            </div>
          </div>
        </div>
      </div>

      <AiUnindexedFilesModal
        open={isUnindexedModalOpen}
        onOpenChange={setIsUnindexedModalOpen}
        syncStatus={syncStatus}
        isSyncing={isSyncing}
        onSyncServerDocs={onSyncServerDocs}
        onPreview={handlePreviewServerFile}
        previewLoadingPath={previewLoadingPath}
        actionLoadingPath={actionLoadingPath}
        onReject={handleRejectClick}
        onIndexSingle={handleIndexSingle}
      />

      <AiServerFilePreviewModal
        previewData={previewData}
        onClose={() => setPreviewData(null)}
        actionLoadingPath={actionLoadingPath}
        onReject={handleRejectClick}
        onIndexSingle={handleIndexSingle}
      />

      <AiServerFileRejectModal
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        fileToReject={fileToReject}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        isRejecting={isRejecting}
        onConfirmReject={handleConfirmReject}
      />
    </div>
  );
}
