import * as React from "react";
import { useTranslation } from "@k2net/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
  cn,
} from "@k2net/ui";
import {
  Loader2,
  CheckCircle2,
  ExternalLink,
  Layers,
  CreditCard,
  QrCode,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import {
  useTenantPackagesMarketplace,
  type TenantMarketplacePackage,
  type OrderPackageResponse,
} from "../../hooks/useTenantPackagesMarketplace";

export interface PackageCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageItem: TenantMarketplacePackage | null;
  onOrderSuccess: () => void;
}

export function PackageCheckoutModal({
  open,
  onOpenChange,
  packageItem,
  onOrderSuccess,
}: PackageCheckoutModalProps) {
  const { t } = useTranslation();
  const { orderPackage, isOrdering } = useTenantPackagesMarketplace();

  const isPrereqRequired =
    packageItem?.eligibility?.eligibilityState === "PREREQUISITE_REQUIRED";

  const [includePrerequisites, setIncludePrerequisites] = React.useState(true);
  const [paymentMethod, setPaymentMethod] = React.useState<"XENDIT_QRIS" | "XENDIT_VA">("XENDIT_QRIS");
  const [orderResult, setOrderResult] = React.useState<OrderPackageResponse | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Reset state when modal opens with new package
  React.useEffect(() => {
    if (open) {
      setIncludePrerequisites(true);
      setPaymentMethod("XENDIT_QRIS");
      setOrderResult(null);
      setErrorMessage(null);
    }
  }, [open, packageItem]);

  if (!packageItem) return null;

  const basePrice = packageItem.priceMonthly || 0;
  // Kalkulasi estimasi PPN 11%
  const subtotal = basePrice;
  const tax = Math.round(subtotal * 0.11);
  const total = subtotal + tax;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleConfirmOrder = async () => {
    try {
      setErrorMessage(null);
      const res = await orderPackage({
        packageId: packageItem.id,
        includePrerequisites,
        paymentMethod,
      });

      if (res && res.success) {
        setOrderResult(res);
        onOrderSuccess();
      } else {
        setErrorMessage(res?.message || t("packages.toast_create_failed"));
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error?.message || t("packages.toast_create_failed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/80">
        {!orderResult ? (
          <>
            <DialogHeader className="space-y-1.5 pb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/30 bg-primary/5 py-0 px-1.5">
                  {packageItem.code}
                </Badge>
              </div>
              <DialogTitle className="text-base font-semibold text-foreground">
                {t("packages.marketplace.checkout_title", { name: packageItem.name })}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("packages.marketplace.checkout_subtitle")}
              </DialogDescription>
            </DialogHeader>

            {errorMessage && (
              <div className="p-3 rounded-md border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-4 py-2 text-xs">
              {/* Prerequisite Auto-Bundle Notice (Condition B) */}
              {isPrereqRequired && packageItem.eligibility?.missingPrerequisites && (
                <div className="p-3 rounded-md border border-amber-500/30 bg-amber-500/5 space-y-2">
                  <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-300">
                    <Layers className="size-3.5 text-amber-500 shrink-0" />
                    <span>{t("packages.marketplace.checkout_prereq_included")}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {packageItem.eligibility.missingPrerequisites.map((code) => (
                      <span
                        key={code}
                        className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 pt-1 text-[11px] text-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includePrerequisites}
                      onChange={(e) => setIncludePrerequisites(e.target.checked)}
                      className="rounded border-border accent-primary size-3.5"
                    />
                    <span>{t("packages.marketplace.btn_bundle_subscribe")}</span>
                  </label>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="rounded-md border border-border/70 bg-muted/20 p-3 space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{t("packages.marketplace.checkout_base_price")}</span>
                  <span className="font-mono text-foreground font-medium">{formatCurrency(basePrice)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{t("packages.marketplace.checkout_tax")}</span>
                  <span className="font-mono text-foreground font-medium">{formatCurrency(tax)}</span>
                </div>
                <div className="pt-2 border-t border-border/60 flex items-center justify-between font-medium">
                  <span className="text-foreground">{t("packages.marketplace.checkout_total")}</span>
                  <span className="font-mono text-sm font-bold text-primary">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                  {t("packages.marketplace.checkout_payment_method")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("XENDIT_QRIS")}
                    className={cn(
                      "flex flex-col items-start gap-1 p-2.5 rounded-md border text-left transition-all cursor-pointer",
                      paymentMethod === "XENDIT_QRIS"
                        ? "border-primary bg-primary/5 text-primary shadow-2xs"
                        : "border-border/80 bg-card hover:bg-muted/40 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-medium">
                      <QrCode className="size-3.5" />
                      <span>QRIS</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">GoPay, OVO, Dana, BCA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("XENDIT_VA")}
                    className={cn(
                      "flex flex-col items-start gap-1 p-2.5 rounded-md border text-left transition-all cursor-pointer",
                      paymentMethod === "XENDIT_VA"
                        ? "border-primary bg-primary/5 text-primary shadow-2xs"
                        : "border-border/80 bg-card hover:bg-muted/40 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-medium">
                      <CreditCard className="size-3.5" />
                      <span>Virtual Account</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">BCA, Mandiri, BNI, BRI</span>
                  </button>
                </div>
              </div>

              {/* Terms Notice */}
              <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
                {t("packages.marketplace.checkout_terms_notice")}
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs font-medium rounded-md"
                onClick={() => onOpenChange(false)}
                disabled={isOrdering}
              >
                {t("packages.edit_modal.cancel_btn")}
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="h-7 px-2.5 text-xs font-medium rounded-md gap-1.5"
                onClick={handleConfirmOrder}
                disabled={isOrdering}
              >
                {isOrdering ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>{t("packages.marketplace.btn_processing")}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-3.5" />
                    <span>{t("packages.marketplace.btn_confirm_order")}</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* Order Placed Success View */
          <div className="space-y-4 py-3 text-center">
            <div className="size-12 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-6" />
            </div>

            <div className="space-y-1">
              <DialogTitle className="text-base font-semibold text-foreground">
                {t("packages.marketplace.order_success_title")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground max-w-xs mx-auto">
                {t("packages.marketplace.order_success_desc")}
              </DialogDescription>
            </div>

            {orderResult.invoiceNumber && (
              <div className="p-3 rounded-md border border-border/80 bg-muted/20 text-xs space-y-1 text-left">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("packages.marketplace.checkout_invoice_label")}:</span>
                  <span className="font-mono font-medium text-foreground">{orderResult.invoiceNumber}</span>
                </div>
                {orderResult.totalAmount && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("packages.marketplace.checkout_total_amount_label")}:</span>
                    <span className="font-mono font-semibold text-primary">
                      {formatCurrency(Number(orderResult.totalAmount))}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              {orderResult.paymentUrl && (
                <a
                  href={orderResult.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="w-full h-8 text-xs font-medium gap-1.5 rounded-md"
                  >
                    <ExternalLink className="size-3.5" />
                    <span>{t("packages.marketplace.btn_pay_now")}</span>
                  </Button>
                </a>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs font-medium rounded-md"
                onClick={() => onOpenChange(false)}
              >
                {t("packages.marketplace.btn_done")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
