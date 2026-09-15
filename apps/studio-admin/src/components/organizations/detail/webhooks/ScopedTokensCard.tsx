import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  Checkbox,
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
  Trash2,
  Clock,
  Shield,
  CheckCircle2,
  Calendar,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScopedToken } from "./types";

interface ScopedTokensCardProps {
  tokens: ScopedToken[];
  loadingTokens: boolean;
  onCreateToken: (data: { name: string; scopes: string[]; expiresInDays: number | null }) => Promise<void>;
  onRevokeToken: (tokenId: string) => Promise<void>;
}

const AVAILABLE_SCOPES = [
  {
    category: "Coverage Maps & ODPs",
    scopes: [
      { id: "coverage:read", label: "coverage:read", desc: "Lihat data batas coverage area, ODP, dan pole" },
      { id: "coverage:write", label: "coverage:write", desc: "Tambah, ubah, dan hapus boundary coverage & ODP" },
    ],
  },
  {
    category: "Network Infrastructure",
    scopes: [
      { id: "network:read", label: "network:read", desc: "Baca status OLT, ONU, kabel feeder, dan splitter" },
      { id: "network:write", label: "network:write", desc: "Provisioning ONU, manajemen core fiber, dan sambungan" },
    ],
  },
  {
    category: "Customers & Subscribers",
    scopes: [
      { id: "customers:read", label: "customers:read", desc: "Baca data pelanggan, paket internet, dan lokasi drop core" },
      { id: "customers:write", label: "customers:write", desc: "Registrasi dan modifikasi data pelanggan" },
    ],
  },
  {
    category: "Billing & Invoicing",
    scopes: [
      { id: "billing:read", label: "billing:read", desc: "Baca riwayat tagihan dan transaksi pembayaran" },
      { id: "billing:write", label: "billing:write", desc: "Generate invoice dan verifikasi status bayar" },
    ],
  },
  {
    category: "Webhooks & Automation",
    scopes: [
      { id: "webhooks:manage", label: "webhooks:manage", desc: "Kelola endpoint webhook dan langganan event" },
    ],
  },
];

export function ScopedTokensCard({
  tokens,
  loadingTokens,
  onCreateToken,
  onRevokeToken,
}: ScopedTokensCardProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    "coverage:read",
    "network:read",
  ]);
  const [expiryDays, setExpiryDays] = useState<number | null>(90);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const toggleScope = (scopeId: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId]
    );
  };

  const selectAllScopes = () => {
    const all = AVAILABLE_SCOPES.flatMap((c) => c.scopes.map((s) => s.id));
    setSelectedScopes(all);
  };

  const clearAllScopes = () => {
    setSelectedScopes([]);
  };

  const handleCreate = async () => {
    if (!tokenName.trim() || selectedScopes.length === 0) return;
    try {
      setIsSubmitting(true);
      await onCreateToken({
        name: tokenName.trim(),
        scopes: selectedScopes,
        expiresInDays: expiryDays,
      });
      setIsCreateModalOpen(false);
      setTokenName("");
      setSelectedScopes(["coverage:read", "network:read"]);
      setExpiryDays(90);
    } finally {
      setIsSubmitting(false);
    }
  };

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

      {/* Tokens List */}
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
            {tokens.map((token) => {
              const isExpired = token.expiresAt && new Date(token.expiresAt) < new Date();
              return (
                <div
                  key={token.id}
                  className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-foreground">{token.name}</span>
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted text-foreground border border-border">
                        {token.tokenPrefix}...{token.tokenLast4}
                      </span>
                      {token.isRevoked ? (
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

                  {!token.isRevoked && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevoke(token.id)}
                      disabled={revokingId === token.id}
                      className="h-7 px-2 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive gap-1 self-start md:self-center cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>{revokingId === token.id ? "Mencabut..." : "Revoke"}</span>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Create Scoped Token */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-xl bg-card border-border shadow-lg p-6 space-y-4 max-h-[88vh] overflow-y-auto">
          <DialogHeader className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <KeyRound className="h-4.5 w-4.5" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-foreground">
                  Generate Granular Scoped API Token
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Tentukan izin akses (scope) spesifik untuk token integrasi ini.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Token Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Nama / Deskripsi Token</Label>
              <Input
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="Contoh: Billing MikroTik Sync, Grafana Prometheus Exporter"
                className="h-9 text-xs bg-background border-border text-foreground"
              />
            </div>

            {/* Expiration Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Masa Berlaku Token (Expiration)</Label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { label: "30 Hari", val: 30 },
                  { label: "60 Hari", val: 60 },
                  { label: "90 Hari", val: 90 },
                  { label: "180 Hari", val: 180 },
                  { label: "1 Tahun", val: 365 },
                  { label: "Tanpa Batas", val: null },
                ].map((item) => (
                  <button
                    key={String(item.val)}
                    type="button"
                    onClick={() => setExpiryDays(item.val)}
                    className={cn(
                      "p-2 rounded-lg border text-center text-xs transition-colors cursor-pointer",
                      expiryDays === item.val
                        ? "bg-primary/10 border-primary text-primary font-semibold"
                        : "bg-background border-border text-foreground hover:bg-muted"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scopes Selection */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span>Izin Akses API (Granular Scopes)</span>
                </Label>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={selectAllScopes}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    type="button"
                    onClick={clearAllScopes}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="space-y-3 p-3 rounded-lg bg-background/50 border border-border">
                {AVAILABLE_SCOPES.map((cat) => (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="text-[11px] font-bold text-foreground/80 tracking-wide uppercase">
                      {cat.category}
                    </div>
                    <div className="grid grid-cols-1 gap-2 pl-1">
                      {cat.scopes.map((s) => {
                        const checked = selectedScopes.includes(s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() => toggleScope(s.id)}
                            className={cn(
                              "flex items-start gap-2.5 p-2 rounded-md border text-xs cursor-pointer transition-colors",
                              checked
                                ? "bg-primary/5 border-primary/40 text-foreground"
                                : "bg-card border-border/60 text-muted-foreground hover:bg-muted/40"
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleScope(s.id)}
                              className="mt-0.5"
                            />
                            <div className="space-y-0.5">
                              <div className="font-mono font-semibold text-foreground text-xs">{s.label}</div>
                              <div className="text-[10px] text-muted-foreground">{s.desc}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 sm:justify-between items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              {selectedScopes.length} scopes dipilih
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="h-8 text-xs border-border"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleCreate}
                disabled={!tokenName.trim() || selectedScopes.length === 0 || isSubmitting}
                className="h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "Membuat..." : "Generate Token"}</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
