"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { SmartDataTable } from "@/components/dashboard/smart-data-table";
import { useOdpData } from "@/hooks/use-odp-data";
import { ODP } from "@/types/network";
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
import { OdpDialog } from "@/components/dashboard/odp-dialogs";
import { toast } from "sonner";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "next-auth/react";

export default function OdpListPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data, loading, pagination, setPagination, setSearch, refresh } =
    useOdpData();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedOdp, setSelectedOdp] = React.useState<ODP | null>(null);

  const handleCreate = React.useCallback(() => {
    setSelectedOdp(null);
    setIsDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback((odp: ODP) => {
    setSelectedOdp(odp);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = React.useCallback(
    async (odp: ODP) => {
      if (!session?.accessToken) return;
      if (!confirm(`Are you sure you want to delete ${odp.code}?`)) return;

      try {
        const baseUrl = getBackendBaseUrl();
        const res = await fetch(`${baseUrl}/network/odps/${odp.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (!res.ok) throw new Error("Failed to delete ODP");

        toast.success(`ODP ${odp.code} deleted successfully`);
        refresh();
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete ODP");
      }
    },
    [session?.accessToken, refresh],
  );

  const columns = React.useMemo<ColumnDef<ODP>[]>(
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
                    router.push(`/dashboard/map?flyTo=${odp.code}`)
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
                  onClick={() => handleDelete(odp)}
                >
                  Delete ODP
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
          onRefresh={refresh}
          loading={loading}
          pagination={{
            pageIndex: pagination.pageIndex,
            pageSize: pagination.pageSize,
            pageCount: pagination.pageCount,
            onPageChange: (index) =>
              setPagination((prev) => ({ ...prev, pageIndex: index })),
          }}
        />
      </div>

      <OdpDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        odp={selectedOdp}
        onSuccess={refresh}
      />
    </div>
  );
}
