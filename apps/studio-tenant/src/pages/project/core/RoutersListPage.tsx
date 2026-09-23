import * as React from "react";
import { useParams } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import {
  PageHeader,
  PageContentShell,
  Card,
  Button,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@k2net/ui";

export function RoutersListPage() {
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";

  const routers = [
    {
      id: "rtr-01",
      name: "MikroTik CCR2004 BGP Core",
      ip: "10.200.0.1",
      role: "BGP Gateway & NAT",
      cpuUsage: "18%",
      uptime: "142 Hari",
      status: "ACTIVE",
    },
    {
      id: "rtr-02",
      name: "Cisco Catalyst 3850 Aggregation",
      ip: "10.200.0.2",
      role: "10G Optical Switch",
      cpuUsage: "8%",
      uptime: "98 Hari",
      status: "ACTIVE",
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: "Proyek", href: "/projects" },
          { label: "Core Devices", href: `/project/${projectId}/core/olt` },
          { label: "Router & Switch" },
        ]}
        title="Router Core & Switch Agregasi"
        actions={
          <Button size="sm" className="h-8 px-3 text-xs font-medium gap-1.5 shadow-xs">
            <Plus className="h-4 w-4" />
            + Tambah Router
          </Button>
        }
      />

      <PageContentShell className="space-y-4 custom-scrollbar">
        <Card className="border-border/60 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px]">
                <TableHead className="font-bold">NAMA PERANGKAT</TableHead>
                <TableHead className="font-bold">IP ADDRESS</TableHead>
                <TableHead className="font-bold">PERAN JARINGAN</TableHead>
                <TableHead className="font-bold">CPU LOAD</TableHead>
                <TableHead className="font-bold">UPTIME</TableHead>
                <TableHead className="font-bold">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routers.map((r) => (
                <TableRow key={r.id} className="text-xs">
                  <TableCell className="font-bold text-foreground">{r.name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{r.ip}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {r.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{r.cpuUsage}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{r.uptime}</TableCell>
                  <TableCell>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {r.status}
                    </span>
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
