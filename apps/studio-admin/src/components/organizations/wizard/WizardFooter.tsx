import * as React from "react";
import { ChevronRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@k2net/ui";
import type { WizardFormData } from "./types";

interface WizardFooterProps {
  step: number;
  prevStep: () => void;
  nextStep: () => Promise<void>;
  handleSubmit: () => Promise<void>;
  closeWizard: () => void;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  formData: WizardFormData;
  ldapTestPassed: boolean;
}

export function WizardFooter({
  step,
  prevStep,
  nextStep,
  handleSubmit,
  closeWizard,
  onOpenChange,
  isSubmitting,
  formData,
  ldapTestPassed,
}: WizardFooterProps) {
  if (step === 5) {
    return (
      <div className="p-4 px-6 bg-card/60 border-t border-border flex items-center justify-end">
        <Button
          size="sm"
          onClick={closeWizard}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-8 min-w-[140px]"
        >
          Tutup & Buka Workspace
        </Button>
      </div>
    );
  }

  const isNextDisabled =
    !formData.name ||
    !formData.slug ||
    (step === 3 && formData.ldapEnabled && !ldapTestPassed);

  return (
    <div className="p-4 px-6 bg-card/60 border-t border-border flex items-center justify-between">
      {step > 1 ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={prevStep}
          className="text-muted-foreground hover:text-foreground text-xs gap-1.5"
        >
          <ArrowLeft className="size-3.5" /> Kembali
        </Button>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenChange(false)}
          className="text-muted-foreground hover:text-foreground text-xs border-border h-8"
        >
          Batal
        </Button>

        {step < 4 ? (
          <Button
            size="sm"
            onClick={nextStep}
            disabled={isNextDisabled}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-8 min-w-[100px] gap-1"
          >
            <span>Lanjut</span>
            <ChevronRight className="size-3.5" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.adminEmail}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-8 min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                <span>Deploying...</span>
              </>
            ) : (
              "Deploy Organization Now"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
