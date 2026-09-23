import * as React from "react";
import { useParams } from "@tanstack/react-router";
import {
  Plus,
  Search,
  MoreVertical,
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

export function OdpListPage() {
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";
  const [modalOpen, setModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const odpList = [
    {
      id: "odp-01",
      code: "ODP-DGO-01",
      name: "ODP FAT Tiang PLN 12",
      odcName: "ODC-DGO-01",
      totalPort: 16,
      usedPort: 14,
      splitterRatio: "1:16",
      status: "ACTIVE",
      avgSignalDbm: -18.4,
    },
    {
      id: "odp-02",
      code: "ODP-DGO-02",
      name: "ODP FAT Tiang PLN 18",
      odcName: "ODC-DGO-01",
      totalPort: 16,
      usedPort: 16,
      splitterRatio: "1:16",
      status: "FULL",
      avgSignalDbm: -19.1,
    },
    {
      id: "odp-03",
      code: "ODP-DGO-03",
      name: "ODP FAT Cluster Blok B",
      odcName: "ODC-DGO-02",
      totalPort: 8,
      usedPort: 4,
      splitterRatio: "1:8",
      status: "ACTIVE",
      avgSignalDbm: -17.2,
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: "Proyek", href: "/projects" },
          { label: "Inventory", href: `/project/${projectId}/inventory/odp` },
          { label: "ODP FAT Boxes" },
        ]}
        title="Daftar Kotak ODP (Optical Distribution Point)"
        actions={
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            + Tambah ODP Baru
          </Button>
        }
      />

      <PageContentShell className="space-y-4 custom-scrollbar">
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari kode ODP, nama, atau ODC induk..."
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
                <TableHead className="font-bold">KODE & NAMA ODP</TableHead>
                <TableHead className="font-bold">INDUK ODC</TableHead>
                <TableHead className="font-bold">PORT DROP TERPASANG</TableHead>
                <TableHead className="font-bold">SPLITTER RATIO</TableHead>
                <TableHead className="font-bold">RATA-RATA RX DBM</TableHead>
                <TableHead className="font-bold">STATUS</TableHead>
                <TableHead className="w-12 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {odpList.map((odp) => (
                <TableRow key={odp.id} className="text-xs">
                  <TableCell>
                    <div className="space-y-0.5">
                      <span className="font-bold font-mono text-primary block">{odp.code}</span>
                      <span className="text-muted-foreground text-[11px]">{odp.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-medium text-foreground">
                    {odp.odcName}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <span className="font-mono font-bold text-foreground">
                        {odp.usedPort} / {odp.totalPort} Port
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        ({Math.round((odp.usedPort / odp.totalPort) * 100)}% Terpakai)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {odp.splitterRatio}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-primary">
                    {odp.avgSignalDbm} dBm
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        odp.status === "ACTIVE"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {odp.status}
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
                        <DropdownMenuItem>Lihat Sambungan Pelanggan</DropdownMenuItem>
                        <DropdownMenuItem>Buka di Peta Spasial</DropdownMenuItem>
                        <DropdownMenuItem>Edit ODP</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Hapus ODP</DropdownMenuItem>
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
        type="ODP"
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={projectId}
      />
    </div>
  );
}
