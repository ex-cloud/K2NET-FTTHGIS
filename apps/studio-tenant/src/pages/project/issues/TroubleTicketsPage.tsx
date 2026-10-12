import * as React from "react";
import { useParams } from "@tanstack/react-router";
import {
  Plus,
  Search,
  AlertTriangle,
} from "lucide-react";
import {
  PageLayout,
  PageHero,
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
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

export function TroubleTicketsPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const _projectId = params?.projectId || "proj-bdg-01";
  const [searchQuery, setSearchQuery] = React.useState("");

  const tickets = [
    {
      id: "TK-9821",
      title: "Redaman Kritis di ODP-DGO-04 Port #7",
      category: "HIGH_ATTENUATION",
      severity: "CRITICAL",
      affectedCustomers: 6,
      assignedTech: "Dedi Supriadi",
      status: "IN_PROGRESS",
      reportedAt: "25 Menit lalu",
    },
    {
      id: "TK-9820",
      title: "Kabel Distribusi Tertimpa Dahan Pohon",
      category: "CABLE_DAMAGE",
      severity: "WARNING",
      affectedCustomers: 12,
      assignedTech: "Rizky Ramadhan",
      status: "DISPATCHED",
      reportedAt: "1 Jam lalu",
    },
    {
      id: "TK-9818",
      title: "Konektor SC/UPC Kotor di ODC-DGO-01",
      category: "MAINTENANCE",
      severity: "RESOLVED",
      affectedCustomers: 1,
      assignedTech: "Dedi Supriadi",
      status: "RESOLVED",
      reportedAt: "4 Jam lalu",
    },
  ];

  return (
    <PageLayout variant="workspace" spaceY="space-y-6">
      <PageHero
        title={t("issues.tickets_title")}
        subtitle={t("issues.tickets_subtitle")}
        icon={AlertTriangle}
        actions={
          <Button size="sm" className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs rounded-md">
            <Plus className="h-3.5 w-3.5" />
            {t("issues.create_ticket")}
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={t("common.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7.5 pl-8 text-xs bg-muted/20 border-border/80"
          />
        </div>
      </div>

        <Card className="border-border/60 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px]">
                <TableHead className="font-bold">{t("issues.ticket_number")} & JUDUL</TableHead>
                <TableHead className="font-bold">{t("issues.issue_type")}</TableHead>
                <TableHead className="font-bold">DAMPAK PELANGGAN</TableHead>
                <TableHead className="font-bold">{t("issues.assigned_technician")}</TableHead>
                <TableHead className="font-bold">DILAPORKAN</TableHead>
                <TableHead className="font-bold">{t("common.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t_item) => (
                <TableRow key={t_item.id} className="text-xs">
                  <TableCell>
                    <div className="space-y-0.5">
                      <span className="font-bold font-mono text-primary block">{t_item.id}</span>
                      <span className="font-medium text-foreground">{t_item.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {t_item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono font-semibold">
                    {t_item.affectedCustomers} Pelanggan
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{t_item.assignedTech}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{t_item.reportedAt}</TableCell>
                  <TableCell>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        t_item.status === "RESOLVED"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : t_item.status === "IN_PROGRESS"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {t_item.status}
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
