import * as React from "react";
import {
  CreditCard,
  Check,
  Zap,
  Download,
  Loader2,
  Sparkles,
  Shield,
  Receipt,
  ExternalLink,
} from "lucide-react";
import {
  PageHeader,
  PageContentShell,
  Card,
  Button,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@k2net/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../lib/api-client";
import { useTenantSubscription } from "../../hooks/useTenantSubscription";
import { toast } from "sonner";

interface PaymentTransaction {
  id: string;
  externalId: string;
  orgSlug: string;
  planName: string;
  amount: number;
  status: "PENDING" | "PAID" | "COMPLETED" | "SETTLED" | "EXPIRED" | "FAILED";
  payerEmail?: string;
  createdAt: string;
  updatedAt?: string;
}

interface SubscribeResponse {
  invoice_id?: string;
  invoice_url?: string;
  external_id?: string;
  amount?: number;
  status?: string;
}

export function BillingPage() {
  const queryClient = useQueryClient();
  const { summary, tier, planCycle, refetch: refetchSubscription } = useTenantSubscription();

  const { data: recentPayments = [], isLoading: isPaymentsLoading } = useQuery<PaymentTransaction[]>({
    queryKey: ["tenant-recent-payments"],
    queryFn: async () => {
      try {
        const res = await apiClient<PaymentTransaction[]>("/api/v1/payments/recent");
        return Array.isArray(res) ? res : [];
      } catch (err) {
        console.warn("Could not fetch recent payments:", err);
        return [];
      }
    },
    staleTime: 30 * 1000,
  });

  const subscribeMutation = useMutation({
    mutationFn: async (targetPlan: string) => {
      return apiClient<SubscribeResponse>("/api/v1/payments/subscribe", {
        method: "POST",
        body: JSON.stringify({ plan: targetPlan }),
      });
    },
    onSuccess: (data) => {
      toast.success("Faktur pembayaran berhasil diterbitkan.");
      if (data?.invoice_url) {
        window.open(data.invoice_url, "_blank");
      }
      queryClient.invalidateQueries({ queryKey: ["tenant-recent-payments"] });
      refetchSubscription();
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Gagal memproses langganan";
      toast.error(msg);
    },
  });

  const plans = [
    {
      key: "FREE",
      name: "STARTER TRIAL",
      price: "Rp 0",
      period: "/bulan",
      description: "Starter 7-day evaluation trial with basic hardware quotas and standard community support.",
      features: [
        "Maksimal 2 OLT & Proyek FTTH Aktif",
        "Maksimal 500 ODP & 100 ODC",
        "Hingga 1.000 Pelanggan Terdaftar",
        "10 GB Kapasitas MinIO S3 Storage",
        "Akses API Standar (2.000 RPM)",
        "Dukungan Tiket & Komunitas Standar",
      ],
      current: tier === "free",
      badge: tier === "free" ? "PAKET AKTIF" : undefined,
    },
    {
      key: "PRO",
      name: "PROFESSIONAL",
      price: "Rp 4.900.000",
      period: "/bulan",
      description: "Professional ISP tier with dedicated poller, LDAP SSO, and Gold 99.5% SLA.",
      features: [
        "Maksimal 5 OLT & Proyek FTTH Aktif",
        "Maksimal 2.500 ODP & 500 ODC",
        "Hingga 5.000 Pelanggan Terdaftar",
        "50 GB Kapasitas MinIO S3 Storage",
        "Live SNMP OLT Poller Telemetry (5.000 RPM)",
        "Keycloak SSO / LDAP Federation",
        "Gold 99.5% SLA Support",
      ],
      current: tier === "pro",
      badge: tier === "pro" ? "PAKET AKTIF" : undefined,
    },
    {
      key: "ENTERPRISE",
      name: "ENTERPRISE",
      price: "Rp 14.500.000",
      period: "/bulan",
      description: "Enterprise Core tier with AI Fiber Copilot, custom POP gateway, and Platinum 99.9% SLA.",
      features: [
        "Maksimal 20 OLT & Proyek FTTH Aktif",
        "Maksimal 10.000 ODP & 2.000 ODC",
        "Hingga 20.000 Pelanggan Terdaftar",
        "100 GB Kapasitas MinIO S3 Storage",
        "AI Fiber Diagnostics Copilot & GIS Core",
        "Integrasi REST API, Webhooks & SNMP (20.000 RPM)",
        "Keycloak SSO / LDAP + Custom Domain White-Label",
        "Platinum 99.9% 24/7 SLA Matrix & Dedicated TAM",
      ],
      current: tier === "enterprise",
      badge: tier === "enterprise" ? "PAKET AKTIF" : undefined,
    },
  ];

  const handleSelectPlan = (planKey: string) => {
    subscribeMutation.mutate(planKey);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.success(`Mengunduh kuitansi ${invoiceId}...`);
  };

  const currentDisplayTitle =
    tier === "enterprise"
      ? "Paket Enterprise Telco"
      : tier === "free"
      ? "Paket Starter Free"
      : "Paket Professional ISP";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Langganan & Faktur Penagihan"
        breadcrumbs={[
          { label: "Organisasi", href: "/projects" },
          { label: "Billing & Pembayaran" },
        ]}
      />

      <PageContentShell className="space-y-6 custom-scrollbar">
        {/* Current Plan Overview Card */}
        <Card className="p-5 border-border/60 bg-card shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                {tier === "enterprise" ? (
                  <Sparkles className="h-5 w-5" />
                ) : tier === "free" ? (
                  <Shield className="h-5 w-5" />
                ) : (
                  <Zap className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">
                    {currentDisplayTitle}
                  </h3>
                  <Badge variant="default" className="text-[10px] font-mono">
                    {summary?.status || "AKTIF"}
                  </Badge>
                  {summary?.isBoosterActive && (
                    <Badge variant="outline" className="text-[10px] font-mono text-amber-500 border-amber-500/30 bg-amber-500/10">
                      BOOSTER ({summary.boosterDaysRemaining} Hari)
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Siklus penagihan: <strong>{planCycle}</strong> • Pembayaran aman otomatis via Payment Gateway
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSelectPlan("PRO")}
              disabled={subscribeMutation.isPending || tier === "pro"}
              className="h-8 px-3 text-xs font-medium gap-1.5 shadow-xs border-border/80"
            >
              <CreditCard className="h-3.5 w-3.5" />
              {tier === "free" ? "Upgrade ke Pro via Xendit" : "Kelola Pembayaran"}
            </Button>
          </div>
        </Card>

        {/* Pricing Tier Plans */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Pilihan Paket Langganan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => (
              <Card
                key={p.key}
                className={`p-5 flex flex-col justify-between border-border/60 bg-card transition-all ${
                  p.current
                    ? "border-primary ring-1 ring-primary shadow-sm"
                    : "hover:border-primary/40"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{p.name}</span>
                    {p.badge && (
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {p.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-xl font-bold font-mono text-foreground">{p.price}</span>
                    <span className="text-xs text-muted-foreground">{p.period}</span>
                  </div>

                  <p className="text-xs text-muted-foreground min-h-[32px] leading-relaxed">
                    {p.description}
                  </p>

                  <div className="pt-3 border-t border-border/40 space-y-2">
                    {p.features.map((f, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-xs text-foreground">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-border/40">
                  <Button
                    variant={p.current ? "outline" : "default"}
                    size="sm"
                    disabled={p.current || subscribeMutation.isPending}
                    onClick={() => handleSelectPlan(p.key)}
                    className="w-full text-xs font-semibold gap-1.5"
                  >
                    {subscribeMutation.isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Memproses...
                      </>
                    ) : p.current ? (
                      "Paket Saat Ini"
                    ) : (
                      <>
                        Pilih Paket Ini
                        <ExternalLink className="h-3 w-3" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Invoices History Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Riwayat Pembayaran & Faktur
          </h3>

          <Card className="border-border/60 overflow-hidden shadow-xs">
            {isPaymentsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : recentPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-[11px]">
                    <TableHead className="font-bold">NOMOR TRANSAKSI</TableHead>
                    <TableHead className="font-bold">TANGGAL</TableHead>
                    <TableHead className="font-bold">PAKET</TableHead>
                    <TableHead className="font-bold">PEMBAYAR</TableHead>
                    <TableHead className="font-bold">TOTAL</TableHead>
                    <TableHead className="font-bold">STATUS</TableHead>
                    <TableHead className="w-16 text-right">FAKTUR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((tx) => (
                    <TableRow key={tx.id} className="text-xs">
                      <TableCell className="font-mono font-bold text-foreground">
                        {tx.externalId || tx.id}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("id-ID") : "-"}
                      </TableCell>
                      <TableCell className="font-medium">{tx.planName || "PROFESSIONAL"}</TableCell>
                      <TableCell className="text-muted-foreground">{tx.payerEmail || "-"}</TableCell>
                      <TableCell className="font-mono font-bold text-foreground">
                        Rp {tx.amount ? Number(tx.amount).toLocaleString("id-ID") : "0"}
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          tx.status === "PAID" || tx.status === "COMPLETED" || tx.status === "SETTLED"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : tx.status === "PENDING"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        }`}>
                          {tx.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadInvoice(tx.externalId || tx.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Download Bukti Pembayaran"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center space-y-2">
                <Receipt className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-xs font-semibold text-foreground">Belum Ada Riwayat Transaksi</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Semua transaksi pembayaran paket langganan dan faktur resmi Anda akan tercatat secara otomatis di sini.
                </p>
              </div>
            )}
          </Card>
        </div>
      </PageContentShell>
    </div>
  );
}
