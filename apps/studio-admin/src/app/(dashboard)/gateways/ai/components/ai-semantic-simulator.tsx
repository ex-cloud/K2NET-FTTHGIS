"use client";

import React from "react";
import { 
  FlaskConical, 
  Search, 
  Loader2, 
  Database, 
  BrainCircuit, 
  Sliders 
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  Button, 
  Input, 
  Label, 
  Badge 
} from "@k2net/ui";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "./types";

interface AiSemanticSimulatorProps {
  simQuery: string;
  setSimQuery: (q: string) => void;
  simMinSimilarity: number;
  setSimMinSimilarity: (v: number) => void;
  simLimit: number;
  setSimLimit: (l: number) => void;
  simScope: string;
  setSimScope: (s: string) => void;
  simResults: any[];
  simTotalMatches: number;
  simSearching: boolean;
  hasSearched: boolean;
  onSimulateSearch: (e?: React.FormEvent) => void;
}

export function AiSemanticSimulator({
  simQuery,
  setSimQuery,
  simMinSimilarity,
  setSimMinSimilarity,
  simLimit,
  setSimLimit,
  simScope,
  setSimScope,
  simResults,
  simTotalMatches,
  simSearching,
  hasSearched,
  onSimulateSearch,
}: AiSemanticSimulatorProps) {
  const PRESET_QUERIES = [
    "Standar redaman GPON ZTE C320",
    "Jarak maksimal kabel drop core ODP ke pelanggan",
    "Arsitektur database spasial PostGIS SRID 4326",
    "Prosedur 3-layer backup dan Nextcloud",
    "Daftar port gateway internal K2NET",
  ];

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                RAG Semantic Search Simulator & Vector Inspector
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/10 font-mono">
                  Live pgvector Test
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Uji coba akurasi dan skor kemiripan vektor cosine pgvector secara real-time terhadap dokumen yang telah diindeks.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-6">
          <form onSubmit={onSimulateSearch} className="space-y-4">
            {/* Search Input Box */}
            <div className="space-y-1.5">
              <Label htmlFor="simQuery" className="text-xs font-semibold text-foreground">
                Pertanyaan / Kata Kunci Semantik
              </Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="simQuery"
                  type="text"
                  placeholder="Ketik pertanyaan untuk diuji ke mesin pgvector..."
                  value={simQuery}
                  onChange={(e) => setSimQuery(e.target.value)}
                  className="pl-10 pr-24 h-11 text-xs bg-background border-border"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={simSearching || !simQuery.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 text-xs gap-1.5"
                >
                  {simSearching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FlaskConical className="w-3.5 h-3.5" />
                  )}
                  Uji Vektor
                </Button>
              </div>
            </div>

            {/* Chip Queries */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">Uji Coba Cepat (Preset):</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_QUERIES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSimQuery(preset);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-md border border-border/80 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulator Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border/60">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground flex items-center justify-between">
                  <span>Scope Kategori</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{simScope}</span>
                </Label>
                <select
                  value={simScope}
                  onChange={(e) => setSimScope(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground flex items-center justify-between">
                  <span>Batas Minimum Similarity</span>
                  <span className="text-[10px] font-mono text-primary font-semibold">
                    {(simMinSimilarity * 100).toFixed(0)}%
                  </span>
                </Label>
                <input
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.05"
                  value={simMinSimilarity}
                  onChange={(e) => setSimMinSimilarity(parseFloat(e.target.value))}
                  className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground flex items-center justify-between">
                  <span>Limit Chunk Hasil</span>
                  <span className="text-[10px] font-mono text-primary font-semibold">{simLimit} chunks</span>
                </Label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={simLimit}
                  onChange={(e) => setSimLimit(parseInt(e.target.value))}
                  className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </form>

          {/* Results Display */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-primary" />
                Hasil Pencarian Vektor pgvector ({simTotalMatches} Chunks Cocok)
              </h3>
              {hasSearched && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  Cosine Threshold: {(simMinSimilarity * 100).toFixed(0)}%
                </Badge>
              )}
            </div>

            {simSearching ? (
              <div className="p-8 text-center border border-border/80 rounded-xl bg-muted/20">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Mengalkulasi cosine distance di PostgreSQL pgvector...</p>
              </div>
            ) : simResults.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-xl bg-muted/20 text-muted-foreground text-xs">
                {hasSearched
                  ? "Tidak ada dokumen dengan skor kemiripan di atas batas toleransi. Coba turunkan ambang batas similarity."
                  : "Ketik pertanyaan di atas dan klik 'Uji Vektor' untuk melihat peringkat kemiripan semantik."}
              </div>
            ) : (
              <div className="space-y-3">
                {simResults.map((res, i) => {
                  const scorePercent = (res.similarity_score * 100).toFixed(1);
                  return (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-border bg-background hover:border-primary/40 transition-all space-y-2 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-foreground flex items-center gap-2">
                            <span>#{i + 1} {res.title}</span>
                            <Badge variant="secondary" className="text-[9px] font-mono">
                              Chunk #{res.chunk_index}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Kategori: {res.category} • Doc ID: {res.document_id?.slice(0, 8)}...
                          </span>
                        </div>

                        {/* Similarity Score Badge & Meter */}
                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-bold text-primary flex items-center gap-1 justify-end">
                            <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                            {scorePercent}%
                          </div>
                          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${Math.min(res.similarity_score * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <div className="p-3 rounded-lg bg-muted/40 text-xs font-mono text-foreground/90 whitespace-pre-wrap leading-relaxed border border-border/40">
                        {res.content_preview}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
