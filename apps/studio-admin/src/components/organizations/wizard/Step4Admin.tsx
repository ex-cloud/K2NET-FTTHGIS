import * as React from "react";
import { PROVISIONING_STAGES, type WizardFormData, type ProvisioningStageInfo } from "./types";
import { Step4ProvisioningProgress } from "./Step4ProvisioningProgress";
import { Step4AdminForm } from "./Step4AdminForm";

interface Step4AdminProps {
  formData: WizardFormData;
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>;
  isSubmitting?: boolean;
  provisioningStage?: number;
  provisioningStages?: ProvisioningStageInfo[];
  slugError?: string | null;
  onRegenerateRandomSlug?: () => void;
}

export function Step4Admin({
  formData,
  setFormData,
  isSubmitting = false,
  provisioningStage = 1,
  provisioningStages = PROVISIONING_STAGES,
  slugError,
  onRegenerateRandomSlug,
}: Step4AdminProps) {
  if (isSubmitting) {
    return (
      <Step4ProvisioningProgress
        provisioningStage={provisioningStage}
        provisioningStages={provisioningStages}
      />
    );
  }

  return (
    <Step4AdminForm
      formData={formData}
      setFormData={setFormData}
      isSubmitting={isSubmitting}
      slugError={slugError}
      onRegenerateRandomSlug={onRegenerateRandomSlug}
    />
  );
}
