import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@k2net/ui";
import { Loader2, Flame, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnrichedOrganization } from "./types";
import { useDeleteOrganizationState } from "./delete-modal/useDeleteOrganizationState";
import { DeleteImpactSummaryCards } from "./delete-modal/DeleteImpactSummaryCards";
import { DeleteBackupBanner } from "./delete-modal/DeleteBackupBanner";
import { DeleteModeSelector } from "./delete-modal/DeleteModeSelector";
import { DeleteNuclearSection } from "./delete-modal/DeleteNuclearSection";

interface DeleteOrganizationModalProps {
  orgToDelete: EnrichedOrganization | null;
  onClose: () => void;
  onDeleteSuccess: () => void;
  deleteOrg?: (payload: { idOrSlug: string; mode: "soft" | "nuclear"; reason: string }) => Promise<unknown>;
  accessToken?: string;
}

export function DeleteOrganizationModal({
  orgToDelete,
  onClose,
  onDeleteSuccess,
  deleteOrg,
  accessToken,
}: DeleteOrganizationModalProps) {
  const state = useDeleteOrganizationState(orgToDelete, accessToken, deleteOrg, onClose, onDeleteSuccess);

  return (
    <Dialog open={!!orgToDelete} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-popover/95 backdrop-blur-xl border-border/80 sm:max-w-[580px] p-0 overflow-hidden shadow-2xl text-foreground rounded-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-3 text-foreground border-b border-border/60">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold flex items-center gap-2.5 text-foreground">
              <div
                className={cn(
                  "p-2 rounded-xl border flex items-center justify-center",
                  state.deleteMode === "soft"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                    : "bg-destructive/10 border-destructive/20 text-destructive"
                )}
              >
                {state.deleteMode === "soft" ? <Archive className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
              </div>
              <div>
                <span className="block text-sm font-semibold">Penghapusan Tenant & Manajemen Siklus Hidup</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  Organisasi: <strong className="text-foreground">{orgToDelete?.name}</strong> (
                  <span className="font-mono">{orgToDelete?.slug}</span>)
                </span>
              </div>
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          <DeleteImpactSummaryCards
            slug={orgToDelete?.slug}
            impactSummary={state.impactSummary}
            loadingImpact={state.loadingImpact}
          />

          <DeleteBackupBanner
            onExportBackup={state.handleExportBackup}
            exportingBackup={state.exportingBackup}
          />

          <DeleteModeSelector
            deleteMode={state.deleteMode}
            setDeleteMode={state.setDeleteMode}
          />

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Alasan Penghapusan Tenant</Label>
            <Select onValueChange={state.setDeleteReason} value={state.deleteReason}>
              <SelectTrigger className="bg-card border-border text-foreground h-9 text-xs">
                <SelectValue placeholder="Pilih alasan penghapusan" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground text-xs">
                <SelectItem value="client-churn">Kontrak ISP / Klien telah berakhir</SelectItem>
                <SelectItem value="temporary-trial-ended">Masa uji coba (Trial) telah habis</SelectItem>
                <SelectItem value="consolidation">Konsolidasi ke tenant / cabang lain</SelectItem>
                <SelectItem value="administrative-purge">Pembersihan administratif / testing</SelectItem>
                <SelectItem value="other">Alasan lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {state.deleteMode === "nuclear" && (
            <DeleteNuclearSection
              orgName={orgToDelete?.name}
              orgSlug={orgToDelete?.slug}
              confirmUnderstandNuclear={state.confirmUnderstandNuclear}
              setConfirmUnderstandNuclear={state.setConfirmUnderstandNuclear}
              deleteConfirmSlug={state.deleteConfirmSlug}
              setDeleteConfirmSlug={state.setDeleteConfirmSlug}
            />
          )}
        </div>

        <div className="p-4 border-t border-border/60 bg-muted/20 flex justify-end gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Batal
          </Button>
          <Button
            variant={state.deleteMode === "nuclear" ? "destructive" : "default"}
            size="sm"
            onClick={state.handleDelete}
            disabled={!state.canDelete || state.deleting}
            className={cn(
              "text-xs font-semibold gap-1.5",
              state.deleteMode === "soft" && "bg-amber-600 hover:bg-amber-700 text-primary-foreground"
            )}
          >
            {state.deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : state.deleteMode === "soft" ? (
              <>
                <Archive className="w-3.5 h-3.5" />
                Pindahkan ke Recycle Bin
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5" />
                Musnahkan Permanen
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
