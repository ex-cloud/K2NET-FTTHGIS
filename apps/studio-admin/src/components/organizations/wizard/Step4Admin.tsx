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
  stageDurations?: Record<number, number>;
  stageDetails?: Record<number, string>;
  streamError?: string | null;
  onRetry?: () => void;
  slugError?: string | null;
  onRegenerateRandomSlug?: () => void;
}

export function Step4Admin({
  formData,
  setFormData,
  isSubmitting = false,
  provisioningStage = 1,
  provisioningStages = PROVISIONING_STAGES,
  stageDurations = {},
  stageDetails = {},
  streamError,
  onRetry,
  slugError,
  onRegenerateRandomSlug,
}: Step4AdminProps) {
  if (isSubmitting || !!streamError) {
    return (
      <Step4ProvisioningProgress
        provisioningStage={provisioningStage}
        provisioningStages={provisioningStages}
        stageDurations={stageDurations}
        stageDetails={stageDetails}
        streamError={streamError}
        onRetry={onRetry}
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
