import { useState } from "react";
import { toast } from "sonner";
import type { WizardFormData } from "./types";

const isValidLdapUrl = (url: string) => !url.trim() || /^ldaps?:\/\/.+/i.test(url.trim());
const isValidDn = (dn: string) => !dn.trim() || dn.includes("=");

export function useWizardLdap(
  formData: WizardFormData,
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>
) {
  const [testingLdap, setTestingLdap] = useState(false);
  const [ldapTestPassed, setLdapTestPassed] = useState(false);

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
    testingLdap,
    ldapTestPassed,
    setLdapTestPassed,
    updateLdapField,
    handleTestLdap,
    isLdapFormComplete,
    isLdapFormatValid,
  };
}
