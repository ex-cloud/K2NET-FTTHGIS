"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { SmartDataTable } from "@/components/dashboard/smart-data-table";
import { useOltData } from "@/hooks/use-olt-data";
import { OLT } from "@/types/network";
import { useSelectionStore } from "@/store/selection-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus, MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { OltDialog } from "@/components/dashboard/olt-dialogs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "next-auth/react";

export default function OltListPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { setSelectedAsset } = useSelectionStore();
  const { data, loading, pagination, setPagination, setSearch, exportToCsv, refresh } =
    useOltData();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedOlt, setSelectedOlt] = React.useState<OLT | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [oltToDelete, setOltToDelete] = React.useState<OLT | null>(null);

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
      const res = await fetch(`${baseUrl}/network/olts/${oltToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
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

  const columns = React.useMemo<ColumnDef<OLT>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-bold text-emerald-500">
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
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = (row.getValue("status") as string) || "UNKNOWN";
          return (
            <Badge
              variant={status === "UP" ? "outline" : "destructive"}
              className={
                status === "UP"
                  ? "border-emerald-500/50 text-emerald-500 bg-emerald-500/5"
                  : ""
              }
            >
              {status}
            </Badge>
          );
        },
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
                    `/dashboard/infrastructure/topology?search=${olt.code}`,
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
                        `/dashboard/infrastructure/topology?search=${olt.code}`,
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
                      setIsDeleting(true);
                    }}
                  >
                    Delete Device
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [router, handleEdit, handlePoll],
  );

  return (
    <div className="flex flex-col h-full bg-zinc-950 pt-24 pb-8 px-8 space-y-8 overflow-y-auto relative">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500/80 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Core Infrastructure Layer
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
            OLT Management
          </h1>
          <p className="text-sm text-zinc-400 max-w-lg leading-relaxed">
            Manage your Optical Line Terminals, IP configurations, and track
            real-time health across the backbone network.
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 px-6 shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
          onClick={handleCreate}
        >
          <Plus className="w-5 h-5 mr-3" />
          Add Core Device
        </Button>
      </div>

      <div className="bg-zinc-900/30 rounded-2xl p-1 border border-white/5">
        <SmartDataTable
          columns={columns}
          data={data}
          loading={loading}
          onSearchChange={setSearch}
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
        />
      </div>

      <OltDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        olt={selectedOlt}
        onSuccess={refresh}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to delete{" "}
              <strong>{oltToDelete?.code}</strong> ({oltToDelete?.name})? This
              action cannot be undone and will affect associated network
              monitoring.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              className="bg-zinc-900 border-white/5 text-white hover:bg-zinc-800"
              onClick={() => setIsDeleting(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
              onClick={handleDelete}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
