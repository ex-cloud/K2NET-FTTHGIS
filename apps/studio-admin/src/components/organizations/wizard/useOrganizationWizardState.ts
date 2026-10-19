import * as React from "react";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";
import { useSession } from "@/lib/auth-compat";
import { useOrganizations } from "@/hooks/useOrganizations";
import { initTenantVaultFolders } from "@/lib/storage-client";
import { INITIAL_FORM_DATA, PROVISIONING_STAGES, type WizardFormData } from "./types";
import { useWizardLdap } from "./useWizardLdap";
import { useWizardProvisioning } from "./useWizardProvisioning";

export const generateSmartSuffix = (length = 4): string => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const sanitizeOrgNameToSlug = (name: string): string => {
  if (!name) return "tenant";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24)
    .replace(/-+$/g, "") || "tenant";
};

export const generateSmartSlug = (name: string, suffixLength = 4): string => {
  const base = sanitizeOrgNameToSlug(name);
  return `${base}-${generateSmartSuffix(suffixLength)}`;
};

export const generateRandom20Alpha = (): string => generateSmartSuffix(20);

function buildProvisioningPayload(formData: WizardFormData, targetSlug: string) {
  return {
    name: formData.name,
    slug: targetSlug,
    description: formData.description,
    website: formData.website,
    address: formData.address,
    plan: formData.plan,
    ldapEnabled: formData.ldapEnabled,
    ldapUrl: formData.ldapUrl,
    ldapBaseDn: formData.ldapBaseDn,
    ldapBindDn: formData.ldapBindDn,
    ldapBindPassword: formData.ldapBindPassword,
    picName: formData.picName,
    picJobTitle: formData.picJobTitle,
    adminPhone: formData.adminPhone,
    picPhone: formData.adminPhone,
    adminEmail: formData.adminEmail,
    adminUsername: formData.adminUsername || formData.adminEmail.split("@")[0],
  };
}

function resolveSlugErrorMessage(
  rawMessage: string,
  targetSlug: string,
  name: string,
  t: ReturnType<typeof useTranslation>["t"]
): { message: string; freshSlug?: string } {
  if (
    rawMessage.includes("organizations_slug_key") ||
    rawMessage.includes("already exists") ||
    rawMessage.includes("sudah terdaftar") ||
    rawMessage.includes("in use")
  ) {
    const freshSlug = generateSmartSlug(name || "tenant");
    const userMessage = t("organizations.wizard_slug_taken_fallback", {
      slug: freshSlug,
      defaultValue: `Subdomain slug '${targetSlug}' is already taken. System prepared a new smart slug: ${freshSlug}`,
    });
    return { message: userMessage, freshSlug };
  }
  return { message: rawMessage };
}

async function validateWizardStep(
  step: number,
  formData: WizardFormData,
  checkSlugAvailable: (slug: string) => Promise<boolean>,
  ldapTestPassed: boolean,
  t: (key: string) => string
): Promise<{ valid: boolean; slugError?: string; errorMessage?: string }> {
  if (step === 1 && !formData.plan) {
    return { valid: false, errorMessage: t("organizations.wizard_select_plan_error") };
  }
  if (step === 2) {
    if (!formData.name || !formData.slug) return { valid: false };
    const isAvailable = await checkSlugAvailable(formData.slug);
    if (!isAvailable) {
      return { valid: false, slugError: t("organizations.wizard_slug_taken_error") };
    }
  }
  if (step === 3 && formData.ldapEnabled && !ldapTestPassed) {
    return { valid: false, errorMessage: t("organizations.wizard_ldap_test_required") };
  }
  if (step === 4 && !formData.adminEmail) {
    return { valid: false, errorMessage: t("organizations.wizard_pic_email_required") };
  }
  return { valid: true };
}

