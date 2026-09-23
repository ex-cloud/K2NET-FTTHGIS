import * as React from "react";
import { Plus, Search, FolderKanban, RefreshCcw } from "lucide-react";
import {
  PageHeader,
  PageContentShell,
  Button,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@k2net/ui";
import { useProjects } from "../../hooks/useProjects";
import { ProjectUsageWidget } from "../../components/project/ProjectUsageWidget";
import { ProjectCardGrid } from "../../components/project/ProjectCardGrid";
import { ProjectCreateWizard } from "../../components/project/ProjectCreateWizard";

export function ProjectsPage() {
  const { projects, isLoading, refetch, deleteProject } = useProjects();
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");

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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page Header */}
      <PageHeader
        title="Daftar Proyek FTTH"
        breadcrumbs={[
          { label: "Organisasi", href: "/projects" },
          { label: "Proyek FTTH" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-8 px-2.5 text-xs gap-1.5"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              + Buat Proyek Baru
            </Button>
          </div>
        }
      />

      {/* Main Content Area */}
      <PageContentShell className="space-y-5 custom-scrollbar">
        {/* Resource Usage Widget */}
        <ProjectUsageWidget projects={projects} />

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <Tabs
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="w-full sm:w-auto"
          >
            <TabsList className="h-8 p-0.5 bg-muted/60 border border-border/40">
              <TabsTrigger value="ALL" className="text-xs px-3">
                Semua ({projects.length})
              </TabsTrigger>
              <TabsTrigger value="PRODUCTION" className="text-xs px-3">
                Production
              </TabsTrigger>
              <TabsTrigger value="PLANNING" className="text-xs px-3">
                Planning
              </TabsTrigger>
              <TabsTrigger value="MAINTENANCE" className="text-xs px-3">
                Maintenance
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari proyek / kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-muted/20"
            />
          </div>
        </div>

        {/* Projects Grid or Empty State */}
        {isLoading ? (
          <div className="flex h-48 w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-xs font-mono text-muted-foreground">Memuat data proyek...</span>
            </div>
          </div>
        ) : filteredProjects.length > 0 ? (
          <ProjectCardGrid
            projects={filteredProjects}
            onDeleteProject={deleteProject}
          />
        ) : (
          <div className="p-8 rounded-xl border border-dashed border-border bg-card/40 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FolderKanban className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Tidak Ada Proyek Ditemukan</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? "Tidak ada proyek yang sesuai dengan kriteria pencarian Anda."
                  : "Mulai dengan membuat proyek FTTH pertama untuk organisasi Anda."}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="text-xs font-semibold gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Buat Proyek Baru
            </Button>
          </div>
        )}
      </PageContentShell>

      {/* Create Project Wizard Modal */}
      <ProjectCreateWizard
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  );
}
