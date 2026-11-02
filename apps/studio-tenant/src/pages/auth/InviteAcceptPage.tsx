import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "@k2net/i18n";
import { AuthLoginLayout, AuthInviteAcceptCard, type AuthLocale } from "@k2net/ui";

export function InviteAcceptPage() {
  const { t, locale, setLocale } = useTranslation();
  const navigate = useNavigate();

  const turnstileSiteKey =
    (import.meta.env.VITE_TURNSTILE_TENANT_SITE_KEY as string | undefined)?.trim() ||
    (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() ||
    "0x4AAAAAAFq1LAd5fwZMDgz5";

  return (
    <AuthLoginLayout
      portalName={t("auth.tenant_portal_fallback")}
      portalSubtitle={t("auth.invite_page_desc")}
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
        <AuthInviteAcceptCard
          turnstileSiteKey={turnstileSiteKey}
          labels={{
            invitePageTitle: t("auth.invite_page_title"),
            invitePageDesc: t("auth.invite_page_desc"),
            inviteRoleLabel: t("auth.invite_role_label"),
            inviteWorkspaceLabel: t("auth.invite_workspace_label"),
            inviteSubdomainLabel: t("auth.invite_subdomain_label"),
            inviteEmailLabel: t("auth.invite_email_label"),
            inviteFullnameLabel: t("auth.invite_fullname_label"),
            inviteFullnamePlaceholder: t("auth.invite_fullname_placeholder"),
            invitePasswordLabel: t("auth.invite_password_label"),
            inviteConfirmPasswordLabel: t("auth.invite_confirm_password_label"),
            inviteSubmitBtn: t("auth.invite_submit_btn"),
            inviteSubmittingBtn: t("auth.invite_submitting_btn"),
            inviteSuccessTitle: t("auth.invite_success_title"),
            inviteSuccessDesc: t("auth.invite_success_desc"),
            inviteExpiredTitle: t("auth.invite_expired_title"),
            inviteExpiredDesc: t("auth.invite_expired_desc"),
            inviteExpiredGuidance: t("auth.invite_expired_guidance"),
            inviteAlreadyAcceptedTitle: t("auth.invite_already_accepted_title"),
            inviteAlreadyAcceptedDesc: t("auth.invite_already_accepted_desc"),
            inviteContinueToLogin: t("auth.invite_continue_to_login"),
            inviteRoleBadge: t("auth.invite_role_badge"),
            inviteExistingAccountHint: t("auth.invite_existing_account_hint"),
            tokenVerifying: t("auth.token_verifying"),
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
