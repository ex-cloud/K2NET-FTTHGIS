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
import { useTranslation } from "@k2net/i18n";

export function ServersListPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";

  const servers = [
    {
      id: "srv-01",
      name: "FTTH Poller Telemetry Engine",
      ip: "10.200.0.10:5010",
      service: "Go SNMP Poller + Redis",
      health: "RUNNING",
      cycleTime: "30s",
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
          { label: t("nav.projects"), href: "/projects" },
          { label: "Core Devices", href: `/project/${projectId}/core/olt` },
          { label: t("inventory.servers_title") },
        ]}
        title={t("inventory.servers_title")}
      />

      <PageContentShell className="space-y-4 custom-scrollbar">
        <Card className="border-border/60 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px]">
                <TableHead className="font-bold">{t("inventory.server_name").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.ip_address").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("common.description").toUpperCase()}</TableHead>
                <TableHead className="font-bold">CYCLE</TableHead>
                <TableHead className="font-bold">{t("common.status").toUpperCase()}</TableHead>
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

