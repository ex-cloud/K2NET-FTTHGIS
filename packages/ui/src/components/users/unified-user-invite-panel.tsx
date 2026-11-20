import * as React from "react";
import {
  Info,
  Key,
  Sparkles,
  Loader2,
  Mail,
  Phone,
  Briefcase,
  User,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { Badge } from "../badge";
import { cn } from "../../utils";
import { PermissionPoliciesAccordion } from "./permission-policies-accordion";
import { UserDiscardConfirmDialog } from "./user-policy-confirm-dialogs";
import {
  type UnifiedRoleOption,
  type UnifiedProjectOption,
  type UnifiedUserScope,
  type UnifiedTranslateFn,
  type UnifiedInviteSubmitPayload,
  trKey,
  generateStrongCryptoPassword,
  resolveCanonicalRoleCode,
  buildPermissionCategoriesForRole,
} from "./user-management-types";

export interface UnifiedUserInvitePanelProps {
  scope: UnifiedUserScope;
  scopeAccountName: string;
  roles: UnifiedRoleOption[];
  projects?: UnifiedProjectOption[];
  isSubmitting?: boolean;
  t?: UnifiedTranslateFn;
  onCancel: () => void;
  onSubmit: (payload: UnifiedInviteSubmitPayload) => Promise<void> | void;
  onOpenDocs?: () => void;
}

export function UnifiedUserInvitePanel({
  scope,
  scopeAccountName,
  roles,
  projects = [],
  isSubmitting = false,
  t,
  onCancel,
  onSubmit,
  onOpenDocs,
}: UnifiedUserInvitePanelProps) {
  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [jobTitle, setJobTitle] = React.useState("");
  const [creationMode, setCreationMode] = React.useState<"INVITE" | "DIRECT">("INVITE");
  const [customPassword, setCustomPassword] = React.useState("");
  const [selectedRoleId, setSelectedRoleId] = React.useState<number | null>(null);
  const [selectedRoleName, setSelectedRoleName] = React.useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("");
  const [discardDialogOpen, setDiscardDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (roles.length > 0 && selectedRoleId === null && !selectedRoleName) {
      setSelectedRoleId(roles[0].id);
      setSelectedRoleName(roles[0].name);
    }
  }, [roles, selectedRoleId, selectedRoleName]);

  const activeRole = React.useMemo(() => {
    if (roles.length === 0) return null;
    return (
      roles.find(
        (r) =>
          (selectedRoleId !== null && r.id === selectedRoleId) ||
          (selectedRoleName && r.name.toLowerCase() === selectedRoleName.toLowerCase())
      ) || null
    );
  }, [roles, selectedRoleId, selectedRoleName]);

  const permissionStats = React.useMemo(() => {
    const cats = buildPermissionCategoriesForRole(scope, activeRole);
    let granted = 0;
    let total = 0;
    for (const cat of cats) {
      for (const item of cat.items) {
        total++;
        if (item.enabled) granted++;
      }
    }
    return { granted, total };
  }, [scope, activeRole]);

  const isDirty = Boolean(
    email.trim() ||
      fullName.trim() ||
      phone.trim() ||
      jobTitle.trim() ||
      customPassword.trim()
  );

  const isFormValid =
    Boolean(email.trim() && email.includes("@") && fullName.trim()) &&
    Boolean(selectedRoleId !== null || selectedRoleName.trim()) &&
    (creationMode === "INVITE" || customPassword.trim().length >= 14);

  const handleRequestCancel = () => {
    if (isDirty) {
      setDiscardDialogOpen(true);
      return;
    }
    onCancel();
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;
    await onSubmit({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      jobTitle: jobTitle.trim(),
      roleId: selectedRoleId,
      roleName: selectedRoleName || (roles[0]?.name ?? "viewer"),
      creationMode,
      customPassword: creationMode === "DIRECT" ? customPassword : "",
      projectId: selectedProjectId,
    });
  };

  const targetMemberLabel = email.trim()
    ? email.trim()
    : fullName.trim()
    ? fullName.trim()
    : trKey(t, "users.cf_zero_members", "0 members");

  return (
    <form onSubmit={handleConfirmSubmit} className="space-y-5">
      {/* 1. In-Canvas Top Bar (No Breadcrumb) */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-foreground tracking-tight">
          {trKey(t, "users.cf_invite_members_title", "Invite members")}
        </h2>
        {onOpenDocs && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenDocs}
            className="h-7 px-2.5 text-xs font-medium border-border"
          >
            {trKey(t, "users.docs_button", "Documentation")}
          </Button>
        )}
      </div>

      {/* 2. Card 1: Add Email Addresses & Member Identity */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-foreground">
              {trKey(
                t,
                "users.cf_add_email_section",
                "Add email addresses & member identity"
              )}
            </span>
            <Info className="size-3.5 text-muted-foreground" />
          </div>

          {/* Mode Switcher: Email Invite vs Direct Creation */}
          <div className="inline-flex items-center gap-1 p-0.5 rounded-md bg-muted/60 border border-border">
            <button
              type="button"
              onClick={() => setCreationMode("INVITE")}
              className={cn(
                "px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer",
                creationMode === "INVITE"
                  ? "bg-card text-foreground shadow-2xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {trKey(t, "users.invite_mode_email", "Mode 1: Email Invite")}
            </button>
            <button
              type="button"
              onClick={() => {
                setCreationMode("DIRECT");
                if (!customPassword) {
                  setCustomPassword(generateStrongCryptoPassword(16));
                }
              }}
              className={cn(
                "px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer",
                creationMode === "DIRECT"
                  ? "bg-card text-foreground shadow-2xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {trKey(t, "users.invite_mode_direct", "Mode 2: Direct Creation")}
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="size-3 text-muted-foreground" />
                {trKey(t, "users.invite_email", "Corporate / Member Email")}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="first@example.com"
                className="h-8.5 text-xs font-mono bg-background border-border"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User className="size-3 text-muted-foreground" />
                {trKey(t, "users.invite_full_name", "Full Name")}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={trKey(
                  t,
                  "users.invite_full_name_placeholder",
                  "e.g. Ahmad Fauzi"
                )}
                className="h-8.5 text-xs bg-background border-border"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="size-3 text-primary" />
                {trKey(t, "users.invite_phone_label", "WhatsApp / Phone")}
              </Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={trKey(
                  t,
                  "users.invite_phone_placeholder",
                  "e.g. 081234567890"
                )}
                className="h-8.5 text-xs font-mono bg-background border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Briefcase className="size-3 text-muted-foreground" />
                {trKey(t, "users.invite_job_title_label", "Job Title / Position")}
              </Label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder={trKey(
                  t,
                  "users.invite_job_title_placeholder",
                  "e.g. NOC Shift Lead"
                )}
                className="h-8.5 text-xs bg-background border-border"
              />
            </div>
          </div>

          {creationMode === "DIRECT" && (
            <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Key className="size-3 text-primary" />
                  {trKey(t, "users.invite_temp_password_label", "Temporary Password")}
                  <span className="text-destructive">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => setCustomPassword(generateStrongCryptoPassword(16))}
                  className="text-[11px] text-primary hover:underline font-mono cursor-pointer inline-flex items-center gap-1"
                >
                  <Sparkles className="size-3" />
                  {trKey(t, "users.invite_generate_strong", "Generate Strong")}
                </button>
              </div>
              <Input
                type="text"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                placeholder={trKey(
                  t,
                  "users.invite_temp_password_placeholder",
                  "Click Generate Strong or enter >= 14 chars"
                )}
                className="h-8.5 text-xs font-mono bg-background border-border"
              />
              <p className="text-[10px] text-muted-foreground">
                {trKey(
                  t,
                  "users.invite_temp_password_hint",
                  "Minimum 14 characters. Account is created immediately in Keycloak and verified."
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Card 2: Add Permission Policies (Cloudflare Accordion Pattern) */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center gap-1.5">
          <span className="text-xs font-semibold text-foreground">
            {trKey(t, "users.cf_add_policies_section", "Add permission policies")}
          </span>
          <Info className="size-3.5 text-muted-foreground" />
        </div>

        <div className="p-4">
          <PermissionPoliciesAccordion
            scope={scope}
            scopeAccountName={scopeAccountName}
            targetMemberLabel={targetMemberLabel}
            roles={roles}
            selectedRoleId={selectedRoleId}
            selectedRoleName={selectedRoleName}
            onSelectRole={(role) => {
              setSelectedRoleId(role.id);
              setSelectedRoleName(role.name);
            }}
            projects={projects}
            selectedProjectId={selectedProjectId || "ALL"}
            onSelectProjectId={setSelectedProjectId}
            t={t}
          />
        </div>

        <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary shrink-0" />
            <span className="text-xs font-semibold text-foreground">
              {activeRole
                ? trKey(
                    t,
                    "users.cf_active_policy_summary",
                    "Active Policy: {{role}} [{{code}}] — {{granted}}/{{total}} Permissions Granted",
                    {
                      role: activeRole.displayName || activeRole.name,
                      code: resolveCanonicalRoleCode(activeRole.name, activeRole.code, scope),
                      granted: permissionStats.granted,
                      total: permissionStats.total,
                    }
                  )
                : trKey(t, "users.cf_no_role_selected", "No Role Selected")}
            </span>
          </div>

          <Badge
            variant="outline"
            className="text-[10px] font-mono px-2 py-0.5 bg-muted/40 text-muted-foreground border-border"
          >
            {trKey(t, "users.cf_rbac_mode", "Role-based Access Control (RBAC)")}
          </Badge>
        </div>
      </div>

      {/* 4. Bottom Action Bar (Cancel on Left, Invite Members on Right) */}
      <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRequestCancel}
          disabled={isSubmitting}
          className="h-7 px-2.5 text-xs font-medium border-border"
        >
          {trKey(t, "common.cancel", "Cancel")}
        </Button>

        <Button
          type="submit"
          variant="default"
          size="sm"
          disabled={!isFormValid || isSubmitting}
          className="h-7 px-2.5 text-xs font-medium gap-1.5"
        >
          {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
          {isSubmitting
            ? trKey(t, "users.invite_processing", "Processing...")
            : creationMode === "DIRECT"
            ? trKey(t, "users.invite_direct_create_btn", "Create User Directly")
            : trKey(t, "users.cf_invite_members_btn", "Invite members")}
        </Button>
      </div>

      {/* 5. Discard Invitations Guard Modal (Cloudflare Image 3) */}
      <UserDiscardConfirmDialog
        open={discardDialogOpen}
        onOpenChange={setDiscardDialogOpen}
        variant="invite"
        t={t}
        onConfirmLeave={onCancel}
      />
    </form>
  );
}
