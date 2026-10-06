import * as React from "react";
import {
  Plus,
  Search,
  Box,
  RefreshCcw,
  LayoutGrid,
  List,
  ArrowUpDown,
  Check,
} from "lucide-react";
import {
  PageLayout,
  Button,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  EmptyState,
  FeatureUpgradeModal,
  ActionTooltip,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  cn,
} from "@k2net/ui";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "@k2net/i18n";
import { useProjects, type Project } from "../../hooks/useProjects";
import { useTenantSubscription } from "../../hooks/useTenantSubscription";
import { ProjectUsageWidget } from "../../components/project/ProjectUsageWidget";
import { ProjectCardGrid } from "../../components/project/ProjectCardGrid";
import { ProjectCreateWizard } from "../../components/project/ProjectCreateWizard";

type SortOption = "updatedAt" | "subscribers" | "cableLength" | "name";

export function ProjectsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projects, isLoading, refetch, deleteProject } = useProjects();
  const { canCreateProject, usedProjects, maxProjects, tier, isTrialExpired, status } = useTenantSubscription();

  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [sortBy, setSortBy] = React.useState<SortOption>("updatedAt");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  const sortLabels: Record<SortOption, string> = {
    updatedAt: t("projects.sort_last_modified") || "Last Modified",
    subscribers: t("projects.sort_subscribers") || "Most Subscribers",
    cableLength: t("projects.sort_cable_length") || "Longest Cable",
    name: t("projects.sort_name") || "Project Name (A - Z)",
  };

  const filteredAndSortedProjects = React.useMemo(() => {
    const filtered = projects.filter((p) => {
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

    return filtered.sort((a: Project, b: Project) => {
      if (sortBy === "subscribers") {
        return (b.totalSubscribers || 0) - (a.totalSubscribers || 0);
      }
      if (sortBy === "cableLength") {
        return (b.cableLengthKm || 0) - (a.cableLengthKm || 0);
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      // Default: updatedAt or createdAt newest first
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [projects, searchQuery, statusFilter, sortBy]);

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
        {/* Main 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (Wider): Toolbar + Project List/Grid */}
          <div className="lg:col-span-8 xl:col-span-8 space-y-4">
            {/* Toolbar: Left (Search + Filter), Right (Sort + Refresh + View Mode + Plus) */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Left: Search + Status Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
                {/* Search Input */}
                <div className="relative w-full sm:w-56 shrink-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    placeholder={t("gis.search_projects")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 pl-8 text-xs bg-muted/20 border-border/80"
                  />
                </div>

                {/* Status Filter Tabs */}
                <Tabs
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  className="w-full sm:w-auto overflow-x-auto custom-scrollbar"
                >
                  <TabsList size="sm" className="border border-border/60 bg-muted/60 shrink-0">
                    <TabsTrigger value="ALL">
                      {t("common.all")} ({projects.length})
                    </TabsTrigger>
                    <TabsTrigger value="PRODUCTION">
                      Production
                    </TabsTrigger>
                    <TabsTrigger value="PLANNING">
                      Planning
                    </TabsTrigger>
                    <TabsTrigger value="MAINTENANCE">
                      Maintenance
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Right: Dropdown Sort + Refresh + View Mode Toggle + Plus Button */}
              <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto flex-wrap">
                {/* Dropdown Sort */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs font-medium gap-1.5 border-border/80 bg-card hover:bg-accent text-foreground cursor-pointer"
                    >
                      <ArrowUpDown className="size-3.5 text-muted-foreground" />
                      <span className="hidden sm:inline text-muted-foreground">
                        {t("projects.sort_by") || "Sort"}:
                      </span>
                      <span className="text-foreground">{sortLabels[sortBy]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 text-xs">
                    {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                      <DropdownMenuItem
                        key={option}
                        onClick={() => setSortBy(option)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <span>{sortLabels[option]}</span>
                        {sortBy === option && <Check className="size-3.5 text-foreground" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Refresh Icon Button */}
                <ActionTooltip label={t("gis.refresh_projects")} shortcut="R" side="bottom">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    className="h-7 w-7 p-0 border-border/80 bg-card hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label={t("gis.refresh_projects")}
                  >
                    <RefreshCcw className="size-3.5" />
                  </Button>
                </ActionTooltip>

                {/* Toggle View Mode (Grid vs List) */}
                <div className="flex items-center rounded-md border border-border/80 bg-card p-0.5">
                  <ActionTooltip label={t("gis.grid_view")} side="bottom">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "p-1 rounded-sm text-muted-foreground hover:text-foreground transition-all cursor-pointer",
                        viewMode === "grid"
                          ? "bg-secondary text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      aria-label={t("gis.grid_view")}
                    >
                      <LayoutGrid className="size-3.5" />
                    </button>
                  </ActionTooltip>
                  <ActionTooltip label={t("gis.list_view")} side="bottom">
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "p-1 rounded-sm text-muted-foreground hover:text-foreground transition-all cursor-pointer",
                        viewMode === "list"
                          ? "bg-secondary text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      aria-label={t("gis.list_view")}
                    >
                      <List className="size-3.5" />
                    </button>
                  </ActionTooltip>
                </div>

                {/* Plus (New Project) CTA Button with ActionTooltip */}
                <ActionTooltip label={t("gis.create_project")} shortcut="N" side="bottom">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleOpenCreateProject}
                    className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    <span className="hidden sm:inline">{t("gis.create_project")}</span>
                  </Button>
                </ActionTooltip>
              </div>
            </div>

            {/* Projects Grid/List or Standard Empty State */}
            {isLoading ? (
              <div className="flex h-48 w-full items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-xs font-mono text-muted-foreground">
                    {t("gis.loading_projects")}
                  </span>
                </div>
              </div>
            ) : filteredAndSortedProjects.length > 0 ? (
              <ProjectCardGrid
                projects={filteredAndSortedProjects}
                viewMode={viewMode}
                onDeleteProject={deleteProject}
              />
            ) : (
              <EmptyState
                icon={<Box className="size-6 text-muted-foreground/80" />}
                title={t("gis.no_projects_found")}
                description={
                  searchQuery
                    ? t("gis.no_projects_search_desc")
                    : t("gis.no_projects_empty_desc")
                }
                action={
                  <Button
                    size="sm"
                    onClick={handleOpenCreateProject}
                    className="h-7 px-2.5 text-xs font-medium gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="size-3.5" />
                    {t("gis.create_new_project")}
                  </Button>
                }
              />
            )}
          </div>

          {/* Right Column: Quota Usage List Widget */}
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
        featureName={
          isTrialExpired || status === "TRIAL_EXPIRED"
            ? t("projects.trial_expired")
            : t("projects.project_capacity")
        }
        featureDescription={
          isTrialExpired || status === "TRIAL_EXPIRED"
            ? t("projects.trial_expired_desc")
            : t("projects.quota_exceeded_desc", {
                used: usedProjects,
                max: maxProjects,
                tier: tier.toUpperCase(),
              })
        }
        requiredTier={tier === "free" ? "starter" : tier === "starter" ? "pro" : "enterprise"}
        currentTier={tier}
        onUpgradeClick={() => navigate({ to: "/billing" })}
      />
    </PageLayout>
  );
}
