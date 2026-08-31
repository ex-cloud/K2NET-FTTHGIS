

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@k2net/ui";
import { FolderKanban, ChevronDown, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskProjectPickerProps {
  selectedProject: string | null;
  projectsList: string[];
  onChange: (projectName: string | null) => void;
  className?: string;
}

export function TaskProjectPicker({
  selectedProject,
  projectsList,
  onChange,
  className,
}: TaskProjectPickerProps) {
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [customProjects, setCustomProjects] = useState<string[]>([]);

  const allProjects = React.useMemo(() => {
    return Array.from(new Set([...projectsList, ...customProjects])).filter(Boolean);
  }, [projectsList, customProjects]);

  const handleAddNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const name = newProjectName.trim();
    setCustomProjects((prev) => [...prev, name]);
    onChange(name);
    setNewProjectName("");
    setIsAddingProject(false);
    toast.success(`Project "${name}" siap digunakan`);
  };

  return (
    <DropdownMenu onOpenChange={(open) => { if (!open) setIsAddingProject(false); }}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors",
            selectedProject
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border/60 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50",
            className
          )}
        >
          <FolderKanban className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[140px]">
            {selectedProject ?? "Project"}
          </span>
          <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56 z-[100] p-1">
        <DropdownMenuItem
          onClick={() => onChange(null)}
          className={cn(
            "text-xs py-1.5 px-2.5 rounded-md cursor-pointer flex items-center justify-between",
            !selectedProject ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"
          )}
        >
          <span>No project</span>
          {!selectedProject && <Check className="h-3 w-3" />}
        </DropdownMenuItem>
        
        {allProjects.length > 0 && <div className="h-px bg-border/40 my-1" />}

        {allProjects.map((proj) => (
          <DropdownMenuItem
            key={proj}
            onClick={() => onChange(proj)}
            className={cn(
              "text-xs py-1.5 px-2.5 rounded-md cursor-pointer flex items-center justify-between",
              selectedProject === proj ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <FolderKanban className="h-3 w-3 text-primary shrink-0" />
              <span className="truncate">{proj}</span>
            </div>
            {selectedProject === proj && <Check className="h-3 w-3 shrink-0" />}
          </DropdownMenuItem>
        ))}

        <div className="h-px bg-border/40 my-1" />

        {isAddingProject ? (
          <div className="p-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              autoFocus
              placeholder="Project name..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddNewProject(e);
              }}
              className="w-full text-xs px-2 py-1 bg-muted rounded border border-border outline-none"
            />
            <div className="flex justify-end gap-1 mt-1.5">
              <button
                type="button"
                onClick={() => setIsAddingProject(false)}
                className="text-[10px] px-2 py-0.5 text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNewProject}
                className="text-[10px] px-2 py-0.5 bg-primary text-primary-foreground rounded font-semibold"
              >
                Add
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsAddingProject(true);
            }}
            className="w-full text-left flex items-center gap-2 text-xs py-1.5 px-2.5 text-primary hover:bg-primary/10 rounded-md font-semibold"
          >
            <Plus className="h-3 w-3" />
            Create new project...
          </button>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
