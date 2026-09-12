import * as React from "react";
import { FileJson, X, Layers, Code2 } from "lucide-react";
import { Button } from "@k2net/ui";
import { cn } from "@/lib/utils";
import type { ParsedBackupData } from "./types";
import { ImportStructuredPreview } from "./ImportStructuredPreview";
import { ImportJsonPreview } from "./ImportJsonPreview";

interface ImportFilePreviewContainerProps {
  file: File | null;
  parsedData: ParsedBackupData;
  activeTab: "visual" | "json";
  setActiveTab: (tab: "visual" | "json") => void;
  onReset: () => void;
  onCopyJson: () => void;
}

export function ImportFilePreviewContainer({
  file,
  parsedData,
  activeTab,
  setActiveTab,
  onReset,
  onCopyJson,
}: ImportFilePreviewContainerProps) {
  return (
    <div className="space-y-3">
      {/* File Metadata Header Bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <FileJson className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground block">{file?.name}</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {file?.size ? (file.size / 1024).toFixed(1) + " KB" : ""} • Diekspor:{" "}
              {parsedData.exportedAt ? new Date(parsedData.exportedAt).toLocaleDateString("id-ID") : "—"}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tab Selector */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("visual")}
          className={cn(
            "flex-1 py-1.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5",
            activeTab === "visual"
              ? "bg-secondary text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="w-3.5 h-3.5 text-primary" />
          Ringkasan Visual
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("json")}
          className={cn(
            "flex-1 py-1.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5",
            activeTab === "json"
              ? "bg-secondary text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Code2 className="w-3.5 h-3.5 text-primary" />
          Pratinjau JSON
        </button>
      </div>

      {activeTab === "visual" ? (
        <ImportStructuredPreview parsedData={parsedData} />
      ) : (
        <ImportJsonPreview parsedData={parsedData} onCopyJson={onCopyJson} />
      )}
    </div>
  );
}
