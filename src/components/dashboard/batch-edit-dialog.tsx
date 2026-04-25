"use client";

import * as React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, AlertCircle, CheckCircle2, Layers, RefreshCw } from "lucide-react";
import { httpClient } from "@/lib/httpClient";
import { toast } from "sonner";
import { ParentSelectorDialog } from "./parent-selector-dialog";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { getBackendBaseUrl } from "@/lib/api-config";

interface BatchEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
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
  const params = useParams();
  const projectId = params?.projectId;
  const { data: session } = useSession();
  
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    status: "",
    healthStatus: "",
    reason: "",
    notes: "",
    newParentId: null as number | null,
    newParentCode: ""
  });
  const [isParentSelectorOpen, setIsParentSelectorOpen] = React.useState(false);

  const isReassignMode = mode === "REASSIGN_PARENT";
  
  const getParentType = () => {
    if (assetType === "ODP") return "ODC";
    if (assetType === "ODC") return "OLT";
    if (assetType === "CUSTOMER") return "ODP";
    return "ODP"; // Fallback
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReassignMode && !formData.status && !formData.healthStatus) {
      toast.error("Please select at least one status to update");
      return;
    }
    
    if (!formData.reason && !isReassignMode) {
      toast.error("Please provide a reason for the update");
      return;
    }

    setLoading(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const response = await httpClient(`${baseUrl}/api/v1/network/assets/batch-update`, {
        method: "POST",
        token: session?.accessToken,
        projectId: projectId as string,
        body: JSON.stringify({
          ids: selectedIds,
          type: assetType,
          status: isReassignMode ? undefined : (formData.status || undefined),
          healthStatus: isReassignMode ? undefined : (formData.healthStatus || undefined),
          reason: isReassignMode ? "Bulk Reassignment" : formData.reason,
          notes: formData.notes,
          newParentId: isReassignMode ? formData.newParentId : undefined
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully processed ${result.count} assets`);
        onSuccess();
        onOpenChange(false);
        setFormData({ status: "", healthStatus: "", reason: "", notes: "", newParentId: null, newParentCode: "" });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to process assets");
      }
    } catch (error: unknown) {
      console.error("Batch update error:", error);
      toast.error("An error occurred during batch update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-white/5 rounded-3xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-zinc-900/50 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Layers className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white uppercase tracking-wider">Batch Edit Assets</DialogTitle>
              <DialogDescription className="text-zinc-500 text-xs font-medium uppercase tracking-tight mt-1">
                Updating <span className="text-emerald-500 font-black">{selectedIds.length}</span> {assetType} records simultaneously
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
                  <SelectTrigger className="h-12 bg-zinc-900 border-white/5 focus:ring-emerald-500/20 rounded-2xl text-[11px] font-bold">
                    <SelectValue placeholder="No change" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 rounded-xl">
                    <SelectItem value="PLAN" className="focus:bg-zinc-500/10 focus:text-zinc-400 font-bold text-[11px]">PLAN</SelectItem>
                    <SelectItem value="DEPLOYING" className="focus:bg-blue-500/10 focus:text-blue-500 font-bold text-[11px]">DEPLOYING</SelectItem>
                    <SelectItem value="ACTIVE" className="focus:bg-emerald-500/10 focus:text-emerald-500 font-bold text-[11px]">ACTIVE</SelectItem>
                    <SelectItem value="MAINTENANCE" className="focus:bg-amber-500/10 focus:text-amber-500 font-bold text-[11px]">MAINTENANCE</SelectItem>
                    <SelectItem value="RETIRED" className="focus:bg-zinc-800/50 focus:text-zinc-600 font-bold text-[11px]">RETIRED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Health Condition</Label>
                <Select 
                  value={formData.healthStatus} 
                  onValueChange={(val) => setFormData({ ...formData, healthStatus: val })}
                >
                  <SelectTrigger className="h-12 bg-zinc-900 border-white/5 focus:ring-emerald-500/20 rounded-2xl text-[11px] font-bold">
                    <SelectValue placeholder="No change" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 rounded-xl">
                    <SelectItem value="UP" className="focus:bg-emerald-500/10 focus:text-emerald-500 font-bold text-[11px]">UP</SelectItem>
                    <SelectItem value="DEGRADED" className="focus:bg-orange-500/10 focus:text-orange-500 font-bold text-[11px]">DEGRADED</SelectItem>
                    <SelectItem value="DOWN" className="focus:bg-red-500/10 focus:text-red-500 font-bold text-[11px]">DOWN</SelectItem>
                    <SelectItem value="BROKEN" className="focus:bg-red-900/10 focus:text-red-700 font-bold text-[11px]">BROKEN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Target Parent {getParentType()}</Label>
              <div 
                onClick={() => setIsParentSelectorOpen(true)}
                className="flex items-center justify-between h-12 bg-zinc-900 border border-white/5 hover:border-blue-500/30 px-4 rounded-2xl text-sm font-bold cursor-pointer group transition-all"
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
            </div>
          )}

          {!isReassignMode && (
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Change Reason (Required for Audit)</Label>
              <Input
                placeholder="e.g., Scheduled Maintenance, Area Outage..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="h-12 bg-zinc-900 border-white/5 focus:border-emerald-500/50 rounded-2xl text-sm font-medium"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Additional Notes (Optional)</Label>
            <Textarea
              placeholder="Provide more context for the history log..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-zinc-900 border-white/5 focus:border-emerald-500/50 rounded-2xl text-sm font-medium min-h-[100px] resize-none"
            />
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed text-zinc-400 font-medium">
              <span className="text-emerald-500 font-bold uppercase mr-1">Note:</span>
              This operation will be recorded in the audit history for each asset. Status propagation will be triggered automatically if applicable.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-12 px-6 rounded-2xl border border-white/5 text-zinc-400 font-bold uppercase tracking-widest text-[10px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || (isReassignMode && !formData.newParentId)}
              className={cn(
                "h-12 px-8 rounded-2xl text-white font-black uppercase tracking-[0.15em] text-[10px] shadow-lg min-w-[140px]",
                isReassignMode 
                  ? "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20" 
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
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
            newParentId: Number(asset.id),
            newParentCode: asset.code
          })}
        />
      </DialogContent>
    </Dialog>
  );
}
