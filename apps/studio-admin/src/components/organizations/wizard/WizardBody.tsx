import * as React from "react";
import { Step1Identity } from "./Step1Identity";
import { Step2Plan } from "./Step2Plan";
import { Step3Network } from "./Step3Network";
import { Step4Admin } from "./Step4Admin";
import { Step5Success } from "./Step5Success";
import type { WizardFormData } from "./types";

interface WizardBodyProps {
  step: number;
  formData: WizardFormData;
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>;
  slugError: string | null;
  setSlugError: React.Dispatch<React.SetStateAction<string | null>>;
  onRegenerateRandomSlug: () => void;
  isSubmitting?: boolean;
  provisioningStage?: number;
  provisioningStages?: import("./types").ProvisioningStageInfo[];
  testingLdap: boolean;
  ldapTestPassed: boolean;
  onTestLdap: () => Promise<void>;
  updateLdapField: (field: string, value: string) => void;
  isLdapFormComplete: boolean;
  isLdapFormatValid: boolean;
  deployedData: {
    slug: string;
    adminPassword?: string;
    adminUsername?: string;
  } | null;
  onCopyPassword: (text: string) => void;
  copied: boolean;
}

export function WizardBody({
  step,
  formData,
  setFormData,
  slugError,
  setSlugError,
  onRegenerateRandomSlug,
  isSubmitting = false,
  provisioningStage = 1,
  provisioningStages,
  testingLdap,
  ldapTestPassed,
  onTestLdap,
  updateLdapField,
  isLdapFormComplete,
  isLdapFormatValid,
  deployedData,
  onCopyPassword,
  copied,
}: WizardBodyProps) {
  return (
    <div className="p-6 space-y-4 max-h-[68vh] overflow-y-auto custom-scrollbar">
      {step === 1 && (
        <Step1Identity
          formData={formData}
          setFormData={setFormData}
          slugError={slugError}
          setSlugError={setSlugError}
          onRegenerateRandomSlug={onRegenerateRandomSlug}
        />
      )}

      {step === 2 && <Step2Plan formData={formData} setFormData={setFormData} />}

      {step === 3 && (
        <Step3Network
          formData={formData}
          setFormData={setFormData}
          testingLdap={testingLdap}
          ldapTestPassed={ldapTestPassed}
          onTestLdap={onTestLdap}
          updateLdapField={updateLdapField}
          isLdapFormComplete={isLdapFormComplete}
          isLdapFormatValid={isLdapFormatValid}
        />
      )}

      {step === 4 && (
        <Step4Admin
          formData={formData}
          setFormData={setFormData}
          isSubmitting={isSubmitting}
          provisioningStage={provisioningStage}
          provisioningStages={provisioningStages}
          slugError={slugError}
          onRegenerateRandomSlug={onRegenerateRandomSlug}
        />
      )}

      {step === 5 && deployedData && (
        <Step5Success
          name={formData.name}
          deployedData={deployedData}
          onCopyPassword={onCopyPassword}
          copied={copied}
        />
      )}
    </div>
  );
}

