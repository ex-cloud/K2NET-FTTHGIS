import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@k2net/ui";
import { Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { useTenantImportState } from "./import/useTenantImportState";
import { ImportHudTerminal } from "./import/ImportHudTerminal";
import { ImportFileDropzone } from "./import/ImportFileDropzone";
import { ImportFilePreviewContainer } from "./import/ImportFilePreviewContainer";

interface TenantImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TenantImportModal({ isOpen, onClose, onSuccess }: TenantImportModalProps) {
  const state = useTenantImportState(onSuccess);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !state.isProcessing && onClose()}>
      <DialogContent className="sm:max-w-xl bg-popover/95 backdrop-blur-2xl border-border p-0 overflow-hidden shadow-2xl rounded-2xl max-h-[90vh] flex flex-col">
        {state.isProcessing ? (
          <ImportHudTerminal
            processStatus={state.processStatus}
            currentActionText={state.currentActionText}
            processProgress={state.processProgress}
            terminalLogs={state.terminalLogs}
            onClose={onClose}
            onReset={state.handleReset}
          />
        ) : (
          <>
            <DialogHeader className="p-6 pb-3 text-foreground border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Impor Cadangan Tenant (.JSON)
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground pt-0.5">
                    Unggah berkas arsip JSON untuk memulihkan atau membuat tenant baru beserta proyek GIS-nya.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {!state.parsedData ? (
                <ImportFileDropzone
                  dragActive={state.dragActive}
                  handleDrag={state.handleDrag}
                  handleDrop={state.handleDrop}
                  fileInputRef={state.fileInputRef}
                  handleFileProcess={state.handleFileProcess}
                />
              ) : (
                <ImportFilePreviewContainer
                  file={state.file}
                  parsedData={state.parsedData}
                  activeTab={state.activeTab}
                  setActiveTab={state.setActiveTab}
                  onReset={state.handleReset}
                  onCopyJson={state.copyJsonToClipboard}
                />
              )}

              {state.parseError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2 text-xs text-destructive">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{state.parseError}</span>
                </div>
              )}
            </div>

            <DialogFooter className="p-4 border-t border-border/60 bg-muted/20 flex justify-end gap-2 shrink-0">
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
                Batal
              </Button>
              <Button
                size="sm"
                onClick={state.handleImportSubmit}
                disabled={!state.parsedData || state.isProcessing}
                className="text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mulai Impor & Provisioning
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
