import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import {
  KeyRound,
  Plus,
  Shield,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [tokenToRevoke, setTokenToRevoke] = useState<ScopedToken | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [filterMode, setFilterMode] = useState<"active" | "all">("active");

  const activeTokens = tokens.filter((t) => !t.isRevoked);
  const displayedTokens = filterMode === "active" ? activeTokens : tokens;

  const handleOpenRevoke = (id: string) => {
    const target = tokens.find((t) => t.id === id);
    if (target) {
      setTokenToRevoke(target);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!tokenToRevoke) return;
    try {
      setIsRevoking(true);
      await onRevokeToken(tokenToRevoke.id);
      setTokenToRevoke(null);
    } finally {
      setIsRevoking(false);
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
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold text-foreground">Granular Scoped API Tokens</h3>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono">
                {activeTokens.length} ACTIVE
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

        <div className="flex items-center gap-2 flex-wrap">
          {tokens.some((t) => t.isRevoked) && (
            <div className="flex items-center p-0.5 rounded-lg bg-background border border-border text-[11px]">
              <button
                type="button"
                onClick={() => setFilterMode("active")}
                className={cn(
                  "px-2 py-1 rounded-md transition-colors cursor-pointer",
                  filterMode === "active"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Aktif ({activeTokens.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={cn(
                  "px-2 py-1 rounded-md transition-colors cursor-pointer",
                  filterMode === "all"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Semua ({tokens.length})
              </button>
            </div>
          )}

          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-7 px-2.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="h-3 w-3" />
            <span>Generate Scoped Token</span>
          </Button>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        {loadingTokens && displayedTokens.length === 0 ? (
          <div className="divide-y divide-border/60 rounded-lg border border-border/80 overflow-hidden bg-background/30 animate-pulse">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted/70" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-32 bg-muted/70 rounded" />
                    <div className="h-2.5 w-48 bg-muted/50 rounded" />
                  </div>
                </div>
                <div className="h-7 w-16 bg-muted/60 rounded" />
              </div>
            ))}
          </div>
        ) : displayedTokens.length === 0 ? (
          <div className="p-6 rounded-lg border border-dashed border-border bg-background/50 text-center space-y-2">
            <KeyRound className="h-6 w-6 text-muted-foreground mx-auto" />
            <div className="text-xs font-medium text-foreground">
              {filterMode === "active" ? "Belum ada Scoped API Token aktif" : "Belum ada Scoped API Token"}
            </div>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Gunakan scoped token untuk memberikan akses terbatas kepada developer atau bot eksternal.
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "divide-y divide-border/60 rounded-lg border border-border/80 overflow-hidden bg-background/30 transition-opacity duration-300",
              loadingTokens && "opacity-60 pointer-events-none"
            )}
          >
            {displayedTokens.map((token) => (
              <ScopedTokenRowItem
                key={token.id}
                token={token}
                isRevoking={isRevoking && tokenToRevoke?.id === token.id}
                onRevoke={handleOpenRevoke}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Token Modal */}
      <CreateScopedTokenModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreate={onCreateToken}
      />

      {/* Modern Confirmation Dialog for Revoking Token */}
      <Dialog open={Boolean(tokenToRevoke)} onOpenChange={(open) => !open && setTokenToRevoke(null)}>
        <DialogContent className="max-w-md bg-card border-border shadow-xl p-5 space-y-4">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-foreground">
                  Cabut (Revoke) Scoped API Token?
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Tindakan ini permanen dan tidak dapat dibatalkan.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {tokenToRevoke && (
            <div className="p-3 rounded-lg bg-background/60 border border-border/70 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nama Token:</span>
                <span className="font-semibold text-foreground">{tokenToRevoke.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Prefix Token:</span>
                <span className="font-mono text-foreground font-medium">
                  {tokenToRevoke.tokenPrefix}...{tokenToRevoke.tokenLast4}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Jumlah Scope:</span>
                <span className="font-semibold text-primary">{tokenToRevoke.scopes.length} Scopes</span>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Aplikasi, bot, atau sistem pihak ketiga yang menggunakan token ini akan segera kehilangan akses API seketika setelah dicabut.
          </p>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTokenToRevoke(null)}
              disabled={isRevoking}
              className="h-8 text-xs border-border"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmRevoke}
              disabled={isRevoking}
              className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5 cursor-pointer shadow-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{isRevoking ? "Mencabut..." : "Ya, Cabut Token"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

