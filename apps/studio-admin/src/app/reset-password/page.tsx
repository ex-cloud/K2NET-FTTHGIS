import React from "react";
import { useRouter } from "@/lib/navigation-compat";
import { useTranslation } from "@k2net/i18n";
import { AuthLoginLayout, AuthResetPasswordCard, type AuthLocale } from "@k2net/ui";

export default function AdminResetPasswordPage() {
  const { t, locale, setLocale } = useTranslation();
  const router = useRouter();

  return (
    <AuthLoginLayout
      portalName="FTTH GIS Platform Admin"
      portalSubtitle={t("auth.reset_password_page_desc")}
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
        <AuthResetPasswordCard
          labels={{
            resetPasswordPageTitle: t("auth.reset_password_page_title"),
            resetPasswordPageDesc: t("auth.reset_password_page_desc"),
            newPasswordLabel: t("auth.new_password_label"),
            confirmPasswordLabel: t("auth.confirm_password_label"),
            passwordMismatch: t("auth.password_mismatch"),
            resetSubmitBtn: t("auth.reset_submit_btn"),
            resetSubmittingBtn: t("auth.reset_submitting_btn"),
            resetSuccessTitle: t("auth.reset_success_title"),
            resetSuccessDesc: t("auth.reset_success_desc"),
            tokenExpiredTitle: t("auth.token_expired_title"),
            tokenExpiredDesc: t("auth.token_expired_desc"),
            tokenVerifying: t("auth.token_verifying"),
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
          onSuccessRedirect={() => router.push("/login")}
          onBackToLogin={() => router.push("/login")}
        />
      </div>
    </AuthLoginLayout>
  );
}