export function useOrganizationWizardState(onSuccess: () => void, onOpenChange: (open: boolean) => void) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [step, setStep] = React.useState(1);
  const { createOrganizationAsync, checkSlugAvailable, organizations } = useOrganizations();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isSubmittingRef = React.useRef(false);

  const [slugError, setSlugError] = React.useState<string | null>(null);
  const [deployedData, setDeployedData] = React.useState<{
    slug: string;
    adminPassword?: string;
    adminUsername?: string;
  } | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [formData, setFormData] = React.useState<WizardFormData>(INITIAL_FORM_DATA);

  const {
    provisioningStage,
    stageDurations,
    stageDetails,
    isStreaming,
    streamError,
    startStreamingProvisioning,
    abortStreaming,
    resetProvisioningState,
  } = useWizardProvisioning();

  const {
    testingLdap,
    ldapTestPassed,
    setLdapTestPassed,
    updateLdapField,
    handleTestLdap,
    isLdapFormComplete,
    isLdapFormatValid,
  } = useWizardLdap(formData, setFormData);

  const handleRegenerateRandomSlug = () => {
    const smartSlug = generateSmartSlug(formData.name || "tenant");
    setFormData((prev) => ({ ...prev, slug: smartSlug }));
    setSlugError(null);
    toast.info(t("organizations.wizard_smart_slug_generated", { slug: smartSlug }));
  };

  const nextStep = async () => {
    const check = await validateWizardStep(step, formData, checkSlugAvailable, ldapTestPassed, t);
    if (!check.valid) {
      if (check.errorMessage) toast.error(check.errorMessage);
      if (check.slugError) setSlugError(check.slugError);
      return;
    }
    setSlugError(null);
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (isSubmittingRef.current) return;
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSlugError(null);

    let targetSlug = formData.slug;

    try {
      if (targetSlug) {
        const isAvailable = await checkSlugAvailable(targetSlug);
        if (!isAvailable) {
          if (formData.plan === "FREE") {
            const freshSlug = generateSmartSlug(formData.name || "tenant");
            targetSlug = freshSlug;
            setFormData((prev) => ({ ...prev, slug: freshSlug }));
          } else {
            throw new Error(
              t("organizations.wizard_slug_taken_error", {
                defaultValue: `Subdomain slug '${targetSlug}' is already in use by another organization. Please change the slug.`,
              })
            );
          }
        }
      }

      const asyncJob = await createOrganizationAsync(buildProvisioningPayload(formData, targetSlug));
      const token = session?.accessToken || "";

      startStreamingProvisioning({
        jobId: asyncJob.jobId,
        token,
        onSuccess: (result) => {
          const targetFinalSlug = result?.slug || targetSlug;
          if (targetFinalSlug) {
            initTenantVaultFolders(targetFinalSlug).catch((e) =>
              console.warn("S3 MinIO Vault auto-init warn:", e)
            );
          }

          setDeployedData({
            slug: targetFinalSlug,
            adminPassword: result?.adminPassword || "K2net@InitialPass2026",
            adminUsername: formData.adminUsername || formData.adminEmail.split("@")[0],
          });

          toast.success("Organization provisioned successfully!", {
            description: `${formData.name} is now deployed and ready to use.`,
          });

          isSubmittingRef.current = false;
          setIsSubmitting(false);
          setStep(5);
          onSuccess();
        },
        onError: (err) => {
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          const rawMsg = err.message || "";
          if (
            rawMsg.toLowerCase().includes("slug") ||
            rawMsg.toLowerCase().includes("subdomain") ||
            rawMsg.includes("already in use")
          ) {
            setSlugError(rawMsg);
          } else {
            setSlugError(null);
          }
          toast.error("Deployment failed", { description: err.message });
        },
      });
    } catch (err) {
      abortStreaming();
      isSubmittingRef.current = false;
      setIsSubmitting(false);

      const rawMsg = err instanceof Error ? err.message : t("organizations.wizard_deploy_failed");
      const { message, freshSlug } = resolveSlugErrorMessage(rawMsg, targetSlug, formData.name, t);
      if (freshSlug) setFormData((prev) => ({ ...prev, slug: freshSlug }));

      if (
        rawMsg.toLowerCase().includes("slug") ||
        rawMsg.toLowerCase().includes("subdomain") ||
        rawMsg.includes("already in use") ||
        freshSlug
      ) {
        setSlugError(message);
      } else {
        setSlugError(null);
      }
      toast.error("Deployment failed", { description: message });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Password copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const closeWizard = () => {
    if (isSubmittingRef.current) return;
    abortStreaming();
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setDeployedData(null);
      setFormData(INITIAL_FORM_DATA);
      setLdapTestPassed(false);
      setSlugError(null);
      resetProvisioningState();
    }, 300);
  };

  return {
    step,
    organizations,
    isSubmitting,
    isStreaming,
    streamError,
    provisioningStage,
    provisioningStages: PROVISIONING_STAGES,
    stageDurations,
    stageDetails,
    testingLdap,
    ldapTestPassed,
    slugError,
    setSlugError,
    deployedData,
    copied,
    formData,
    setFormData,
    handleRegenerateRandomSlug,
    updateLdapField,
    nextStep,
    prevStep,
    handleSubmit,
    copyToClipboard,
    closeWizard,
    handleTestLdap,
    isLdapFormComplete,
    isLdapFormatValid,
  };
}
