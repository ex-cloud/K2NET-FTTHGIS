"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { SmartDataTable } from "@/components/dashboard/smart-data-table";
import { useOdpData } from "@/hooks/use-odp-data";
import { ODP } from "@/types/network";
import { useSelectionStore } from "@/store/selection-store";
import { NetworkStatusBadge } from "@/components/dashboard/network-status-badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus, MapPin, Layers, RefreshCw, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";

const OdpDialog = dynamic(() => import("@/components/dashboard/odp-dialogs").then(mod => mod.OdpDialog), {
  ssr: false,
  loading: () => null
});

const BatchEditDialog = dynamic(() => import("@/components/dashboard/batch-edit-dialog").then(mod => mod.BatchEditDialog), {
  ssr: false,
  loading: () => null
});
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "next-auth/react";
import { httpClient } from "@/lib/httpClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function OdpListPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  
  const orgId = params?.orgId as string;
  const projectId = params?.projectId as string;
  
  const { setSelectedAsset } = useSelectionStore();
  const { data, loading, pagination, setPagination, setSearch, setSorting, setFilters, exportToCsv, refresh } =
    useOdpData();
 
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedOdp, setSelectedOdp] = React.useState<ODP | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [deleteReason, setDeleteReason] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [odpToDelete, setOdpToDelete] = React.useState<ODP | null>(null);
  
  // Batch Edit State
  const [isBatchDialogOpen, setIsBatchDialogOpen] = React.useState(false);
  const [batchMode, setBatchMode] = React.useState<"STATUS_UPDATE" | "REASSIGN_PARENT">("STATUS_UPDATE");
  const [batchSelectedIds, setBatchSelectedIds] = React.useState<number[]>([]);

  const handleCreate = React.useCallback(() => {
    setSelectedOdp(null);
    setIsDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback((odp: ODP) => {
    setSelectedOdp(odp);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = async () => {
    if (!odpToDelete || !session?.accessToken) return;
    
    if (!deleteReason.trim()) {
      toast.error("Please provide a reason for deletion");
      return;
    }

    setIsDeleting(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const url = new URL(`${baseUrl}/network/odps/${odpToDelete.id}`);
      url.searchParams.append("reason", deleteReason);

      const res = await httpClient(url.toString(), {
        method: "DELETE",
        token: session.accessToken,
      });

      if (!res.ok) throw new Error("Failed to delete ODP");

      toast.success(`ODP ${odpToDelete.code} purged from registry`);
      setIsDeleteDialogOpen(false);
      setDeleteReason("");
      refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete ODP record");
    } finally {
      setIsDeleting(false);
      setOdpToDelete(null);
    }
  };

  const openDeleteDialog = (odp: ODP) => {
    setOdpToDelete(odp);
    setDeleteReason("");
    setIsDeleteDialogOpen(true);
  };

  const handleBulkDelete = async (selected: ODP[]) => {
    if (!confirm(`Are you sure you want to permanently delete ${selected.length} ODP records?`)) return;
    
    const reason = prompt("Reason for bulk deletion:");
    if (!reason) return;

    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/network/assets/batch-delete?type=ODP&reason=${encodeURIComponent(reason)}`, {
        method: "DELETE",
        token: session?.accessToken,
        body: JSON.stringify(selected.map(item => item.id))
      });

      if (res.ok) {
        toast.success(`Successfully deleted ${selected.length} ODPs`);
        refresh();
      } else {
        throw new Error("Failed to bulk delete");
      }
    } catch {
      toast.error("Bulk delete failed");
    }
  };

  const columns = React.useMemo<ColumnDef<ODP>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-bold text-emerald-500 truncate block max-w-[200px]" title={row.getValue("code")}>
            {row.getValue("code")}
          </span>
        ),
      },
      {
        header: "Parent ODC",
        accessorKey: "odcCode",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-mono text-xs text-zinc-400">
              {row.original.odcCode || "-"}
            </span>
            <span className="text-xs truncate max-w-[150px]">
              {row.original.odcName}
            </span>
          </div>
        ),
      },
      {
        header: "Port Usage",
        cell: ({ row }) => {
          const total = row.original.totalPort || 8;
          const used = row.original.usedPort || 0;
          const pct = Math.round((used / total) * 100);
          return (
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                <span className="text-muted-foreground">{used} / {total} Ports</span>
                <span className={pct > 80 ? "text-amber-500 font-black" : "text-emerald-500"}>{pct}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div
                  className={`h-full transition-all duration-700 ease-out ${
                    pct > 90 ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]" : 
                    pct > 75 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]" : 
                    "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
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
          const odp = row.original;
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
                    router.push(`/org/${orgId}/project/${projectId}/infrastructure/topology?flyTo=${odp.code}`)
                  }
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  View on Map
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-white/5"
                  onClick={() => handleEdit(odp)}
                >
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-red-500 hover:bg-red-500/10 hover:text-red-400"
                  onClick={() => openDeleteDialog(odp)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete ODP
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
            Optical Distribution Points
          </h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">
            {data.length} Points Found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleCreate}
            className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" /> New ODP
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
          onRowClick={(odp) => setSelectedAsset({ ...odp, id: String(odp.id), type: "ODP" })}
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
              label: "Reassign ODC",
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
        assetType="ODP"
        mode={batchMode}
        onSuccess={refresh}
      />

      <OdpDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        odp={selectedOdp}
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
              DELETE ASSET
            </DialogTitle>
            <DialogDescription className="text-zinc-400 font-medium">
              Are you sure you want to permanently delete ODP <span className="text-white font-bold">{odpToDelete?.code}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="row-reason" className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Reason for Removal
              </Label>
              <Textarea
                id="row-reason"
                placeholder="Why is this asset being removed?"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="bg-zinc-900/50 border-white/10 rounded-xl min-h-[80px] text-sm text-zinc-200 placeholder:text-zinc-600 focus:ring-red-500 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="text-zinc-500 hover:text-white"
            >
              Abort
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting || !deleteReason.trim()}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 shadow-lg shadow-red-900/20"
            >
              {isDeleting ? "Purging..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
