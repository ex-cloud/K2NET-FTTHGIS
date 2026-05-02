"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Building2, 
  Globe, 
  ShieldAlert, 
  Check, 
  Copy, 
  ExternalLink,
  Info,
  Loader2,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Project {
  id: string;
  name: string;
  region: string;
}

interface Organization {
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
}

export default function GeneralSettingsPage() {
  const { orgId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [orgData, setOrgData] = React.useState<Organization | null>(null);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [copied, setCopied] = React.useState(false);
  const [name, setName] = React.useState("");
  const [logoUrl, setLogoUrl] = React.useState("");
  const [isAdmin, setIsAdmin] = React.useState(false);
  
  // Delete Modal States
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = React.useState("");
  const [checkedProjects, setCheckedProjects] = React.useState<Record<string, boolean>>({});
  const [deleteReason, setDeleteReason] = React.useState("");

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [orgRes, projectsRes, userRes] = await Promise.all([
          fetch(`/api/v1/organizations/${orgId}`),
          fetch(`/api/v1/organizations/${orgId}/projects`),
          fetch(`/api/v1/users/me`)
        ]);

        if (orgRes.ok) {
          const data = await orgRes.json();
          setOrgData(data);
          setName(data.name);
          setLogoUrl(data.logoUrl || "");
        }

        if (projectsRes.ok) {
          const projectData = await projectsRes.json();
          setProjects(projectData);
        }

        if (userRes.ok) {
          const userData = await userRes.json();
          // Allow Super Admin, Admin, and Owner (if we use that name)
          const authorized = ["super_admin", "admin", "owner"].includes(userData.roleName.toLowerCase());
          setIsAdmin(authorized);
        }
      } catch (error) {
        console.error("Failed to fetch organization data", error);
        toast.error("Failed to load settings data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orgId]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Organization name cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/v1/organizations/${orgId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, logoUrl }),
      });

      if (res.ok) {
        const updated = await res.json();
        setOrgData(updated);
        toast.success("Organization updated successfully");
        router.refresh();
      } else {
        const error = await res.text();
        toast.error(error || "Failed to update organization");
      }
    } catch (error) {
      console.error("Failed to update organization", error);
      toast.error("Network error while updating organization");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmSlug !== orgData?.slug) {
      toast.error("Organization slug does not match");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/organizations/${orgId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Organization deleted successfully");
        router.push("/org");
      } else {
        const error = await res.text();
        toast.error(error || "Failed to delete organization");
      }
    } catch (error) {
      console.error("Failed to delete organization", error);
      toast.error("Network error while deleting organization");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const allProjectsAcknowledged = projects.length === 0 || 
    (projects.every(p => checkedProjects[p.id]) && deleteReason !== "");

  const canDelete = deleteConfirmSlug === orgData?.slug && allProjectsAcknowledged;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(orgData?.slug || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="p-8 space-y-6">
      <div className="h-8 w-48 bg-zinc-800 animate-pulse rounded" />
      <div className="h-64 w-full bg-zinc-900 animate-pulse rounded-xl" />
    </div>
  );

  const hasChanges = name !== orgData?.name || logoUrl !== (orgData?.logoUrl || "");

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">General Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your organization details and core identifiers.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="border-zinc-800 text-zinc-400 hover:text-zinc-100"
            disabled={!hasChanges || saving}
            onClick={() => {
              setName(orgData?.name || "");
              setLogoUrl(orgData?.logoUrl || "");
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!hasChanges || saving || !isAdmin}
            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)] min-w-[120px]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Organization Logo */}
      <Card className="bg-[#0c0c0c] border-zinc-800/50 shadow-2xl overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-500" />
            Organization Logo
          </CardTitle>
          <CardDescription className="text-zinc-500">
            Customize your organization branding.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-8 py-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-2 border-zinc-800 ring-4 ring-zinc-900 shadow-2xl">
              <AvatarImage src={logoUrl} />
              <AvatarFallback className="bg-zinc-900 text-zinc-500 text-2xl font-bold uppercase">
                {name?.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
              <Upload className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="space-y-4 flex-1">
            <div className="grid gap-2">
              <Label htmlFor="logoUrl" className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">
                Logo URL
              </Label>
              <Input 
                id="logoUrl" 
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 focus:border-emerald-500/50 text-zinc-300 h-9"
                placeholder="https://example.com/logo.png"
              />
            </div>
            <p className="text-xs text-zinc-600">
              Optimal size is 400x400px. JPG, PNG or SVG allowed. Max 2MB.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Organization Details */}
      <Card className="bg-[#0c0c0c] border-zinc-800/50 shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-500" />
            Organization Details
          </CardTitle>
          <CardDescription className="text-zinc-500">
            General information about your organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="grid gap-2">
            <Label htmlFor="orgName" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
              Organization Name
            </Label>
            <Input 
              id="orgName" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-900/50 border-zinc-800 focus:border-emerald-500/50 focus:ring-emerald-500/20 text-zinc-200"
              placeholder="Enter organization name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="orgSlug" className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">
              Organization Slug
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input 
                  id="orgSlug" 
                  value={orgData?.slug || ""} 
                  readOnly
                  className="bg-zinc-950 border-zinc-800 text-zinc-500 pr-10 font-mono text-sm"
                />
                <button 
                  onClick={copyToClipboard}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-emerald-500 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <Button variant="outline" size="icon" className="border-zinc-800 hover:bg-zinc-800">
                <ExternalLink className="w-4 h-4 text-zinc-400" />
              </Button>
            </div>
            <p className="text-[11px] text-zinc-600 mt-1 flex items-center gap-1.5">
              <Info className="w-3 h-3" />
              Slugs are used in your organization&apos;s unique URL. Contact support to change it.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data Privacy */}
      <Card className="bg-[#0c0c0c] border-zinc-800/50">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" />
            Data Privacy & Regions
          </CardTitle>
          <CardDescription className="text-zinc-500">
            Configure how your organization data is processed and where it is stored.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
            <div className="p-2 rounded-md bg-blue-500/10">
              <Globe className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-100">Default Region</h4>
              <p className="text-xs text-zinc-500 mt-1">
                Your primary data is currently hosted in <span className="text-zinc-300 font-mono">ap-southeast-1 (Jakarta)</span>.
              </p>
            </div>
            <Badge variant="outline" className="ml-auto border-blue-500/30 text-blue-400 bg-blue-500/5">
              Enterprise Only
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {isAdmin && (
        <div className="space-y-4 pt-4">
          <div className="items-center gap-2 px-1 flex">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-bold text-red-500 uppercase tracking-widest">Danger Zone</h2>
          </div>
          
          <Card className="border-red-900/30 bg-red-950/5">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-zinc-100">Delete this organization</h4>
                <p className="text-xs text-zinc-500">
                  Once you delete an organization, there is no going back. All projects and assets will be removed.
                </p>
              </div>
              
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-900/50 transition-all">
                    Delete Organization
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0f0f0f] border-zinc-800 sm:max-w-[450px] p-0 overflow-hidden shadow-2xl">
                  <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-semibold text-zinc-100">Delete organization</DialogTitle>
                  </DialogHeader>
                  
                  <div className="p-6 space-y-6">
                    {projects.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Acknowledge each project that will be deleted:</p>
                        <div className="space-y-2 max-h-[160px] overflow-auto pr-2 custom-scrollbar">
                          {projects.map((project) => (
                            <div key={project.id} className="flex items-center justify-between p-3 rounded-md bg-zinc-900/50 border border-zinc-800 group hover:border-zinc-700 transition-colors">
                              <div className="flex items-center gap-3">
                                <Checkbox 
                                  id={`project-${project.id}`}
                                  checked={!!checkedProjects[project.id]}
                                  onCheckedChange={(checked) => {
                                    setCheckedProjects(prev => ({
                                      ...prev,
                                      [project.id]: !!checked
                                    }));
                                  }}
                                  className="border-zinc-700 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                />
                                <Label htmlFor={`project-${project.id}`} className="text-sm font-medium text-zinc-200 cursor-pointer">
                                  {project.name}
                                </Label>
                              </div>
                              <span className="text-[10px] text-zinc-500 font-mono uppercase bg-zinc-800 px-1.5 py-0.5 rounded">
                                {project.region || "ap-southeast-1"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Reason for deleting:</p>
                      <Select onValueChange={setDeleteReason} value={deleteReason}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-200 h-10 focus:ring-red-500/20">
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                          <SelectItem value="moving-to-another-platform">Moving to another platform</SelectItem>
                          <SelectItem value="temporary-project-ended">Temporary project ended</SelectItem>
                          <SelectItem value="costs-are-too-high">Costs are too high</SelectItem>
                          <SelectItem value="features-are-missing">Features are missing</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-4 rounded-md bg-red-500/5 border border-red-500/10 space-y-2">
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        This action <span className="text-zinc-100 font-bold italic underline decoration-red-500/50">cannot</span> be undone. This will permanently delete the <span className="text-zinc-100 font-bold">{orgData?.name}</span> organization and remove all of its projects.
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <p className="text-xs font-medium text-zinc-400">
                        Type <span className="text-zinc-100 font-mono font-bold bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">{orgData?.slug}</span> to confirm.
                      </p>
                      <Input 
                        value={deleteConfirmSlug}
                        onChange={(e) => setDeleteConfirmSlug(e.target.value)}
                        placeholder="Enter the string above"
                        className="bg-zinc-900 border-zinc-800 text-white h-11 focus:border-red-500/50 focus:ring-red-500/10"
                      />
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 p-4 border-t border-zinc-800/50 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} className="text-zinc-400 hover:text-zinc-100 h-10">
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDelete}
                      disabled={!canDelete || deleting}
                      className="bg-red-600 hover:bg-red-700 h-10 px-6 font-medium shadow-[0_0_20px_rgba(220,38,38,0.15)] transition-all"
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
