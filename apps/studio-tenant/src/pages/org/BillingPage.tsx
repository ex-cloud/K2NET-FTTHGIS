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
import { useTranslation } from "@k2net/i18n";
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
  const { t, formatCurrency, formatDate } = useTranslation();
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
      toast.success(t("billing.invoice_issued_success"));
      if (data?.invoice_url) {
        window.open(data.invoice_url, "_blank");
      }
      queryClient.invalidateQueries({ queryKey: ["tenant-recent-payments"] });
      refetchSubscription();
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : t("billing.subscribe_failed");
      toast.error(msg);
    },
  });

  const plans = [
    {
      key: "FREE",
      name: "STARTER TRIAL",
      price: formatCurrency(0),
      period: t("billing.per_month"),
      description: "Starter 14-day evaluation trial with basic hardware quotas and standard community support.",
      features: [
        "Maksimal 1 OLT & Proyek FTTH Aktif",
        "Maksimal 50 ODP & 10 ODC",
        "Hingga 100 Pelanggan Terdaftar",
        "2 GB Kapasitas MinIO S3 Storage",
        "Akses API Standar (500 RPM)",
        "Dukungan Komunitas",
      ],
      current: tier === "free",
      badge: tier === "free" ? t("billing.free_trial") : undefined,
    },
    {
      key: "STARTER",
      name: "STARTER ISP",
      price: formatCurrency(990000),
      period: t("billing.per_month"),
      description: "Starter ISP tier for local ISPs and RT-RW Net with 2 OLTs and up to 500 customers.",
      features: [
        "Maksimal 2 OLT & Proyek FTTH Aktif",
        "Maksimal 300 ODP & 50 ODC",
        "Hingga 500 Pelanggan Terdaftar",
        "15 GB Kapasitas MinIO S3 Storage",
        "Akses Webhook & API (2.000 RPM)",
        "Standard SLA & Support",
      ],
      current: tier === "starter",
      badge: tier === "starter" ? t("billing.active_tier_badge") : undefined,
    },
    {
      key: "PRO",
      name: "PROFESSIONAL",
      price: formatCurrency(3900000),
      period: t("billing.per_month"),
      description: "Professional ISP tier with dedicated poller, optical heatmap, LDAP SSO, and Gold 99.5% SLA.",
      features: [
        "Maksimal 6 OLT & Proyek FTTH Aktif",
        "Maksimal 2.500 ODP & 500 ODC",
        "Hingga 5.000 Pelanggan Terdaftar",
        "100 GB Kapasitas MinIO S3 Storage",
        "Live SNMP OLT Poller Telemetry (8.000 RPM)",
        "Visualisasi Heatmap Redaman Optik",
        "Keycloak SSO / LDAP Federation",
        "Gold 99.5% SLA Support",
      ],
      current: tier === "pro",
      badge: tier === "pro" ? t("billing.active_tier_badge") : t("billing.most_popular"),
    },
    {
      key: "ENTERPRISE",
      name: "ENTERPRISE",
      price: formatCurrency(12500000),
      period: t("billing.per_month"),
      description: "Enterprise Core tier with AI Fiber Copilot, custom POP gateway, and Platinum 99.9% SLA.",
      features: [
        "Maksimal 25 OLT & Proyek FTTH Aktif",
        "Maksimal 12.000 ODP & 2.000 ODC",
        "Hingga 25.000 Pelanggan Terdaftar",
        "500 GB Kapasitas MinIO S3 Storage",
        "AI Fiber Diagnostics Copilot & Core Engine",
        "Integrasi REST API, Webhooks & SNMP (30.000 RPM)",
        "Keycloak SSO / SAML + Custom Domain",
        "Platinum 99.9% 24/7 SLA Matrix & Dedicated TAM",
      ],
      current: tier === "enterprise",
      badge: tier === "enterprise" ? t("billing.active_tier_badge") : undefined,
    },
  ];

  const handleSelectPlan = (planKey: string) => {
    subscribeMutation.mutate(planKey);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.success(`${t("common.download")} ${invoiceId}...`);
  };

  const currentDisplayTitle =
    tier === "enterprise"
      ? t("billing.plan_enterprise_title")
      : tier === "pro"
      ? t("billing.plan_pro_title")
      : tier === "starter"
      ? t("billing.plan_starter_title")
      : t("billing.plan_trial_title");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title={t("billing.tenant_billing_title")}
        breadcrumbs={[
          { label: t("organizations.tab_overview"), href: "/projects" },
          { label: t("billing.title") },
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
                ) : tier === "starter" ? (
                  <Zap className="h-5 w-5" />
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
                    {summary?.status || t("common.active")}
                  </Badge>
                  {summary?.isBoosterActive && (
                    <Badge variant="outline" className="text-[10px] font-mono text-amber-500 border-amber-500/30 bg-amber-500/10">
                      {t("billing.booster_badge", { days: summary.boosterDaysRemaining || 0 })}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("billing.billing_cycle")}: <strong>{planCycle}</strong>
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSelectPlan("STARTER")}
              disabled={subscribeMutation.isPending || tier === "starter" || tier === "pro" || tier === "enterprise"}
              className="h-8 px-3 text-xs font-medium gap-1.5 shadow-xs border-border/80"
            >
              <CreditCard className="h-3.5 w-3.5" />
              {tier === "free" ? t("billing.upgrade_plan") : t("billing.manage_quota")}
            </Button>
          </div>
        </Card>

        {/* Pricing Tier Plans */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("billing.title")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
                        {t("common.processing")}
                      </>
                    ) : p.current ? (
                      t("billing.current_tier_btn")
                    ) : (
                      <>
                        {t("billing.select_tier_btn")}
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
            {t("billing.past_invoices")}
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
                    <TableHead className="font-bold">{t("billing.invoice_number")}</TableHead>
                    <TableHead className="font-bold">{t("billing.invoice_date")}</TableHead>
                    <TableHead className="font-bold">{t("organizations.plan_tier")}</TableHead>
                    <TableHead className="font-bold">{t("billing.payer_email")}</TableHead>
                    <TableHead className="font-bold">{t("billing.invoice_amount")}</TableHead>
                    <TableHead className="font-bold">{t("billing.invoice_status")}</TableHead>
                    <TableHead className="w-16 text-right">{t("billing.invoice_action")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((tx) => (
                    <TableRow key={tx.id} className="text-xs">
                      <TableCell className="font-mono font-bold text-foreground">
                        {tx.externalId || tx.id}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {tx.createdAt ? formatDate(tx.createdAt) : "-"}
                      </TableCell>
                      <TableCell className="font-medium">{tx.planName || "PROFESSIONAL"}</TableCell>
                      <TableCell className="text-muted-foreground">{tx.payerEmail || "-"}</TableCell>
                      <TableCell className="font-mono font-bold text-foreground">
                        {formatCurrency(tx.amount || 0)}
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
                          title={t("billing.download_pdf")}
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
                <p className="text-xs font-semibold text-foreground">{t("billing.no_transactions")}</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {t("billing.invoices_desc")}
                </p>
              </div>
            )}
          </Card>
        </div>
      </PageContentShell>
    </div>
  );
}
