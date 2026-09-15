import * as React from "react";
import { toast } from "sonner";
import { useOrganizations } from "@/hooks/useOrganizations";
import { initTenantVaultFolders } from "@/lib/storage-client";
import { INITIAL_FORM_DATA, PROVISIONING_STAGES, type WizardFormData } from "./types";
import { useWizardLdap } from "./useWizardLdap";
import { useWizardProvisioning } from "./useWizardProvisioning";

export const generateRandom20Alpha = () =>
  Array.from({ length: 20 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");

export function useOrganizationWizardState(onSuccess: () => void, onOpenChange: (open: boolean) => void) {
  const [step, setStep] = React.useState(1);
  const { createOrganization, checkSlugAvailable, organizations } = useOrganizations();
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
    setProvisioningStage,
    startProvisioningStageTicker,
    stopProvisioningStageTicker,
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
    const randomSlug = generateRandom20Alpha();
    setFormData((prev) => ({ ...prev, slug: randomSlug, slugMode: "random" }));
    setSlugError(null);
    toast.info(`Generated 20-char random subdomain: ${randomSlug}`);
  };

  const nextStep = async () => {
    if (step === 1) {
      if (!formData.name || !formData.slug) return;
      const isAvailable = await checkSlugAvailable(formData.slug);
      if (!isAvailable) {
        setSlugError("Slug ini sudah dipakai organisasi lain. Gunakan nama slug yang unik.");
        return;
      }
      setSlugError(null);
    }
    if (step === 3 && formData.ldapEnabled && !ldapTestPassed) {
      toast.error("Silakan uji koneksi LDAP terlebih dahulu sebelum melanjutkan.");
      return;
    }
    if (step === 4 && !formData.adminEmail) {
      toast.error("Email Admin PIC wajib diisi.");
      return;
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (isSubmittingRef.current) return;
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) {
      console.warn("Deploy submission already in-flight, ignoring duplicate trigger.");
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSlugError(null);
    startProvisioningStageTicker();

    let targetSlug = formData.slug;

    try {
      if (targetSlug) {
        const isAvailable = await checkSlugAvailable(targetSlug);
        if (!isAvailable) {
          if (formData.slugMode === "random" || formData.plan === "FREE") {
            const freshSlug = generateRandom20Alpha();
            targetSlug = freshSlug;
            setFormData((prev) => ({ ...prev, slug: freshSlug }));
          } else {
            throw new Error(`Subdomain slug '${targetSlug}' sudah digunakan oleh organisasi lain. Silakan ubah slug.`);
          }
        }
      }

      const result = await createOrganization({
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
        adminEmail: formData.adminEmail,
        adminUsername: formData.adminUsername || formData.adminEmail.split("@")[0],
      });

      const targetFinalSlug = result?.slug || targetSlug;

      const readableFolder = formData.name
        ? formData.name.toLowerCase().trim().replace(/[^a-z0-9_.-]+/g, "-").replace(/^-+|-+$/g, "")
        : targetFinalSlug;
      if (readableFolder) {
        initTenantVaultFolders(readableFolder).catch((e) =>
          console.warn("S3 MinIO Vault auto-init warn:", e)
        );
      }

      setProvisioningStage(5);
      setDeployedData({
        slug: targetFinalSlug,
        adminPassword: result?.adminPassword || "K2net@InitialPass2026",
        adminUsername: formData.adminUsername || formData.adminEmail.split("@")[0],
      });

      toast.success("Organization provisioned successfully!", {
        description: `${formData.name} is now deployed and ready to use.`,
      });

      setStep(5);
      onSuccess();
    } catch (err) {
      stopProvisioningStageTicker();
      const rawMessage = err instanceof Error ? err.message : "Gagal membuat organisasi.";
      
      let userMessage = rawMessage;
      if (rawMessage.includes("organizations_slug_key") || rawMessage.includes("already exists") || rawMessage.includes("sudah terdaftar")) {
        userMessage = `Subdomain slug '${targetSlug}' sudah digunakan. Sistem telah menyiapkan slug acak baru.`;
        const freshSlug = generateRandom20Alpha();
        setFormData((prev) => ({ ...prev, slug: freshSlug, slugMode: "random" }));
      }

      setSlugError(userMessage);
      toast.error("Deployment failed", {
        description: userMessage,
      });
    } finally {
      stopProvisioningStageTicker();
      isSubmittingRef.current = false;
      setIsSubmitting(false);
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
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setDeployedData(null);
      setFormData(INITIAL_FORM_DATA);
      setLdapTestPassed(false);
      setSlugError(null);
      setProvisioningStage(1);
    }, 300);
  };

  return {
    step,
    organizations,
    isSubmitting,
    provisioningStage,
    provisioningStages: PROVISIONING_STAGES,
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
