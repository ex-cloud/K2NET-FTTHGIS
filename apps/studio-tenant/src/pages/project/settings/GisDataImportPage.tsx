import * as React from "react";
import { useParams } from "@tanstack/react-router";
import { UploadCloud } from "lucide-react";
import {
  PageHeader,
  PageContentShell,
  Card,
  Button,
} from "@k2net/ui";
import { toast } from "sonner";

export function GisDataImportPage() {
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";

  const handleUploadKml = () => {
    toast.success("File KML/GeoJSON berhasil di-parse dan di-import ke PostGIS!");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: "Proyek", href: "/projects" },
          { label: "Settings", href: `/project/${projectId}/settings/general` },
          { label: "Import Data GIS" },
        ]}
        title="Import Data Spasial GIS & Berkas KML"
      />

      <PageContentShell className="space-y-4 custom-scrollbar max-w-4xl">
        <Card className="p-6 border-border/60 bg-card space-y-4 shadow-xs">
          <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-border bg-muted/20 text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">
                Tarik & Lepas File GIS di Sini
              </h3>
              <p className="text-xs text-muted-foreground">
                Format didukung: <strong>.kml, .kmz, .geojson, .shp (zip)</strong> (Maksimal 25 MB)
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleUploadKml}
              className="h-8 text-xs font-semibold gap-1.5 shadow-xs"
            >
              Pilih Berkas dari Komputer
            </Button>
          </div>

          <div className="pt-2 border-t border-border/40 space-y-2">
            <h4 className="text-xs font-bold text-foreground">Petunjuk Format Layer KML:</h4>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4 leading-relaxed">
              <li>Folder bernama <code>ODC</code> atau <code>Closure</code> akan otomatis dikonversi menjadi node ODC.</li>
              <li>Folder bernama <code>ODP</code> atau <code>FAT</code> akan otomatis dikonversi menjadi node ODP.</li>
              <li>LineString dengan atribut <code>48c</code> atau <code>24c</code> otomatis menjadi kabel optik.</li>
            </ul>
          </div>
        </Card>
      </PageContentShell>
    </div>
  );
}
