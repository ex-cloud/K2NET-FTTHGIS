


import * as React from "react";
import {
  Badge,
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@k2net/ui";
import {
  Check,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  MessageSquare,
  ShieldCheck,
  Network,
  Users,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";
import type { SubscriptionPlanInfo } from "./billing-types";

interface BillingChangePlanSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orgName: string;
  currentTier: string;
  currentPlanCode?: string;
  availablePlans: SubscriptionPlanInfo[];
  plansLoading: boolean;
  plansError?: string | null;
  onRetryPlans?: () => void;
  onSelectPlan: (plan: SubscriptionPlanInfo) => void;
}

export function BillingChangePlanSheet({
  isOpen,
  onOpenChange,
  orgName,
  currentTier,
  currentPlanCode,
  availablePlans,
  plansLoading,
  plansError,
  onRetryPlans,
  onSelectPlan,
}: BillingChangePlanSheetProps) {
  const [enterpriseExpanded, setEnterpriseExpanded] = React.useState(false);

  const isPlanCurrent = (plan: SubscriptionPlanInfo) => {
    const normPlanCode = plan.code.toLowerCase().trim();
    const normPlanName = plan.name.toLowerCase().trim();
    const normCurrentTier = currentTier.toLowerCase().trim();
    const normCurrentCode = (currentPlanCode || "").toLowerCase().trim();

    if (normCurrentCode && (normPlanCode === normCurrentCode || normPlanName === normCurrentCode)) {
      return true;
    }
    if (normPlanCode === normCurrentTier || normPlanName === normCurrentTier) {
      return true;
    }
    if (
      (normPlanCode === "free" || normPlanName === "free") &&
      (normCurrentTier.includes("free") || normCurrentTier.includes("trial"))
    ) {
      return true;
    }
    if (
      (normPlanCode === "starter" || normPlanName === "starter") &&
      normCurrentTier.includes("starter")
    ) {
      return true;
    }
    if (
      (normPlanCode === "pro" || normPlanName === "pro" || normPlanName === "professional") &&
      (normCurrentTier.includes("pro") || normCurrentTier.includes("professional"))
    ) {
      return true;
    }
    if (
      (normPlanCode === "enterprise" || normPlanName === "enterprise") &&
      normCurrentTier.includes("enterprise")
    ) {
      return true;
    }
    return false;
  };

  const currentPlanObj = availablePlans.find((p) => isPlanCurrent(p));
  const currentPrice = currentPlanObj ? currentPlanObj.numericPrice : 0;

  // Split into Top 3 Cards (Free, Starter, Pro) and Bottom 1 Card (Enterprise)
  const topPlans = availablePlans.filter(
    (p) => p.code.toUpperCase() !== "ENTERPRISE" && p.name.toUpperCase() !== "ENTERPRISE"
  );
  const enterprisePlan = availablePlans.find(
    (p) => p.code.toUpperCase() === "ENTERPRISE" || p.name.toUpperCase() === "ENTERPRISE"
  );

  const getTierHeader = (planCode: string, index: number) => {
    const upper = planCode.toUpperCase();
    if (upper === "FREE") return "TIER 01";
    if (upper === "STARTER") return "TIER 02";
    if (upper === "PRO") return "TIER 03";
    return `TIER 0${index + 1}`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[96vw] sm:max-w-[1050px] xl:max-w-[1280px] overflow-y-auto bg-card/95 backdrop-blur-2xl border-l border-border p-6 md:p-8 space-y-6"
      >
        <SheetHeader className="space-y-1 text-left">
          <SheetTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary inline-block" />
            <span>Change subscription plan for {orgName}</span>
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Pilih tier paket langganan yang sesuai dengan skala jaringan ISP dan kebutuhan kuota operasional Anda.
          </SheetDescription>
        </SheetHeader>

        {plansLoading ? (
          /* Sleek Skeleton Cards while loading */
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-card/40 p-5 space-y-4 animate-pulse h-[380px] flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-3 w-full bg-muted/60 rounded" />
                    <div className="h-7 w-32 bg-muted rounded my-2" />
                    <div className="h-8 w-full bg-muted/80 rounded" />
                    <div className="space-y-2 pt-3">
                      <div className="h-3 w-full bg-muted/50 rounded" />
                      <div className="h-3 w-4/5 bg-muted/50 rounded" />
                      <div className="h-3 w-3/4 bg-muted/50 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="h-36 rounded-2xl border border-border bg-card/40 animate-pulse" />
          </div>
        ) : plansError || availablePlans.length === 0 ? (
          /* Friendly Error / Retry state */
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-amber-500/20 text-amber-500">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
            <div className="space-y-1">
              <h5 className="text-sm font-bold text-foreground">Gagal memuat paket dari server</h5>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Terjadi kendala saat menghubungkan ke database paket langganan. Silakan coba muat ulang data paket.
              </p>
            </div>
            {onRetryPlans && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetryPlans}
                className="text-xs border-amber-500/40 bg-card hover:bg-amber-500/20 text-foreground font-medium gap-1.5 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Coba Lagi</span>
              </Button>
            )}
          </div>
        ) : (
          /* Repositioned Layout: Top 3 Cards + Bottom 1 Enterprise Card */
          <div className="space-y-5 pt-1">
            {/* Top 3 Cards Grid (Free, Starter, Pro) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPlans.map((plan, index) => {
                const isCurrent = isPlanCurrent(plan);
                const isDowngrade = !isCurrent && plan.numericPrice < currentPrice;
                const isFree = plan.code.toUpperCase() === "FREE";

                return (
                  <div
                    key={plan.name}
                    className={`relative rounded-xl border p-5 flex flex-col justify-between transition-all duration-200 ${isCurrent
                        ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-sm"
                        : plan.popular
                          ? "border-primary/60 bg-card/75 hover:border-primary shadow-xs"
                          : "border-border bg-card/60 hover:border-border hover:bg-card/90"
                      }`}
                  >
                    {plan.popular && !isCurrent && (
                      <div className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono shadow-xs flex items-center gap-1">
                        <span>★</span>
                        <span>MOST POPULAR</span>
                      </div>
                    )}

                    {isCurrent && (
                      <div className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono shadow-xs">
                        CURRENT PLAN
                      </div>
                    )}

                    <div className="space-y-3.5">
                      {/* Tier Label & Trial Badge */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
                          {getTierHeader(plan.code, index)}
                        </span>
                        {isFree && !isCurrent && (
                          <Badge
                            variant="outline"
                            className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[9px] px-1.5 py-0"
                          >
                            TRIAL
                          </Badge>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h5 className="text-base font-extrabold text-foreground">{plan.name.toUpperCase()}</h5>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                          {plan.description}
                        </p>
                      </div>

                      {/* Pricing */}
                      <div className="flex items-baseline gap-1 py-0.5">
                        <span className="text-2xl font-extrabold font-mono text-foreground">{plan.price}</span>
                        <span className="text-xs text-muted-foreground font-mono">{plan.period}</span>
                      </div>

                      {/* Plan Action Button (Supabase Style for Current Plan) */}
                      <Button
                        size="sm"
                        disabled={isCurrent}
                        onClick={() => !isCurrent && onSelectPlan(plan)}
                        className={`w-full text-xs font-semibold h-9 rounded-lg transition-all ${isCurrent
                            ? "bg-muted/60 text-muted-foreground border border-border cursor-not-allowed opacity-75 shadow-none"
                            : isDowngrade
                              ? "bg-muted hover:bg-muted/80 text-foreground border border-border cursor-pointer"
                              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
                          }`}
                      >
                        {isCurrent ? (
                          "Current plan"
                        ) : isDowngrade ? (
                          `Downgrade to ${plan.name}`
                        ) : (
                          `Upgrade to ${plan.name}`
                        )}
                      </Button>

                      {/* Features Section */}
                      <div className="space-y-2 pt-3 border-t border-border/60">
                        <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-1">
                          FITUR & KUOTA:
                        </div>
                        {plan.features.map((feat) => (
                          <div key={feat.title} className="flex items-start gap-2 text-xs">
                            <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold block text-[11px] text-foreground leading-snug">
                                {feat.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground block leading-snug">
                                {feat.detail}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Free Plan Footnote (Supabase Reference) */}
                      {isFree && (
                        <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground/80 leading-relaxed">
                          Free projects are paused after 2 week of inactivity. Limit of 1 active projects.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Card 4: Enterprise Plan (Landscape / Collapsible) */}
            {enterprisePlan && (() => {
              const isCurrent = isPlanCurrent(enterprisePlan);
              const isDowngrade = !isCurrent && enterprisePlan.numericPrice < currentPrice;

              return (
                <div
                  className={`relative rounded-2xl border p-5 md:p-6 transition-all duration-200 ${isCurrent
                      ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-sm"
                      : "border-border/80 bg-card/75 backdrop-blur-sm hover:border-border"
                    }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-2.5 right-6 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono shadow-xs">
                      CURRENT PLAN
                    </div>
                  )}

                  {/* Enterprise Header Badge */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5"
                    >
                      ENTERPRISE CORE TIER
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Infrastruktur ISP Skala Besar (&gt;25 OLT / ISP Core)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Title, Description, 3 Metrics Pills, Collapsible details */}
                    <div className="lg:col-span-8 space-y-4">
                      <div>
                        <h4 className="text-xl font-extrabold text-foreground tracking-tight">ENTERPRISE</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {enterprisePlan.description ||
                            "Enterprise Core tier with AI Fiber Copilot, custom POP gateway, custom domain, and Platinum 99.9% SLA."}
                        </p>
                      </div>

                      {/* 3 Horizontal Metric Highlight Pills */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-lg border border-border/70 bg-card/60 p-3 space-y-1">
                          <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
                            <Network className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">Maks. 25 OLT & 12.000 ODP</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Pemetaan Skala Metropolitan</p>
                        </div>

                        <div className="rounded-lg border border-border/70 bg-card/60 p-3 space-y-1">
                          <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
                            <Users className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">2.000 ODC & 25.000 Pelanggan</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Distribusi Closure & FAT Aktif</p>
                        </div>

                        <div className="rounded-lg border border-border/70 bg-card/60 p-3 space-y-1">
                          <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
                            <HardDrive className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">500 GB MinIO S3 Storage</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Arsip Redaman & Berkas Teknis</p>
                        </div>
                      </div>

                      {/* Collapsible Trigger */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setEnterpriseExpanded(!enterpriseExpanded)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                        >
                          <span>Lihat Detail Spesifikasi Lengkap & Add-on</span>
                          {enterpriseExpanded ? (
                            <ChevronUp className="h-4 w-4 transition-transform" />
                          ) : (
                            <ChevronDown className="h-4 w-4 transition-transform" />
                          )}
                        </button>

                        {/* Collapsible Content */}
                        {enterpriseExpanded && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 mt-3 border-t border-border/60 animate-in fade-in duration-200">
                            {enterprisePlan.features.map((feat) => (
                              <div key={feat.title} className="flex items-start gap-2 text-xs">
                                <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-semibold block text-[11px] text-foreground">
                                    {feat.title}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground block leading-snug">
                                    {feat.detail}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Price & Action Buttons */}
                    <div className="lg:col-span-4 flex flex-col sm:items-end justify-between space-y-4 pt-1 lg:border-l lg:border-border/60 lg:pl-6">
                      <div className="text-left sm:text-right space-y-0.5">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                          HARGA BERLANGGANAN:
                        </span>
                        <div className="flex items-baseline sm:justify-end gap-1">
                          <span className="text-2xl font-extrabold font-mono text-foreground">
                            {enterprisePlan.price}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">/ bln</span>
                        </div>
                      </div>

                      <div className="w-full sm:w-64 space-y-2">
                        <Button
                          size="sm"
                          disabled={isCurrent}
                          onClick={() => !isCurrent && onSelectPlan(enterprisePlan)}
                          className={`w-full text-xs font-semibold h-9 rounded-lg gap-1.5 ${isCurrent
                              ? "bg-muted/60 text-muted-foreground border border-border cursor-not-allowed opacity-75 shadow-none"
                              : isDowngrade
                                ? "bg-muted hover:bg-muted/80 text-foreground border border-border cursor-pointer"
                                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
                            }`}
                        >
                          <span>{isCurrent ? "Current plan" : `Upgrade to ${enterprisePlan.name}`}</span>
                          {!isCurrent && <ArrowRight className="h-3.5 w-3.5" />}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toast.info("Silakan hubungi K2NET Enterprise Solution Team.")}
                          className="w-full h-8 text-xs border-border bg-card/80 hover:bg-muted text-foreground font-medium gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Konsultasi Kustomisasi (Contact Sales)</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Footer Trust Bar & FAQ */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-muted-foreground border-t border-border/40">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <span>Pembayaran aman via Virtual Account Bank, QRIS, & Kartu Kredit Korporat.</span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <button
                  type="button"
                  onClick={() => toast.info("Faktur diterbitkan otomatis setiap awal siklus penagihan.")}
                  className="hover:text-foreground transition-colors cursor-pointer"
                >
                  FAQ Penagihan
                </button>
                <span className="text-muted-foreground/40">•</span>
                <button
                  type="button"
                  onClick={() => toast.info("Jaminan SLA 99.5% - 99.9% dan kuota perangkat FTTH terisolasi.")}
                  className="hover:text-foreground transition-colors cursor-pointer"
                >
                  Kebijakan SLA & Kuota
                </button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
