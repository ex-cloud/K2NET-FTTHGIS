"use client";

import * as React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@k2net/ui";
import { Button } from "@k2net/ui";
import { Label } from "@k2net/ui";
import { Input } from "@k2net/ui";
import { Textarea } from "@k2net/ui";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@k2net/ui";
import { Loader2, AlertCircle, CheckCircle2, Layers, RefreshCw } from "lucide-react";
import { ParentSelectorDialog } from "./parent-selector-dialog";
import { cn } from "@/lib/utils";
import { useBatchEditForm } from "@/hooks/network/useBatchEditForm";

interface BatchEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  assetType: string;
  onSuccess: () => void;
  mode?: "STATUS_UPDATE" | "REASSIGN_PARENT";
}

export function BatchEditDialog({
  open,
  onOpenChange,
  selectedIds,
  assetType,
  onSuccess,
  mode = "STATUS_UPDATE"
}: BatchEditDialogProps) {
  const {
    formData,
    setFormData,
    formErrors,
    loading,
    isParentSelectorOpen,
    setIsParentSelectorOpen,
    isReassignMode,
    getParentType,
    handleSubmit
  } = useBatchEditForm({
    selectedIds,
    assetType,
    onSuccess,
    onOpenChange,
    mode
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-border rounded-3xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-zinc-900/50 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Layers className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white uppercase tracking-wider">Batch Edit Assets</DialogTitle>
              <DialogDescription className="text-zinc-500 text-xs font-medium uppercase tracking-tight mt-1">
                Updating <span className="text-primary font-black">{selectedIds.length}</span> {assetType} records simultaneously
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {!isReassignMode ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Lifecycle Status</Label>
                <Select 
                   value={formData.status} 
                   onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className={cn(
                    "h-12 bg-zinc-900 border-border focus:ring-primary/20 rounded-2xl text-[11px] font-bold",
                    formErrors.status && "border-red-500/50"
                  )}>
                    <SelectValue placeholder="No change" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 rounded-xl">
                    <SelectItem value="PLAN" className="focus:bg-zinc-500/10 focus:text-zinc-400 font-bold text-[11px]">PLAN</SelectItem>
                    <SelectItem value="DEPLOYING" className="focus:bg-blue-500/10 focus:text-blue-500 font-bold text-[11px]">DEPLOYING</SelectItem>
                    <SelectItem value="ACTIVE" className="focus:bg-primary/10 focus:text-primary font-bold text-[11px]">ACTIVE</SelectItem>
                    <SelectItem value="MAINTENANCE" className="focus:bg-amber-500/10 focus:text-amber-500 font-bold text-[11px]">MAINTENANCE</SelectItem>
                    <SelectItem value="RETIRED" className="focus:bg-zinc-800/50 focus:text-zinc-600 font-bold text-[11px]">RETIRED</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.status && <p className="text-[10px] text-red-500 ml-1">{formErrors.status}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Health Condition</Label>
                <Select 
                   value={formData.healthStatus} 
                   onValueChange={(val) => setFormData({ ...formData, healthStatus: val })}
                >
                  <SelectTrigger className={cn(
                    "h-12 bg-zinc-900 border-border focus:ring-primary/20 rounded-2xl text-[11px] font-bold",
                    formErrors.healthStatus && "border-red-500/50"
                  )}>
                    <SelectValue placeholder="No change" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 rounded-xl">
                    <SelectItem value="UP" className="focus:bg-primary/10 focus:text-primary font-bold text-[11px]">UP</SelectItem>
                    <SelectItem value="DEGRADED" className="focus:bg-orange-500/10 focus:text-orange-500 font-bold text-[11px]">DEGRADED</SelectItem>
                    <SelectItem value="DOWN" className="focus:bg-red-500/10 focus:text-red-500 font-bold text-[11px]">DOWN</SelectItem>
                    <SelectItem value="BROKEN" className="focus:bg-red-900/10 focus:text-red-700 font-bold text-[11px]">BROKEN</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.healthStatus && <p className="text-[10px] text-red-500 ml-1">{formErrors.healthStatus}</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Target Parent {getParentType()}</Label>
              <div 
                onClick={() => setIsParentSelectorOpen(true)}
                className={cn(
                  "flex items-center justify-between h-12 bg-zinc-900 border border-border hover:border-blue-500/30 px-4 rounded-2xl text-sm font-bold cursor-pointer group transition-all",
                  formErrors.newParentId && "border-red-500/50"
                )}
              >
                {formData.newParentCode ? (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500 font-black">{formData.newParentCode}</span>
                    <span className="text-[10px] text-zinc-500 uppercase">Selected Parent</span>
                  </div>
                ) : (
                  <span className="text-zinc-600">Select new {getParentType()}...</span>
                )}
                <RefreshCw className="w-4 h-4 text-zinc-500 group-hover:text-blue-500 transition-colors" />
              </div>
              {formErrors.newParentId && <p className="text-[10px] text-red-500 ml-1">{formErrors.newParentId}</p>}
            </div>
          )}

          {!isReassignMode && (
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Change Reason (Required for Audit)</Label>
              <Input
                placeholder="e.g., Scheduled Maintenance, Area Outage..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className={cn(
                  "h-12 bg-zinc-900 border-border focus:border-primary/50 rounded-2xl text-sm font-medium",
                  formErrors.reason && "border-red-500/50"
                )}
              />
              {formErrors.reason && <p className="text-[10px] text-red-500 ml-1">{formErrors.reason}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Additional Notes (Optional)</Label>
            <Textarea
              placeholder="Provide more context for the history log..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-zinc-900 border-border focus:border-primary/50 rounded-2xl text-sm font-medium min-h-[100px] resize-none"
            />
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed text-zinc-400 font-medium">
              <span className="text-primary font-bold uppercase mr-1">Note:</span>
              This operation will be recorded in the audit history for each asset. Status propagation will be triggered automatically if applicable.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-12 px-6 rounded-2xl border border-border text-zinc-400 font-bold uppercase tracking-widest text-[10px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "h-12 px-8 rounded-2xl text-white font-black uppercase tracking-[0.15em] text-[10px] shadow-lg min-w-[140px]",
                isReassignMode 
                  ? "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20" 
                  : "bg-primary hover:bg-primary/90 shadow-emerald-500/20"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {isReassignMode ? "Execute Reassign" : "Execute Status Batch"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>

        <ParentSelectorDialog 
          open={isParentSelectorOpen}
          onOpenChange={setIsParentSelectorOpen}
          parentType={getParentType()}
          onSelect={(asset) => setFormData({ 
            ...formData, 
            newParentId: asset.id,
            newParentCode: asset.code
          })}
        />
      </DialogContent>
    </Dialog>
  );
}
