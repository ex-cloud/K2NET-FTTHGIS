import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@k2net/ui";
import { UserPlus, Shield, Phone, Briefcase, Mail, Key, Loader2, Sparkles, FolderGit2 } from "lucide-react";
import type { DynamicRole } from "./types";
import { cn } from "@/lib/utils";

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgName: string;
  name: string;
  setName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  jobTitle: string;
  setJobTitle: (jobTitle: string) => void;
  roles: DynamicRole[];
  selectedRoleId: number | null;
  onRoleChange: (roleId: number) => void;
  creationMode: "INVITE" | "DIRECT";
  setCreationMode: (mode: "INVITE" | "DIRECT") => void;
  customPassword: string;
  setCustomPassword: (pwd: string) => void;
  projects?: { id: string; name: string }[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  isSubmitting: boolean;
  onSendInvite: () => void;
}

export function InviteMemberModal({
  open,
  onOpenChange,
  orgName,
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  jobTitle,
  setJobTitle,
  roles = [],
  selectedRoleId,
  onRoleChange,
  creationMode,
  setCreationMode,
  customPassword,
  setCustomPassword,
  projects = [],
  selectedProjectId,
  setSelectedProjectId,
  isSubmitting,
  onSendInvite,
}: InviteMemberModalProps) {
  // Generate cryptographically random secure password (Zero Hardcoded Credentials)
  const generateStrongPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
    const array = new Uint32Array(16);
    crypto.getRandomValues(array);
    let pass = "";
    for (let i = 0; i < 16; i++) {
      pass += chars[array[i] % chars.length];
    }
    setCustomPassword(pass);
  };

  const isFormValid =
    Boolean(name.trim() && email.trim()) &&
    (creationMode === "INVITE" || (customPassword && customPassword.length >= 14));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover/95 backdrop-blur-xl border-border sm:max-w-[500px] p-0 overflow-hidden shadow-xl text-foreground">
        <DialogHeader className="p-6 pb-2 text-foreground">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            <span>Invite Staff to {orgName}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure identity credentials, contact details, and operational ISP workspace permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
          {/* 1. Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-muted/40 border border-border">
            <button
              type="button"
              onClick={() => setCreationMode("INVITE")}
              className={cn(
                "py-2 px-3 rounded-md text-xs font-bold transition-all flex flex-col items-center gap-0.5 text-center cursor-pointer",
                creationMode === "INVITE"
                  ? "bg-primary/10 text-primary border border-primary/30 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>Mode 1: Email Invite</span>
              <span className="text-[10px] font-normal opacity-70">Automated activation link</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCreationMode("DIRECT");
                if (!customPassword) {
                  generateStrongPassword();
                }
              }}
              className={cn(
                "py-2 px-3 rounded-md text-xs font-bold transition-all flex flex-col items-center gap-0.5 text-center cursor-pointer",
                creationMode === "DIRECT"
                  ? "bg-primary/10 text-primary border border-primary/30 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>Mode 2: Direct Creation</span>
              <span className="text-[10px] font-normal opacity-70">Set temporary password</span>
            </button>
          </div>

          {/* 2. Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Ahmad Fauzi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-card border-border text-foreground h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="size-3 text-muted-foreground" /> Work Email <span className="text-destructive">*</span>
              </Label>
              <Input
                type="email"
                placeholder="e.g. fauzi@isp.net"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-card border-border text-foreground h-9 text-xs font-mono"
              />
            </div>
          </div>

          {/* 3. Phone & Job Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="size-3 text-primary" /> WhatsApp / Phone
              </Label>
              <Input
                type="tel"
                placeholder="e.g. 081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-card border-border text-foreground h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Briefcase className="size-3 text-muted-foreground" /> Job Title / Jabatan
              </Label>
              <Input
                placeholder="e.g. NOC Shift Lead"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="bg-card border-border text-foreground h-9 text-xs"
              />
            </div>
          </div>

          {/* 4. Role Selection (100% Dynamic from Database) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Shield className="size-3 text-primary" /> Role &amp; Access Permission <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedRoleId ? String(selectedRoleId) : ""}
              onValueChange={(v) => onRoleChange(Number(v))}
            >
              <SelectTrigger className="bg-card border-border text-foreground h-9 text-xs">
                <SelectValue placeholder="Select dynamic workspace role" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground text-xs">
                {roles.length === 0 ? (
                  <div className="p-2 text-[11px] text-muted-foreground text-center">Loading roles from database...</div>
                ) : (
                  roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">{r.displayName || r.name}</span>
                        {r.code && (
                          <span className="text-[10px] text-primary/80 font-mono">[{r.code}]</span>
                        )}
                        {r.description && (
                          <span className="text-muted-foreground text-[11px] truncate max-w-[240px]">
                            — {r.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 5. Direct Password Input (Mode 2) */}
          {creationMode === "DIRECT" && (
            <div className="space-y-1.5 p-3 rounded-lg border border-border bg-muted/20 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Key className="size-3 text-primary" /> Temporary Password <span className="text-destructive">*</span>
                </Label>
                <button
                  type="button"
                  onClick={generateStrongPassword}
                  className="text-[11px] text-primary hover:underline font-mono cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="size-3" /> Generate Strong
                </button>
              </div>
              <Input
                type="text"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                placeholder="Click Generate Strong or enter >= 14 chars"
                className="bg-card border-border text-foreground h-9 text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                Minimum 14 characters. Account is created in Keycloak &amp; user is prompted to set permanent password upon first login.
              </p>
            </div>
          )}

          {/* 6. Optional Project Scope */}
          {projects.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FolderGit2 className="size-3 text-muted-foreground" /> Project Area Assignment (Optional)
              </Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="bg-card border-border text-foreground h-9 text-xs">
                  <SelectValue placeholder="All Organization Projects (Default)" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground text-xs">
                  <SelectItem value="">All Organization Projects (Default)</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onSendInvite}
            disabled={!isFormValid || isSubmitting}
            className="text-xs font-medium bg-primary text-primary-foreground cursor-pointer gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                <span>Processing...</span>
              </>
            ) : creationMode === "DIRECT" ? (
              "Create Member Directly"
            ) : (
              "Send Invitation"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
