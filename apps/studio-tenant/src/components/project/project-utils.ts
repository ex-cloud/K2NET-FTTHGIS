import { type Project } from "../../hooks/useProjects";
import { toast } from "sonner";

export function getProjectStatusInfo(status?: string, t?: (k: string) => string) {
  const raw = (status || "ACTIVE").toUpperCase();
  if (raw === "ARCHIVED") {
    return {
      label: t ? t("projects.status_archived") || "ARCHIVED" : "ARCHIVED",
      shortLabel: "ARCHIVED",
      badgeClass: "bg-muted text-muted-foreground border-border/80",
    };
  }
  return {
    label: t ? t("projects.status_active") || "ACTIVE" : "ACTIVE",
    shortLabel: "ACTIVE",
    badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  };
}

export const handleExportSpatial = (project: Project, successMessage: string) => {
  const exportData = {
    type: "FeatureCollection",
    projectName: project.name,
    projectCode: project.code,
    exportedAt: new Date().toISOString(),
    features: [],
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.code.toLowerCase()}_spatial_export.geojson`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success(successMessage || `${project.code} GeoJSON exported!`);
};

export const handleDuplicateStructure = (project: Project, successMessage: string) => {
  navigator.clipboard.writeText(
    JSON.stringify(
      {
        name: `${project.name} (Copy)`,
        code: `${project.code}-COPY`,
        description: project.description,
        status: "ACTIVE",
      },
      null,
      2
    )
  );
  toast.success(successMessage || `Structure ${project.code} copied!`);
};
