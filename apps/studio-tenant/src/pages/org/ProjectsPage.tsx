import * as React from "react";
import { Plus, Search, Box, RefreshCcw, LayoutGrid, List } from "lucide-react";
import {
  PageLayout,
  Button,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  FeatureUpgradeModal,
  ActionTooltip,
  cn,
} from "@k2net/ui";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "@k2net/i18n";
import { useProjects } from "../../hooks/useProjects";
import { useTenantSubscription } from "../../hooks/useTenantSubscription";
import { ProjectUsageWidget } from "../../components/project/ProjectUsageWidget";
import { ProjectCardGrid } from "../../components/project/ProjectCardGrid";
import { ProjectCreateWizard } from "../../components/project/ProjectCreateWizard";

export function ProjectsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projects, isLoading, refetch, deleteProject } = useProjects();
  const { canCreateProject, usedProjects, maxProjects, tier, isTrialExpired, status } = useTenantSubscription();

  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  const filteredProjects = React.useMemo(() => {
    return projects.filter((p) => {
      const matchQuery =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PRODUCTION" && (p.status === "PRODUCTION" || p.status === "ACTIVE")) ||
        (statusFilter === "PLANNING" && p.status === "PLANNING") ||
        (statusFilter === "MAINTENANCE" && p.status === "MAINTENANCE");

      return matchQuery && matchStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const handleOpenCreateProject = () => {
    if (isTrialExpired || status === "TRIAL_EXPIRED" || !canCreateProject) {
      setUpgradeModalOpen(true);
      return;
    }
    setCreateModalOpen(true);
  };

  return (
    <PageLayout variant="dashboard">
      <div className="space-y-6">
        {/* Main 2-Column Responsive Layout (Gambar 2 Grid Standard) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (Wider): Toolbar + Project List/Grid */}
          <div className="lg:col-span-8 xl:col-span-8 space-y-4">
            {/* Toolbar: Left (Search + Filter), Right (Refresh + View Mode + Plus) */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Left: Search + Status Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
                {/* Search Input */}
                <div className="relative w-full sm:w-56 shrink-0">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t("gis.search_projects")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs bg-muted/20 border-border/60"
                  />
                </div>

                {/* Status Filter Tabs */}
                <Tabs
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  className="w-full sm:w-auto overflow-x-auto custom-scrollbar"
                >
                  <TabsList className="h-8 p-0.5 bg-muted/60 border border-border/40 shrink-0">
                    <TabsTrigger value="ALL" className="text-xs px-2.5">
                      {t("common.all")} ({projects.length})
                    </TabsTrigger>
                    <TabsTrigger value="PRODUCTION" className="text-xs px-2.5">
                      Production
                    </TabsTrigger>
                    <TabsTrigger value="PLANNING" className="text-xs px-2.5">
                      Planning
                    </TabsTrigger>
                    <TabsTrigger value="MAINTENANCE" className="text-xs px-2.5">
                      Maintenance
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Right: Refresh + View Mode Toggle (Grid, List) + New Project Button */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                {/* Refresh Icon Button */}
                <ActionTooltip label={t("gis.refresh_projects")} shortcut="R" side="bottom">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetch()}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground border-border/60 cursor-pointer"
                    aria-label={t("gis.refresh_projects")}
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                  </Button>
                </ActionTooltip>

                {/* Toggle View Mode (Grid vs List) */}
                <div className="flex items-center p-0.5 rounded-lg border border-border/60 bg-muted/40">
                  <ActionTooltip label={t("gis.grid_view")} side="bottom">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "p-1 rounded-md transition-colors cursor-pointer",
                        viewMode === "grid"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      aria-label={t("gis.grid_view")}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </button>
                  </ActionTooltip>
                  <ActionTooltip label={t("gis.list_view")} side="bottom">
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "p-1 rounded-md transition-colors cursor-pointer",
                        viewMode === "list"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      aria-label={t("gis.list_view")}
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                  </ActionTooltip>
                </div>

                {/* Plus (New Project) Button with ActionTooltip */}
                <ActionTooltip label={t("gis.create_project")} shortcut="N" side="bottom">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleOpenCreateProject}
                    className="h-8 px-3 text-xs font-medium gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t("gis.create_project")}</span>
                  </Button>
                </ActionTooltip>
              </div>
            </div>

            {/* Projects Grid/List or Empty State */}
            {isLoading ? (
              <div className="flex h-48 w-full items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-xs font-mono text-muted-foreground">{t("gis.loading_projects")}</span>
                </div>
              </div>
            ) : filteredProjects.length > 0 ? (
              <ProjectCardGrid
                projects={filteredProjects}
                viewMode={viewMode}
                onDeleteProject={deleteProject}
              />
            ) : (
              <div className="p-8 rounded-xl border border-dashed border-border bg-card/40 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 border border-border/80 text-foreground/80">
                  <Box className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">{t("gis.no_projects_found")}</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {searchQuery
                      ? t("gis.no_projects_search_desc")
                      : t("gis.no_projects_empty_desc")}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleOpenCreateProject}
                  className="text-xs font-medium gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("gis.create_new_project")}
                </Button>
              </div>
            )}
          </div>

          {/* Right Column: Quota Usage List (Gambar 3 Style) */}
          <div className="lg:col-span-4 xl:col-span-4">
            <ProjectUsageWidget projects={projects} />
          </div>
        </div>
      </div>

      {/* Create Project Wizard Modal */}
      <ProjectCreateWizard
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      {/* Upgrade Quota Limit & Trial Paused Modal */}
      <FeatureUpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        featureName={isTrialExpired || status === "TRIAL_EXPIRED" ? t("projects.trial_expired") : t("projects.project_capacity")}
        featureDescription={
          isTrialExpired || status === "TRIAL_EXPIRED"
            ? "Masa evaluasi 14 hari telah berakhir dan proyek saat ini di-pause dalam mode Read-Only. Tingkatkan paket langganan Anda untuk membuat dan mengelola proyek jaringan secara penuh."
            : `Organisasi Anda telah mencapai batas maksimum ${usedProjects} dari ${maxProjects} proyek aktif untuk paket ${tier.toUpperCase()}. Tingkatkan ke paket yang lebih tinggi untuk membuat proyek FTTH baru.`
        }
        requiredTier={tier === "free" ? "starter" : tier === "starter" ? "pro" : "enterprise"}
        currentTier={tier}
        onUpgradeClick={() => navigate({ to: "/billing" })}
      />
    </PageLayout>
  );
}
