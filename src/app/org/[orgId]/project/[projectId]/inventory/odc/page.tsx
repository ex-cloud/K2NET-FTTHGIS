"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { SmartDataTable } from "@/components/dashboard/smart-data-table";
import { useOdcData } from "@/hooks/use-odc-data";
import { ODC } from "@/types/network";
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
import { OdcDialog } from "@/components/dashboard/odc-dialogs";
import { toast } from "sonner";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "next-auth/react";

export default function OdcListPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { setSelectedAsset } = useSelectionStore();
  const { data, loading, pagination, setPagination, setSearch, exportToCsv, refresh } =
    useOdcData();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedOdc, setSelectedOdc] = React.useState<ODC | null>(null);

  const handleCreate = React.useCallback(() => {
    setSelectedOdc(null);
    setIsDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback((odc: ODC) => {
    setSelectedOdc(odc);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = React.useCallback(
    async (odc: ODC) => {
      if (!session?.accessToken) return;
      if (!confirm(`Are you sure you want to delete ${odc.code}?`)) return;

      try {
        const baseUrl = getBackendBaseUrl();
        const res = await fetch(`${baseUrl}/network/odcs/${odc.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (!res.ok) throw new Error("Failed to delete ODC");

        toast.success(`ODC ${odc.code} deleted successfully`);
        refresh();
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete ODC");
      }
    },
    [session?.accessToken, refresh],
  );

  const columns = React.useMemo<ColumnDef<ODC>[]>(
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
                <span className={pct > 80 ? "text-red-500" : "text-emerald-500"}>{pct}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden border border-white/5">
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
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          let variant: "default" | "destructive" | "outline" | "secondary" =
            "default";
          if (status === "DOWN" || status === "BROKEN") variant = "destructive";
          if (status === "MAINTENANCE") variant = "secondary";
          if (status === "PLANNING") variant = "outline";

          return <Badge variant={variant}>{status}</Badge>;
        },
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
                    router.push(`/dashboard/map?flyTo=${odc.code}`)
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
                  onClick={() => handleDelete(odc)}
                >
                  Delete Cabinet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [handleEdit, handleDelete, router],
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
            className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 shadow-sm"
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
        />
      </div>

      <OdcDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        odc={selectedOdc}
        onSuccess={refresh}
      />
    </div>
  );
}
