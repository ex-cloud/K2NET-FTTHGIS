"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { SmartDataTable } from "@/components/dashboard/smart-data-table";
import { useCustomerData } from "@/hooks/use-customer-data";
import { Customer } from "@/types/network";
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

const CustomerDialog = dynamic(() => import("@/components/dashboard/customer-dialogs").then(mod => mod.CustomerDialog), {
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

export default function CustomerListPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  
  const orgId = params?.orgId as string;
  const projectId = params?.projectId as string;
  
  const { setSelectedAsset } = useSelectionStore();
  const { data, loading, pagination, setPagination, setSearch, setSorting, setFilters, exportToCsv, refresh } =
    useCustomerData();
 
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [deleteReason, setDeleteReason] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [customerToDelete, setCustomerToDelete] = React.useState<Customer | null>(null);

  // Batch Edit State
  const [isBatchDialogOpen, setIsBatchDialogOpen] = React.useState(false);
  const [batchMode, setBatchMode] = React.useState<"STATUS_UPDATE" | "REASSIGN_PARENT">("STATUS_UPDATE");
  const [batchSelectedIds, setBatchSelectedIds] = React.useState<string[]>([]);

  const handleCreate = React.useCallback(() => {
    setSelectedCustomer(null);
    setIsDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = async () => {
    if (!customerToDelete || !session?.accessToken) return;
    
    if (!deleteReason.trim()) {
      toast.error("Please provide a reason for records removal");
      return;
    }

    setIsDeleting(true);
    try {
      await networkApi.deleteAsset("CUSTOMER", customerToDelete.id, deleteReason, session.accessToken as string, projectId as string);

      toast.success(`Customer ${customerToDelete.code} record removed`);
      setIsDeleteDialogOpen(false);
      setDeleteReason("");
      refresh();
    } catch (err) {
      console.error(err);
      toast.error("Registry error: Unable to remove customer record.");
    } finally {
      setIsDeleting(false);
      setCustomerToDelete(null);
    }
  };

  const openDeleteDialog = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteReason("");
    setIsDeleteDialogOpen(true);
  };

  const handleBulkDelete = async (selected: Customer[]) => {
    if (!confirm(`Are you sure you want to permanently delete ${selected.length} customer records?`)) return;
    
    const reason = prompt("Reason for bulk deletion:");
    if (!reason) return;

    try {
      await networkApi.batchDelete("CUSTOMER", selected.map(item => item.id), reason, session?.accessToken as string, projectId as string);
      toast.success(`Successfully deleted ${selected.length} customers`);
      refresh();
    } catch {
      toast.error("Bulk delete failed");
    }
  };

  const columns = React.useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "code",
        header: "CUST ID",
        cell: ({ row }) => (
          <span className="font-bold text-primary truncate block max-w-[150px]" title={row.getValue("code")}>
            {row.getValue("code")}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium text-zinc-200">
            {row.getValue("name")}
          </span>
        ),
      },
      {
        accessorKey: "address",
        header: "Address",
        cell: ({ row }) => (
          <span
            className="text-xs text-zinc-400 truncate max-w-[200px]"
            title={row.getValue("address")}
          >
            {row.getValue("address")}
          </span>
        ),
      },
      {
        header: "Connected to ODP",
        accessorKey: "odpCode",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-blue-400">
            {row.original.odpCode || "-"}
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
          const customer = row.original;
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
                    router.push(`/org/${orgId}/project/${projectId}/infrastructure/topology?flyTo=${customer.code}`)
                  }
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  View on Map
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-white/5"
                  onClick={() => handleEdit(customer)}
                >
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-red-500 hover:bg-red-500/10 hover:text-red-400"
                  onClick={() => openDeleteDialog(customer)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Customer
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
            Customer Database
          </h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">
            {data.length} Customers Registered
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleCreate}
            className="h-9 bg-primary hover:bg-primary/90 text-white font-bold px-4 shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" /> New Customer
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
          onRowClick={(cust) => setSelectedAsset({ ...cust, id: String(cust.id), type: "CUSTOMER" })}
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
              label: "Reassign ODP",
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
        assetType="CUSTOMER"
        mode={batchMode}
        onSuccess={refresh}
      />

      <CustomerDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        customer={selectedCustomer}
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
              PURGE CUSTOMER
            </DialogTitle>
            <DialogDescription className="text-zinc-400 font-medium">
              Are you sure you want to permanently delete record for <span className="text-white font-bold">{customerToDelete?.name}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cust-reason" className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Reason for Termination
              </Label>
              <Textarea
                id="cust-reason"
                placeholder="Specify reason (e.g., Unsubscription, Double record)..."
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
