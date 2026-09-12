import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@k2net/ui";
import { UserPlus } from "lucide-react";
import type { TenantUserRole } from "./types";

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgName: string;
  name: string;
  setName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  role: TenantUserRole;
  setRole: (role: TenantUserRole) => void;
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
  role,
  setRole,
  onSendInvite,
}: InviteMemberModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover/95 backdrop-blur-xl border-border sm:max-w-[420px] p-0 overflow-hidden shadow-2xl text-foreground">
        <DialogHeader className="p-6 pb-2 text-foreground">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            <span>Invite Staff to {orgName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Full Name</Label>
            <Input
              placeholder="e.g. Ahmad Fauzi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-card border-border text-foreground h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Work Email</Label>
            <Input
              type="email"
              placeholder="e.g. fauzi@isp.net"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-card border-border text-foreground h-9 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Role &amp; Access Permission</Label>
            <Select value={role} onValueChange={(v) => setRole(v as TenantUserRole)}>
              <SelectTrigger className="bg-card border-border text-foreground h-9 text-xs">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground text-xs">
                <SelectItem value="TENANT_ADMIN">Tenant Admin (Full Management)</SelectItem>
                <SelectItem value="NOC_OPERATOR">NOC Operator (GIS &amp; OLT Poller)</SelectItem>
                <SelectItem value="FIELD_TECH">Field Technician (ONT Provisioning)</SelectItem>
                <SelectItem value="VIEWER">Read-only Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onSendInvite}
            className="text-xs font-semibold bg-primary text-primary-foreground cursor-pointer"
          >
            Send Invitation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
