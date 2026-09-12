import React from "react";
import { CreditCard, Loader2, Sparkles, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, UniversalContextMenu, type ContextMenuGroupConfig } from "@k2net/ui";
import { toast } from "sonner";
import type { PaymentTransaction } from "@/lib/actions/gateways";

interface PaymentTransactionsCardProps {
  transactions: PaymentTransaction[];
  loading: boolean;
}

function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} mnt lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function getPaymentContextMenuGroups(tx: PaymentTransaction): ContextMenuGroupConfig[] {
  return [
    {
      items: [
        {
          label: "Tanya AI Status Transaksi",
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: {
                  prompt: `Analisa status transaksi pembayaran tagihan invoice ID ${tx.externalId}. Status: ${tx.status}, Tenant: ${tx.orgSlug}, Nominal: Rp ${tx.amount.toLocaleString("id-ID")}, Paket: ${tx.planName}. Berikan ringkasan audit rekonsiliasi.`,
                },
              })
            );
            window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
          },
        },
      ],
    },
    {
      items: [
        {
          label: "Salin External ID",
          icon: Copy,
          shortcut: "Ctrl+C",
          onClick: () => {
            navigator.clipboard.writeText(tx.externalId);
            toast.success(`External ID ${tx.externalId} disalin!`);
          },
        },
        {
          label: "Salin Nominal Pembayaran",
          icon: CreditCard,
          shortcut: "Alt+C",
          onClick: () => {
            navigator.clipboard.writeText(String(tx.amount));
            toast.success(`Nominal Rp ${tx.amount.toLocaleString("id-ID")} disalin!`);
          },
        },
      ],
    },
  ];
}

export function PaymentTransactionsCard({ transactions, loading }: PaymentTransactionsCardProps) {
  return (
    <Card glowingEffect className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
          Transaksi Terkini
          {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted/40 rounded animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/60 text-center py-4">Belum ada riwayat transaksi.</p>
        ) : (
          transactions.map((tx) => (
            <UniversalContextMenu key={tx.id} groups={getPaymentContextMenuGroups(tx)}>
              <div className="border-b border-border pb-3 last:border-b-0 last:pb-0 space-y-1 cursor-context-menu hover:bg-muted/10 p-1.5 rounded transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-foreground truncate max-w-[140px] font-mono">
                    {tx.externalId.split(":").pop()?.slice(0, 12)}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    Rp {tx.amount.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[9px] text-muted-foreground">
                  <span>
                    Org: {tx.orgSlug} ({tx.planName})
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      className={`text-[8px] px-1 py-0 border ${
                        tx.status === "PAID" || tx.status === "SUCCESS"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : tx.status === "PENDING"
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      }`}
                    >
                      {tx.status}
                    </Badge>
                    <span>{formatRelativeTime(tx.createdAt)}</span>
                  </div>
                </div>
              </div>
            </UniversalContextMenu>
          ))
        )}
      </CardContent>
    </Card>
  );
}
