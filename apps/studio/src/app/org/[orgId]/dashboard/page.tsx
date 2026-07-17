"use client";

import * as React from "react";
import { Plus, Search, Filter, LayoutGrid, List } from "lucide-react";
import { Button } from "@k2net/ui";
import { Input } from "@k2net/ui";
import Link from "next/link";
import { use, useState, useEffect, useCallback } from "react";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "next-auth/react";

import { ProjectCreateWizard } from "@/components/tenant/project/project-create-wizard";

interface ProjectItem {
  id: string;
  name: string;
}

export default function OrgDashboardPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId: slug } = use(params);
  const { data: session } = useSession();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/organizations/${slug}/projects`, {
        token: session.accessToken,
      });
      if (res.ok) {
        const data: ProjectItem[] = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, slug]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-y-auto">
      <ProjectCreateWizard 
        open={isWizardOpen} 
        onOpenChange={setIsWizardOpen} 
        onSuccess={fetchProjects}
      />
      <div className="w-full max-w-6xl mx-auto py-8 px-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Projects
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted/40 border border-border rounded-md p-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 bg-background text-foreground shadow-sm rounded-sm"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button 
              className="bg-primary hover:bg-primary/90 text-white gap-2 font-medium h-8 px-3 text-xs"
              onClick={() => setIsWizardOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              New project
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for a project"
              className="bg-muted/30 border-border pl-10 h-9 text-xs text-foreground focus:ring-primary focus:border-emerald-500"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 border border-border text-muted-foreground hover:text-foreground"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeletons
            [1, 2].map((i) => (
              <div key={i} className="animate-pulse flex flex-col p-6 rounded-xl border border-border bg-card h-[130px]">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted/50 rounded" />
                    <div className="h-3 w-20 bg-muted/50 rounded" />
                  </div>
                  <div className="h-5 w-14 bg-muted/50 rounded-full" />
                </div>
                <div className="mt-auto pt-4 flex items-center gap-2">
                  <div className="h-4 w-10 bg-muted/50 rounded" />
                  <div className="h-1 flex-1 bg-muted/50 rounded-full" />
                </div>
              </div>
            ))
          ) : projects.length === 0 ? (
            <div className="col-span-3 py-20 text-center border border-dashed border-border rounded-xl">
              <p className="text-sm text-muted-foreground">
                No projects found. Create one to get started!
              </p>
            </div>
          ) : (
            projects.map((project) => (
              <Link key={project.id} href={`/org/${slug}/project/${project.id}`}>
                <div className="group flex flex-col p-6 rounded-xl border border-border bg-card hover:border-border/80 hover:bg-accent/50 transition-all cursor-pointer h-full border-b-2 border-b-emerald-600/50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      <div className="text-xs text-muted-foreground font-medium">
                        AWS | ap-southeast-1
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-tight">
                      Active
                    </div>
                  </div>

                  <div className="mt-auto pt-4 flex items-center gap-2">
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-bold uppercase tracking-tighter">
                      NANO
                    </span>
                    <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-1/3" />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
