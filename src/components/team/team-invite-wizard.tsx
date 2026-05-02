"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Shield, Briefcase, CheckCircle2, ChevronRight, ArrowLeft, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";

type Step = "identity" | "access" | "review";

interface GlobalRole {
  id: number | string;
  name: string;
  description?: string;
}

interface ProjectData {
  id: string;
  name: string;
  code?: string;
}

export function TeamInviteWizard({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const params = useParams();
  const orgId = params.orgId as string;

  const [step, setStep] = useState<Step>("identity");
  const [globalRoles, setGlobalRoles] = useState<GlobalRole[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    globalRole: "",
  });

  const [projectRoles, setProjectRoles] = useState<Record<string, string>>({});

  const accessToken = session?.accessToken;

  useEffect(() => {
    if (!isOpen || !accessToken || !orgId) return;

    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const config = {
          headers: { Authorization: `Bearer ${accessToken}` }
        };
        const baseUrl = getBackendBaseUrl();
        
        const [rolesRes, projectsRes] = await Promise.all([
          axios.get(`${baseUrl}/roles`, config),
          axios.get(`${baseUrl}/organizations/${orgId}/projects`, config)
        ]);
        
        if (isMounted) {
          setGlobalRoles(rolesRes.data || []);
          // Handle paginated or direct array responses for projects
          setProjects(projectsRes.data.content || projectsRes.data || []); 
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to fetch data", error);
          toast.error("Failed to load roles and projects.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, accessToken, orgId]);

  const nextStep = () => {
    if (step === "identity") setStep("access");
    else if (step === "access") setStep("review");
  };

  const prevStep = () => {
    if (step === "review") setStep("access");
    else if (step === "access") setStep("identity");
  };

  const submitInvite = async () => {
    if (!session?.accessToken) return;
    
    setIsSubmitting(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        globalRoleId: Number(formData.globalRole),
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
      
      toast.success("User successfully invited to the platform!");
      onClose();
      // Reset state for next use
      setStep("identity");
      setFormData({ fullName: "", email: "", globalRole: "" });
      setProjectRoles({});
    } catch (e: unknown) {
      console.error(e);
      if (axios.isAxiosError(e)) {
        toast.error(e.response?.data?.message || "Failed to invite user");
      } else {
        toast.error("Failed to invite user");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background border-border/50 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Invite New Member</DialogTitle>
          <DialogDescription>
            Step-by-step wizard to invite and configure a new organization member.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col h-[600px]">
          {/* Header Progress */}
          <div className="flex items-center px-8 py-4 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                  step === "identity" || step === "access" || step === "review"
                    ? "bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                01
              </div>
              <span
                className={`text-sm font-semibold tracking-wide ${
                  step === "identity" || step === "access" || step === "review"
                    ? "text-emerald-500"
                    : "text-muted-foreground"
                }`}
              >
                IDENTITY
              </span>
            </div>
            <div className="h-px flex-1 bg-border/50 mx-4" />
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                  step === "access" || step === "review"
                    ? "bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                02
              </div>
              <span
                className={`text-sm font-semibold tracking-wide ${
                  step === "access" || step === "review"
                    ? "text-emerald-500"
                    : "text-muted-foreground"
                }`}
              >
                ACCESS AREAS
              </span>
            </div>
            <div className="h-px flex-1 bg-border/50 mx-4" />
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                  step === "review"
                    ? "bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                03
              </div>
              <span
                className={`text-sm font-semibold tracking-wide ${
                  step === "review" ? "text-emerald-500" : "text-muted-foreground"
                }`}
              >
                SECURITY REVIEW
              </span>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {isLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <p>Loading configurations...</p>
              </div>
            ) : step === "identity" ? (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Identity & Role Assignment
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Configure core profile data and operational permissions.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Elena Vance"
                      className="w-full h-11 px-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Corporate Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. e.vance@ex-cloud.org"
                      className="w-full h-11 px-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
                    Primary Global Role
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {globalRoles.map((role) => (
                      <div
                        key={role.id}
                        onClick={() => setFormData({ ...formData, globalRole: String(role.id) })}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          formData.globalRole === String(role.id)
                            ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500"
                            : "border-border hover:border-emerald-500/50 bg-card"
                        }`}
                      >
                        <User className={`w-6 h-6 mb-3 ${formData.globalRole === String(role.id) ? "text-emerald-500" : "text-muted-foreground"}`} />
                        <h4 className="font-semibold text-foreground">{role.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-snug">{role.description || "System Access Role"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : step === "access" ? (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Access Areas
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Assign specific project access and local roles.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-2">
                  {projects.length === 0 ? (
                    <div className="p-8 text-center border border-dashed rounded-xl border-border">
                      <p className="text-muted-foreground text-sm">No projects found in this organization.</p>
                    </div>
                  ) : (
                    projects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-4 border border-border rounded-xl bg-card">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <Briefcase className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{project.name}</h4>
                            <p className="text-xs text-muted-foreground font-mono">ID: {project.id.substring(0, 8)}...</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <select
                            className="h-9 px-3 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            value={projectRoles[project.id] || ""}
                            onChange={(e) => setProjectRoles({ ...projectRoles, [project.id]: e.target.value })}
                          >
                            <option value="">No Access</option>
                            {globalRoles.map((r) => (
                              <option key={r.id} value={String(r.id)}>{r.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : step === "review" ? (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Security Review
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Review identity and access policies before deploying.
                  </p>
                </div>

                <div className="bg-muted/30 border border-border rounded-xl p-6 mt-2">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    Identity Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs mb-1">Name</span>
                      <span className="font-medium">{formData.fullName || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs mb-1">Email</span>
                      <span className="font-medium">{formData.email || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs mb-1">Global Role</span>
                      <span className="font-medium">{globalRoles.find((r) => String(r.id) === formData.globalRole)?.name || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 border border-border rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-500" />
                    Granted Project Access
                  </h3>
                  <ul className="space-y-3">
                    {Object.entries(projectRoles).filter(([, roleId]) => roleId !== "").length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No projects assigned.</p>
                    ) : (
                      Object.entries(projectRoles)
                        .filter(([, roleId]) => roleId !== "")
                        .map(([projectId, roleId]) => (
                          <li key={projectId} className="flex items-center justify-between text-sm">
                            <span className="font-medium">{projects.find(p => p.id === projectId)?.name}</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-semibold">
                              {globalRoles.find(r => String(r.id) === roleId)?.name}
                            </span>
                          </li>
                        ))
                    )}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-8 py-4 border-t border-border/50 bg-muted/10">
            <Button variant="ghost" disabled={isSubmitting} className="text-muted-foreground hover:text-foreground" onClick={step === "identity" ? onClose : prevStep}>
              {step === "identity" ? "Cancel" : (
                <>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </>
              )}
            </Button>
            
            {step === "review" ? (
              <Button onClick={submitInvite} disabled={isSubmitting} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 min-w-[180px]">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
                  <>
                    Deploy / Send Invite
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={nextStep} disabled={step === "identity" && (!formData.fullName || !formData.email || !formData.globalRole)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6">
                Next Step
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
