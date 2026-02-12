"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { SmartDataTable } from "@/components/dashboard/smart-data-table";
import { useCustomerData } from "@/hooks/use-customer-data";
import { Customer } from "@/types/network";
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
import { CustomerDialog } from "@/components/dashboard/customer-dialogs";
import { toast } from "sonner";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "next-auth/react";

export default function CustomerListPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data, loading, pagination, setPagination, setSearch, refresh } =
    useCustomerData();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    React.useState<Customer | null>(null);

  const handleCreate = React.useCallback(() => {
    setSelectedCustomer(null);
    setIsDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = React.useCallback(
    async (customer: Customer) => {
      if (!session?.accessToken) return;
      if (!confirm(`Are you sure you want to delete ${customer.code}?`)) return;

      try {
        const baseUrl = getBackendBaseUrl();
        const res = await fetch(`${baseUrl}/network/customers/${customer.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (!res.ok) throw new Error("Failed to delete customer");

        toast.success(`Customer ${customer.code} deleted successfully`);
        refresh();
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete customer");
      }
    },
    [session?.accessToken, refresh],
  );

  const columns = React.useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "code",
        header: "CUST ID",
        cell: ({ row }) => (
          <span className="font-bold text-emerald-500">
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
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          let variant: "default" | "destructive" | "outline" | "secondary" =
            "default";
          if (status === "TERMINATED") variant = "destructive";
          if (status === "SUSPENDED") variant = "secondary";
          if (status === "ACTIVE") variant = "default";

          return (
            <Badge
              variant={variant}
              className={
                status === "ACTIVE"
                  ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/20"
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
                    router.push(`/dashboard/map?flyTo=${customer.code}`)
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
                  onClick={() => handleDelete(customer)}
                >
                  Delete Record
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
    <div className="flex flex-col h-full space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Customer Management
          </h2>
          <p className="text-muted-foreground">
            View and manage all connected customers and their termination
            status.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleCreate}
            className="bg-emerald-600 hover:bg-emerald-500 font-bold text-white"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-md border border-white/10 bg-black/20 backdrop-blur-sm">
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

      <CustomerDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        customer={selectedCustomer}
        onSuccess={refresh}
      />
    </div>
  );
}
