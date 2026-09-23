import * as React from "react";
import { useParams } from "@tanstack/react-router";
import {
  Plus,
  Search,
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
} from "@k2net/ui";

export function TroubleTicketsPage() {
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";
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
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: "Proyek", href: "/projects" },
          { label: "Issues", href: `/project/${projectId}/issues/tickets` },
          { label: "Trouble Tickets" },
        ]}
        title="Trouble Tickets & Alarm Gangguan"
        actions={
          <Button size="sm" className="h-8 px-3 text-xs font-medium gap-1.5 shadow-xs">
            <Plus className="h-4 w-4" />
            + Buat Tiket Gangguan
          </Button>
        }
      />

      <PageContentShell className="space-y-4 custom-scrollbar">
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari nomor tiket, judul atau teknisi..."
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
                <TableHead className="font-bold">NOMOR & JUDUL TIKET</TableHead>
                <TableHead className="font-bold">KATEGORI</TableHead>
                <TableHead className="font-bold">DAMPAK PELANGGAN</TableHead>
                <TableHead className="font-bold">TEKNISI DITUGASKAN</TableHead>
                <TableHead className="font-bold">DILAPORKAN</TableHead>
                <TableHead className="font-bold">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t) => (
                <TableRow key={t.id} className="text-xs">
                  <TableCell>
                    <div className="space-y-0.5">
                      <span className="font-bold font-mono text-primary block">{t.id}</span>
                      <span className="font-medium text-foreground">{t.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {t.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono font-semibold">
                    {t.affectedCustomers} Pelanggan
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{t.assignedTech}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{t.reportedAt}</TableCell>
                  <TableCell>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        t.status === "RESOLVED"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : t.status === "IN_PROGRESS"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {t.status}
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
