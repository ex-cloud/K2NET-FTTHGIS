"use client";

import React from "react";
import { Cpu, BookOpen, BrainCircuit, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { Card } from "@k2net/ui";
import { AiKnowledgeStats } from "@/lib/actions/gateways";
import { formatBytes } from "./types";

interface AiKpiCardsProps {
  stats: AiKnowledgeStats | null;
  loading: boolean;
  onOpenExplorer: () => void;
}

export function AiKpiCards({ stats, loading, onOpenExplorer }: AiKpiCardsProps) {
  const docCount = stats?.total_documents || 0;
  const chunkCount = stats?.total_chunks || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* 1. Service Engine */}
      <Card glowingEffect className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase">
            Service Engine
          </span>
          <div className="flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/75 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <Cpu className="h-4 w-4 text-primary ml-1" />
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground font-mono">Port 5012</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            FastAPI • pgvector 0.8.6
          </p>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Gateway Health</span>
            <span className="text-primary font-semibold font-mono">100% Online</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </Card>

      {/* 2. Dokumen Terindeks */}
      <Card glowingEffect className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase">
            Dokumen Terindeks
          </span>
          <BookOpen className="h-4 w-4 text-cyan-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground font-mono">
            {loading ? "..." : docCount}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ukuran: {formatBytes(stats?.total_size_bytes || 0)} SOP terdaftar
          </p>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Coverage</span>
            <span className="font-mono">{docCount > 0 ? "100%" : "0%"}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-700"
              style={{ width: docCount > 0 ? "100%" : "0%" }}
            />
          </div>
        </div>
      </Card>

      {/* 3. Vector Chunks (Interactive) */}
      <Card 
        glowingEffect 
        onClick={onOpenExplorer}
        className="p-5 flex flex-col gap-3 cursor-pointer hover:border-primary/50 transition-all group"
        title="Klik untuk membuka Vector Chunk Explorer"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase group-hover:text-primary transition-colors">
            Vector Chunks
          </span>
          <BrainCircuit className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-foreground font-mono">
              {loading ? "..." : chunkCount}
            </p>
            <span className="text-[10px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
              Eksplorasi →
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            HNSW Cosine • 1536 dim
          </p>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>HNSW Index Ready</span>
            <span className="text-purple-400 font-semibold font-mono">Active</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500 transition-all duration-700"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </Card>

      {/* 4. Active LLM Provider & Cache */}
      <Card glowingEffect className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/75 dark:text-muted-foreground font-bold tracking-wider uppercase">
            Active LLM Engine
          </span>
          <Sparkles className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground font-mono truncate">
            {stats?.llm_provider || "GEMINI"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate font-mono text-[11px]">
            {stats?.chat_model || "gemini-2.5-flash"}
          </p>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Redis Cache
            </span>
            <span className="text-amber-400 font-semibold font-mono">&lt; 10ms</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-700"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
