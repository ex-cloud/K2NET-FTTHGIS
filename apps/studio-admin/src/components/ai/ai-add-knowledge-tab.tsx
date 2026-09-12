import React, { useState } from "react";
import { UploadCloud, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@k2net/ui";
import { cn } from "@/lib/utils";
import type { KnowledgeScope } from "./types";
import { AiKnowledgeGuideSidebar } from "./knowledge/AiKnowledgeGuideSidebar";
import { AiUploadKnowledgeForm } from "./knowledge/AiUploadKnowledgeForm";
import { AiManualKnowledgeForm } from "./knowledge/AiManualKnowledgeForm";

interface AiAddKnowledgeTabProps {
  uploadTitle: string;
  setUploadTitle: (t: string) => void;
  uploadCategory: string;
  setUploadCategory: (c: string) => void;
  uploadScope?: KnowledgeScope;
  setUploadScope?: (s: KnowledgeScope) => void;
  uploadAutoApprove?: boolean;
  setUploadAutoApprove?: (a: boolean) => void;
  selectedFile: File | null;
  setSelectedFile: (f: File | null) => void;
  uploading: boolean;
  onUploadSubmit: (e: React.FormEvent) => void;

  manualTitle: string;
  setManualTitle: (t: string) => void;
  manualCategory: string;
  setManualCategory: (c: string) => void;
  manualScope?: KnowledgeScope;
  setManualScope?: (s: KnowledgeScope) => void;
  manualAutoApprove?: boolean;
  setManualAutoApprove?: (a: boolean) => void;
  manualIsDraft?: boolean;
  setManualIsDraft?: (d: boolean) => void;
  manualContent: string;
  setManualContent: (c: string) => void;
  manualSubmitting: boolean;
  onManualSubmit: (e: React.FormEvent) => void;

  onCancel: () => void;
  onGoToTemplates: () => void;
}

export function AiAddKnowledgeTab({
  uploadTitle,
  setUploadTitle,
  uploadCategory,
  setUploadCategory,
  uploadScope = "GLOBAL",
  setUploadScope,
  uploadAutoApprove = true,
  setUploadAutoApprove,
  selectedFile,
  setSelectedFile,
  uploading,
  onUploadSubmit,
  manualTitle,
  setManualTitle,
  manualCategory,
  setManualCategory,
  manualScope = "GLOBAL",
  setManualScope,
  manualAutoApprove = true,
  setManualAutoApprove,
  manualIsDraft: _manualIsDraft = false,
  setManualIsDraft: _setManualIsDraft,
  manualContent,
  setManualContent,
  manualSubmitting,
  onManualSubmit,
  onCancel,
  onGoToTemplates,
}: AiAddKnowledgeTabProps) {
  const [entryMode, setEntryMode] = useState<"UPLOAD" | "MANUAL">("UPLOAD");

  return (
    <div className="w-full space-y-6">
      {/* Top Segmented Mode Switcher Bar */}
      <Card glowingEffect className="p-4 border-border bg-card shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              {entryMode === "UPLOAD" ? (
                <UploadCloud className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Tambah Basis Pengetahuan SOP & Panduan Jaringan
              </h2>
              <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
                Pilih metode input: Unggah berkas dokumen (PDF, MD, TXT) atau tulis catatan SOP langsung melalui editor Markdown.
              </p>
            </div>
          </div>

          <div className="inline-flex p-1 bg-background border border-border rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setEntryMode("UPLOAD")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                entryMode === "UPLOAD"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-foreground/75 dark:text-muted-foreground hover:text-foreground"
              )}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Unggah Berkas</span>
            </button>
            <button
              type="button"
              onClick={() => setEntryMode("MANUAL")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                entryMode === "MANUAL"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-foreground/75 dark:text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tulis Manual</span>
            </button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        <div className="lg:col-span-8 xl:col-span-9">
          <Card glowingEffect className="border-border bg-card shadow-xs p-0">
            <CardHeader className="border-b border-border bg-muted/20 px-6 py-4 rounded-t-xl">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                {entryMode === "UPLOAD" ? (
                  <>
                    <UploadCloud className="w-4 h-4 text-primary" />
                    <span>Unggah Dokumen Baru (PDF / Markdown / TXT)</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Editor Catatan SOP & Prosedur Lapangan</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              {entryMode === "UPLOAD" ? (
                <AiUploadKnowledgeForm
                  uploadTitle={uploadTitle}
                  setUploadTitle={setUploadTitle}
                  uploadCategory={uploadCategory}
                  setUploadCategory={setUploadCategory}
                  uploadScope={uploadScope}
                  setUploadScope={setUploadScope}
                  uploadAutoApprove={uploadAutoApprove}
                  setUploadAutoApprove={setUploadAutoApprove}
                  selectedFile={selectedFile}
                  setSelectedFile={setSelectedFile}
                  uploading={uploading}
                  onUploadSubmit={onUploadSubmit}
                  onCancel={onCancel}
                  onGoToTemplates={onGoToTemplates}
                />
              ) : (
                <AiManualKnowledgeForm
                  manualTitle={manualTitle}
                  setManualTitle={setManualTitle}
                  manualCategory={manualCategory}
                  setManualCategory={setManualCategory}
                  manualScope={manualScope}
                  setManualScope={setManualScope}
                  manualAutoApprove={manualAutoApprove}
                  setManualAutoApprove={setManualAutoApprove}
                  manualContent={manualContent}
                  setManualContent={setManualContent}
                  manualSubmitting={manualSubmitting}
                  onManualSubmit={onManualSubmit}
                  onCancel={onCancel}
                  onGoToTemplates={onGoToTemplates}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <AiKnowledgeGuideSidebar />
      </div>
    </div>
  );
}
