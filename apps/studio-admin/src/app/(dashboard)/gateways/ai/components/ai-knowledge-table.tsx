"use client";

import React from "react";
import { 
  Search, 
  BookOpen, 
  UploadCloud, 
  FolderSync, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Loader2 
} from "lucide-react";
import { Card, Button, Input, Badge } from "@k2net/ui";
import { cn } from "@/lib/utils";
import { AiDocumentItem } from "@/lib/actions/gateways";
import { CATEGORIES, formatBytes } from "./types";

interface AiKnowledgeTableProps {
  documents: AiDocumentItem[];
  docsLoading: boolean;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onDelete: (id: string, title: string) => void;
  onGoToUpload: () => void;
  onSyncServerDocs: () => void;
}

export function AiKnowledgeTable({
  documents,
  docsLoading,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onDelete,
  onGoToUpload,
  onSyncServerDocs,
}: AiKnowledgeTableProps) {
  return (
    <div className="space-y-4">
      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 custom-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border cursor-pointer",
                selectedCategory === cat.id
                  ? "bg-primary/10 text-primary border-primary/30 font-semibold shadow-xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/60 hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <form onSubmit={onSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari judul dokumen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs pl-8 pr-4 h-9 bg-card border-border"
          />
        </form>
      </div>

      {/* Table Container */}
      <Card className="border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-foreground/75 dark:text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Judul Pengetahuan</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Ukuran</th>
                <th className="py-3 px-4">Vector Chunks</th>
                <th className="py-3 px-4">Status Indeks</th>
                <th className="py-3 px-4">Tanggal Diperbarui</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {docsLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                    Memuat data knowledge base...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                    Belum ada dokumen terindeks pada kategori ini.
                    <div className="mt-3 flex justify-center gap-2">
                      <Button size="sm" variant="outline" onClick={onGoToUpload}>
                        <UploadCloud className="w-3.5 h-3.5 mr-1.5" /> Unggah Berkas
                      </Button>
                      <Button size="sm" variant="outline" onClick={onSyncServerDocs}>
                        <FolderSync className="w-3.5 h-3.5 mr-1.5" /> Sinkronkan Server Docs
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const catMeta = CATEGORIES.find((c) => c.id === doc.category);
                  return (
                    <tr key={doc.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="py-3 px-4 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <div>
                            <div className="font-semibold text-foreground">{doc.title}</div>
                            {doc.file_name && (
                              <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[220px]">
                                {doc.file_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${catMeta?.color || "text-foreground/80 border-border bg-muted/60"}`}>
                          {catMeta?.label || doc.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono">
                        {formatBytes(doc.file_size_bytes)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          {doc.chunk_count} chunk
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {doc.status === "INDEXED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Terindeks
                          </span>
                        )}
                        {doc.status === "PROCESSING" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memproses...
                          </span>
                        )}
                        {doc.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400">
                            <Clock className="w-3.5 h-3.5" /> Antrean
                          </span>
                        )}
                        {doc.status === "FAILED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400" title={doc.error_message || ""}>
                            <AlertCircle className="w-3.5 h-3.5" /> Gagal
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(doc.updated_at || doc.created_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(doc.id, doc.title)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-md"
                          title="Hapus dari memori AI"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
