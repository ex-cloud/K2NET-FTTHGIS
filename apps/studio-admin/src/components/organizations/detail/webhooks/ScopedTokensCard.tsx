import { useState } from "react";
import {
  Badge,
  Button,
  Card,
} from "@k2net/ui";
import {
  KeyRound,
  Plus,
  Shield,
} from "lucide-react";
import type { ScopedToken } from "./types";
import { CreateScopedTokenModal } from "./CreateScopedTokenModal";
import { ScopedTokenRowItem } from "./ScopedTokenRowItem";

interface ScopedTokensCardProps {
  tokens: ScopedToken[];
  loadingTokens: boolean;
  onCreateToken: (data: { name: string; scopes: string[]; expiresInDays: number | null }) => Promise<void>;
  onRevokeToken: (tokenId: string) => Promise<void>;
}

export function ScopedTokensCard({
  tokens,
  loadingTokens,
  onCreateToken,
  onRevokeToken,
}: ScopedTokensCardProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleRevoke = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin mencabut (revoke) API Token ini secara permanen? Token tidak akan bisa digunakan lagi.")) {
      return;
    }
    try {
      setRevokingId(id);
      await onRevokeToken(id);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <Card className="p-5 space-y-4 bg-card border-border shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <KeyRound className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-foreground">Granular Scoped API Tokens</h3>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono">
                {tokens.filter((t) => !t.isRevoked).length} ACTIVE
              </Badge>
              <Badge variant="outline" className="border-border text-muted-foreground text-[9px] font-mono gap-1">
                <Shield className="h-2.5 w-2.5 text-primary" />
                LEAST PRIVILEGE
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Buat token dengan izin akses terbatas (scope) dan tanggal kedaluwarsa untuk integrasi sistem pihak ketiga yang aman.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="h-7 px-2.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="h-3 w-3" />
          <span>Generate Scoped Token</span>
        </Button>
      </div>

      <div className="space-y-2 pt-1">
        {loadingTokens ? (
          <div className="p-6 text-center text-xs text-muted-foreground animate-pulse">
            Memuat daftar scoped tokens...
          </div>
        ) : tokens.length === 0 ? (
          <div className="p-6 rounded-lg border border-dashed border-border bg-background/50 text-center space-y-2">
            <KeyRound className="h-6 w-6 text-muted-foreground mx-auto" />
            <div className="text-xs font-medium text-foreground">Belum ada Scoped API Token</div>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Gunakan scoped token untuk memberikan akses terbatas (misal: hanya baca coverage atau hanya provisioning) kepada developer atau bot eksternal.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60 rounded-lg border border-border/80 overflow-hidden bg-background/30">
            {tokens.map((token) => (
              <ScopedTokenRowItem
                key={token.id}
                token={token}
                isRevoking={revokingId === token.id}
                onRevoke={handleRevoke}
              />
            ))}
          </div>
        )}
      </div>

      <CreateScopedTokenModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreate={onCreateToken}
      />
    </Card>
  );
}
