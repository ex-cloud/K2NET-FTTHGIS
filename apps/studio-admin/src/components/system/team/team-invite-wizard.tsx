import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@k2net/ui";
import { Loader2 } from "lucide-react";
import { useParams } from "@/lib/navigation-compat";
import { useSession } from "@/lib/auth-compat";
import axios from "axios";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";
import {
  StepUserDetails,
  StepRoleSelection,
  StepProjectAccess,
  StepReviewSummary,
  WizardFooter,
  type WizardFormData,
  type GlobalRole,
  type ProjectData,
} from "./team-invite-steps";

interface WizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
}

function getDialogText(step: number, creationMode: "INVITE" | "DIRECT") {
  if (step === 1) {
    return {
      title: creationMode === "DIRECT" ? "Create New User Directly" : "Invite New Member",
      description:
        creationMode === "DIRECT"
          ? "Enter the identification details and temporary password."
          : "Enter the identification details of your team member.",
    };
  }
  if (step === 2) {
    return {
      title: "Primary Role",
      description: "Select the main professional role in the organization.",
    };
  }
  if (step === 3) {
    return {
      title: "Project Access",
      description: "Optional: Assign specific project-level permissions.",
    };
  }
  return {
    title: creationMode === "DIRECT" ? "Review & Create" : "Review & Invite",
    description: "Quick check of the access levels being granted.",
  };
}

function checkCanContinue(step: number, formData: WizardFormData): boolean {
  if (step === 1) {
    const hasBase = Boolean(formData.fullName && formData.email);
    return formData.creationMode === "DIRECT" ? Boolean(hasBase && formData.customPassword) : hasBase;
  }
  if (step === 2) return Boolean(formData.globalRole);
  return true;
}

interface StepBodyProps {
  step: number;
  isLoading: boolean;
  formData: WizardFormData;
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>;
  organizationId?: string;
  paramsOrgId?: string;
  selectedOrgId: string;
  setSelectedOrgId: (id: string) => void;
  orgList: { id: string; name: string }[];
  globalRoles: GlobalRole[];
  projects: ProjectData[];
  projectRoles: Record<string, string>;
  setProjectRoles: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

function WizardStepBody({
  step,
  isLoading,
  formData,
  setFormData,
  organizationId,
  paramsOrgId,
  selectedOrgId,
  setSelectedOrgId,
  orgList,
  globalRoles,
  projects,
  projectRoles,
  setProjectRoles,
}: StepBodyProps) {
  if (isLoading) {
    return (
      <div className="h-40 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-xs">Fetching configuration...</p>
      </div>
    );
  }

  if (step === 1) {
    return (
      <StepUserDetails
        formData={formData}
        setFormData={setFormData}
        organizationId={organizationId}
        paramsOrgId={paramsOrgId}
        selectedOrgId={selectedOrgId}
        setSelectedOrgId={setSelectedOrgId}
        orgList={orgList}
      />
    );
  }

  if (step === 2) {
    return (
      <StepRoleSelection
        globalRoles={globalRoles}
        selectedRole={formData.globalRole}
        onSelectRole={(roleId) => setFormData((prev) => ({ ...prev, globalRole: roleId }))}
      />
    );
  }

  if (step === 3) {
    return (
      <StepProjectAccess
        projects={projects}
        globalRoles={globalRoles}
        projectRoles={projectRoles}
        onProjectRoleChange={(pId, rId) => setProjectRoles((prev) => ({ ...prev, [pId]: rId }))}
      />
    );
  }

  return (
    <StepReviewSummary
      formData={formData}
      globalRoles={globalRoles}
      projectRoles={projectRoles}
    />
  );
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

  const [formData, setFormData] = React.useState<WizardFormData>({
    fullName: "",
    email: "",
    globalRole: "",
    creationMode: "INVITE",
    customPassword: "",
  });

  const [projectRoles, setProjectRoles] = React.useState<Record<string, string>>({});

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

  const canContinue = checkCanContinue(step, formData);

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
            projectId,
            roleId: Number(roleId),
          })),
      };

      await axios.post(`${baseUrl}/organizations/${orgId}/users/invite`, payload, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      toast.success(formData.creationMode === "DIRECT" ? "User created successfully!" : "Invitation sent successfully!");
      onOpenChange(false);
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

  const { title: dialogTitle, description: dialogDescription } = getDialogText(step, formData.creationMode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-background border-border text-foreground p-0 overflow-hidden outline-none">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-border">
          <div
            className="h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-2 text-primary mb-2">
            <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-sm">
              {step}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Step {step} of 4</span>
          </div>
          <DialogTitle className="text-xl font-medium tracking-tight">
            {dialogTitle}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[450px] overflow-y-auto custom-scrollbar">
          <WizardStepBody
            step={step}
            isLoading={isLoading}
            formData={formData}
            setFormData={setFormData}
            organizationId={organizationId}
            paramsOrgId={params.orgId as string | undefined}
            selectedOrgId={selectedOrgId}
            setSelectedOrgId={setSelectedOrgId}
            orgList={orgList}
            globalRoles={globalRoles}
            projects={projects}
            projectRoles={projectRoles}
            setProjectRoles={setProjectRoles}
          />
        </div>

        <WizardFooter
          step={step}
          isSubmitting={isSubmitting}
          isLoading={isLoading}
          canContinue={canContinue}
          creationMode={formData.creationMode}
          onPrev={() => setStep((prev) => prev - 1)}
          onCancel={() => onOpenChange(false)}
          onNext={() => setStep((prev) => prev + 1)}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
