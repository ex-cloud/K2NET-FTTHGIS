"use client";

import { useOrganizations, type Organization } from "@/hooks/useOrganizations";
import { 
  Building2, 
  Search, 
  MoreHorizontal, 
  LayoutGrid,
  List as ListIcon,
  Table as TableIcon,
  Globe,
  MapPin,
  Plus,
  ArrowRight,
  Loader2,
  ShieldAlert
} from "lucide-react";
import { getTenantUrl } from "@/lib/domain";
import { Button, Input, Card } from "@k2net/ui";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  PageLayout,
} from "@k2net/ui";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { OrganizationWizard } from "@/components/system/organization-wizard";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@k2net/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@k2net/ui";
import { Checkbox } from "@k2net/ui";
import { Label } from "@k2net/ui";
import { OrganizationPageWrapper } from "@/components/page-guards/organization-page-wrapper";

interface Project {
  id: string;
  name: string;
  region: string;
}

type ViewMode = "grid" | "list" | "table";

export default function AdminOrganizationsPage() {
  const { organizations, loading: isLoading, refresh } = useOrganizations();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);

  // Delete Modal States
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [checkedProjects, setCheckedProjects] = useState<Record<string, boolean>>({});
  const [deleteReason, setDeleteReason] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: session } = useSession();

  // Fetch projects when organization is selected for deletion
  useEffect(() => {
    if (!orgToDelete || !session?.accessToken) {
      setProjects([]);
      setCheckedProjects({});
      setDeleteReason("");
      setDeleteConfirmSlug("");
      return;
    }

    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const res = await fetch(`/api/v1/organizations/${orgToDelete.slug}/projects`, {
          headers: {
            "Authorization": `Bearer ${session.accessToken}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        } else {
          console.error("Failed to fetch projects");
        }
      } catch (error) {
        console.error("Error fetching projects", error);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [orgToDelete, session?.accessToken]);

  const handleDelete = async () => {
    if (!orgToDelete) return;
    if (deleteConfirmSlug !== orgToDelete.slug) {
      toast.error("Organization slug does not match");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/organizations/${orgToDelete.slug}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session?.accessToken}`
        }
      });

      if (res.ok) {
        toast.success("Organization deleted successfully");
        setOrgToDelete(null);
        refresh();
      } else {
        const error = await res.text();
        toast.error(error || "Failed to delete organization");
      }
    } catch (error) {
      console.error("Failed to delete organization", error);
      toast.error("Network error while deleting organization");
    } finally {
      setDeleting(false);
    }
  };

  const allProjectsChecked = projects.length === 0 || projects.every(p => checkedProjects[p.id]);
  const canDelete = orgToDelete && deleteConfirmSlug === orgToDelete.slug && allProjectsChecked && deleteReason !== "";

  const [displaySuffix, setDisplaySuffix] = useState(".ftthgis.com");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname.startsWith("system-")) {
        setDisplaySuffix("-" + hostname.substring(7));
      } else if (hostname.startsWith("system.")) {
        setDisplaySuffix("." + hostname.substring(7));
      } else {
        const parts = hostname.split(".");
        if (parts.length >= 2) {
          setDisplaySuffix("." + parts.slice(-2).join("."));
        }
      }
    }
  }, []);

  // Real-time filtering logic
  const filteredOrgs = useMemo(() => {
    if (!organizations) return [];
    if (!searchQuery.trim()) return organizations;
    
    const query = searchQuery.toLowerCase().trim();
    return organizations.filter((org: Organization) => 
      org.name.toLowerCase().includes(query) || 
      org.slug.toLowerCase().includes(query) ||
      org.website?.toLowerCase().includes(query)
    );
  }, [organizations, searchQuery]);

  return (
    <OrganizationPageWrapper>
      <PageLayout variant="dashboard" spaceY="space-y-12">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-normal text-foreground tracking-tight">
            Organizations
          </h1>
          <p className="text-xs text-muted-foreground">
            Global oversight of all tenant environments and subscriptions.
          </p>
        </div>
        <Button 
          onClick={() => setWizardOpen(true)}
          variant="default"
          size="sm"
        >
          <Plus className="h-4 w-4" /> New organization
        </Button>
      </div>

      {/* Filters & View Switcher */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for an organization" 
              className="bg-muted/30 border-border pl-10 h-9 text-xs text-muted-foreground focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center p-1 bg-muted/20 rounded-lg border border-border">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setViewMode("grid")}
            className={cn("h-7 w-7 rounded-md transition-all", viewMode === "grid" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setViewMode("list")}
            className={cn("h-7 w-7 rounded-md transition-all", viewMode === "list" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            <ListIcon className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setViewMode("table")}
            className={cn("h-7 w-7 rounded-md transition-all", viewMode === "table" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            <TableIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Wizard Component */}
      <OrganizationWizard 
        open={wizardOpen} 
        onOpenChange={setWizardOpen} 
        onSuccess={refresh} 
      />

      {/* Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 p-5 rounded-lg border border-border bg-muted/10 h-24">
              <div className="h-11 w-11 rounded bg-muted/50" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-24 bg-muted/50 rounded" />
                <div className="h-3 w-16 bg-muted/50 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrgs.length === 0 ? (
        <div className="p-20 text-center text-muted-foreground bg-muted/5 border border-dashed border-border rounded-xl">
          {searchQuery ? "No organizations match your search." : "No organizations found."}
        </div>
      ) : (
        <>
          {/* GRID VIEW */}
          {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOrgs.map((org: Organization) => (
                  <div key={org.id} className="group relative">
                    <Card
                      glowingEffect
                      onClick={() => window.location.assign(getTenantUrl(org.slug))}
                      className="flex flex-row items-center gap-4 p-5 cursor-pointer h-24"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded bg-muted/80 border border-border transition-colors">
                        <div className="h-6 w-6 rounded-sm bg-muted/50 flex items-center justify-center border border-border/30">
                          <Building2 className={cn("h-3.5 w-3.5 transition-colors", 
                            org.status === 'SUSPENDED' ? "text-amber-500" : "text-muted-foreground group-hover:text-primary"
                          )} />
                        </div>
                      </div>

                      <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-8">
                        <div className="flex items-center gap-2">
                          <span className={cn("font-medium transition-colors", 
                             org.status === 'SUSPENDED' ? "text-muted-foreground" : "text-foreground group-hover:text-primary"
                          )}>
                            {org.name}
                          </span>
                          {(org.status === 'SUSPENDED' || org.status === 'TRIAL_EXPIRED') && (
                            <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase font-bold tracking-wider">
                              Suspended
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="font-mono">{org.slug}{displaySuffix}</span>
                          <span className="text-border">•</span>
                          <span className="capitalize">{org.subscriptionPlan?.name || "Free"} Plan</span>
                        </div>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                         <ArrowRight className="h-4 w-4 text-primary" />
                      </div>
                    </Card>

                    <div className="absolute top-2.5 right-2.5 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                          >
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            window.location.assign(getTenantUrl(org.slug));
                          }}>
                            Access Tenant
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={(e) => {
                            e.stopPropagation();
                            setOrgToDelete(org);
                          }}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
          )}

          {/* LIST VIEW */}
          {viewMode === "list" && (
            <div className="flex flex-col gap-2">
              {filteredOrgs.map((org: Organization) => (
                <div key={org.id} className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded bg-muted border border-border flex items-center justify-center text-muted-foreground">
                      <Building2 className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-foreground">{org.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono">{org.slug}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase", org.status === 'ACTIVE' ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-500")}>
                      {org.status || 'ACTIVE'}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs">
                        <DropdownMenuItem onClick={() => window.location.assign(getTenantUrl(org.slug))}>Access Tenant</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Suspend</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => setOrgToDelete(org)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TABLE VIEW */}
          {viewMode === "table" && (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Organization</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Details</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-xs">
                  {filteredOrgs.map((org: Organization) => (
                    <tr key={org.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-7 rounded bg-muted border border-border flex items-center justify-center text-muted-foreground">
                            <Building2 className="size-3.5" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{org.name}</p>
                            <p className="text-[10px] text-muted-foreground">{org.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={cn("size-1.5 rounded-full", org.status === 'ACTIVE' ? "bg-primary shadow-[0_0_8px_color-mix(in_srgb,var(--primary)_50%,transparent)]" : "bg-amber-500")} />
                          <span className="text-muted-foreground capitalize">{org.status?.toLowerCase() || 'active'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
                          <div className="flex items-center gap-1"><Globe className="size-3" /> {org.website || "-"}</div>
                          <div className="flex items-center gap-1"><MapPin className="size-3" /> {org.address || "-"}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem onClick={() => window.location.assign(getTenantUrl(org.slug))}>Access Tenant</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Suspend</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => setOrgToDelete(org)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

      {/* Delete Organization Confirmation Dialog */}
      <Dialog open={!!orgToDelete} onOpenChange={(open) => !open && setOrgToDelete(null)}>
        <DialogContent className="bg-card border-border sm:max-w-[450px] p-0 overflow-hidden shadow-2xl text-muted-foreground">
          <DialogHeader className="p-6 pb-2 text-foreground">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Delete organization
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            {loadingProjects ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Loading associated projects...</p>
              </div>
            ) : projects.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Acknowledge each project that will be deleted:</p>
                <div className="space-y-2 max-h-[160px] overflow-auto pr-2 custom-scrollbar">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 rounded-md bg-background/50 border border-border group hover:border-border transition-colors">
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          id={`project-${project.id}`}
                          checked={!!checkedProjects[project.id]}
                          onCheckedChange={(checked: boolean) => {
                            setCheckedProjects(prev => ({
                              ...prev,
                              [project.id]: !!checked
                            }));
                          }}
                          className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label htmlFor={`project-${project.id}`} className="text-sm font-medium text-foreground cursor-pointer">
                          {project.name}
                        </Label>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono uppercase bg-muted px-1.5 py-0.5 rounded">
                        {project.region || "ap-southeast-1"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason for deleting:</p>
              <Select onValueChange={setDeleteReason} value={deleteReason}>
                <SelectTrigger className="bg-background border-border text-foreground h-10 focus:ring-red-500/20">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="moving-to-another-platform">Moving to another platform</SelectItem>
                  <SelectItem value="temporary-project-ended">Temporary project ended</SelectItem>
                  <SelectItem value="costs-are-too-high">Costs are too high</SelectItem>
                  <SelectItem value="features-are-missing">Features are missing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 rounded-md bg-red-500/5 border border-red-500/10 space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                This action <span className="text-foreground font-bold italic underline decoration-red-500/50">cannot</span> be undone. This will permanently delete the <span className="text-foreground font-bold">{orgToDelete?.name}</span> organization and remove all of its projects, users, realms, databases, and assets.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-xs font-medium text-muted-foreground">
                Type <span className="text-foreground font-mono font-bold bg-muted px-1.5 py-0.5 rounded border border-border">{orgToDelete?.slug}</span> to confirm.
              </p>
              <Input 
                value={deleteConfirmSlug}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeleteConfirmSlug(e.target.value)}
                placeholder="Enter the string above"
                className="bg-background border-border text-foreground h-11 focus:border-red-500/50 focus:ring-red-500/10 text-xs"
              />
            </div>
          </div>

          <div className="bg-background/30 p-4 border-t border-border flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOrgToDelete(null)} className="text-muted-foreground hover:text-foreground h-10 text-xs">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={!canDelete || deleting}
              className="bg-red-600 hover:bg-red-700 h-10 px-6 font-medium shadow-[0_0_20px_rgba(220,38,38,0.15)] transition-all text-xs"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "I understand, delete this organization"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
      )}
      </PageLayout>
    </OrganizationPageWrapper>
  );
}
