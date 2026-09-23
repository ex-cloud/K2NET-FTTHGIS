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

export function OdcListPage() {
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";
  const [modalOpen, setModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const odcList = [
    {
      id: "odc-01",
      code: "ODC-DGO-01",
      name: "ODC Utama Cluster Dago Atas",
      oltName: "OLT ZTE C320 #01",
      capacity: 144,
      usedCapacity: 112,
      connectedOdpCount: 14,
      status: "ACTIVE",
      lat: -6.8854,
      lng: 107.6142,
    },
    {
      id: "odc-02",
      code: "ODC-DGO-02",
      name: "ODC Cluster Dago Asri",
      oltName: "OLT ZTE C320 #01",
      capacity: 144,
      usedCapacity: 86,
      connectedOdpCount: 10,
      status: "ACTIVE",
      lat: -6.8872,
      lng: 107.6168,
    },
    {
      id: "odc-03",
      code: "ODC-ARC-01",
      name: "ODC Arcamanik Endah",
      oltName: "OLT Huawei MA5608T #02",
      capacity: 288,
      usedCapacity: 198,
      connectedOdpCount: 22,
      status: "ACTIVE",
      lat: -6.9124,
      lng: 107.6821,
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: "Proyek", href: "/projects" },
          { label: "Inventory", href: `/project/${projectId}/inventory/odc` },
          { label: "ODC Cabinets" },
        ]}
        title="Daftar Kabinet ODC (Optical Distribution Cabinet)"
        actions={
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            + Tambah ODC Baru
          </Button>
        }
      />

      <PageContentShell className="space-y-4 custom-scrollbar">
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari kode ODC, nama, atau OLT..."
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
                <TableHead className="font-bold">KODE & NAMA ODC</TableHead>
                <TableHead className="font-bold">TERHUBUNG KE OLT</TableHead>
                <TableHead className="font-bold">KAPASITAS CORE</TableHead>
                <TableHead className="font-bold">TOTAL ODP TERHUBUNG</TableHead>
                <TableHead className="font-bold">STATUS</TableHead>
                <TableHead className="w-12 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {odcList.map((odc) => (
                <TableRow key={odc.id} className="text-xs">
                  <TableCell>
                    <div className="space-y-0.5">
                      <span className="font-bold font-mono text-primary block">{odc.code}</span>
                      <span className="text-muted-foreground text-[11px]">{odc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-foreground font-medium">
                    {odc.oltName}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <span className="font-mono font-bold text-foreground">
                        {odc.usedCapacity} / {odc.capacity} Core
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        ({Math.round((odc.usedCapacity / odc.capacity) * 100)}% Terpakai)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-semibold">
                    {odc.connectedOdpCount} ODP FAT
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {odc.status}
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
                        <DropdownMenuItem>Lihat di Peta Spasial</DropdownMenuItem>
                        <DropdownMenuItem>Kelola Port Splitter</DropdownMenuItem>
                        <DropdownMenuItem>Edit Informasi</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Hapus ODC</DropdownMenuItem>
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
        type="ODC"
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={projectId}
      />
    </div>
  );
}
