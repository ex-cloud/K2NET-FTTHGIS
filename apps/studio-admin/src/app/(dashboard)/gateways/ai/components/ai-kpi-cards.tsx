"use client";

import React from "react";
import { Cpu, BookOpen, BrainCircuit, Sparkles, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@k2net/ui";
import { AiKnowledgeStats } from "@/lib/actions/gateways";
import { formatBytes } from "./types";

interface AiKpiCardsProps {
  stats: AiKnowledgeStats | null;
  loading: boolean;
  onOpenExplorer: () => void;
}

export function AiKpiCards({ stats, loading, onOpenExplorer }: AiKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Service Engine */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground">
            Service Engine
          </span>
          <Cpu className="w-4 h-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Port 5012 Active
          </div>
          <p className="text-xs text-foreground/70 dark:text-muted-foreground mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            FastAPI • pgvector 0.8.6
          </p>
        </CardContent>
      </Card>

      {/* 2. Dokumen Terindeks */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground">
            Dokumen Terindeks
          </span>
          <BookOpen className="w-4 h-4 text-cyan-400" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold tracking-tight text-foreground">
            {loading ? "..." : `${stats?.total_documents || 0} Berkas`}
          </div>
          <p className="text-xs text-foreground/70 dark:text-muted-foreground mt-1">
            Ukuran: {formatBytes(stats?.total_size_bytes || 0)}
          </p>
        </CardContent>
      </Card>

      {/* 3. Vector Chunks (Interactive) */}
      <Card 
        onClick={onOpenExplorer}
        className="border-border bg-card shadow-xs cursor-pointer hover:border-primary/50 transition-all group"
        title="Klik untuk membuka Vector Chunk Explorer"
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground group-hover:text-primary transition-colors">
            Vector Chunks
          </span>
          <BrainCircuit className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold tracking-tight text-foreground flex items-center justify-between">
            <span>{loading ? "..." : `${stats?.total_chunks || 0} Chunks`}</span>
            <span className="text-[10px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Eksplorasi →
            </span>
          </div>
          <p className="text-xs text-foreground/70 dark:text-muted-foreground mt-1">
            HNSW Cosine • 1536 dim
          </p>
        </CardContent>
      </Card>

      {/* 4. Active LLM Provider */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground">
            Active LLM Provider
          </span>
          <Sparkles className="w-4 h-4 text-amber-400" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold tracking-tight text-foreground">
            {stats?.llm_provider || "GEMINI"}
          </div>
          <p className="text-xs text-foreground/70 dark:text-muted-foreground mt-1 truncate">
            {stats?.chat_model || "gemini-1.5-flash"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
