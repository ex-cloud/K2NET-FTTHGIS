"use client";

import React from "react";
import { 
  Search, 
  FolderSync, 
  RefreshCw, 
  Plus, 
  Filter, 
  ChevronDown, 
  Check, 
  ShieldCheck, 
  Clock 
} from "lucide-react";
import { 
  Input, 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  ActionTooltip 
} from "@k2net/ui";
import { cn } from "@/lib/utils";
import { 
  CATEGORIES, 
  KNOWLEDGE_SCOPES, 
  STATUS_ITEMS, 
  KnowledgeStatus 
} from "./types";

interface AiKnowledgeToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedScope?: string;
  setSelectedScope?: (scope: string) => void;
  selectedStatus?: string;
  setSelectedStatus?: (status: string) => void;
  docsLoading: boolean;
  isSyncing?: boolean;
  onSyncServerDocs: () => void;
  onRefresh: () => void;
  onGoToUpload: () => void;
}

export function AiKnowledgeToolbar({
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  selectedCategory,
  setSelectedCategory,
  selectedScope = "ALL",
  setSelectedScope,
  selectedStatus = "ALL",
  setSelectedStatus,
  docsLoading,
  isSyncing = false,
  onSyncServerDocs,
  onRefresh,
  onGoToUpload,
}: AiKnowledgeToolbarProps) {
  return (
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

      {/* Right Toolbar: Linear-Style Action Buttons (Sinkron -> Refresh -> Tambah) */}
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
  );
}
