

import React from "react";
import { 
  Database, 
  FlaskConical, 
  FileCode, 
  UploadCloud, 
  Cpu, 
  FolderSync, 
  RefreshCw,
  Network 
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
      <nav className="flex items-center gap-5 text-sm font-medium overflow-x-auto custom-scrollbar">
        {/* Tab 1: Knowledge List */}
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

        {/* Tab 2: 2D Obsidian-Style Semantic Graph */}
        <button
          onClick={() => setActiveTab("GRAPH")}
          className={cn(
            "flex items-center gap-2 pb-3.5 transition-all text-xs font-semibold border-b-2 cursor-pointer whitespace-nowrap",
            activeTab === "GRAPH"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Network className="w-4 h-4 text-purple-400" />
          <span>Graf Pengetahuan 2D</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Obsidian Graph
          </span>
        </button>

        {/* Tab 3: Add Knowledge (Unified Upload & Manual) */}
        <button
          onClick={() => setActiveTab("ADD_KNOWLEDGE")}
          className={cn(
            "flex items-center gap-2 pb-3.5 transition-all text-xs font-semibold border-b-2 cursor-pointer whitespace-nowrap",
            activeTab === "ADD_KNOWLEDGE"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <UploadCloud className="w-4 h-4 text-primary" />
          <span>Tambah Pengetahuan (Upload / Tulis)</span>
        </button>

        {/* Tab 4: Semantic Simulator */}
        <button
          onClick={() => setActiveTab("SIMULATOR")}
          className={cn(
            "flex items-center gap-2 pb-3.5 transition-all text-xs font-semibold border-b-2 cursor-pointer whitespace-nowrap",
            activeTab === "SIMULATOR"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <FlaskConical className="w-4 h-4 text-blue-400" />
          <span>RAG Semantic Simulator</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Live Test
          </span>
        </button>

        {/* Tab 5: Templates */}
        <button
          onClick={() => setActiveTab("TEMPLATES")}
          className={cn(
            "flex items-center gap-2 pb-3.5 transition-all text-xs font-semibold border-b-2 cursor-pointer whitespace-nowrap",
            activeTab === "TEMPLATES"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <FileCode className="w-4 h-4 text-amber-400" />
          <span>Contoh & Template SOP</span>
        </button>

        {/* Tab 6: Multi-Provider Hub & Config */}
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
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Multi-Provider Hub</span>
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
