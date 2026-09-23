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

export function OltListPage() {
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";
  const [searchQuery, setSearchQuery] = React.useState("");

  const olts = [
    {
      id: "olt-01",
      code: "OLT-ZTE-DGO-01",
      name: "ZTE C320 Dago POP",
      brand: "ZTE C320 (GPON)",
      ipAddress: "10.200.10.2",
      ponPortsTotal: 16,
      ponPortsUsed: 14,
      totalOnuOnline: 684,
      snmpStatus: "CONNECTED",
      health: "UP",
      pingLatency: "1.4 ms",
    },
    {
      id: "olt-02",
      code: "OLT-HW-ARC-01",
      name: "Huawei MA5608T Arcamanik",
      brand: "Huawei MA5608T (EPON/GPON)",
      ipAddress: "10.200.10.3",
      ponPortsTotal: 16,
      ponPortsUsed: 12,
      totalOnuOnline: 512,
      snmpStatus: "CONNECTED",
      health: "UP",
      pingLatency: "2.1 ms",
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: "Proyek", href: "/projects" },
          { label: "Core Devices", href: `/project/${projectId}/core/olt` },
          { label: "Perangkat OLT" },
        ]}
        title="Daftar Perangkat OLT (Optical Line Terminal)"
        actions={
          <Button size="sm" className="h-8 px-3 text-xs font-medium gap-1.5 shadow-xs">
            <Plus className="h-4 w-4" />
            + Tambah OLT
          </Button>
        }
      />

      <PageContentShell className="space-y-4 custom-scrollbar">
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari kode OLT, IP atau nama POP..."
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
                <TableHead className="font-bold">KODE & NAMA OLT</TableHead>
                <TableHead className="font-bold">MERK & TIPE</TableHead>
                <TableHead className="font-bold">IP MANAGEMENT</TableHead>
                <TableHead className="font-bold">PORT PON DIGUNAKAN</TableHead>
                <TableHead className="font-bold">TOTAL ONU ONLINE</TableHead>
                <TableHead className="font-bold">LATENCY PING</TableHead>
                <TableHead className="font-bold">STATUS</TableHead>
                <TableHead className="w-12 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {olts.map((olt) => (
                <TableRow key={olt.id} className="text-xs">
                  <TableCell>
                    <div className="space-y-0.5">
                      <span className="font-bold font-mono text-primary block">{olt.code}</span>
                      <span className="text-muted-foreground text-[11px]">{olt.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{olt.brand}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{olt.ipAddress}</TableCell>
                  <TableCell className="font-mono font-semibold">
                    {olt.ponPortsUsed} / {olt.ponPortsTotal} Port
                  </TableCell>
                  <TableCell className="font-mono font-bold text-primary">
                    {olt.totalOnuOnline} ONT
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{olt.pingLatency}</TableCell>
                  <TableCell>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {olt.health}
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
                        <DropdownMenuItem>Pindai Port PON</DropdownMenuItem>
                        <DropdownMenuItem>Live Telemetry SNMP</DropdownMenuItem>
                        <DropdownMenuItem>Edit Parameter</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </PageContentShell>
    </div>
  );
}
