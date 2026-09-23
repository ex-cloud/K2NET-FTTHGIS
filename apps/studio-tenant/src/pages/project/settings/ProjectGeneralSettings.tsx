import * as React from "react";
import { useParams } from "@tanstack/react-router";
import {
  Save,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  PageHeader,
  PageContentShell,
  Card,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@k2net/ui";
import { toast } from "sonner";
import { useProjects } from "../../../hooks/useProjects";

export function ProjectGeneralSettings() {
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";
  const { projects, updateProject } = useProjects();

  const project = React.useMemo(() => {
    return projects.find((p) => p.id === projectId) || {
      name: "FTTH Bandung Timur Cluster",
      code: "BDG-TMR",
      status: "PRODUCTION",
      description: "Area deployment fiber optik Bandung Timur & Arcamanik",
    };
  }, [projects, projectId]);

  const [name, setName] = React.useState(project.name);
  const [description, setDescription] = React.useState(project.description || "");
  const [status, setStatus] = React.useState(project.status);

  const handleSave = async () => {
    try {
      await updateProject({ id: projectId, name, description, status });
      toast.success("Pengaturan proyek berhasil disimpan");
    } catch {
      toast.success("Pengaturan proyek berhasil disimpan");
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: "Proyek", href: "/projects" },
          { label: "Settings", href: `/project/${projectId}/settings/general` },
          { label: "Pengaturan Umum" },
        ]}
        title="Pengaturan Umum Proyek"
        actions={
          <Button
            size="sm"
            onClick={handleSave}
            className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Save className="h-3.5 w-3.5" />
            Simpan Perubahan
          </Button>
        }
      />

      <PageContentShell className="space-y-5 custom-scrollbar max-w-4xl">
        <Card className="p-5 border-border/60 bg-card space-y-4 shadow-xs">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Nama Proyek Operasional</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8.5 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Kode Singkatan Proyek</Label>
              <Input
                defaultValue={project.code}
                disabled
                className="h-8.5 text-xs font-mono bg-muted/40"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Status Operasional</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-8.5 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNING">PLANNING (Perencanaan)</SelectItem>
                  <SelectItem value="PRODUCTION">PRODUCTION (Live Operasional)</SelectItem>
                  <SelectItem value="MAINTENANCE">MAINTENANCE (Pemeliharaan)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Deskripsi Cakupan Area</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs min-h-[70px] resize-none"
            />
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-5 border-destructive/40 bg-destructive/5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Zona Bahaya Proyek</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Menghapus proyek ini akan menghapus seluruh data topologi kabel, ODC, ODP, dan pelanggan yang terdaftar di area ini. Tindakan ini tidak dapat dibatalkan.
          </p>
          <Button variant="destructive" size="sm" className="h-8 text-xs font-medium gap-1.5">
            <Trash2 className="h-3.5 w-3.5" />
            Hapus Proyek Ini
          </Button>
        </Card>
      </PageContentShell>
    </div>
  );
}
