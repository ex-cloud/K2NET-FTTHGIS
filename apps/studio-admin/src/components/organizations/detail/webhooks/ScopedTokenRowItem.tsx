import {
  Badge,
  Button,
  ActionTooltip,
} from "@k2net/ui";
import {
  Trash2,
  Clock,
  Calendar,
  ShieldAlert,
} from "lucide-react";
import type { ScopedToken } from "./types";

interface ScopedTokenRowItemProps {
  token: ScopedToken;
  isRevoking: boolean;
  canManage?: boolean;
  onRevoke: (id: string) => void;
}

export function ScopedTokenRowItem({
  token,
  isRevoking,
  canManage = true,
  onRevoke,
}: ScopedTokenRowItemProps) {
  const isRevoked = Boolean(token.isRevoked || token.revoked);
  const isExpired = token.expiresAt && new Date(token.expiresAt) < new Date();

  return (
    <div className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-foreground">{token.name}</span>
          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted text-foreground border border-border">
            {token.tokenPrefix}...{token.tokenLast4}
          </span>
          {isRevoked ? (
            <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive text-[9px] font-mono">
              REVOKED
            </Badge>
          ) : isExpired ? (
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-mono">
              EXPIRED
            </Badge>
          ) : (
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono">
              ACTIVE
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {token.scopes.map((scope) => (
            <Badge
              key={scope}
              variant="outline"
              className="text-[9px] font-mono bg-background border-border text-foreground"
            >
              {scope}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Dibuat: {new Date(token.createdAt).toLocaleDateString("id-ID")}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {token.expiresAt
              ? `Berlaku s/d: ${new Date(token.expiresAt).toLocaleDateString("id-ID")}`
              : "Tidak pernah kedaluwarsa"}
          </span>
          {token.lastUsedAt && (
            <span>
              Terakhir digunakan: {new Date(token.lastUsedAt).toLocaleDateString("id-ID")}
            </span>
          )}
        </div>
      </div>

      {!isRevoked && (
        canManage ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRevoke(token.id)}
            disabled={isRevoking}
            className="h-7 px-2 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive gap-1 self-start md:self-center cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            <span>{isRevoking ? "Mencabut..." : "Revoke"}</span>
          </Button>
        ) : (
          <ActionTooltip label="Akses Read-Only: Memerlukan izin system.organizations.webhooks.manage">
            <span className="inline-block self-start md:self-center">
              <Button
                variant="outline"
                size="sm"
                disabled
                className="h-7 px-2 text-xs border-border text-muted-foreground opacity-50 cursor-not-allowed gap-1"
              >
                <ShieldAlert className="h-3 w-3" />
                <span>Revoke</span>
              </Button>
            </span>
          </ActionTooltip>
        )
      )}
    </div>
  );
}
