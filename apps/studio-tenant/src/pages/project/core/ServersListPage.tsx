import * as React from "react";
import { useParams } from "@tanstack/react-router";
import {
  PageHeader,
  PageContentShell,
  Card,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@k2net/ui";

export function ServersListPage() {
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";

  const servers = [
    {
      id: "srv-01",
      name: "FTTH Poller Telemetry Engine",
      ip: "10.200.0.10:5010",
      service: "Go SNMP Poller + Redis",
      health: "RUNNING",
      cycleTime: "30 Detik",
    },
    {
      id: "srv-02",
      name: "FreeRADIUS AAA Server",
      ip: "10.200.0.11:1812",
      service: "PPPoE Authentication & Accounting",
      health: "RUNNING",
      cycleTime: "Real-time",
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: "Proyek", href: "/projects" },
          { label: "Core Devices", href: `/project/${projectId}/core/olt` },
          { label: "Server & NMS" },
        ]}
        title="Server NMS & Engine Poller"
      />

      <PageContentShell className="space-y-4 custom-scrollbar">
        <Card className="border-border/60 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px]">
                <TableHead className="font-bold">NAMA SERVER / DAEMON</TableHead>
                <TableHead className="font-bold">INTERNAL SOCKET</TableHead>
                <TableHead className="font-bold">LAYANAN FUNGSI</TableHead>
                <TableHead className="font-bold">SIKLUS POLLING</TableHead>
                <TableHead className="font-bold">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servers.map((s) => (
                <TableRow key={s.id} className="text-xs">
                  <TableCell className="font-bold text-foreground">{s.name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{s.ip}</TableCell>
                  <TableCell className="font-medium text-foreground">{s.service}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{s.cycleTime}</TableCell>
                  <TableCell>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {s.health}
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
