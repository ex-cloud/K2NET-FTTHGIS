import * as React from "react";
import { useParams } from "@tanstack/react-router";
import {
  UserPlus,
  Trash2,
  Users,
} from "lucide-react";
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

export function ProjectMembersPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const _projectId = params?.projectId || "proj-bdg-01";

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
    <PageLayout variant="workspace" spaceY="space-y-6" maxWidth="max-w-4xl">
      <PageHero
        title={t("projects.members_title")}
        subtitle={t("projects.members_subtitle")}
        icon={Users}
        actions={
          <Button size="sm" className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs rounded-md">
            <UserPlus className="h-3.5 w-3.5" />
            {t("projects.add_member_btn")}
          </Button>
        }
      />

      <Card className="border-border/60 overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 text-[11px]">
              <TableHead className="font-bold">{t("team.member_name", { defaultValue: "STAFF NAME" }).toUpperCase()}</TableHead>
              <TableHead className="font-bold">{t("projects.member_role").toUpperCase()}</TableHead>
              <TableHead className="font-bold">{t("team.access_level", { defaultValue: "PROJECT ACCESS" }).toUpperCase()}</TableHead>
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
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </PageLayout>
  );
}
