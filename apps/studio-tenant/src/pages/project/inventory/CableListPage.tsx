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
  Badge,
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

export function CableListPage() {
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";
  const [modalOpen, setModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const cables = [
    {
      id: "cbl-01",
      code: "CBL-FDR-DGO-01",
      type: "FEEDER",
      coreCount: 48,
      usedCore: 32,
      lengthMeters: 2450,
      startNode: "OLT-ZTE-01",
      endNode: "ODC-DGO-01",
      status: "ACTIVE",
    },
    {
      id: "cbl-02",
      code: "CBL-DST-DGO-04",
      type: "DISTRIBUTION",
      coreCount: 24,
      usedCore: 16,
      lengthMeters: 850,
      startNode: "ODC-DGO-01",
      endNode: "ODP-DGO-04",
      status: "ACTIVE",
    },
    {
      id: "cbl-03",
      code: "CBL-DST-DGO-05",
      type: "DISTRIBUTION",
      coreCount: 24,
      usedCore: 24,
      lengthMeters: 620,
      startNode: "ODC-DGO-01",
      endNode: "ODP-DGO-05",
      status: "FULL",
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: "Proyek", href: "/projects" },
          { label: "Inventory", href: `/project/${projectId}/inventory/cable` },
          { label: "Kabel Optik" },
        ]}
        title="Daftar Bentang Kabel Fiber Optik"
        actions={
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="h-8 px-3 text-xs font-medium gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            + Tambah Kabel Baru
          </Button>
        }
      />

      <PageContentShell className="space-y-4 custom-scrollbar">
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari kode kabel, node asal atau tujuan..."
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
                <TableHead className="font-bold">KODE KABEL</TableHead>
                <TableHead className="font-bold">JENIS SEGMENT</TableHead>
                <TableHead className="font-bold">TOTAL CORE</TableHead>
                <TableHead className="font-bold">PANJANG BENTANG</TableHead>
                <TableHead className="font-bold">RUTE NODE (ASAL → TUJUAN)</TableHead>
                <TableHead className="font-bold">STATUS</TableHead>
                <TableHead className="w-12 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cables.map((c) => (
                <TableRow key={c.id} className="text-xs">
                  <TableCell className="font-mono font-bold text-primary">
                    {c.code}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {c.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-bold text-foreground">
                      {c.usedCore} / {c.coreCount} Core
                    </span>
                  </TableCell>
                  <TableCell className="font-mono font-semibold text-foreground">
                    {c.lengthMeters} m ({ (c.lengthMeters / 1000).toFixed(2) } Km)
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {c.startNode} → {c.endNode}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        c.status === "ACTIVE"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
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
                        <DropdownMenuItem>Trace Jalur Optik</DropdownMenuItem>
                        <DropdownMenuItem>Lihat di Map Studio</DropdownMenuItem>
                        <DropdownMenuItem>Edit Bentang</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Hapus Kabel</DropdownMenuItem>
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
        type="CABLE"
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={projectId}
      />
    </div>
  );
}
