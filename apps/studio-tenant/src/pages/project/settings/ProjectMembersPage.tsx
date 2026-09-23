import * as React from "react";
import { useParams } from "@tanstack/react-router";
import {
  UserPlus,
  Trash2,
} from "lucide-react";
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

export function ProjectMembersPage() {
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";

  const members = [
    {
      name: "Andiansyah Pratama",
      email: "andiansyah@ispnet.id",
      role: "Project Lead / Owner",
      access: "FULL_CONTROL",
    },
    {
      name: "Dedi Supriadi",
      email: "dedi.tech@ispnet.id",
      role: "Lead Field Technician",
      access: "SPATIAL_OPERATIONAL",
    },
    {
      name: "Rizky Ramadhan",
      email: "rizky.noc@ispnet.id",
      role: "NOC Operator",
      access: "SPATIAL_OPERATIONAL",
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: "Proyek", href: "/projects" },
          { label: "Settings", href: `/project/${projectId}/settings/general` },
          { label: "Anggota Proyek" },
        ]}
        title="Anggota & Penetapan Hak Akses Proyek"
        actions={
          <Button size="sm" className="h-8 px-3 text-xs font-medium gap-1.5 shadow-xs">
            <UserPlus className="h-4 w-4" />
            + Tambah Anggota Proyek
          </Button>
        }
      />

      <PageContentShell className="space-y-4 custom-scrollbar max-w-4xl">
        <Card className="border-border/60 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-[11px]">
                <TableHead className="font-bold">NAMA STAF</TableHead>
                <TableHead className="font-bold">PERAN ORGANISASI</TableHead>
                <TableHead className="font-bold">HAK AKSES PROYEK</TableHead>
                <TableHead className="w-12 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m, idx) => (
                <TableRow key={idx} className="text-xs">
                  <TableCell>
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground block">{m.name}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">{m.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{m.role}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px] bg-muted/40">
                      {m.access}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
