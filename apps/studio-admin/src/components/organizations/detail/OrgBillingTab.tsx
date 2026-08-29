"use client";

import React, { useState } from "react";
import {
  Badge,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Card,
  ActionTooltip,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
  Checkbox,
} from "@k2net/ui";
import {
  CreditCard,
  Download,
  CheckCircle2,
  FileText,
  Copy,
  Mail,
  AlertTriangle,
  Clock,
  Sparkles,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  RotateCcw,
  Check,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { EnrichedOrganization } from "../types";
import { useTenantSubscription } from "@/hooks/useTenantSubscription";

interface OrgBillingTabProps {
  organization: EnrichedOrganization;
  onOpenPlanUpgrade?: () => void;
}

interface TenantInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  description: string;
  amount: string;
  status: "PAID" | "PENDING";
  paymentMethod: string;
}

const PLAN_TIERS = [
  {
    name: "Starter",
    code: "FREE",
    price: "Rp 1.500.000",
    period: "/ bln",
    description: "Untuk ISP lokal skala awal atau evaluasi kawasan rintisan.",
    features: [
      "Maks. 2 OLT & 500 ODP",
      "10 GB Penyimpanan Dokumen MinIO S3",
      "API Rate Limit 2.000 RPM",
      "Standard Community Support",
    ],
    badgeColor: "border-border text-foreground/80",
    maxOlts: 2,
    maxOdps: 500,
  },
  {
    name: "Professional",
    code: "PRO",
    price: "Rp 4.500.000",
    period: "/ bln",
    description: "Paket komersial favorit dengan telemetri OLT dan auto-diagnosa.",
    features: [
      "Maks. 5 OLT & 2.500 ODP",
      "50 GB MinIO S3 Storage",
      "Dedicated SNMP OLT Poller",
      "AI Diagnostics Copilot",
      "Gold 99.5% SLA Support",
    ],
    badgeColor: "border-primary/40 bg-primary/10 text-primary font-bold",
    popular: true,
    maxOlts: 5,
    maxOdps: 2500,
  },
  {
    name: "Enterprise",
    code: "ENTERPRISE",
    price: "Rp 12.500.000",
    period: "/ bln",
    description: "Infrastruktur lengkap ISP skala menengah & korporat multi-region.",
    features: [
      "Maks. 20 OLT & 10.000 ODP",
      "100 GB MinIO S3 Storage",
      "Custom Domain & Traefik SSL Auto-Renew",
      "Dedicated AI Fiber Copilot & RAG Knowledge",
      "Keycloak SSO / LDAP Federation",
      "Platinum 99.9% 24/7 SLA Matrix",
    ],
    badgeColor: "border-indigo-500/40 bg-indigo-500/10 text-indigo-400 font-bold",
    maxOlts: 20,
    maxOdps: 10000,
  },
];

