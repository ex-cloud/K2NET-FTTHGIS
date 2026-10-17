import * as React from "react";
import { Check } from "lucide-react";
import { Badge, DialogHeader, DialogTitle, DialogDescription } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

interface WizardHeaderProps {
  step: number;
  plan?: string;
}

const PLAN_BADGES: Record<string, { label: string; className: string }> = {
  FREE: { label: "Free Trial (14 Days)", className: "border-amber-500/30 text-amber-500 bg-amber-500/10" },
  STARTER: { label: "Starter ISP", className: "border-blue-500/30 text-blue-500 bg-blue-500/10" },
  PRO: { label: "Professional", className: "border-primary/30 text-primary bg-primary/10" },
  ENTERPRISE: { label: "Enterprise SaaS", className: "border-purple-500/30 text-purple-400 bg-purple-500/10" },
};

export function WizardHeader({ step, plan }: WizardHeaderProps) {
  const { t } = useTranslation();

  const currentPlan = plan ? PLAN_BADGES[plan.toUpperCase()] || PLAN_BADGES.ENTERPRISE : PLAN_BADGES.ENTERPRISE;

  const STEP_TITLES: Record<number, { title: string; desc: string }> = {
    1: {
      title: t("organizations.wizard_step1_title"),
      desc: t("organizations.wizard_step1_desc"),
    },
    2: {
      title: t("organizations.wizard_step2_title"),
      desc: t("organizations.wizard_step2_desc"),
    },
    3: {
      title: t("organizations.wizard_step3_title"),
      desc: t("organizations.wizard_step3_desc"),
    },
    4: {
      title: t("organizations.wizard_step4_title"),
      desc: t("organizations.wizard_step4_desc"),
    },
    5: {
      title: "Infrastructure Provisioned Successfully!",
      desc: t("organizations.wizard_step5_desc"),
    },
  };

  const currentStepInfo = STEP_TITLES[step] || STEP_TITLES[1];

  return (
    <DialogHeader className="p-6 pb-3 border-b border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <div className="size-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs font-mono">
            {step <= 4 ? step : <Check className="size-4" />}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary font-mono">
            {step <= 4 ? `Step ${step} of 4 • Provisioning Wizard` : "Deployment Ready"}
          </span>
        </div>
        <Badge variant="outline" className={`font-mono text-[10px] uppercase font-semibold ${currentPlan.className}`}>
          {currentPlan.label}
        </Badge>
      </div>

      <DialogTitle className="text-lg font-bold text-foreground mt-1">
        {currentStepInfo.title}
      </DialogTitle>
      <DialogDescription className="text-xs text-muted-foreground">
        {currentStepInfo.desc}
      </DialogDescription>
    </DialogHeader>
  );
}
