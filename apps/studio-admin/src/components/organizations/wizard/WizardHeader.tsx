import * as React from "react";
import { Check } from "lucide-react";
import { Badge, DialogHeader, DialogTitle, DialogDescription } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

interface WizardHeaderProps {
  step: number;
}

export function WizardHeader({ step }: WizardHeaderProps) {
  const { t } = useTranslation();

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
        <Badge variant="outline" className="font-mono text-[10px] border-border text-muted-foreground">
          Enterprise SaaS
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
