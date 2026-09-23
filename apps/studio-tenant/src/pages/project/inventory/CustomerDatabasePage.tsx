import * as React from "react";
import { useParams } from "@tanstack/react-router";
import {
  Plus,
  Search,
  MoreVertical,
  Signal,
} from "lucide-react";
import {
  PageHeader,
  PageContentShell,
  Card,
  Button,
  Input,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { AssetDialog } from "../../../components/inventory/AssetDialogs";

export function CustomerDatabasePage() {
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";
  const [modalOpen, setModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const customers = [
    {
      id: "cust-01",
      customerCode: "CUST-08421",
      name: "Bambang Sudarmono",
      package: "50 Mbps Ultra Home",
      odpCode: "ODP-DGO-01",
      portIndex: 4,
      ontSn: "ZTEGC84A12B9",
      signalDbm: -18.2,
      status: "ONLINE",
      address: "Jl. Dago Asri No. 14",
    },
    {
      id: "cust-02",
      customerCode: "CUST-08422",
      name: "Ibu Ratna Juwita",
      package: "100 Mbps Gamer Pro",
      odpCode: "ODP-DGO-01",
      portIndex: 5,
      ontSn: "HWTC99A041C2",
      signalDbm: -19.4,
      status: "ONLINE",
      address: "Jl. Dago Asri No. 16",
    },
    {
      id: "cust-03",
      customerCode: "CUST-08423",
      name: "Cafe Kopi Kembara",
      package: "200 Mbps B2B Dedicated",
      odpCode: "ODP-DGO-02",
      portIndex: 1,
      ontSn: "ZTEGC11F8890",
      signalDbm: -17.1,
      status: "ONLINE",
      address: "Jl. Ir. H. Juanda No. 182",
    },
    {
      id: "cust-04",
      customerCode: "CUST-08424",
      name: "Ahmad Maulana",
      package: "30 Mbps Family",
      odpCode: "ODP-DGO-03",
      portIndex: 2,
      ontSn: "FHTT0412889A",
      signalDbm: -26.8,
      status: "HIGH_ATTENUATION",
      address: "Komplek Dago Permai Blok C-8",
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: "Proyek", href: "/projects" },
          { label: "Inventory", href: `/project/${projectId}/inventory/customers` },
          { label: "Database Pelanggan" },
        ]}
        title="Database Pelanggan & Sambungan Homepass"
        actions={
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="h-8 px-3 text-xs font-medium gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            + Registrasi Pelanggan
          </Button>
        }
      />

      <PageContentShell className="space-y-4 custom-scrollbar">
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari ID pelanggan, nama, atau ODP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-muted/20"
            />
          </div>
        </div>

        <Card className="border-border/60 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px]">
                <TableHead className="font-bold">ID & NAMA PELANGGAN</TableHead>
                <TableHead className="font-bold">PAKET INTERNET</TableHead>
                <TableHead className="font-bold">ODP & PORT</TableHead>
                <TableHead className="font-bold">ONT SERIAL NUMBER</TableHead>
                <TableHead className="font-bold">RX SIGNAL (DBM)</TableHead>
                <TableHead className="font-bold">STATUS</TableHead>
                <TableHead className="w-12 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id} className="text-xs">
                  <TableCell>
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground block">{c.name}</span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {c.customerCode} • {c.address}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {c.package}
                  </TableCell>
                  <TableCell className="font-mono text-primary font-semibold">
                    {c.odpCode} (Port #{c.portIndex})
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {c.ontSn}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-mono font-bold">
                      <Signal className="h-3.5 w-3.5 text-primary" />
                      <span
                        className={
                          c.signalDbm < -25
                            ? "text-rose-600 dark:text-rose-400 font-bold"
                            : "text-primary"
                        }
                      >
                        {c.signalDbm} dBm
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        c.status === "ONLINE"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {c.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs">
                        <DropdownMenuItem>Pindai Sinyal ONT</DropdownMenuItem>
                        <DropdownMenuItem>Lihat Sambungan di Peta</DropdownMenuItem>
                        <DropdownMenuItem>Edit Profil</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Putus Sambungan</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </PageContentShell>

      <AssetDialog
        type="CUSTOMER"
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={projectId}
      />
    </div>
  );
}
