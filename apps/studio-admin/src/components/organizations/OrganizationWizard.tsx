import * as React from "react";
import { Dialog, DialogContent } from "@k2net/ui";
import { useSession } from "@/lib/auth-compat";
import { useOrganizationWizardState } from "./wizard/useOrganizationWizardState";
import { UpgradeLimitDialog } from "./wizard/UpgradeLimitDialog";
import { WizardHeader } from "./wizard/WizardHeader";
import { WizardBody } from "./wizard/WizardBody";
import { WizardFooter } from "./wizard/WizardFooter";

export { generateRandom20Alpha } from "./wizard/useOrganizationWizardState";

interface WizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function OrganizationWizard({ open, onOpenChange, onSuccess }: WizardProps) {
  const { data: session } = useSession();
  const state = useOrganizationWizardState(onSuccess, onOpenChange);

  const user = session?.user;
  const userRoles = user?.roles || [];
  const issuer = (session as { issuer?: string })?.issuer || "";
  const isSuperAdmin =
    issuer.includes("ftth-realm") ||
    issuer.includes("/system") ||
    userRoles.some((r) => r.toLowerCase().replace(/^role_/, "") === "super_admin");

  const hasFreePlan = state.organizations.some((org) => org.subscriptionPlan?.name?.toUpperCase() === "FREE");
  const isLimitReached = !isSuperAdmin && hasFreePlan;

  if (isLimitReached) {
    return <UpgradeLimitDialog open={open} onOpenChange={onOpenChange} />;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-popover/95 backdrop-blur-xl border-border text-foreground p-0 overflow-hidden rounded-2xl shadow-2xl">
        {/* Top Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-border">
          <div
            className="h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${(Math.min(4, state.step) / 4) * 100}%` }}
          />
        </div>

        <WizardHeader step={state.step} />

        <WizardBody
          step={state.step}
          formData={state.formData}
          setFormData={state.setFormData}
          slugError={state.slugError}
          setSlugError={state.setSlugError}
          onRegenerateRandomSlug={state.handleRegenerateRandomSlug}
          isSubmitting={state.isSubmitting}
          provisioningStage={state.provisioningStage}
          provisioningStages={state.provisioningStages}
          testingLdap={state.testingLdap}
          ldapTestPassed={state.ldapTestPassed}
          onTestLdap={state.handleTestLdap}
          updateLdapField={state.updateLdapField}
          isLdapFormComplete={state.isLdapFormComplete}
          isLdapFormatValid={state.isLdapFormatValid}
          deployedData={state.deployedData}
          onCopyPassword={state.copyToClipboard}
          copied={state.copied}
        />

        <WizardFooter
          step={state.step}
          prevStep={state.prevStep}
          nextStep={state.nextStep}
          handleSubmit={state.handleSubmit}
          closeWizard={state.closeWizard}
          onOpenChange={onOpenChange}
          isSubmitting={state.isSubmitting}
          provisioningStage={state.provisioningStage}
          formData={state.formData}
          ldapTestPassed={state.ldapTestPassed}
        />
      </DialogContent>
    </Dialog>
  );
}

