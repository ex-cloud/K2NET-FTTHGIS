"use client";

import React from "react";
import { 
  BrainCircuit, 
  FileText, 
  FlaskConical 
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  Button, 
  Badge, 
  Progress 
} from "@k2net/ui";
import { AiKnowledgeStats, AiDocumentItem } from "@/lib/actions/gateways";

interface AiVectorExplorerModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  stats: AiKnowledgeStats | null;
  documents: AiDocumentItem[];
  onOpenSimulator: () => void;
}

export function AiVectorExplorerModal({
  isOpen,
  setIsOpen,
  stats,
  documents,
  onOpenSimulator,
}: AiVectorExplorerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col bg-background border-border">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                pgvector Chunk & Index Explorer
                <Badge variant="outline" className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border-purple-500/30">
                  HNSW • 1536 dim
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Inspeksi pecahan dokumen teks (chunks) dan vektor embedding yang tersimpan di PostgreSQL pgvector.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-3 custom-scrollbar">
          {/* Summary Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-card border border-border space-y-1">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Total Dokumen</div>
              <div className="text-lg font-bold text-foreground">{stats?.total_documents || 0} Berkas</div>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border space-y-1">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Total Vektor Chunks</div>
              <div className="text-lg font-bold text-purple-400">{stats?.total_chunks || 0} Chunks</div>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border space-y-1">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Indeks Algoritma</div>
              <div className="text-xs font-mono font-semibold text-emerald-400 mt-1">HNSW Cosine Distance</div>
            </div>
          </div>

          {/* Document Chunks List */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Daftar Dokumen & Kapasitas Chunk</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                Menampilkan {documents.length} dokumen terindeks
              </span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {documents.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  Belum ada dokumen yang terindeks di database pgvector.
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl bg-card border border-border hover:border-primary/40 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-foreground">{doc.title}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            ID: {doc.id.slice(0, 18)}... • Kategori: {doc.category}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border-purple-500/20 shrink-0">
                        {doc.chunk_count} Chunks
                      </Badge>
                    </div>

                    {/* Chunk Token Estimate Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                        <span>Estimasi Token Chunks (~500 token/chunk)</span>
                        <span>{doc.chunk_count * 500} tokens</span>
                      </div>
                      <Progress value={Math.min(doc.chunk_count * 20, 100)} className="h-1.5 bg-muted" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-3 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSimulator}
            className="text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Uji Coba RAG Simulator
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-xs"
          >
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
