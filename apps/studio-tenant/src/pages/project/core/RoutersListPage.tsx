import * as React from "react";
import { useParams } from "@tanstack/react-router";
import { Plus, Router } from "lucide-react";
import {
  PageLayout,
  PageHero,
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
import { useTranslation } from "@k2net/i18n";

export function RoutersListPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const _projectId = params?.projectId || "proj-bdg-01";

  const routers = [
    {
      id: "rtr-01",
      name: "MikroTik CCR2004 BGP Core",
      ip: "10.200.0.1",
      role: "BGP Gateway & NAT",
      cpuUsage: "18%",
      uptime: "142d",
      status: "ACTIVE",
    },
    {
      id: "rtr-02",
      name: "Cisco Catalyst 3850 Aggregation",
      ip: "10.200.0.2",
      role: "10G Optical Switch",
      cpuUsage: "8%",
      uptime: "98d",
      status: "ACTIVE",
    },
  ];

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <PageHero
        title={t("inventory.routers_title")}
        subtitle={t("inventory.routers_subtitle")}
        icon={Router}
        actions={
          <Button size="sm" className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs rounded-md">
            <Plus className="h-3.5 w-3.5" />
            {t("inventory.add_router")}
          </Button>
        }
      />
        <Card className="border-border/60 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px]">
                <TableHead className="font-bold">{t("inventory.router_name").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.ip_address").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.interfaces").toUpperCase()}</TableHead>
                <TableHead className="font-bold">{t("inventory.cpu_load").toUpperCase()}</TableHead>
                <TableHead className="font-bold">UPTIME</TableHead>
                <TableHead className="font-bold">{t("common.status").toUpperCase()}</TableHead>
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
    </PageLayout>
  );
}

