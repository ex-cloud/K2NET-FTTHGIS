"use client";

import React from "react";
import { 
  Database, 
  FlaskConical, 
  FileCode, 
  UploadCloud, 
  FileText, 
  Cpu, 
  FolderSync, 
  RefreshCw 
} from "lucide-react";
import { Button } from "@k2net/ui";
import { cn } from "@/lib/utils";
import { AiTabType } from "./types";

interface AiNavTabsProps {
  activeTab: AiTabType;
  setActiveTab: (tab: AiTabType) => void;
  docsTotal: number;
  onSyncServerDocs: () => void;
  onRefresh: () => void;
  isSyncing: boolean;
  docsLoading: boolean;
  onLoadConfig: () => void;
}

export function AiNavTabs({
  activeTab,
  setActiveTab,
  docsTotal,
  onSyncServerDocs,
  onRefresh,
  isSyncing,
  docsLoading,
  onLoadConfig,
}: AiNavTabsProps) {
  return (
    <div className="border-b border-border flex items-center justify-between flex-wrap gap-4">
      <nav className="flex items-center gap-6 text-sm font-medium overflow-x-auto custom-scrollbar">
        {/* Tab 1: Knowledge */}
        <button
          onClick={() => setActiveTab("KNOWLEDGE")}
          className={cn(
            "flex items-center gap-2 pb-3.5 transition-all text-xs font-semibold border-b-2 cursor-pointer whitespace-nowrap",
            activeTab === "KNOWLEDGE"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Database className="w-4 h-4" />
          <span>Daftar Pengetahuan ({docsTotal})</span>
        </button>

        {/* Tab 2: Semantic Simulator */}
        <button
          onClick={() => setActiveTab("SIMULATOR")}
          className={cn(
            "flex items-center gap-2 pb-3.5 transition-all text-xs font-semibold border-b-2 cursor-pointer whitespace-nowrap",
            activeTab === "SIMULATOR"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <FlaskConical className="w-4 h-4" />
          <span>RAG Semantic Simulator</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-primary/10 text-primary border border-primary/20">
            Live Test
          </span>
        </button>

        {/* Tab 3: Templates */}
        <button
          onClick={() => setActiveTab("TEMPLATES")}
          className={cn(
            "flex items-center gap-2 pb-3.5 transition-all text-xs font-semibold border-b-2 cursor-pointer whitespace-nowrap",
            activeTab === "TEMPLATES"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <FileCode className="w-4 h-4" />
          <span>Contoh & Template SOP</span>
        </button>

        {/* Tab 4: Upload */}
        <button
          onClick={() => setActiveTab("UPLOAD")}
          className={cn(
            "flex items-center gap-2 pb-3.5 transition-all text-xs font-semibold border-b-2 cursor-pointer whitespace-nowrap",
            activeTab === "UPLOAD"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Unggah Berkas SOP</span>
        </button>

        {/* Tab 5: Manual Note */}
        <button
          onClick={() => setActiveTab("MANUAL")}
          className={cn(
            "flex items-center gap-2 pb-3.5 transition-all text-xs font-semibold border-b-2 cursor-pointer whitespace-nowrap",
            activeTab === "MANUAL"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="w-4 h-4" />
          <span>Tulis Manual (Quick Note)</span>
        </button>

        {/* Tab 6: Config */}
        <button
          onClick={() => {
            setActiveTab("CONFIG");
            onLoadConfig();
          }}
          className={cn(
            "flex items-center gap-2 pb-3.5 transition-all text-xs font-semibold border-b-2 cursor-pointer whitespace-nowrap",
            activeTab === "CONFIG"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Cpu className="w-4 h-4" />
          <span>Engine Config</span>
        </button>
      </nav>

      {activeTab === "KNOWLEDGE" && (
        <div className="flex items-center gap-2 pb-3.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onSyncServerDocs}
            disabled={isSyncing}
            className="text-xs gap-1.5 border-primary/40 hover:bg-primary/10 text-primary font-medium"
          >
            <FolderSync className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Menyinkronkan Server..." : "Sinkronkan Folder Server Docs"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${docsLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      )}
    </div>
  );
}