export function OrgBillingTab({
  organization: org,
  onOpenPlanUpgrade,
}: OrgBillingTabProps) {
  const {
    summary,
    loading: subLoading,
    upgrade,
    downgrade,
    getProrateCalc,
    extendTrial,
    updateDunning,
    refetch,
  } = useTenantSubscription(org.slug);

  // Modals state
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isDowngradeModalOpen, setIsDowngradeModalOpen] = useState(false);
  const [isProrationOpen, setIsProrationOpen] = useState(false);
  const [isDunningModalOpen, setIsDunningModalOpen] = useState(false);

  // Plan transition states
  const [selectedPlanTarget, setSelectedPlanTarget] = useState<any>(null);
  const [prorateData, setProrateData] = useState<any>(null);
  const [upgradeNotes, setUpgradeNotes] = useState("");
  const [downgradeReason, setDowngradeReason] = useState("");
  const [ackOverQuota, setAckOverQuota] = useState(false);
  const [selectedDunningLevel, setSelectedDunningLevel] = useState(summary?.dunningLevel || 0);
  const [dunningNotes, setDunningNotes] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);

  // Invoices data
  const invoices: TenantInvoice[] = [
    {
      id: "inv-1",
      invoiceNumber: `INV-${new Date().getFullYear()}-08-0042`,
      date: "01 Aug 2026",
      description: `K2NET FTTH GIS SaaS Subscription — ${org.planTier} Tier (Aug 2026)`,
      amount: org.planTier === "Enterprise" ? "Rp 12.500.000" : org.planTier === "Professional" ? "Rp 4.500.000" : "Rp 1.500.000",
      status: "PAID",
      paymentMethod: "Xendit Virtual Account BCA",
    },
    {
      id: "inv-2",
      invoiceNumber: `INV-${new Date().getFullYear()}-07-0038`,
      date: "01 Jul 2026",
      description: `K2NET FTTH GIS SaaS Subscription — ${org.planTier} Tier (Jul 2026)`,
      amount: org.planTier === "Enterprise" ? "Rp 12.500.000" : org.planTier === "Professional" ? "Rp 4.500.000" : "Rp 1.500.000",
      status: "PAID",
      paymentMethod: "Xendit Virtual Account BCA",
    },
    {
      id: "inv-3",
      invoiceNumber: `INV-${new Date().getFullYear()}-06-0029`,
      date: "01 Jun 2026",
      description: `K2NET FTTH GIS SaaS Subscription — ${org.planTier} Tier (Jun 2026)`,
      amount: org.planTier === "Enterprise" ? "Rp 12.500.000" : org.planTier === "Professional" ? "Rp 4.500.000" : "Rp 1.500.000",
      status: "PAID",
      paymentMethod: "Xendit Virtual Account Mandiri",
    },
  ];

  const handleSelectPlan = async (plan: (typeof PLAN_TIERS)[0]) => {
    setSelectedPlanTarget(plan);
    const currentTier = org.planTier || "Professional";

    // Detect if this is Downgrade vs Upgrade
    const isDowngrade =
      (currentTier === "Enterprise" && (plan.name === "Professional" || plan.name === "Starter")) ||
      (currentTier === "Professional" && plan.name === "Starter");

    if (isDowngrade) {
      setDowngradeReason("");
      setAckOverQuota(false);
      setIsDowngradeModalOpen(true);
    } else if (plan.name === currentTier) {
      toast.info(`Organisasi ini sudah aktif pada paket ${plan.name}`);
    } else {
      // Calculate Proration Estimate
      const pr = await getProrateCalc(plan.code, "MONTHLY");
      setProrateData(pr);
      setUpgradeNotes("");
      setIsProrationOpen(true);
    }
  };

  const handleExecuteUpgrade = async () => {
    if (!selectedPlanTarget) return;
    setIsExecuting(true);
    try {
      await upgrade({
        newPlanName: selectedPlanTarget.code,
        planCycle: "MONTHLY",
        isDirectOverride: true,
        notes: upgradeNotes || "Super Admin God-Mode Upgrade",
      });
      setIsProrationOpen(false);
      refetch();
    } catch {
      // Handled by hook
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExecuteDowngrade = async () => {
    if (!selectedPlanTarget) return;
    if (!downgradeReason.trim()) {
      toast.error("Wajib mengisi alasan resmi / nomor surat downgrade.");
      return;
    }
    setIsExecuting(true);
    try {
      await downgrade({
        targetPlanName: selectedPlanTarget.code,
        reason: downgradeReason,
        acknowledgeOverQuota: ackOverQuota,
      });
      setIsDowngradeModalOpen(false);
      refetch();
    } catch {
      // Handled by hook
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExtendTrial = async (days: number) => {
    try {
      await extendTrial({ additionalDays: days, reason: `Super admin extension +${days} days` });
      refetch();
    } catch {
      // Handled
    }
  };

  const handleExecuteDunning = async () => {
    setIsExecuting(true);
    try {
      await updateDunning({
        dunningLevel: Number(selectedDunningLevel),
        notes: dunningNotes,
      });
      setIsDunningModalOpen(false);
      refetch();
    } catch {
      // Handled
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDownloadPdf = (inv: TenantInvoice) => {
    toast.success(`Mengunduh berkas invoice ${inv.invoiceNumber}...`, {
      description: "PDF diterbitkan oleh payment-gateway:5002.",
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin ke clipboard`);
  };

  const handleResendReceipt = (inv: TenantInvoice) => {
    toast.success(`Kwitansi invoice ${inv.invoiceNumber} dikirim ulang ke ${org.picEmail}`);
  };

  const currentTier = org.planTier || "Professional";
  const usedOlts = summary?.usedOlts ?? org.usedOlts;
  const usedOdps = summary?.usedOdps ?? org.usedOdps;

  return (
    <div className="space-y-6">
      {/* ── 1. Header Overview & Status Lifecycle Badge ────────────────────── */}
      <div className="p-4 rounded-xl border border-border bg-card/70 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Tata Kelola Paket Langganan & Billing</h3>
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px] font-bold">
              {currentTier.toUpperCase()} PLAN
            </Badge>

            {summary?.isBoosterActive && (
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-500 font-mono text-[10px] gap-1">
                <Zap className="h-3 w-3" />
                <span>BOOSTER +{summary.boosterOdps} ODP ({summary.boosterDaysRemaining} Hari Sisa)</span>
              </Badge>
            )}

            {summary?.isOverQuota && (
              <Badge variant="destructive" className="font-mono text-[10px] gap-1">
                <AlertTriangle className="h-3 w-3" />
                <span>OVER_QUOTA (Read-Only Mode)</span>
              </Badge>
            )}

            {summary?.dunningLevel !== undefined && summary.dunningLevel > 0 && (
              <Badge variant="destructive" className="font-mono text-[10px] gap-1">
                <ShieldAlert className="h-3 w-3" />
                <span>OVERDUE (Level {summary.dunningLevel})</span>
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Kelola tier langganan, simulasi prorata upgrade, downgrade tanpa kehilangan data (Zero Data Loss), dan dunning gagal bayar.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsDunningModalOpen(true)}
            className="h-8 px-3 text-xs font-medium border-border text-foreground hover:bg-muted/50 gap-1.5"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
            <span>Kontrol Dunning</span>
          </Button>

          {onOpenPlanUpgrade && (
            <Button
              size="sm"
              onClick={onOpenPlanUpgrade}
              className="h-8 px-3 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Modal Cepat</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── 2. Trial & Grace Period Alert (Kondisi 4) ────────────────────────── */}
      {(org.status === "TRIAL" || summary?.trialExpiresAt) && (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-amber-500 shrink-0" />
            <div>
              <span className="font-bold text-foreground">Status Masa Uji Coba (Starter Trial): </span>
              <span className="text-foreground/80">
                {summary?.isTrialExpired
                  ? "Masa trial telah kedaluwarsa. Sistem berada pada masa tenggang akses terbatas."
                  : `Sisa ${summary?.trialDaysRemaining ?? 7} hari masa evaluasi.`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExtendTrial(7)}
              className="h-7 text-xs border-amber-500/40 bg-card hover:bg-amber-500/20 text-foreground font-medium"
            >
              +7 Hari Trial
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExtendTrial(14)}
              className="h-7 text-xs border-amber-500/40 bg-card hover:bg-amber-500/20 text-foreground font-medium"
            >
              +14 Hari Trial
            </Button>
          </div>
        </div>
      )}

      {/* ── 3. Plan Switcher & Comparison Grid ──────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
            Pilihan Paket Langganan SaaS K2NET
          </h4>
          <span className="text-[11px] text-muted-foreground font-mono">
            Kapasitas Saat Ini: {usedOlts} OLT · {usedOdps} ODP Terpetakan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLAN_TIERS.map((plan) => {
            const isCurrent = plan.name === currentTier;
            return (
              <div
                key={plan.name}
                className={`relative rounded-xl border p-4.5 flex flex-col justify-between transition-all ${
                  isCurrent
                    ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-sm"
                    : "border-border bg-card/60 hover:border-border hover:bg-card/90"
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-2.5 right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full font-mono shadow-xs">
                    PAKET AKTIF
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-bold text-foreground">{plan.name}</h5>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{plan.description}</p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1 py-1">
                    <span className="text-xl font-extrabold font-mono text-foreground">{plan.price}</span>
                    <span className="text-xs text-muted-foreground font-mono">{plan.period}</span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-border/60">
                    {plan.features.map((feat) => (
                      <div key={feat} className="flex items-center gap-2 text-xs text-foreground/80">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-[11px]">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-border/40">
                  <Button
                    size="sm"
                    disabled={isCurrent || subLoading}
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full text-xs font-semibold h-8 cursor-pointer ${
                      isCurrent
                        ? "bg-muted text-muted-foreground border border-border"
                        : plan.name === "Enterprise"
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                    }`}
                  >
                    {isCurrent ? (
                      "Paket Saat Ini"
                    ) : plan.name === "Enterprise" ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        Upgrade ke Enterprise
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <ArrowDownRight className="h-3.5 w-3.5" />
                        Pilih {plan.name}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. Invoices History Table ────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md overflow-hidden shadow-xs">
        <div className="py-3 px-4 border-b border-border/80 bg-muted/20 flex items-center justify-between">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
            Riwayat Invoice & Pembayaran Xendit ({invoices.length})
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">Mata Uang: IDR (Rupiah)</span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40 border-b border-border/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-6">
                  Nomor Invoice
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Tanggal Terbit
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Rincian Layanan
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Nominal
                </TableHead>
                <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-right pr-6 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {invoices.map((inv) => (
                <ContextMenu key={inv.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow className="border-b border-border/50 text-xs hover:bg-muted/30 cursor-pointer">
                      <TableCell className="pl-6 py-3.5 font-mono font-bold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{inv.invoiceNumber}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5 font-mono text-muted-foreground">{inv.date}</TableCell>

                      <TableCell className="py-3.5 text-foreground max-w-[280px] truncate">{inv.description}</TableCell>

                      <TableCell className="py-3.5 font-mono font-semibold text-foreground">{inv.amount}</TableCell>

                      <TableCell className="py-3.5">
                        <Badge
                          variant="outline"
                          className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px] gap-1 px-2 py-0.5"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{inv.status}</span>
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3.5 pr-6 text-right">
                        <ActionTooltip label={`Unduh kuitansi PDF ${inv.invoiceNumber}`} shortcut="D">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPdf(inv)}
                            className="h-7 text-xs border-border bg-card hover:bg-accent text-foreground gap-1.5 px-2.5 font-mono"
                          >
                            <Download className="h-3 w-3" />
                            <span>PDF</span>
                          </Button>
                        </ActionTooltip>
                      </TableCell>
                    </TableRow>
                  </ContextMenuTrigger>

                  <ContextMenuContent className="w-64 bg-popover/95 backdrop-blur-xl border-border/80 shadow-2xl text-xs z-[9999] py-1.5 rounded-xl">
                    <ContextMenuItem
                      onClick={() => handleDownloadPdf(inv)}
                      className="cursor-pointer font-semibold text-primary focus:bg-primary/10 focus:text-primary gap-2"
                    >
                      <Download className="w-3.5 h-3.5 text-primary" />
                      <span>Download PDF Invoice</span>
                      <ContextMenuShortcut>D</ContextMenuShortcut>
                    </ContextMenuItem>

                    <ContextMenuItem
                      onClick={() => handleResendReceipt(inv)}
                      className="cursor-pointer font-medium text-foreground focus:bg-accent gap-2"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      <span>Kirim Ulang ke PIC ({org.picEmail})</span>
                    </ContextMenuItem>

                    <ContextMenuSeparator className="bg-border/40 my-1" />

                    <ContextMenuItem
                      onClick={() => handleCopy(inv.invoiceNumber, "Nomor Invoice")}
                      className="cursor-pointer gap-2 focus:bg-muted"
                    >
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Salin Nomor ({inv.invoiceNumber})</span>
                      <ContextMenuShortcut>C</ContextMenuShortcut>
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── MODAL 1: Downgrade Impact Analysis Dialog (Kondisi 1 - Zero Data Loss) ── */}
      <Dialog open={isDowngradeModalOpen} onOpenChange={setIsDowngradeModalOpen}>
        <DialogContent className="bg-popover/95 backdrop-blur-xl border-border sm:max-w-[500px] p-0 overflow-hidden shadow-2xl text-foreground rounded-2xl">
          <DialogHeader className="p-5 pb-2 text-foreground">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-amber-500">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Analisis Dampak Downgrade Paket ({selectedPlanTarget?.name})</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Kebijakan Zero Data Loss menjamin data topologi fisik tidak dihapus, namun kapasitas baru akan ditinjau.
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-4 text-xs">
            {/* Impact table comparison */}
            <div className="rounded-xl border border-border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between font-mono pb-1.5 border-b border-border text-[11px]">
                <span className="text-muted-foreground">Perangkat / Sumber Daya</span>
                <span>Kapasitas Terpakai vs Batas Baru</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-foreground">Perangkat OLT:</span>
                <span className={usedOlts > (selectedPlanTarget?.maxOlts || 2) ? "text-amber-500 font-bold" : "text-foreground"}>
                  {usedOlts} / {selectedPlanTarget?.maxOlts || 2} OLT {usedOlts > (selectedPlanTarget?.maxOlts || 2) ? "(Kapasitas Lebih)" : "✓"}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-foreground">Node ODP / FAT:</span>
                <span className={usedOdps > (selectedPlanTarget?.maxOdps || 500) ? "text-amber-500 font-bold" : "text-foreground"}>
                  {usedOdps} / {selectedPlanTarget?.maxOdps || 500} ODP {usedOdps > (selectedPlanTarget?.maxOdps || 500) ? "(Kapasitas Lebih)" : "✓"}
                </span>
              </div>
            </div>

            {/* Zero Data Loss Notification */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground block mb-1">🛡️ Kebijakan Perlindungan Aset:</strong>
              Seluruh {usedOlts} OLT dan {usedOdps} ODP yang telah terpetakan di lapangan tetap aktif melayani pelanggan. Pembuatan node baru akan di-lock dalam <strong>Read-Only Mode</strong> sampai kuota disesuaikan.
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Alasan Resmi / Nomor Surat Downgrade *</Label>
              <Input
                placeholder="Contoh: Permintaan resmi tenant nomor surat 042/ISP/VIII/2026"
                value={downgradeReason}
                onChange={(e) => setDowngradeReason(e.target.value)}
                className="h-8 text-xs bg-card border-border text-foreground"
              />
            </div>

            <div className="flex items-start gap-2 pt-1">
              <Checkbox
                id="ack-overquota"
                checked={ackOverQuota}
                onCheckedChange={(c: boolean) => setAckOverQuota(!!c)}
              />
              <Label htmlFor="ack-overquota" className="text-[11px] text-muted-foreground leading-tight cursor-pointer">
                Saya memahami bahwa status akun akan menjadi OVER_QUOTA dan fitur add-on Enterprise (AI Copilot, SSO) akan dinonaktifkan.
              </Label>
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsDowngradeModalOpen(false)} className="text-xs">
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteDowngrade}
              disabled={isExecuting || !ackOverQuota || !downgradeReason.trim()}
              className="text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            >
              {isExecuting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Eksekusi Downgrade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 2: Proration & Instant Upgrade Dialog (Kondisi 3) ─────────────── */}
      <Dialog open={isProrationOpen} onOpenChange={setIsProrationOpen}>
        <DialogContent className="bg-popover/95 backdrop-blur-xl border-border sm:max-w-[500px] p-0 overflow-hidden shadow-2xl text-foreground rounded-2xl">
          <DialogHeader className="p-5 pb-2 text-foreground">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Simulasi Prorata Upgrade ({selectedPlanTarget?.name})</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Perhitungan selisih kredit paket lama vs biaya prorata paket baru secara otomatis.
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-4 text-xs">
            {/* Proration Calculation Box */}
            <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground text-[11px] pb-1 border-b border-border">
                <span>Parameter Siklus</span>
                <span>Sisa {prorateData?.remainingDays || 15} dari {prorateData?.totalCycleDays || 30} Hari</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground">Kredit Paket Lama ({currentTier}):</span>
                <span className="font-mono text-primary font-semibold">
                  - Rp {(prorateData?.unusedOldPlanCredit || 750000).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground">Biaya Prorata Paket Baru ({selectedPlanTarget?.name}):</span>
                <span className="font-mono text-foreground font-semibold">
                  + Rp {(prorateData?.newPlanProratedCost || 6250000).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border font-bold">
                <span className="text-foreground">Tagihan Bersih yang Wajib Dibayar:</span>
                <span className="font-mono text-primary text-sm">
                  Rp {(prorateData?.netPayableDelta || 5500000).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Catatan / Referensi PO / Transfer Manual (Opsional)</Label>
              <Input
                placeholder="Contoh: PO-KIR-2026-08 / BAST Billing Super Admin"
                value={upgradeNotes}
                onChange={(e) => setUpgradeNotes(e.target.value)}
                className="h-8 text-xs bg-card border-border text-foreground"
              />
            </div>

            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-muted-foreground leading-relaxed">
              Begitu disetujui, batas kapasitas (OLT, ODP, S3, AI Copilot) langsung terbuka saat itu juga (*Instant Unfreeze*).
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsProrationOpen(false)} className="text-xs">
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteUpgrade}
              disabled={isExecuting}
              className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            >
              {isExecuting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Aktivasi Upgrade Sekarang"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 3: Dunning & Debt Escalation Dialog (Kondisi 5) ───────────────── */}
      <Dialog open={isDunningModalOpen} onOpenChange={setIsDunningModalOpen}>
        <DialogContent className="bg-popover/95 backdrop-blur-xl border-border sm:max-w-[480px] p-0 overflow-hidden shadow-2xl text-foreground rounded-2xl">
          <DialogHeader className="p-5 pb-2 text-foreground">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-amber-500">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <span>Kontrol Eskalasi Dunning & Gagal Bayar</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Atur status dunning untuk tagihan yang telah melewati batas jatuh tempo.
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Tingkat Eskalasi Dunning</Label>
              <div className="space-y-2">
                {[
                  { level: 0, title: "Level 0: Normal / Lunas", desc: "Status ACTIVE penuh tanpa pembatasan." },
                  { level: 1, title: "Level 1: Peringatan H+1", desc: "Notifikasi WA & email peringatan jatuh tempo dikirim ke PIC." },
                  { level: 2, title: "Level 2: Peringatan Keras H+3", desc: "Fitur add-on non-esensial (AI Copilot, SMS blast) dinonaktifkan." },
                  { level: 3, title: "Level 3: Soft-Lock H+7", desc: "Mode Read-Only GIS. Pembuatan node dikunci, hanya Billing yang aktif." },
                ].map((item) => (
                  <div
                    key={item.level}
                    onClick={() => setSelectedDunningLevel(item.level)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      selectedDunningLevel === item.level
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card/60 hover:bg-card text-foreground/80"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>{item.title}</span>
                      {selectedDunningLevel === item.level && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Catatan Petugas Kolektibilitas</Label>
              <Input
                placeholder="Contoh: Janji bayar via transfer tanggal 05 September"
                value={dunningNotes}
                onChange={(e) => setDunningNotes(e.target.value)}
                className="h-8 text-xs bg-card border-border text-foreground"
              />
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsDunningModalOpen(false)} className="text-xs">
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteDunning}
              disabled={isExecuting}
              className="text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            >
              {isExecuting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Simpan Status Dunning"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
