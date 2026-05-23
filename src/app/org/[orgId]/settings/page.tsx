"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, Globe, ShieldAlert, Check, Copy, ExternalLink, Info, Loader2, Upload, Trash2, Boxes } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrganizations, type Organization } from "@/hooks/useOrganizations";
import { getBaseUrl, getCurrentOrgSlug, getLogoUrl } from "@/lib/domain";

interface Project {
  id: string;
  name: string;
  region: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  roleName: string;
}

export default function GeneralSettingsPage() {
  const params = useParams();
  const orgId = (params.orgId as string) || (typeof window !== "undefined" ? getCurrentOrgSlug() : "") || "";
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [orgData, setOrgData] = React.useState<Organization | null>(null);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [copied, setCopied] = React.useState(false);
  const [name, setName] = React.useState("");
  const [logoUrl, setLogoUrl] = React.useState("");
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [userData, setUserData] = React.useState<User | null>(null);
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [website, setWebsite] = React.useState("");
  
  // Slug Confirmation States
  const [slugConfirmOpen, setSlugConfirmOpen] = React.useState(false);
  
  // Delete Modal States
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = React.useState("");
  const [checkedProjects, setCheckedProjects] = React.useState<Record<string, boolean>>({});
  const [deleteReason, setDeleteReason] = React.useState("");

  const { organizations, loading: orgsLoading } = useOrganizations();
  const currentOrg = organizations.find(o => o.slug === orgId);

  React.useEffect(() => {
    if (currentOrg) {
      setOrgData(currentOrg);
      setName(currentOrg.name);
      setSlug(currentOrg.slug);
      setLogoUrl(currentOrg.logoUrl ? getLogoUrl(currentOrg.logoUrl) : "");
      setDescription(currentOrg.description || "");
      setAddress(currentOrg.address || "");
      setWebsite(currentOrg.website || "");
    }
  }, [currentOrg]);

  React.useEffect(() => {
    const fetchAdditionalData = async () => {
      if (!session?.accessToken) return;
      
      try {
        const headers = {
          "Authorization": `Bearer ${session.accessToken}`
        };

        const [projectsRes, userRes] = await Promise.all([
          fetch(`/api/v1/organizations/${orgId}/projects`, { headers }),
          fetch(`/api/v1/users/me`, { headers })
        ]);

        if (projectsRes.ok) {
          const projectData = await projectsRes.json();
          setProjects(projectData);
        }

        if (userRes.ok) {
          const data = await userRes.json();
          setUserData(data);
        }
      } catch (error) {
        console.error("Failed to fetch additional data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdditionalData();
  }, [orgId, session?.accessToken]);

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<Organization>) => {
      const res = await fetch(`/api/v1/organizations/${orgId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to update organization");
      }
      return res.json();
    },
    onSuccess: (updated: Organization) => {
      setOrgData(updated);
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success("Organization updated successfully");
      
      // If slug changed, redirect to the new URL
      if (updated.slug !== orgId) {
        router.push(`/org/${updated.slug}/settings`);
      } else {
        router.refresh();
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const isAdmin = React.useMemo(() => {
    if (!userData) return false;
    const role = userData.roleName?.toLowerCase() || "";
    const username = userData.username?.toLowerCase() || "";
    return role.includes("admin") || role.includes("super") || role.includes("owner") || username.includes("admin");
  }, [userData]);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    // Create a local preview
    const previewUrl = URL.createObjectURL(file);
    setLogoFile(file);
    setLogoPreview(previewUrl);
    setLogoUrl(""); // Clear the URL to indicate a new file is pending
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const tenantSlug = orgData?.slug || slug;
    const res = await fetch(`/api/v1/files/upload?tenant=${tenantSlug}&folder=asset`, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${session?.accessToken}`
      },
      body: formData
    });

    if (!res.ok) throw new Error("Failed to upload logo");
    
    const data = await res.json();
    return getLogoUrl(data.url);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Organization name cannot be empty");
      return;
    }

    if (!slug.trim()) {
      toast.error("Organization slug cannot be empty");
      return;
    }

    // If slug changed, show confirmation dialog
    if (slug !== orgData?.slug && !slugConfirmOpen) {
      setSlugConfirmOpen(true);
      return;
    }

    let finalLogoUrl = logoUrl;

    // If there's a new file selected, upload it first
    if (logoFile) {
      setUploading(true);
      try {
        finalLogoUrl = await uploadFile(logoFile);
        setLogoUrl(finalLogoUrl);
        setLogoFile(null);
        setLogoPreview(null);
      } catch {
        toast.error("Failed to upload logo");
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    updateMutation.mutate({ 
      name, 
      slug,
      logoUrl: finalLogoUrl,
      description,
      address,
      website
    });
    setSlugConfirmOpen(false);
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
        headers: {
          "Authorization": `Bearer ${session?.accessToken}`
        }
      });

      if (res.ok) {
        toast.success("Organization deleted successfully");
        window.location.assign(getBaseUrl() + "/org");
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

  if (loading || orgsLoading) return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto w-full">
      <div className="h-8 w-48 bg-zinc-800 animate-pulse rounded" />
      <div className="h-64 w-full bg-zinc-900 animate-pulse rounded-xl" />
    </div>
  );

  const hasChanges = 
    name !== orgData?.name || 
    slug !== orgData?.slug ||
    description !== (orgData?.description || "") ||
    address !== (orgData?.address || "") ||
    website !== (orgData?.website || "") ||
    logoUrl !== (orgData?.logoUrl || "") || 
    !!logoFile;

  return (
    <div className="p-8 pb-24 space-y-10 w-full max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Organization Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">
          General configuration, privacy, and lifecycle controls.
        </p>
      </div>

      {/* Organization Logo */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Organization logo</h2>
        </div>
        <Card className="bg-[#0c0c0c] border-zinc-800/80 shadow-2xl overflow-hidden">
          <CardContent className="flex items-center gap-8 py-6 px-6">
            <div className="relative group">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleLogoSelect}
              />
              <Avatar 
                className="h-24 w-24 border-2 border-zinc-800 ring-4 ring-zinc-900 shadow-2xl cursor-pointer hover:border-emerald-500/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {(logoPreview || (logoUrl && logoUrl.trim() !== "")) ? (
                  <AvatarImage src={logoPreview || getLogoUrl(logoUrl)} />
                ) : null}
                <AvatarFallback className="bg-zinc-900 text-zinc-500 rounded flex items-center justify-center">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Boxes className="w-12 h-12 text-zinc-600" strokeWidth={1.5} />
                  )}
                </AvatarFallback>
              </Avatar>
              <div 
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer pointer-events-none"
              >
                <Upload className="w-6 h-6 text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                </div>
              )}
            </div>
            <div className="space-y-4 flex-1">
              <div className="grid gap-2">
                <Label htmlFor="logoUrl" className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">
                  Logo URL (or Upload by clicking avatar)
                </Label>
                <div className="flex gap-2">
                  <Input 
                    id="logoUrl" 
                    value={logoUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogoUrl(e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 focus:border-emerald-500/50 text-zinc-300 h-9"
                    placeholder="https://example.com/logo.png"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 border-zinc-800 hover:bg-zinc-800 gap-2 text-zinc-300"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                  </Button>
                  {logoUrl && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-9 text-red-500 hover:text-red-400 hover:bg-red-500/10 gap-2"
                      onClick={() => {
                        setLogoUrl("");
                        setLogoFile(null);
                        setLogoPreview(null);
                      }}
                      disabled={uploading}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-zinc-600">
                Optimal size is 400x400px. JPG, PNG or SVG allowed. Max 2MB.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Details */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Organization details</h2>
        </div>
        <Card className="bg-[#0c0c0c] border-zinc-800/80 shadow-2xl overflow-hidden divide-y divide-zinc-800/50">
          <CardContent className="p-0 divide-y divide-zinc-800/50">
            {/* Row 1: Organization name */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 px-6 items-center">
              <Label htmlFor="orgName" className="text-zinc-400 text-sm font-medium">
                Organization name
              </Label>
              <div className="md:col-span-2">
                <Input 
                  id="orgName" 
                  value={name} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800 focus:border-emerald-500/50 focus:ring-emerald-500/20 text-zinc-200"
                  placeholder="Enter organization name"
                />
              </div>
            </div>

            {/* Row 2: Organization slug (DISABLED) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 px-6 items-center">
              <div className="flex flex-col">
                <Label htmlFor="orgSlug" className="text-zinc-400 text-sm font-medium">
                  Organization slug
                </Label>
                <span className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                  Locked due to subdomains binding.
                </span>
              </div>
              <div className="md:col-span-2 flex gap-2">
                <div className="relative flex-1">
                  <Input 
                    id="orgSlug" 
                    value={slug} 
                    disabled
                    className="bg-zinc-900/20 border-zinc-800 text-zinc-500 font-mono text-sm cursor-not-allowed select-all pr-10"
                    placeholder="organization-slug"
                  />
                  <button 
                    onClick={copyToClipboard}
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-emerald-500 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="border-zinc-800 hover:bg-zinc-800 shrink-0"
                  onClick={() => window.open(window.location.protocol + "//" + orgId + "." + window.location.host.replace(/^(system[-.])/, ""), '_blank')}
                  title="Open organization domain"
                >
                  <ExternalLink className="w-4 h-4 text-zinc-400" />
                </Button>
              </div>
            </div>

            {/* Row 3: Description */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 px-6 items-start">
              <Label htmlFor="orgDesc" className="text-zinc-400 text-sm font-medium pt-2">
                Description
              </Label>
              <div className="md:col-span-2">
                <textarea 
                  id="orgDesc" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 ring-offset-background placeholder:text-zinc-500 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50"
                  placeholder="Tell us about your organization..."
                />
              </div>
            </div>

            {/* Row 4: Website */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 px-6 items-center">
              <Label htmlFor="orgWebsite" className="text-zinc-400 text-sm font-medium">
                Website
              </Label>
              <div className="md:col-span-2">
                <Input 
                  id="orgWebsite" 
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800 focus:border-emerald-500/50 text-zinc-200"
                  placeholder="https://company.com"
                />
              </div>
            </div>

            {/* Row 5: Address */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 px-6 items-center">
              <Label htmlFor="orgAddress" className="text-zinc-400 text-sm font-medium">
                Address
              </Label>
              <div className="md:col-span-2">
                <Input 
                  id="orgAddress" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800 focus:border-emerald-500/50 text-zinc-200"
                  placeholder="123 Street, City, Country"
                />
              </div>
            </div>
          </CardContent>

          {/* Compact Supabase Card Footer */}
          <div className="flex justify-between items-center py-4 px-6 bg-zinc-950/40 border-t border-zinc-800/80">
            <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              Please save your changes to apply them to your organization.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="border-zinc-800 text-zinc-400 hover:text-zinc-100 h-9"
                disabled={!hasChanges || updateMutation.isPending}
                onClick={() => {
                  setName(orgData?.name || "");
                  setSlug(orgData?.slug || "");
                  setDescription(orgData?.description || "");
                  setAddress(orgData?.address || "");
                  setWebsite(orgData?.website || "");
                  setLogoUrl(orgData?.logoUrl ? getLogoUrl(orgData.logoUrl) : "");
                  setLogoPreview(null);
                  setLogoFile(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!hasChanges || updateMutation.isPending || uploading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)] h-9 min-w-[100px]"
              >
                {(updateMutation.isPending || uploading) ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Slug Confirmation Dialog */}
      <Dialog open={slugConfirmOpen} onOpenChange={setSlugConfirmOpen}>
        <DialogContent className="bg-[#0f0f0f] border-zinc-800 sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-amber-500 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Critical URL Change
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-zinc-300 leading-relaxed">
              Changing your organization slug from <span className="font-mono text-white font-bold bg-zinc-800 px-1 rounded">{orgData?.slug}</span> to <span className="font-mono text-emerald-400 font-bold bg-zinc-800 px-1 rounded">{slug}</span> will:
            </p>
            <ul className="text-xs text-zinc-500 space-y-2 list-disc list-inside">
              <li>Change your dashboard URL instantly.</li>
              <li>Break any bookmarked links.</li>
              <li>Disconnect external integrations using this slug.</li>
            </ul>
            <p className="text-sm font-medium text-zinc-200">Are you absolutely sure you want to proceed?</p>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" onClick={() => {
              setSlugConfirmOpen(false);
              setSlug(orgData?.slug || "");
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-500 text-white">
              Yes, Change URL
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                                  onCheckedChange={(checked: boolean) => {
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeleteConfirmSlug(e.target.value)}
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
