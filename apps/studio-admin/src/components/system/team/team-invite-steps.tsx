import type * as React from "react";
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
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@k2net/ui";
import { cn } from "@/lib/utils";

export interface GlobalRole {
  id: number | string;
  name: string;
  description?: string;
}

export interface ProjectData {
  id: string;
  name: string;
}

export interface WizardFormData {
  fullName: string;
  email: string;
  globalRole: string;
  creationMode: "INVITE" | "DIRECT";
  customPassword: string;
}

interface StepUserDetailsProps {
  formData: WizardFormData;
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>;
  organizationId?: string;
  paramsOrgId?: string;
  selectedOrgId: string;
  setSelectedOrgId: (id: string) => void;
  orgList: { id: string; name: string }[];
}

export function StepUserDetails({
  formData,
  setFormData,
  organizationId,
  paramsOrgId,
  selectedOrgId,
  setSelectedOrgId,
  orgList,
}: StepUserDetailsProps) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-muted/30 border border-border">
        <button
          type="button"
          onClick={() => setFormData((prev) => ({ ...prev, creationMode: "INVITE" }))}
          className={cn(
            "py-2 px-3 rounded-md text-xs font-bold transition-all flex flex-col items-center gap-1 text-center",
            formData.creationMode === "INVITE"
              ? "bg-primary/10 text-primary border border-primary/30 shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span>Mode 1: Email Invite</span>
          <span className="text-[9px] font-normal opacity-70">Send automated email</span>
        </button>
        <button
          type="button"
          onClick={() => setFormData((prev) => ({ ...prev, creationMode: "DIRECT" }))}
          className={cn(
            "py-2 px-3 rounded-md text-xs font-bold transition-all flex flex-col items-center gap-1 text-center",
            formData.creationMode === "DIRECT"
              ? "bg-primary/10 text-primary border border-primary/30 shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span>Mode 2: Direct Creation</span>
          <span className="text-[9px] font-normal opacity-70">Custom temporary password</span>
        </button>
      </div>

      {!organizationId && !paramsOrgId && (
        <div className="space-y-1.5 animate-in fade-in duration-200">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="size-3" /> Target Organization
          </label>
          <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
            <SelectTrigger className="w-full bg-muted/30 border-border text-sm h-10">
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
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <User className="size-3" /> Full Name
        </label>
        <Input
          value={formData.fullName}
          onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
          placeholder="e.g. Dodi Darsono"
          className="bg-muted/30 border-border focus:border-primary/50 focus:ring-primary/20 text-sm h-10"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Mail className="size-3" /> {formData.creationMode === "DIRECT" ? "Email / Username" : "Corporate Email"}
        </label>
        <Input
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          placeholder={formData.creationMode === "DIRECT" ? "e.g. dodi@teknisi.local or dodi@example.com" : "e.g. dodi@example.com"}
          className="bg-muted/30 border-border focus:border-primary/50 focus:ring-primary/20 text-sm h-10"
        />
      </div>

      {formData.creationMode === "DIRECT" && (
        <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Shield className="size-3 text-primary" /> Temporary Password
          </label>
          <Input
            type="text"
            value={formData.customPassword}
            onChange={(e) => setFormData((prev) => ({ ...prev, customPassword: e.target.value }))}
            placeholder="e.g. TeknisiJaya2026!"
            className="bg-muted/30 border-border focus:border-primary/50 focus:ring-primary/20 text-sm h-10 font-mono"
          />
          <p className="text-[10px] text-muted-foreground">User will be forced to change this password upon first login.</p>
        </div>
      )}
    </div>
  );
}

export function StepRoleSelection({
  globalRoles,
  selectedRole,
  onSelectRole,
}: {
  globalRoles: GlobalRole[];
  selectedRole: string;
  onSelectRole: (roleId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Select Global Role</label>
      {globalRoles.map((role) => (
        <div
          key={role.id}
          onClick={() => onSelectRole(String(role.id))}
          className={cn(
            "p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3",
            selectedRole === String(role.id)
              ? "bg-primary/10 border-primary text-primary"
              : "bg-muted/30 border-border text-muted-foreground hover:border-border"
          )}
        >
          <Shield className={cn("size-4", selectedRole === String(role.id) ? "text-primary" : "text-muted-foreground/60")} />
          <div className="flex-1">
            <p className="text-xs font-bold">{role.name}</p>
            <p className="text-[10px] opacity-70 leading-tight">Access to {role.name.toLowerCase()} modules & reporting.</p>
          </div>
          {selectedRole === String(role.id) && <Check className="size-4" />}
        </div>
      ))}
    </div>
  );
}

export function StepProjectAccess({
  projects,
  globalRoles,
  projectRoles,
  onProjectRoleChange,
}: {
  projects: ProjectData[];
  globalRoles: GlobalRole[];
  projectRoles: Record<string, string>;
  onProjectRoleChange: (projectId: string, roleId: string) => void;
}) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Per-Project Overrides</label>
        <span className="text-[10px] text-muted-foreground italic">Optional</span>
      </div>
      {projects.length === 0 ? (
        <div className="p-8 text-center bg-muted/30 rounded-lg border border-dashed border-border">
          <p className="text-[11px] text-muted-foreground">No projects created yet.</p>
        </div>
      ) : (
        projects.map((project) => (
          <div key={project.id} className="p-3 bg-muted/30 border border-border rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="size-4 text-primary/50" />
              <span className="text-xs font-medium text-foreground">{project.name}</span>
            </div>
            <select
              className="bg-background border-border text-[10px] rounded px-2 py-1 outline-none focus:border-primary/50 text-foreground"
              value={projectRoles[project.id] || ""}
              onChange={(e) => onProjectRoleChange(project.id, e.target.value)}
            >
              <option value="">No Access</option>
              {globalRoles.map((r) => (
                <option key={r.id} value={String(r.id)}>{r.name}</option>
              ))}
            </select>
          </div>
        ))
      )}
    </div>
  );
}

export function StepReviewSummary({
  formData,
  globalRoles,
  projectRoles,
}: {
  formData: WizardFormData;
  globalRoles: GlobalRole[];
  projectRoles: Record<string, string>;
}) {
  const activeRoleName = globalRoles.find((r) => String(r.id) === formData.globalRole)?.name;
  const projectCount = Object.keys(projectRoles).filter((k) => projectRoles[k] !== "").length;

  return (
    <div className="space-y-4 animate-in zoom-in-95 duration-300">
      <div className="rounded-lg bg-muted/30 border border-border p-4 space-y-4">
        <div className="flex justify-between items-center border-b border-border pb-2">
          <span className="text-[11px] text-primary font-bold uppercase tracking-widest">
            {formData.creationMode === "DIRECT" ? "Creation Summary" : "Invitation Summary"}
          </span>
          <ShieldCheck className="size-4 text-primary" />
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="col-span-2 flex items-center gap-3 p-2 bg-background rounded border border-border">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {formData.fullName[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-foreground">{formData.fullName}</p>
              <p className="text-[10px] text-muted-foreground">{formData.email}</p>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5 uppercase tracking-tighter text-[9px]">Global Permission</p>
            <p className="font-bold text-primary">{activeRoleName}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5 uppercase tracking-tighter text-[9px]">Project Access</p>
            <p className="font-bold text-foreground">{projectCount} Projects</p>
          </div>
          {formData.creationMode === "DIRECT" && (
            <div className="col-span-2 pt-2 border-t border-border">
              <p className="text-muted-foreground mb-0.5 uppercase tracking-tighter text-[9px]">Temporary Password</p>
              <p className="font-mono font-bold text-amber-400">{formData.customPassword}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground">
        <Mail className="size-4 text-primary shrink-0" />
        <p>
          {formData.creationMode === "DIRECT"
            ? "Account will be created instantly. Provide the temporary password directly to the user."
            : "An invitation email will be sent to the user with secure login instructions."}
        </p>
      </div>
    </div>
  );
}

export function WizardFooter({
  step,
  isSubmitting,
  isLoading,
  canContinue,
  creationMode,
  onPrev,
  onCancel,
  onNext,
  onSubmit,
}: {
  step: number;
  isSubmitting: boolean;
  isLoading: boolean;
  canContinue: boolean;
  creationMode: "INVITE" | "DIRECT";
  onPrev: () => void;
  onCancel: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="p-6 bg-muted/30 border-t border-border flex items-center justify-between">
      {step > 1 ? (
        <Button
          variant="ghost"
          onClick={onPrev}
          className="text-muted-foreground hover:text-foreground hover:bg-transparent px-0"
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
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground"
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        {step < 4 ? (
          <Button
            onClick={onNext}
            disabled={isLoading || !canContinue}
            className="bg-primary hover:bg-primary/90 text-foreground min-w-[100px] h-9 shadow-lg shadow-primary/10"
          >
            Continue <ChevronRight className="size-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 text-foreground min-w-[140px] h-9 shadow-lg shadow-primary/10"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" /> {creationMode === "DIRECT" ? "Creating..." : "Sending..."}
              </>
            ) : (
              creationMode === "DIRECT" ? "Create User" : "Send Invitation"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
