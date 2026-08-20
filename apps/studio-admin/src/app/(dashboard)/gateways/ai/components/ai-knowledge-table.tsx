"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Search, 
  BookOpen, 
  UploadCloud, 
  FolderSync, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Loader2,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  BrainCircuit,
  Database,
  HelpCircle,
  HardDrive,
  RefreshCw,
  Plus,
  Filter,
  FileEdit,
  Lock,
  Building2,
  Globe2,
  XCircle,
  ShieldCheck,
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
  Input, 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  ActionTooltip,
} from "@k2net/ui";
import { cn } from "@/lib/utils";
import { AiDocumentItem } from "@/lib/actions/gateways";
import { 
  CATEGORIES, 
  KNOWLEDGE_SCOPES, 
  STATUS_ITEMS, 
  KnowledgeScope, 
  KnowledgeStatus, 
  formatBytes 
} from "./types";
import { AiDocumentContextMenu } from "./ai-document-context-menu";

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
  onInspectVector,
  onTestSimulator,
}: AiKnowledgeTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Intersection Observer for Infinite Scrolling
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !docsLoading && onFetchMore) {
          onFetchMore();
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, loadingMore, docsLoading, onFetchMore, documents.length]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Judul Pengetahuan",
        cell: (info) => {
          const doc = info.row.original;
          const scopeMeta = KNOWLEDGE_SCOPES.find((s) => s.id === doc.scope) || KNOWLEDGE_SCOPES[2];
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
      {/* ── Supabase-style Inline KPI Stats Summary Bar ────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/75 dark:text-muted-foreground font-medium px-1">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-primary" />
          <span className="font-bold text-foreground font-mono">{totalCount}</span>
          <span>Dokumen Terdaftar</span>
          <span title="Total berkas SOP dan dokumen panduan yang terindeks di database PostgreSQL." className="cursor-help text-foreground/50 hover:text-foreground">
            <HelpCircle className="h-3 w-3" />
          </span>
        </div>
        <span className="text-border">/</span>
        <div className="flex items-center gap-1.5">
          <BrainCircuit className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
          <span className="font-bold text-foreground font-mono">{totalChunks}</span>
          <span>Vector Chunks</span>
          <span title="Jumlah pecahan token berdimensi 1536 yang siap dicari secara semantik." className="cursor-help text-foreground/50 hover:text-foreground">
            <HelpCircle className="h-3 w-3" />
          </span>
        </div>
        <span className="text-border">/</span>
        <div className="flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
          <span className="font-bold text-foreground font-mono">{formatBytes(totalBytes)}</span>
          <span>Ukuran Disk</span>
          <span title="Total ukuran file fisik dokumen SOP." className="cursor-help text-foreground/50 hover:text-foreground">
            <HelpCircle className="h-3 w-3" />
          </span>
        </div>
        <span className="text-border">/</span>
        <div className="flex items-center gap-1.5 text-primary font-mono font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>HNSW 1536 dim Ready</span>
        </div>
      </div>

      {/* ── Query-Performance Style Unified Toolbar with Filters ───────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Left Toolbar: Search + Category Filter + Scope Filter + Status Filter */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto flex-1">
          <form onSubmit={onSearchSubmit} className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/75 dark:text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari judul dokumen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-8 pr-4 h-8 bg-card border-border text-foreground"
            />
          </form>

          {/* 1. Category Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg font-semibold h-8 transition-colors cursor-pointer outline-hidden shrink-0",
                selectedCategory !== "ALL"
                  ? "bg-primary/10 text-primary border-primary/40 shadow-xs"
                  : "bg-card border-border hover:bg-muted/40 text-foreground"
              )}>
                <Filter className="w-3.5 h-3.5 text-foreground/75 dark:text-muted-foreground" />
                <span>{CATEGORIES.find(c => c.id === selectedCategory)?.label || "Kategori"}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover border border-border shadow-2xl rounded-xl p-1.5 min-w-60 z-50">
              <p className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                Filter Kategori Pengetahuan
              </p>
              <div className="space-y-0.5">
                {CATEGORIES.map((cat) => (
                  <DropdownMenuItem
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "flex items-center justify-between text-xs py-2 px-2.5 rounded-lg cursor-pointer transition-colors",
                      selectedCategory === cat.id
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        cat.id === "ALL" && "bg-primary",
                        cat.id === "TROUBLESHOOTING" && "bg-amber-500",
                        cat.id === "NETWORK_CONFIG" && "bg-sky-500",
                        cat.id === "GIS_MANUAL" && "bg-primary",
                        cat.id === "INFRASTRUCTURE" && "bg-purple-500",
                        cat.id === "PLANS" && "bg-cyan-500",
                        cat.id === "GENERAL" && "bg-rose-500",
                      )} />
                      <span>{cat.label}</span>
                    </div>
                    {selectedCategory === cat.id && (
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 2. Scope Filter Dropdown */}
          {setSelectedScope && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg font-semibold h-8 transition-colors cursor-pointer outline-hidden shrink-0",
                  selectedScope !== "ALL"
                    ? "bg-primary/10 text-primary border-primary/40 shadow-xs"
                    : "bg-card border-border hover:bg-muted/40 text-foreground"
                )}>
                  <ShieldCheck className="w-3.5 h-3.5 text-foreground/75 dark:text-muted-foreground" />
                  <span>
                    {selectedScope === "ALL"
                      ? "Semua Scope"
                      : KNOWLEDGE_SCOPES.find((s) => s.id === selectedScope)?.shortLabel || selectedScope}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-popover border border-border shadow-2xl rounded-xl p-1.5 min-w-64 z-50">
                <p className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                  Filter Scope Visibilitas
                </p>
                <div className="space-y-0.5">
                  <DropdownMenuItem
                    onClick={() => setSelectedScope("ALL")}
                    className={cn(
                      "flex items-center justify-between text-xs py-2 px-2.5 rounded-lg cursor-pointer transition-colors",
                      selectedScope === "ALL"
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-muted/50"
                    )}
                  >
                    <span>Semua Scope (Platform, Tenant & Global)</span>
                    {selectedScope === "ALL" && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </DropdownMenuItem>

                  {KNOWLEDGE_SCOPES.map((sc) => {
                    const Icon = sc.icon;
                    return (
                      <DropdownMenuItem
                        key={sc.id}
                        onClick={() => setSelectedScope(sc.id)}
                        className={cn(
                          "flex items-center justify-between text-xs py-2 px-2.5 rounded-lg cursor-pointer transition-colors",
                          selectedScope === sc.id
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-foreground hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${sc.color}`} />
                          <span>{sc.shortLabel}</span>
                        </div>
                        {selectedScope === sc.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 3. Status Filter Dropdown */}
          {setSelectedStatus && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg font-semibold h-8 transition-colors cursor-pointer outline-hidden shrink-0",
                  selectedStatus !== "ALL"
                    ? "bg-primary/10 text-primary border-primary/40 shadow-xs"
                    : "bg-card border-border hover:bg-muted/40 text-foreground"
                )}>
                  <Clock className="w-3.5 h-3.5 text-foreground/75 dark:text-muted-foreground" />
                  <span>
                    {selectedStatus === "ALL"
                      ? "Semua Status"
                      : STATUS_ITEMS[selectedStatus as KnowledgeStatus]?.label || selectedStatus}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-popover border border-border shadow-2xl rounded-xl p-1.5 min-w-56 z-50">
                <p className="text-[10px] font-bold text-foreground/75 dark:text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                  Filter Status Dokumen
                </p>
                <div className="space-y-0.5">
                  <DropdownMenuItem
                    onClick={() => setSelectedStatus("ALL")}
                    className={cn(
                      "flex items-center justify-between text-xs py-2 px-2.5 rounded-lg cursor-pointer transition-colors",
                      selectedStatus === "ALL"
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-muted/50"
                    )}
                  >
                    <span>Semua Status</span>
                    {selectedStatus === "ALL" && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </DropdownMenuItem>

                  {(["INDEXED", "PENDING_REVIEW", "DRAFT", "REJECTED"] as KnowledgeStatus[]).map((st) => {
                    const meta = STATUS_ITEMS[st];
                    const Icon = meta.icon;
                    return (
                      <DropdownMenuItem
                        key={st}
                        onClick={() => setSelectedStatus(st)}
                        className={cn(
                          "flex items-center justify-between text-xs py-2 px-2.5 rounded-lg cursor-pointer transition-colors",
                          selectedStatus === st
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-foreground hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                          <span>{meta.label}</span>
                        </div>
                        {selectedStatus === st && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Right Toolbar: Linear-Style Borderless Action Buttons (Sinkron -> Refresh -> Tambah) */}
        <div className="flex items-center gap-1 w-full sm:w-auto justify-end shrink-0">
          {/* 1. Sinkronkan Server Docs (FolderSync) */}
          <ActionTooltip label={isSyncing ? "Menyinkronkan Server..." : "Sinkronkan Direktori Server"} shortcut="S">
            <button
              onClick={onSyncServerDocs}
              disabled={isSyncing}
              className="h-8 w-8 p-0 shrink-0 border-0 bg-transparent hover:bg-muted/60 text-foreground/75 dark:text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer flex items-center justify-center outline-hidden disabled:opacity-50"
              aria-label="Sinkronkan Direktori Server Docs"
            >
              <FolderSync className={`w-4 h-4 ${isSyncing ? "animate-spin text-primary" : ""}`} />
            </button>
          </ActionTooltip>

          {/* 2. Refresh Data pgvector (RefreshCw) */}
          <ActionTooltip label="Segarkan Data pgvector" shortcut="R">
            <button
              onClick={onRefresh}
              disabled={docsLoading}
              className="h-8 w-8 p-0 shrink-0 border-0 bg-transparent hover:bg-muted/60 text-foreground/75 dark:text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer flex items-center justify-center outline-hidden disabled:opacity-50"
              aria-label="Segarkan Data pgvector"
            >
              <RefreshCw className={`w-4 h-4 ${docsLoading ? "animate-spin text-primary" : ""}`} />
            </button>
          </ActionTooltip>

          {/* 3. Tambah Pengetahuan (Plus) */}
          <ActionTooltip label="Tambah Pengetahuan (Upload / Tulis)" shortcut="C">
            <button
              onClick={onGoToUpload}
              className="h-8 w-8 p-0 shrink-0 border-0 bg-transparent hover:bg-muted/60 text-foreground/75 dark:text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer flex items-center justify-center outline-hidden"
              aria-label="Tambah Pengetahuan (Upload / Tulis)"
            >
              <Plus className="w-4 h-4" />
            </button>
          </ActionTooltip>
        </div>
      </div>

      {/* ── Enterprise Card & Table Container ─────────────────────────────── */}
      <div
        className="border border-border/80 bg-card/60 backdrop-blur-md rounded-xl shadow-xs"
        style={{ overflow: "clip" }}
      >
        <div className="max-h-[600px] overflow-auto custom-scrollbar relative">
          <div className="min-w-[1100px] flex flex-col">
            
            {/* Sticky Header with Sorting Menus */}
            <div className="sticky top-0 z-20 bg-card grid grid-cols-[minmax(280px,1fr)_160px_160px_100px_120px_140px_140px_90px] border-b border-border items-stretch divide-x divide-border/40 text-[11px] font-semibold text-foreground/75 dark:text-muted-foreground shadow-xs">
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
                    className="grid grid-cols-[minmax(280px,1fr)_160px_160px_100px_120px_140px_140px_90px] items-stretch border-b border-border/40 divide-x divide-border/30 animate-pulse bg-background/30"
                  >
                    <div className="min-w-0 px-4 py-3 flex items-center gap-2">
                      <div className="h-4 w-4 bg-muted/60 rounded-md" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 bg-muted/70 rounded w-3/4" />
                        <div className="h-2.5 bg-muted/50 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="px-4 py-3 flex items-center">
                      <div className="h-4 bg-muted/60 rounded w-20" />
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
                      className="grid grid-cols-[minmax(280px,1fr)_160px_160px_100px_120px_140px_140px_90px] items-stretch border-b border-border/40 divide-x divide-border/30 hover:bg-muted/40 transition-colors group cursor-context-menu"
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
              <div ref={sentinelRef} className="py-2 flex items-center justify-center">
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
  );
}
