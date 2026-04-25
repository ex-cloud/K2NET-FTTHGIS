"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { SmartDataTable } from "@/components/dashboard/smart-data-table";
import { useOltData } from "@/hooks/use-olt-data";
import { OLT } from "@/types/network";
import { useSelectionStore } from "@/store/selection-store";
import { NetworkStatusBadge } from "@/components/dashboard/network-status-badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus, MapPin, Trash2, Layers } from "lucide-react";
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

const OltDialog = dynamic(() => import("@/components/dashboard/olt-dialogs").then(mod => mod.OltDialog), {
  ssr: false,
  loading: () => null
});

const BatchEditDialog = dynamic(() => import("@/components/dashboard/batch-edit-dialog").then(mod => mod.BatchEditDialog), {
  ssr: false,
  loading: () => null
});
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "next-auth/react";
import { httpClient } from "@/lib/httpClient";

export default function OltListPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  
  const orgId = params?.orgId as string;
  const projectId = params?.projectId as string;
  
  const { setSelectedAsset } = useSelectionStore();
  const { data, loading, pagination, setPagination, setSearch, setSorting, setFilters, exportToCsv, refresh } =
    useOltData();
 
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedOlt, setSelectedOlt] = React.useState<OLT | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteReason, setDeleteReason] = React.useState("");
  const [oltToDelete, setOltToDelete] = React.useState<OLT | null>(null);

  // Batch Edit State
  const [isBatchDialogOpen, setIsBatchDialogOpen] = React.useState(false);
  const [batchSelectedIds, setBatchSelectedIds] = React.useState<number[]>([]);

  const handleCreate = React.useCallback(() => {
    setSelectedOlt(null);
    setIsDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback((olt: OLT) => {
    setSelectedOlt(olt);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = async () => {
    if (!oltToDelete || !session?.accessToken) return;

    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/network/olts/${oltToDelete.id}`, {
        method: "DELETE",
        token: session.accessToken,
      });

      if (!res.ok) throw new Error("Failed to delete OLT");

      toast.success(`OLT ${oltToDelete.code} deleted successfully`);
      refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete OLT");
    } finally {
      setIsDeleting(false);
      setOltToDelete(null);
    }
  };

  const handlePoll = React.useCallback(
    async (olt: OLT) => {
      if (!session?.accessToken) return;
      toast.info(`Triggering SNMP poll for ${olt.code}...`);
      // Logic for polling will be integrated here
    },
    [session?.accessToken],
  );

  const handleBulkDelete = async (selected: OLT[]) => {
    if (!confirm(`Are you sure you want to permanently delete ${selected.length} OLT records?`)) return;
    
    const reason = prompt("Reason for bulk deletion:");
    if (!reason) return;

    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/network/assets/batch-delete?type=OLT&reason=${encodeURIComponent(reason)}`, {
        method: "DELETE",
        token: session?.accessToken,
        body: JSON.stringify(selected.map(item => item.id))
      });

      if (res.ok) {
        toast.success(`Successfully deleted ${selected.length} OLTs`);
        refresh();
      } else {
        throw new Error("Failed to bulk delete");
      }
    } catch {
      toast.error("Bulk delete failed");
    }
  };


  const columns = React.useMemo<ColumnDef<OLT>[]>(
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
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "ipAddress",
        header: "IP Address",
        cell: ({ row }) => (
          <span className="text-muted-foreground font-mono">
            {row.getValue("ipAddress") || "-"}
          </span>
        ),
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
          const olt = row.original;
          return (
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-emerald-500/10 hover:text-emerald-500"
                onClick={() => {
                  router.push(
                    `/org/${orgId}/project/${projectId}/infrastructure/topology?flyTo=${olt.code}`,
                  );
                }}
              >
                <MapPin className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-zinc-950/90 backdrop-blur-xl border-white/10 shadow-2xl"
                >
                  <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground px-2 py-1.5 font-bold tracking-widest">
                    Device Operations
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/org/${orgId}/project/${projectId}/infrastructure/topology?flyTo=${olt.code}`,
                      )
                    }
                  >
                    View Topology
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handlePoll(olt)}
                  >
                    Poll SNMP Now
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleEdit(olt)}
                  >
                    Edit Connection
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem
                    className="text-red-500 focus:text-white focus:bg-red-500 cursor-pointer"
                    onClick={() => {
                      setOltToDelete(olt);
                      setDeleteReason("");
                      setIsDeleting(true);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Device
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [router, handleEdit, handlePoll, orgId, projectId],
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex flex-row items-center justify-between px-8 py-4 border-b border-border bg-card/30">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            OLT Management
          </h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">
            {data.length} Nodes Found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleCreate}
            className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Core Device
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 pt-6">
        <SmartDataTable
          columns={columns}
          data={data}
          loading={loading}
          onSearchChange={setSearch}
          onSortingChange={setSorting}
          onColumnFiltersChange={setFilters}
          onRefresh={refresh}
          onExport={exportToCsv}
          onRowClick={(olt) => setSelectedAsset({ ...olt, id: String(olt.id), type: "OLT" })}
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
        assetType="OLT"
        onSuccess={refresh}
      />

      <OltDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        olt={selectedOlt}
        onSuccess={refresh}
      />

      {/* Modern Purge Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              PURGE DEVICE
            </DialogTitle>
            <DialogDescription className="text-zinc-400 font-medium">
              Are you sure you want to permanently delete OLT <span className="text-white font-bold">{oltToDelete?.code}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="olt-reason" className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Reason for Removal
              </Label>
              <Textarea
                id="olt-reason"
                placeholder="Why is this core device being removed?"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="bg-zinc-900/50 border-white/10 rounded-xl min-h-[80px] text-sm text-zinc-200 placeholder:text-zinc-600 focus:ring-red-500 resize-none font-medium"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              variant="ghost"
              className="text-zinc-500 hover:text-white h-11 font-bold"
              onClick={() => setIsDeleting(false)}
            >
              Abort
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-500 text-white font-black h-11 px-8 shadow-lg shadow-red-900/20 active:scale-95 transition-all"
              onClick={handleDelete}
              disabled={!deleteReason.trim()}
            >
              Confirm Purge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
