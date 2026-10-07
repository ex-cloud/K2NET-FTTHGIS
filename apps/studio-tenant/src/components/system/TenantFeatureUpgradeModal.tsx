import * as React from "react";
import { FeatureUpgradeModal } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  useTenantSubscription,
  getRecommendedUpgradeTier,
  type NormalizedTier,
} from "../../hooks/useTenantSubscription";

export interface TenantFeatureUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
  featureDescription?: string;
  requiredTier?: NormalizedTier;
  currentTier?: NormalizedTier;
  title?: string;
  badgeText?: string;
  targetTierTitle?: string;
  highlights?: string[];
  guaranteeText?: string;
  cancelText?: string;
  upgradeText?: string;
  onUpgradeClick?: () => void;
}

export function TenantFeatureUpgradeModal({
  open,
  onOpenChange,
  featureName = "Feature",
  featureDescription,
  requiredTier,
  currentTier: passedCurrentTier,
  title,
  badgeText,
  targetTierTitle: customTargetTierTitle,
  highlights: customHighlights,
  guaranteeText: customGuaranteeText,
  cancelText: customCancelText,
  upgradeText: customUpgradeText,
  onUpgradeClick,
}: TenantFeatureUpgradeModalProps) {
  const { t } = useTranslation();
  const { tier: autoCurrentTier } = useTenantSubscription();

  const currentTier = passedCurrentTier || autoCurrentTier || "free";
  const recommendedTier = getRecommendedUpgradeTier(currentTier, requiredTier);

  const isEnterprise = recommendedTier === "enterprise";
  const isStarter = recommendedTier === "starter";

  const targetTierTitle =
    customTargetTierTitle ||
    (isEnterprise
      ? t("billing.plan_enterprise_title") || "Enterprise Core"
      : isStarter
      ? t("billing.plan_starter_title") || "Starter ISP"
      : t("billing.plan_pro_title") || "Professional ISP");

  const highlights =
    customHighlights ||
    (isEnterprise
      ? [
          t("billing.enterprise_h1"),
          t("billing.enterprise_h2"),
          t("billing.enterprise_h3"),
          t("billing.enterprise_h4"),
          t("billing.enterprise_h5"),
        ]
      : isStarter
      ? [
          t("billing.starter_h1"),
          t("billing.starter_h2"),
          t("billing.starter_h3"),
          t("billing.starter_h4"),
        ]
      : [
          t("billing.pro_h1"),
          t("billing.pro_h2"),
          t("billing.pro_h3"),
          t("billing.pro_h4"),
          t("billing.pro_h5"),
        ]);

  const modalTitle =
    title ||
    t("billing.upgrade_modal_title", { featureName }) ||
    `Feature ${featureName} Restricted`;

  const badge =
    badgeText ||
    t("billing.upgrade_modal_badge", { tier: targetTierTitle }) ||
    `Upgrade to ${targetTierTitle}`;

  const defaultDesc = t("billing.upgrade_modal_default_desc", {
    tier: targetTierTitle,
    currentTier: currentTier.toUpperCase(),
  });

  const guarantee =
    customGuaranteeText ||
    t("billing.upgrade_modal_guarantee") ||
    "Instant activation without network data downtime.";

  const cancel =
    customCancelText || t("billing.upgrade_modal_cancel") || "Maybe Later";

  const upgrade =
    customUpgradeText || t("billing.upgrade_modal_cta") || "View Pricing Plans";

  return (
    <FeatureUpgradeModal
      open={open}
      onOpenChange={onOpenChange}
      title={modalTitle}
      description={featureDescription || defaultDesc}
      badgeText={badge}
      targetTierTitle={targetTierTitle}
      highlights={highlights}
      guaranteeText={guarantee}
      cancelText={cancel}
      upgradeText={upgrade}
      isEnterprise={isEnterprise}
      onUpgradeClick={onUpgradeClick}
    />
  );
}
