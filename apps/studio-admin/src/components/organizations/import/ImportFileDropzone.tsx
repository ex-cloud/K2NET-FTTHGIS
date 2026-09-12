import * as React from "react";
import { FileJson } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportFileDropzoneProps {
  dragActive: boolean;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileProcess: (file: File) => void;
}

export function ImportFileDropzone({
  dragActive,
  handleDrag,
  handleDrop,
  fileInputRef,
  handleFileProcess,
}: ImportFileDropzoneProps) {
  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3",
        dragActive
          ? "border-primary bg-primary/10"
          : "border-border/80 bg-card hover:border-primary/50 hover:bg-muted/40"
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileProcess(e.target.files[0]);
          }
        }}
      />
      <div className="p-3 rounded-full bg-primary/10 border border-primary/20 text-primary">
        <FileJson className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold text-foreground">
          Klik untuk memilih berkas atau seret & jatuhkan berkas .JSON di sini
        </p>
        <p className="text-[11px] text-muted-foreground">
          Mendukung format cadangan resmi FTTH GIS K2NET Enterprise
        </p>
      </div>
    </div>
  );
}
