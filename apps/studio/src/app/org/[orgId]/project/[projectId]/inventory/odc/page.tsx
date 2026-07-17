"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { SmartDataTable } from "@/components/dashboard/smart-data-table";
import { useOdcData } from "@/hooks/use-odc-data";
import { ODC } from "@/types/network";
import { useSelectionStore } from "@/store/selection-store";
import { NetworkStatusBadge } from "@/components/dashboard/network-status-badge";
import { Button } from "@k2net/ui";
import { MoreHorizontal, Plus, MapPin, Layers, RefreshCw, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@k2net/ui";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";

const OdcDialog = dynamic(() => import("@/components/dashboard/odc-dialogs").then(mod => mod.OdcDialog), {
  ssr: false,
  loading: () => null
});

const BatchEditDialog = dynamic(() => import("@/components/dashboard/batch-edit-dialog").then(mod => mod.BatchEditDialog), {
  ssr: false,
  loading: () => null
});
import { Textarea } from "@k2net/ui";
import { toast } from "sonner";
import { networkApi } from "@/lib/api/network";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@k2net/ui";
import { Label } from "@k2net/ui";

export default function OdcListPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  
  const orgId = params?.orgId as string;
  const projectId = params?.projectId as string;
  
  const { setSelectedAsset } = useSelectionStore();
  const { data, loading, pagination, setPagination, setSearch, setSorting, setFilters, exportToCsv, refresh } =
    useOdcData();
 
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedOdc, setSelectedOdc] = React.useState<ODC | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [deleteReason, setDeleteReason] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [odcToDelete, setOdcToDelete] = React.useState<ODC | null>(null);

  // Batch Edit State
  const [isBatchDialogOpen, setIsBatchDialogOpen] = React.useState(false);
  const [batchMode, setBatchMode] = React.useState<"STATUS_UPDATE" | "REASSIGN_PARENT">("STATUS_UPDATE");
  const [batchSelectedIds, setBatchSelectedIds] = React.useState<string[]>([]);

  const handleCreate = React.useCallback(() => {
    setSelectedOdc(null);
    setIsDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback((odc: ODC) => {
    setSelectedOdc(odc);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = async () => {
    if (!odcToDelete || !session?.accessToken) return;
    
    if (!deleteReason.trim()) {
      toast.error("Please provide a reason for deletion");
      return;
    }

    setIsDeleting(true);
    try {
      await networkApi.deleteAsset("ODC", odcToDelete.id, deleteReason, session.accessToken as string, projectId as string);

      toast.success(`ODC ${odcToDelete.code} purged from registry`);
      setIsDeleteDialogOpen(false);
      setDeleteReason("");
      refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete ODC record");
    } finally {
      setIsDeleting(false);
      setOdcToDelete(null);
    }
  };

  const openDeleteDialog = (odc: ODC) => {
    setOdcToDelete(odc);
    setDeleteReason("");
    setIsDeleteDialogOpen(true);
  };

  const handleBulkDelete = async (selected: ODC[]) => {
    if (!confirm(`Are you sure you want to permanently delete ${selected.length} ODC records?`)) return;
    
    const reason = prompt("Reason for bulk deletion:");
    if (!reason) return;

    try {
      await networkApi.batchDelete("ODC", selected.map(item => item.id), reason, session?.accessToken as string, projectId as string);
      toast.success(`Successfully deleted ${selected.length} ODCs`);
      refresh();
    } catch {
      toast.error("Bulk delete failed");
    }
  };

  const columns = React.useMemo<ColumnDef<ODC>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-bold text-primary truncate block max-w-[200px]" title={row.getValue("code")}>
            {row.getValue("code")}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        header: "Parent OLT",
        accessorKey: "oltCode",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-mono text-xs text-zinc-400">
              {row.original.oltCode || "-"}
            </span>
            <span className="text-xs truncate max-w-[150px]">
              {row.original.oltName}
            </span>
          </div>
        ),
      },
      {
        header: "Capacity",
        cell: ({ row }) => {
          const cap = row.original.capacity || 144;
          const used = row.original.usedCapacity || 0;
          const pct = Math.round((used / cap) * 100);
          return (
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                <span className="text-muted-foreground">{used} / {cap} Cores</span>
                <span className={pct > 80 ? "text-red-500" : "text-primary"}>{pct}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden border border-border">
                <div
                  className={`h-full transition-all duration-500 ${
                    pct > 90 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" : 
                    pct > 70 ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" : 
                    "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                  }`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "lastNote",
        header: "Catatan Terakhir",
        cell: ({ row }) => (
          <div 
            className="max-w-[180px] truncate text-xs text-zinc-400 italic" 
            title={row.getValue("lastNote")}
          >
            {row.getValue("lastNote") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <NetworkStatusBadge 
            status={row.original.status} 
            healthStatus={row.original.healthStatus} 
          />
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const odc = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-zinc-950 border-white/10 text-white"
              >
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-white/5"
                  onClick={() =>
                    router.push(`/org/${orgId}/project/${projectId}/infrastructure/topology?flyTo=${odc.code}`)
                  }
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  View on Map
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-white/5"
                  onClick={() => handleEdit(odc)}
                >
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-red-500 hover:bg-red-500/10 hover:text-red-400"
                  onClick={() => openDeleteDialog(odc)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete ODC
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [handleEdit, orgId, projectId, router],
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex flex-row items-center justify-between px-8 py-4 border-b border-border bg-card/30">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Optical Distribution Cabinets
          </h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">
            {data.length} Cabinets Found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleCreate}
            className="h-9 bg-primary hover:bg-primary/90 text-white font-bold px-4 shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" /> New ODC
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 pt-6">
        <SmartDataTable
          columns={columns}
          data={data}
          onSearchChange={setSearch}
          onSortingChange={setSorting}
          onColumnFiltersChange={setFilters}
          onRefresh={refresh}
          onExport={exportToCsv}
          onRowClick={(odc) => setSelectedAsset({ ...odc, id: String(odc.id), type: "ODC" })}
          loading={loading}
          pagination={{
            pageIndex: pagination.pageIndex,
            pageSize: pagination.pageSize,
            pageCount: pagination.pageCount,
            totalCount: pagination.totalCount,
            onPageChange: (index) =>
              setPagination((prev) => ({ ...prev, pageIndex: index })),
          }}
          bulkActions={[
            {
              label: "Batch Edit",
              icon: <Layers className="w-3 h-3" />,
              variant: "emerald",
              onClick: (selected) => {
                setBatchMode("STATUS_UPDATE");
                setBatchSelectedIds(selected.map(item => item.id));
                setIsBatchDialogOpen(true);
              }
            },
            {
              label: "Reassign OLT",
              icon: <RefreshCw className="w-3 h-3" />,
              variant: "blue",
              onClick: (selected) => {
                setBatchMode("REASSIGN_PARENT");
                setBatchSelectedIds(selected.map(item => item.id));
                setIsBatchDialogOpen(true);
              }
            },
            {
              label: "Delete Selected",
              icon: <Trash2 className="w-3 h-3" />,
              variant: "destructive",
              onClick: (selected) => {
                handleBulkDelete(selected);
              }
            }
          ]}
        />
      </div>

      <BatchEditDialog
        open={isBatchDialogOpen}
        onOpenChange={setIsBatchDialogOpen}
        selectedIds={batchSelectedIds}
        assetType="ODC"
        mode={batchMode}
        onSuccess={refresh}
      />

      <OdcDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        odc={selectedOdc}
        onSuccess={refresh}
      />

      {/* Modern Purge Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              DELETE CABINET
            </DialogTitle>
            <DialogDescription className="text-zinc-400 font-medium">
              Are you sure you want to permanently delete ODC <span className="text-white font-bold">{odcToDelete?.code}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="odc-reason" className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Reason for Removal
              </Label>
              <Textarea
                id="odc-reason"
                placeholder="Why is this cabinet being removed?"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="bg-zinc-900/50 border-white/10 rounded-xl min-h-[80px] text-sm text-zinc-200 placeholder:text-zinc-600 focus:ring-red-500 resize-none font-medium"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="text-zinc-500 hover:text-white font-bold"
            >
              Abort
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting || !deleteReason.trim()}
              className="bg-red-600 hover:bg-red-500 text-white font-black px-8 shadow-lg shadow-red-900/20"
            >
              {isDeleting ? "Purging..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
