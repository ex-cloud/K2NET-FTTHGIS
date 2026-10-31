import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "@k2net/i18n";
import { AuthLoginLayout, AuthActivateCard, type AuthLocale } from "@k2net/ui";

export function ActivatePage() {
  const { t, locale, setLocale } = useTranslation();
  const navigate = useNavigate();

  return (
    <AuthLoginLayout
      portalName="FTTH GIS Tenant Portal"
      portalSubtitle={t("auth.activate_page_desc")}
      docsUrl="https://system-gis.kdua.net/gateways/overview"
      docsLabel={t("auth.system_docs")}
      welcomeTitle={t("auth.welcome_back")}
      locale={locale as AuthLocale}
      onLocaleChange={(newLocale) => setLocale(newLocale)}
      footerAgreePrefix={t("auth.footer_agree_prefix")}
      footerTermsLabel={t("auth.footer_terms")}
      footerAndLabel={t("auth.footer_and")}
      footerPrivacyLabel={t("auth.footer_privacy")}
      footerAgreeSuffix={t("auth.footer_agree_suffix")}
      footerCopyrightText={t("auth.footer_copyright")}
      policyTermsTab={t("auth.policy_terms_tab")}
      policyPrivacyTab={t("auth.policy_privacy_tab")}
      policyCloseButton={t("auth.policy_close_button")}
    >
      <div className="w-full max-w-sm mx-auto">
        <AuthActivateCard
          labels={{
            activatePageTitle: t("auth.activate_page_title"),
            activatePageDesc: t("auth.activate_page_desc"),
            activateOrgLabel: t("auth.activate_org_label"),
            activateSubdomainLabel: t("auth.activate_subdomain_label"),
            activatePicLabel: t("auth.activate_pic_label"),
            activateSubmitBtn: t("auth.activate_submit_btn"),
            activateSubmittingBtn: t("auth.activate_submitting_btn"),
            activateSuccessTitle: t("auth.activate_success_title"),
            activateSuccessDesc: t("auth.activate_success_desc"),
            tokenExpiredTitle: t("auth.token_expired_title"),
            tokenExpiredDesc: t("auth.token_expired_desc"),
            tokenVerifying: t("auth.token_verifying"),
            newPasswordLabel: t("auth.new_password_label"),
            confirmPasswordLabel: t("auth.confirm_password_label"),
            passwordMismatch: t("auth.password_mismatch"),
            passwordStrengthWeak: t("auth.password_strength_weak"),
            passwordStrengthFair: t("auth.password_strength_fair"),
            passwordStrengthGood: t("auth.password_strength_good"),
            passwordStrengthStrong: t("auth.password_strength_strong"),
            passwordRequirementMin: t("auth.password_requirement_min"),
            passwordRequirementUpper: t("auth.password_requirement_upper"),
            passwordRequirementDigit: t("auth.password_requirement_digit"),
            passwordRequirementSpecial: t("auth.password_requirement_special"),
            backToSignIn: t("auth.back_to_sign_in"),
            operationFailed: t("auth.login_error_server_error"),
          }}
          onSuccessRedirect={(redirectUrl) => {
            if (redirectUrl && redirectUrl.startsWith("http")) {
              window.location.href = redirectUrl;
            } else {
              navigate({ to: "/login" });
            }
          }}
        />
      </div>
    </AuthLoginLayout>
  );
}
