import { Badge, Button, ActionTooltip } from "@k2net/ui";
import { Users, UserPlus } from "lucide-react";

interface TeamHeaderBarProps {
  slug: string;
  onOpenInvite: () => void;
}

export function TeamHeaderBar({ slug, onOpenInvite }: TeamHeaderBarProps) {
  return (
    <div className="p-3.5 rounded-xl border border-border bg-card/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold text-foreground">Tenant Team &amp; Access Control</h3>
          <Badge variant="outline" className="border-border text-[9px] font-mono px-1.5 py-0">
            Realm: {slug}-realm
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Pengaturan akun staf, teknisi lapangan, dan hak akses RBAC Keycloak terisolasi.
        </p>
      </div>

      <ActionTooltip label="Invite Staff Member to Keycloak Realm" shortcut="I">
        <Button
          size="sm"
          onClick={onOpenInvite}
          className="h-7 px-2.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shrink-0 shadow-xs cursor-pointer"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Invite Team Member</span>
        </Button>
      </ActionTooltip>
    </div>
  );
}
