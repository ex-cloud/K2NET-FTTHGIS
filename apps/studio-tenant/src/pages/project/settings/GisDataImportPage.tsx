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
import { useTranslation } from "@k2net/i18n";

export function GisDataImportPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const projectId = params?.projectId || "proj-bdg-01";

  const handleUploadKml = () => {
    toast.success(t("projects.import_success"));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        breadcrumbs={[
          { label: t("nav.projects"), href: "/projects" },
          { label: t("nav.settings"), href: `/project/${projectId}/settings/general` },
          { label: t("projects.gis_import_title") },
        ]}
        title={t("projects.gis_import_title")}
      />

      <PageContentShell className="space-y-4 custom-scrollbar max-w-4xl">
        <Card className="p-6 border-border/60 bg-card space-y-4 shadow-xs">
          <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-border bg-muted/20 text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">
                {t("projects.upload_dropzone")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("projects.supported_formats")}
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleUploadKml}
              className="h-8 text-xs font-semibold gap-1.5 shadow-xs"
            >
              {t("common.import")}
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
