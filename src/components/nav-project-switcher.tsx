"use client";
 
import * as React from "react";
import { Plus, Check, ChevronsUpDown, Box, Search, X, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useProjects } from "@/hooks/useProjects";

export function NavProjectSwitcher() {
  const pathname = usePathname();
  const params = useParams();
  const [search, setSearch] = React.useState("");

  const orgId = params.orgId as string;
  const projectId = params.projectId as string;

  const { projects, loading } = useProjects(orgId);

  const currentProject = projects.find((p) => String(p.id) === String(projectId));

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  // If we are not in a project context, don't render or show "Select Project"
  if (!projectId && !pathname.includes("/project/")) return null;

  const displayName = loading 
    ? "Loading project..." 
    : (currentProject?.name || projectId || "Select Project");

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center justify-center gap-1.5 px-0.5 rounded-md hover:bg-accent border border-transparent hover:border-border text-sm font-medium text-muted-foreground cursor-pointer transition-colors group">
        <Link
          href={`/org/${orgId}/project/${projectId}`}
          className="flex items-center gap-1.5"
        >
          <Box className="size-3 flex items-center justify-center" />
          <span className="truncate max-w-[120px] group-hover:text-foreground transition-colors">
            {displayName}
          </span>
          {currentProject?.status && (
            <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 px-1.5 rounded-full text-emerald-500 font-bold uppercase tracking-tight">
              {currentProject.status}
            </span>
          )}
        </Link>
      </div>
      <DropdownMenu onOpenChange={(open) => !open && setSearch("")}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors rounded-md active:bg-accent focus:bg-accent p-0 cursor-pointer"
          >
            <ChevronsUpDown className="h-3 w-3" strokeWidth={1.5} />
            <span className="sr-only">Nav Project Switcher</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-64 rounded-lg bg-popover border-border shadow-xl p-0 overflow-hidden"
          side="bottom"
          align="start"
          sideOffset={20}
        >
          <div className="p-2 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <Input
                placeholder="Search for a project"
                className="bg-muted/50 border-border pl-8 h-8 text-xs text-muted-foreground focus-visible:ring-emerald-500/50 focus-visible:ring-offset-0 focus-visible:border-emerald-500/50 focus-visible:outline-none focus-visible:ring-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                autoFocus
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="p-1">
            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-3 py-2">
              Projects
            </DropdownMenuLabel>

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  className="gap-2 p-2 hover:bg-accent focus:bg-accent cursor-pointer group"
                  asChild
                >
                  <Link href={`/org/${orgId}/project/${project.id}`}>
                    <div className="flex size-7 items-center justify-center rounded-md border border-border bg-muted/50">
                      <span className="font-bold text-xs group-hover:text-emerald-500">
                        {project.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-xs font-medium">
                        {project.name}
                      </span>
                      <span className="text-[9px] text-emerald-500 uppercase">
                        {project.status || 'Active'}
                      </span>
                    </div>
                    {project.id === projectId && (
                      <Check className="size-3.5 text-emerald-500" />
                    )}
                  </Link>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-zinc-500">No projects found</p>
              </div>
            )}
          </div>
          <DropdownMenuSeparator className="bg-border mx-0 mt-0" />
          <div className="p-1">
            <DropdownMenuItem 
              asChild
              className="gap-2 p-2 hover:bg-accent focus:bg-accent cursor-pointer rounded-md text-muted-foreground hover:text-foreground"
            >
              <Link href={`/org/${orgId}`} className="flex items-center gap-2 w-full">
                <div className="flex size-7 items-center justify-center rounded-md border border-border bg-muted">
                  <Plus className="size-3.5" />
                </div>
                <div className="font-medium text-xs">
                  New Project
                </div>
              </Link>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
