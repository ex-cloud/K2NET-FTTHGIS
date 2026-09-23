import * as React from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  Plus,
  Search,
  Mail,
  Shield,
  MoreVertical,
  UserCheck,
} from "lucide-react";
import {
  PageHeader,
  PageContentShell,
  Button,
  Input,
  Card,
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
import { TeamInviteWizard } from "../../components/team/TeamInviteWizard";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  lastActive: string;
  assignedProjects: number;
}

export function TeamPage() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const [inviteModalOpen, setInviteModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const subView = React.useMemo(() => {
    if (pathname.includes("/team/roles")) return "roles";
    if (pathname.includes("/team/activity")) return "activity";
    return "members";
  }, [pathname]);

  const members: TeamMember[] = [
    {
      id: "u-01",
      name: "Andiansyah Pratama",
      email: "andiansyah@ispnet.id",
      role: "Owner / Org Admin",
      status: "ACTIVE",
      lastActive: "Baru saja",
      assignedProjects: 5,
    },
    {
      id: "u-02",
      name: "Rizky Ramadhan",
      email: "rizky.noc@ispnet.id",
      role: "NOC & GIS Operator",
      status: "ACTIVE",
      lastActive: "15 menit lalu",
      assignedProjects: 3,
    },
    {
      id: "u-03",
      name: "Dedi Supriadi",
      email: "dedi.tech@ispnet.id",
      role: "Field Technician",
      status: "ACTIVE",
      lastActive: "2 jam lalu",
      assignedProjects: 2,
    },
    {
      id: "u-04",
      name: "Siti Rahmawati",
      email: "siti.survey@ispnet.id",
      role: "Surveyor GIS",
      status: "INVITED",
      lastActive: "Menunggu aktivasi",
      assignedProjects: 1,
    },
  ];

  const activityLogs = [
    {
      id: "act-1",
      user: "Andiansyah Pratama",
      action: "Memperbarui rute kabel Feeder BDG-01",
      module: "GIS Map Studio",
      time: "10 menit lalu",
    },
    {
      id: "act-2",
      user: "Rizky Ramadhan",
      action: "Menyelesaikan Trouble Ticket #TK-9821",
      module: "Issues",
      time: "1 jam lalu",
    },
    {
      id: "act-3",
      user: "Dedi Supriadi",
      action: "Menambahkan sambungan drop port ODP-DGO-04",
      module: "Inventory",
      time: "3 jam lalu",
    },
  ];

  const rolesList = [
    {
      title: "Organization Admin",
      description: "Akses penuh ke seluruh proyek, konfigurasi organisasi, billing, dan manajemen tim.",
      usersCount: 1,
      permissions: ["projects.*", "network.*", "team.*", "billing.*", "settings.*"],
    },
    {
      title: "NOC & GIS Operator",
      description: "Mengelola topologi jaringan, monitoring kesehatan OLT, dan operasional inventaris.",
      usersCount: 1,
      permissions: ["projects.view", "network.manage", "gis.edit", "issues.manage"],
    },
    {
      title: "Field Technician (JIT Scoped)",
      description: "Akses ke tiket gangguan dan pemetaan ODP pada area proyek yang ditugaskan.",
      usersCount: 1,
      permissions: ["projects.view", "network.view", "issues.execute", "geom.update"],
    },
    {
      title: "Surveyor GIS",
      description: "Menggambar jalur kabel baru, validasi survey lapangan, dan import KML/CAD.",
      usersCount: 1,
      permissions: ["gis.survey", "cad.import", "projects.view"],
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title={
          subView === "roles"
            ? "Peran & Izin PBAC"
            : subView === "activity"
            ? "Riwayat Aktivitas Tim"
            : "Manajemen Anggota Tim"
        }
        breadcrumbs={[
          { label: "Organisasi", href: "/projects" },
          { label: "Tim", href: "/team/members" },
          {
            label:
              subView === "roles"
                ? "Peran & Izin"
                : subView === "activity"
                ? "Aktivitas"
                : "Anggota",
          },
        ]}
        actions={
          subView === "members" && (
            <Button
              size="sm"
              onClick={() => setInviteModalOpen(true)}
              className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              + Undang Anggota
            </Button>
          )
        }
      />

      <PageContentShell className="space-y-4 custom-scrollbar">
        {/* VIEW 1: MEMBERS */}
        {subView === "members" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau email..."
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
                    <TableHead className="font-bold">NAMA & EMAIL</TableHead>
                    <TableHead className="font-bold">PERAN (ROLE)</TableHead>
                    <TableHead className="font-bold">STATUS</TableHead>
                    <TableHead className="font-bold">PROYEK DITUGASKAN</TableHead>
                    <TableHead className="font-bold">AKTIVITAS TERAKHIR</TableHead>
                    <TableHead className="w-12 text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id} className="text-xs">
                      <TableCell>
                        <div className="space-y-0.5">
                          <span className="font-bold text-foreground block">{member.name}</span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] bg-muted/40">
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            member.status === "ACTIVE"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {member.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono font-semibold">
                        {member.assignedProjects} Proyek
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-[11px]">
                        {member.lastActive}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem>Ubah Peran</DropdownMenuItem>
                            <DropdownMenuItem>Kelola Hak Proyek</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Cabut Akses</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {/* VIEW 2: ROLES */}
        {subView === "roles" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rolesList.map((role, idx) => (
              <Card key={idx} className="p-4 border-border/60 bg-card space-y-3 shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Shield className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{role.title}</h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                    {role.usersCount} Pengguna
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">
                  {role.description}
                </p>
                <div className="pt-2 border-t border-border/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Izin Efektif:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.map((p, pIdx) => (
                      <span
                        key={pIdx}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-foreground border border-border/60"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* VIEW 3: ACTIVITY */}
        {subView === "activity" && (
          <Card className="p-4 border-border/60 bg-card space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Aktivitas Terbaru Anggota Organisasi
            </h3>
            <div className="space-y-2">
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserCheck className="h-3.5 w-3.5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground">
                        {log.user} • <span className="font-normal text-muted-foreground">{log.action}</span>
                      </span>
                      <span className="text-[10px] font-mono text-primary block">
                        Modul: {log.module}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">{log.time}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </PageContentShell>

      <TeamInviteWizard
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
      />
    </div>
  );
}
