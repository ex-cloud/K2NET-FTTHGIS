"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  FolderSync, 
  Trash2, 
  CheckCircle2, 
  Loader2,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  BrainCircuit,
  Database,
  RefreshCw,
  Plus,
  FileEdit,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import { 
  Button, 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { toast } from "sonner";
import { 
  AiDocumentItem, 
  ServerSyncStatus,
  ServerFilePreview,
  previewAiServerFile,
  rejectAiServerFile,
  indexSingleAiServerFile,
} from "@/lib/actions/gateways";
import { 
  CATEGORIES, 
  KNOWLEDGE_SCOPES, 
  STATUS_ITEMS, 
  KnowledgeScope, 
  KnowledgeStatus, 
  formatBytes 
} from "./types";
import { AiDocumentContextMenu } from "./ai-document-context-menu";
import { AiKnowledgeSummaryBar } from "./ai-knowledge-summary-bar";
import { AiKnowledgeToolbar } from "./ai-knowledge-toolbar";
import { AiUnindexedFilesModal } from "./ai-unindexed-files-modal";
import { AiServerFilePreviewModal } from "./ai-server-file-preview-modal";
import { AiServerFileRejectModal } from "./ai-server-file-reject-modal";

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

const columnHelper = createColumnHelper<AiDocumentItem>();

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
  syncStatusLoading = false,
  onInspectVector,
  onTestSimulator,
}: AiKnowledgeTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isUnindexedModalOpen, setIsUnindexedModalOpen] = useState(false);

  // Server Files Preview & Rejection State
  const [previewData, setPreviewData] = useState<ServerFilePreview | null>(null);
  const [previewLoadingPath, setPreviewLoadingPath] = useState<string | null>(null);
  const [actionLoadingPath, setActionLoadingPath] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [fileToReject, setFileToReject] = useState<{ path: string; title: string; category?: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const handlePreviewServerFile = async (filePath: string) => {
    setPreviewLoadingPath(filePath);
    try {
      const preview = await previewAiServerFile(filePath);
      setPreviewData(preview);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat pratinjau berkas");
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
    } catch (err: any) {
      toast.error(err.message || "Gagal menolak berkas");
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
    } catch (err: any) {
      toast.error(err.message || "Gagal mengindeks berkas");
    } finally {
      setActionLoadingPath(null);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Intersection Observer for Infinite Scrolling
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

  const columns = useMemo(
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
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border whitespace-nowrap ${catMeta?.color || "text-foreground/80 border-border bg-muted/60"}`}>
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
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border whitespace-nowrap ${meta.accentBg} ${meta.accentBorder}`}>
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
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${statusMeta.badge}`}>
                <Icon className={`w-3.5 h-3.5 ${status === "PROCESSING" ? "animate-spin" : ""}`} />
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
              {/* Edit / Revisi */}
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

              {/* Approve jika belum indexed */}
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

              {/* Delete */}
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
    [copiedId, onDelete, onEdit, onApprove]
  );

  const table = useReactTable({
    data: documents,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* ── Supabase-style Inline KPI Stats & Sync Banner ──────────────────── */}
      <AiKnowledgeSummaryBar
        totalCount={totalCount}
        totalChunks={totalChunks}
        totalBytes={totalBytes}
        syncStatus={syncStatus}
        isSyncing={isSyncing}
        onSyncServerDocs={onSyncServerDocs}
        onOpenUnindexedModal={() => setIsUnindexedModalOpen(true)}
      />

      {/* ── Enterprise Card & Table Container (Query-Performance Unified Architecture) ── */}
      <div className="border border-border bg-card/20 rounded-xl overflow-hidden flex flex-col shadow-xs w-full">
        {/* 1. Integrated Toolbar */}
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

        {/* 2. Shimmer Running Beam on Top Table Border */}
        <div className="relative flex-1 min-h-0 flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden z-30 pointer-events-none">
            <div
              className={`h-full w-1/4 bg-gradient-to-r from-transparent via-primary/80 to-transparent transition-opacity duration-300 will-change-transform ${
                docsLoading || loadingMore || isSyncing ? "animate-shimmer-line opacity-100" : "opacity-0"
              }`}
            />
          </div>

          {/* 3. Scrollable Table Container */}
          <div ref={scrollContainerRef} className="max-h-[620px] overflow-auto custom-scrollbar-thin">
            <div className="min-w-[1300px] flex flex-col">
              
              {/* Sticky Header with Sorting Menus */}
              <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md grid grid-cols-[minmax(320px,1.5fr)_200px_165px_105px_130px_140px_140px_90px] border-b border-border items-stretch divide-x divide-border/40 text-[11px] font-semibold text-foreground/75 dark:text-muted-foreground shadow-xs">
                {table.getFlatHeaders().map((header) => {
                  if (header.isPlaceholder) return <div key={header.id} />;

                  const canSort = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();
                  const isRightAligned = ["file_size_bytes", "chunk_count", "actions"].includes(header.column.id);

                  return (
                    <div
                      key={header.id}
                      className={`min-w-0 px-4 py-2.5 flex items-center ${
                        isRightAligned ? "justify-end text-right" : "justify-start text-left"
                      }`}
                    >
                      {canSort && header.column.id !== "actions" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1 hover:text-foreground transition-colors outline-hidden select-none py-1 px-1.5 -mx-1.5 rounded hover:bg-muted/40 font-medium cursor-pointer">
                              <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                              <span className="flex items-center">
                                {isSorted === "asc" ? (
                                  <ArrowUp className="h-3 w-3 text-primary shrink-0" />
                                ) : isSorted === "desc" ? (
                                  <ArrowDown className="h-3 w-3 text-primary shrink-0" />
                                ) : (
                                  <ChevronDown className="h-3 w-3 opacity-40 shrink-0 hover:opacity-100" />
                                )}
                              </span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isRightAligned ? "end" : "start"} className="bg-popover border border-border shadow-xl rounded-lg p-1 min-w-32 z-50">
                            <DropdownMenuItem 
                              onClick={() => header.column.toggleSorting(false)}
                              className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-sm cursor-pointer hover:bg-muted/50 text-foreground"
                            >
                              <ArrowUp className="h-3.5 w-3.5 text-foreground/75 dark:text-muted-foreground" />
                              <span>Urutkan Naik (Ascending)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => header.column.toggleSorting(true)}
                              className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-sm cursor-pointer hover:bg-muted/50 text-foreground"
                            >
                              <ArrowDown className="h-3.5 w-3.5 text-foreground/75 dark:text-muted-foreground" />
                              <span>Urutkan Turun (Descending)</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Table Rows Body */}
              <div className="divide-y divide-border/40">
                {docsLoading && documents.length === 0 ? (
                  /* Animated Skeleton Loading Rows */
                  Array.from({ length: 6 }).map((_, i) => (
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
                  ))
                ) : table.getRowModel().rows.length === 0 ? (
                  /* Empty State */
                  <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center text-foreground/75 dark:text-muted-foreground border border-border/60">
                      <Database className="w-6 h-6 opacity-60" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Tidak Ada Dokumen SOP Ditemukan</p>
                      <p className="text-xs text-foreground/75 dark:text-muted-foreground max-w-sm">
                        {searchQuery 
                          ? `Tidak ada hasil untuk pencarian "${searchQuery}". Coba kata kunci lain atau reset filter kategori/scope.`
                          : "Belum ada dokumen panduan SOP atau manual hardware yang cocok dengan kriteria filter."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onGoToUpload}
                        className="text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Dokumen Baru
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onSyncServerDocs}
                        disabled={isSyncing}
                        className="text-xs gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                        {isSyncing ? "Menyinkronkan..." : "Sinkronkan Server Docs"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  table.getRowModel().rows.map((row) => (
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
                      <div
                        className="grid grid-cols-[minmax(320px,1.5fr)_200px_165px_105px_130px_140px_140px_90px] items-stretch border-b border-border/40 divide-x divide-border/30 hover:bg-muted/30 transition-colors group cursor-context-menu"
                      >
                        {row.getVisibleCells().map((cell) => {
                          const isRightAligned = ["file_size_bytes", "chunk_count", "actions"].includes(cell.column.id);
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
                  ))
                )}

                {/* Infinite Scroll Sentinel & Loading More Spinner */}
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

            </div>
          </div>
        </div>
      </div>

      {/* ── Dialog Modal: Daftar Berkas Server Belum Terindeks ─────────────── */}
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

      {/* ── Dialog Modal: Pratinjau Isi Dokumen Server ─────────────── */}
      <AiServerFilePreviewModal
        previewData={previewData}
        onClose={() => setPreviewData(null)}
        actionLoadingPath={actionLoadingPath}
        onReject={handleRejectClick}
        onIndexSingle={handleIndexSingle}
      />

      {/* ── Dialog Modal: Konfirmasi Tolak Berkas Server ─────────────── */}
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
