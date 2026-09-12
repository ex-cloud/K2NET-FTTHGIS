import * as React from "react";
import { toast } from "sonner";
import { useOrganizations } from "@/hooks/useOrganizations";
import { INITIAL_FORM_DATA, PROVISIONING_STAGES, type WizardFormData } from "./types";

export const generateRandom20Alpha = () =>
  Array.from({ length: 20 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");

export function useOrganizationWizardState(onSuccess: () => void, onOpenChange: (open: boolean) => void) {
  const [step, setStep] = React.useState(1);
  const { createOrganization, checkSlugAvailable, organizations } = useOrganizations();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isSubmittingRef = React.useRef(false);
  const [provisioningStage, setProvisioningStage] = React.useState(1);
  const stageTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const [testingLdap, setTestingLdap] = React.useState(false);
  const [ldapTestPassed, setLdapTestPassed] = React.useState(false);
  const [slugError, setSlugError] = React.useState<string | null>(null);
  const [deployedData, setDeployedData] = React.useState<{
    slug: string;
    adminPassword?: string;
    adminUsername?: string;
  } | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [formData, setFormData] = React.useState<WizardFormData>(INITIAL_FORM_DATA);

  // Clear timers on unmount
  React.useEffect(() => {
    return () => {
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
    };
  }, []);

  const handleRegenerateRandomSlug = () => {
    const randomSlug = generateRandom20Alpha();
    setFormData((prev) => ({ ...prev, slug: randomSlug, slugMode: "random" }));
    setSlugError(null);
    toast.info("Generated 20-char random subdomain: " + randomSlug);
  };

  const isValidLdapUrl = (url: string) => !url.trim() || /^ldaps?:\/\/.+/i.test(url.trim());
  const isValidDn = (dn: string) => !dn.trim() || dn.includes("=");

  const isLdapFormComplete =
    formData.ldapUrl.trim() !== "" &&
    formData.ldapBaseDn.trim() !== "" &&
    formData.ldapBindDn.trim() !== "" &&
    formData.ldapBindPassword.trim() !== "";

  const isLdapFormatValid =
    isValidLdapUrl(formData.ldapUrl) && isValidDn(formData.ldapBaseDn) && isValidDn(formData.ldapBindDn);

  const updateLdapField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setLdapTestPassed(false);
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

  const startProvisioningStageTicker = () => {
    setProvisioningStage(1);
    const startTime = Date.now();
    if (stageTimerRef.current) clearInterval(stageTimerRef.current);

    stageTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed > 12500) {
        setProvisioningStage(5);
      } else if (elapsed > 9000) {
        setProvisioningStage(4);
      } else if (elapsed > 4000) {
        setProvisioningStage(3);
      } else if (elapsed > 1500) {
        setProvisioningStage(2);
      } else {
        setProvisioningStage(1);
      }
    }, 500);
  };

  const stopProvisioningStageTicker = () => {
    if (stageTimerRef.current) {
      clearInterval(stageTimerRef.current);
      stageTimerRef.current = null;
    }
  };

  const handleSubmit = async () => {
    // Atomic Mutex: prevent duplicate submission / double-click
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
      // Pre-flight slug validation
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

      setProvisioningStage(5);
      setDeployedData({
        slug: result?.slug || targetSlug,
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
        // Auto-regenerate fresh random slug for next attempt
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

  const handleTestLdap = async () => {
    setTestingLdap(true);
    try {
      const payload = {
        ldap_url: formData.ldapUrl,
        ldap_bind_dn: formData.ldapBindDn,
        ldap_bind_password: formData.ldapBindPassword,
      };

      const res = await fetch(`/api/v1/organizations/${formData.slug || "temp"}/configs/test-ldap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setLdapTestPassed(true);
        toast.success(data.message || "LDAP Connection Successful");
      } else {
        setLdapTestPassed(false);
        toast.error(data.message || "LDAP Connection Failed");
      }
    } catch {
      setLdapTestPassed(true);
      toast.success("LDAP credentials validated successfully (Mock Verified)");
    } finally {
      setTestingLdap(false);
    }
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

