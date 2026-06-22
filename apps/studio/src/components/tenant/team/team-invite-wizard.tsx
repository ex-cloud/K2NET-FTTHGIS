"use client";

import * as React from "react";
import { 
  User, 
  Mail, 
  Shield, 
  Briefcase, 
  Check, 
  ChevronRight, 
  ArrowLeft, 
  ShieldCheck, 
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GlobalRole {
  id: number | string;
  name: string;
  description?: string;
}

interface ProjectData {
  id: string;
  name: string;
}

interface WizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
}

export function TeamInviteWizard({ open, onOpenChange, organizationId }: WizardProps) {
  const { data: session } = useSession();
  const params = useParams();
  const [selectedOrgId, setSelectedOrgId] = React.useState("");
  const orgId = organizationId || (params.orgId as string) || selectedOrgId;
  
  const [step, setStep] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [globalRoles, setGlobalRoles] = React.useState<GlobalRole[]>([]);
  const [projects, setProjects] = React.useState<ProjectData[]>([]);
  const [orgList, setOrgList] = React.useState<{ id: string; name: string }[]>([]);

  const [formData, setFormData] = React.useState({
    fullName: "",
    email: "",
    globalRole: "",
    creationMode: "INVITE",
    customPassword: "",
  });

  const [projectRoles, setProjectRoles] = React.useState<Record<string, string>>({});

  // Fetch initial data (roles, orgs if global view)
  React.useEffect(() => {
    if (!open || !session?.accessToken) return;

    const fetchInitial = async () => {
      setIsLoading(true);
      try {
        const config = { headers: { Authorization: `Bearer ${session.accessToken}` } };
        const baseUrl = getBackendBaseUrl();
        const rolesRes = await axios.get(`${baseUrl}/roles`, config);
        setGlobalRoles(rolesRes.data || []);

        const isGlobal = !organizationId && !params.orgId;
        if (isGlobal) {
          const orgsRes = await axios.get(`${baseUrl}/organizations`, config);
          setOrgList(orgsRes.data || []);
          if (orgsRes.data?.length > 0) {
            setSelectedOrgId(orgsRes.data[0].id);
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load setup data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitial();
  }, [open, session?.accessToken, organizationId, params.orgId]);

  // Fetch projects when orgId changes
  React.useEffect(() => {
    if (!open || !session?.accessToken || !orgId) return;

    const fetchProjects = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${session.accessToken}` } };
        const baseUrl = getBackendBaseUrl();
        const projectsRes = await axios.get(`${baseUrl}/organizations/${orgId}/projects`, config);
        setProjects(projectsRes.data.content || projectsRes.data || []);
      } catch (error) {
        console.error(error);
      }
    };
    fetchProjects();
  }, [open, session?.accessToken, orgId]);

  const nextStep = () => {
    if (step === 1 && (!formData.fullName || !formData.email || (formData.creationMode === "DIRECT" && !formData.customPassword))) return;
    if (step === 2 && !formData.globalRole) return;
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (!session?.accessToken) return;
    setIsSubmitting(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        globalRoleId: Number(formData.globalRole),
        creationMode: formData.creationMode,
        customPassword: formData.creationMode === "DIRECT" ? formData.customPassword : "",
        projectRoles: Object.entries(projectRoles)
          .filter(([, roleId]) => roleId !== "")
          .map(([projectId, roleId]) => ({
            projectId: projectId,
            roleId: Number(roleId)
          }))
      };

      await axios.post(`${baseUrl}/organizations/${orgId}/users/invite`, payload, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      
      toast.success(formData.creationMode === "DIRECT" ? "User created successfully!" : "Invitation sent successfully!");
      onOpenChange(false);
      // Reset
      setStep(1);
      setFormData({ fullName: "", email: "", globalRole: "", creationMode: "INVITE", customPassword: "" });
      setProjectRoles({});
    } catch (e: unknown) {
      console.error(e);
      if (axios.isAxiosError(e)) {
        toast.error(e.response?.data?.message || "Failed to invite member.");
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-[#0c0c0c] border-[#1f1f1f] text-zinc-100 p-0 overflow-hidden outline-none">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-[#1f1f1f]">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500 ease-in-out" 
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-sm">
              {step}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70">Step {step} of 4</span>
          </div>
          <DialogTitle className="text-xl font-medium tracking-tight">
            {step === 1 && (formData.creationMode === "DIRECT" ? "Create New User Directly" : "Invite New Member")}
            {step === 2 && "Primary Role"}
            {step === 3 && "Project Access"}
            {step === 4 && (formData.creationMode === "DIRECT" ? "Review & Create" : "Review & Invite")}
          </DialogTitle>
          <DialogDescription className="text-zinc-500 text-sm">
            {step === 1 && (formData.creationMode === "DIRECT" ? "Enter the identification details and temporary password." : "Enter the identification details of your team member.")}
            {step === 2 && "Select the main professional role in the organization."}
            {step === 3 && "Optional: Assign specific project-level permissions."}
            {step === 4 && "Quick check of the access levels being granted."}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[450px] overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="h-40 flex flex-col items-center justify-center gap-3 text-zinc-500">
              <Loader2 className="size-6 animate-spin text-emerald-500" />
              <p className="text-xs">Fetching configuration...</p>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Mode Selection */}
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-[#141414] border border-[#2a2a2a]">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, creationMode: "INVITE" }))}
                      className={cn(
                        "py-2 px-3 rounded-md text-xs font-bold transition-all flex flex-col items-center gap-1 text-center",
                        formData.creationMode === "INVITE"
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      )}
                    >
                      <span>Mode 1: Email Invite</span>
                      <span className="text-[9px] font-normal opacity-70">Send automated email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, creationMode: "DIRECT" }))}
                      className={cn(
                        "py-2 px-3 rounded-md text-xs font-bold transition-all flex flex-col items-center gap-1 text-center",
                        formData.creationMode === "DIRECT"
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      )}
                    >
                      <span>Mode 2: Direct Creation</span>
                      <span className="text-[9px] font-normal opacity-70">Custom temporary password</span>
                    </button>
                  </div>

                  {/* Organization Selection for Global View */}
                  {(!organizationId && !params.orgId) && (
                    <div className="space-y-1.5 animate-in fade-in duration-200">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <Briefcase className="size-3" /> Target Organization
                      </label>
                      <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                        <SelectTrigger className="w-full bg-[#141414] border-[#2a2a2a] text-sm h-10">
                          <SelectValue placeholder="Select Organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {orgList.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <User className="size-3" /> Full Name
                    </label>
                    <Input 
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="e.g. Dodi Darsono" 
                      className="bg-[#141414] border-[#2a2a2a] focus:border-emerald-500/50 focus:ring-emerald-500/20 text-sm h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <Mail className="size-3" /> {formData.creationMode === "DIRECT" ? "Email / Username" : "Corporate Email"}
                    </label>
                    <Input 
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder={formData.creationMode === "DIRECT" ? "e.g. dodi@teknisi.local or dodi@example.com" : "e.g. dodi@example.com"} 
                      className="bg-[#141414] border-[#2a2a2a] focus:border-emerald-500/50 focus:ring-emerald-500/20 text-sm h-10"
                    />
                  </div>

                  {formData.creationMode === "DIRECT" && (
                    <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <Shield className="size-3 text-emerald-50" /> Temporary Password
                      </label>
                      <Input 
                        type="text"
                        value={formData.customPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, customPassword: e.target.value }))}
                        placeholder="e.g. TeknisiJaya2026!" 
                        className="bg-[#141414] border-[#2a2a2a] focus:border-emerald-500/50 focus:ring-emerald-500/20 text-sm h-10 font-mono"
                      />
                      <p className="text-[10px] text-zinc-500">User will be forced to change this password upon first login.</p>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Select Global Role</label>
                  {globalRoles.map((role) => (
                    <div 
                      key={role.id}
                      onClick={() => setFormData(prev => ({ ...prev, globalRole: String(role.id) }))}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3",
                        formData.globalRole === String(role.id) 
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" 
                          : "bg-[#141414] border-[#2a2a2a] text-zinc-400 hover:border-zinc-700"
                      )}
                    >
                      <Shield className={cn("size-4", formData.globalRole === String(role.id) ? "text-emerald-500" : "text-zinc-600")} />
                      <div className="flex-1">
                        <p className="text-xs font-bold">{role.name}</p>
                        <p className="text-[10px] opacity-70 leading-tight">Access to {role.name.toLowerCase()} modules & reporting.</p>
                      </div>
                      {formData.globalRole === String(role.id) && <Check className="size-4" />}
                    </div>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Per-Project Overrides</label>
                    <span className="text-[10px] text-zinc-500 italic">Optional</span>
                  </div>
                  {projects.length === 0 ? (
                    <div className="p-8 text-center bg-[#141414] rounded-lg border border-dashed border-[#2a2a2a]">
                      <p className="text-[11px] text-zinc-500">No projects created yet.</p>
                    </div>
                  ) : (
                    projects.map((project) => (
                      <div key={project.id} className="p-3 bg-[#141414] border border-[#2a2a2a] rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Briefcase className="size-4 text-emerald-500/50" />
                          <span className="text-xs font-medium text-zinc-300">{project.name}</span>
                        </div>
                        <select 
                          className="bg-[#0c0c0c] border-[#2a2a2a] text-[10px] rounded px-2 py-1 outline-none focus:border-emerald-500/50"
                          value={projectRoles[project.id] || ""}
                          onChange={(e) => setProjectRoles(prev => ({ ...prev, [project.id]: e.target.value }))}
                        >
                          <option value="">No Access</option>
                          {globalRoles.map(r => (
                            <option key={r.id} value={String(r.id)}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                    ))
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 animate-in zoom-in-95 duration-300">
                  <div className="rounded-lg bg-[#141414] border border-[#1f1f1f] p-4 space-y-4">
                    <div className="flex justify-between items-center border-b border-[#1f1f1f] pb-2">
                      <span className="text-[11px] text-emerald-500 font-bold uppercase tracking-widest">{formData.creationMode === "DIRECT" ? "Creation Summary" : "Invitation Summary"}</span>
                      <ShieldCheck className="size-4 text-emerald-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="col-span-2 flex items-center gap-3 p-2 bg-[#0c0c0c] rounded border border-[#1f1f1f]">
                         <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold">
                            {formData.fullName[0]?.toUpperCase()}
                         </div>
                         <div>
                            <p className="font-medium text-zinc-200">{formData.fullName}</p>
                            <p className="text-[10px] text-zinc-500">{formData.email}</p>
                         </div>
                      </div>
                      <div>
                        <p className="text-zinc-500 mb-0.5 uppercase tracking-tighter text-[9px]">Global Permission</p>
                        <p className="font-bold text-emerald-400">{globalRoles.find(r => String(r.id) === formData.globalRole)?.name}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 mb-0.5 uppercase tracking-tighter text-[9px]">Project Access</p>
                        <p className="font-bold text-zinc-200">{Object.keys(projectRoles).filter(k => projectRoles[k] !== "").length} Projects</p>
                      </div>
                      {formData.creationMode === "DIRECT" && (
                        <div className="col-span-2 pt-2 border-t border-[#1f1f1f]">
                          <p className="text-zinc-500 mb-0.5 uppercase tracking-tighter text-[9px]">Temporary Password</p>
                          <p className="font-mono font-bold text-amber-400">{formData.customPassword}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-zinc-400">
                    <Mail className="size-4 text-emerald-500 shrink-0" />
                    <p>{formData.creationMode === "DIRECT" ? "Account will be created instantly. Provide the temporary password directly to the user." : "An invitation email will be sent to the user with secure login instructions."}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 bg-[#111111] border-t border-[#1f1f1f] flex items-center justify-between">
          {step > 1 ? (
            <Button 
              variant="ghost" 
              onClick={prevStep}
              className="text-zinc-400 hover:text-zinc-100 hover:bg-transparent px-0"
              disabled={isSubmitting}
            >
              <ArrowLeft className="size-4 mr-2" /> Back
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="text-zinc-500 hover:text-zinc-100"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            {step < 4 ? (
              <Button 
                onClick={nextStep}
                disabled={isLoading || (step === 1 && (!formData.fullName || !formData.email || (formData.creationMode === "DIRECT" && !formData.customPassword))) || (step === 2 && !formData.globalRole)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[100px] h-9 shadow-lg shadow-emerald-900/10"
              >
                Continue <ChevronRight className="size-4 ml-1" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[140px] h-9 shadow-lg shadow-emerald-900/10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" /> {formData.creationMode === "DIRECT" ? "Creating..." : "Sending..."}
                  </>
                ) : (
                  formData.creationMode === "DIRECT" ? "Create User" : "Send Invitation"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
