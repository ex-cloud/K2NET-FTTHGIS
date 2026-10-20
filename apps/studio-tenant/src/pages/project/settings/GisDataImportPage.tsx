import * as React from "react";
import { useParams } from "@tanstack/react-router";
import { UploadCloud } from "lucide-react";
import {
  PageLayout,
  PageHero,
  Card,
  Button,
} from "@k2net/ui";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";

export function GisDataImportPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false }) as { projectId?: string };
  const _projectId = params?.projectId || "";

  const handleUploadKml = () => {
    toast.success(t("projects.import_success"));
  };

  return (
    <PageLayout variant="workspace" spaceY="space-y-6" maxWidth="max-w-4xl">
      <PageHero
        title={t("projects.gis_import_title")}
        subtitle={t("projects.gis_import_subtitle")}
        icon={UploadCloud}
      />

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
            className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs rounded-md"
          >
            {t("common.import")}
          </Button>
        </div>

        <div className="pt-2 border-t border-border/40 space-y-2">
          <h4 className="text-xs font-bold text-foreground">{t("projects.kml_guide_title")}</h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4 leading-relaxed">
            <li>{t("projects.kml_guide_odc")}</li>
            <li>{t("projects.kml_guide_odp")}</li>
            <li>{t("projects.kml_guide_cable")}</li>
          </ul>
        </div>
      </Card>
    </PageLayout>
  );
}
