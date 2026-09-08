<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!((messagesPerField.existsError('username','password'))!false) displayInfo=((realm.password)!false) && ((realm.registrationAllowed)!false) && !registrationDisabled??; section>
    <#if section = "header">
        ${msg("loginAccountTitle")}
    <#elseif section = "form">

    <#-- Context variables detection -->
    <#assign isSystem = (realm.name == "ftth-realm" || realm.name == "master" || ((realm.attributes.isSystem)!'') == 'true')>
    <#assign rawOrgName = (realm.displayName)!((realm.attributes.orgName)!realm.name)>
    <#assign orgName = (rawOrgName?has_content && rawOrgName != realm.name)?then(rawOrgName, isSystem?then('K2NET Platform Admin', rawOrgName))>
    <#assign plan = ((realm.attributes.plan)!'FREE')?upper_case>
    <#assign planDisplayName = ((realm.attributes.planDisplayName)!(isSystem?then('SYSTEM ADMIN', (plan == 'PRO' || plan == 'PROFESSIONAL')?then('PROFESSIONAL', (plan == 'ENTERPRISE' || plan == 'ENTERPRISE CORE')?then('ENTERPRISE CORE', 'STARTER TRIAL')))))>
    <#assign logoUrl = ((realm.attributes.logoUrl)!'')>

    <!-- ============================================================
         FTTH GIS — 100% Identical React Split-Screen Interactive Login Page
         ============================================================ -->
    <div class="ftth-login-container" style="display:flex;min-height:100vh;width:100%;font-family:'Inter',sans-serif;background:#09090b;color:#f4f4f5;overflow-x:hidden;">

      <!-- ─── LEFT COLUMN: Login Form & Header ─────────────────────────── -->
      <div id="ftth-left" style="width:100%;max-width:44%;min-height:100vh;max-height:100vh;overflow-y:auto;background:#09090b;display:flex;flex-direction:column;justify-content:space-between;padding:24px 44px;position:relative;border-right:1px solid rgba(39,39,42,0.8);z-index:10;">

        <!-- Top Header Row (Logo + Docs + Instant Language Switcher) -->
        <div id="ftth-header" style="display:flex;align-items:center;justify-content:space-between;width:100%;z-index:20;flex-shrink:0;">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="display:flex;height:24px;width:24px;align-items:center;justify-content:center;border-radius:6px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);overflow:hidden;">
              <#if logoUrl?has_content>
                <img src="${logoUrl}" alt="${orgName}" style="width:100%;height:100%;object-fit:cover;border-radius:5px;" />
              <#elseif isSystem>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              <#else>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
                </svg>
              </#if>
            </div>
            <span style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#fafafa;">
              ${isSystem?then('FTTH GIS PORTAL', orgName)}
            </span>
          </div>

          <div style="display:flex;align-items:center;gap:8px;">
            <a id="ftth-docs-link" href="https://system-gis.kdua.net/gateways/overview" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:8px;border:1px solid rgba(63,63,70,0.6);background:rgba(24,24,27,0.5);font-size:11px;font-weight:500;color:#a1a1aa;text-decoration:none;">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              <span data-i18n="systemDocs">System Docs</span>
            </a>

            <!-- Language Selector (Instant Client-Side Toggle + Keycloak Sync) -->
            <div class="ftth-locale-selector" id="k2net-lang-switcher" style="display:inline-flex;align-items:center;background:rgba(24,24,27,0.6);border:1px solid rgba(63,63,70,0.6);border-radius:6px;padding:2px;">
              <button type="button" class="ftth-locale-btn active" data-lang="en" style="padding:2px 6px;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;border-radius:4px;border:none;cursor:pointer;background:#22c55e;color:#09090b;transition:all 0.15s ease;">
                EN
              </button>
              <button type="button" class="ftth-locale-btn" data-lang="id" style="padding:2px 6px;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;border-radius:4px;border:none;cursor:pointer;background:transparent;color:#a1a1aa;transition:all 0.15s ease;">
                ID
              </button>
            </div>
          </div>
        </div>

        <!-- Center Form Area -->
        <div id="ftth-form-area" style="width:100%;max-width:390px;margin:auto;padding:12px 0;z-index:20;">

          <!-- Welcome text (Exact match with React) -->
          <div id="ftth-welcome" style="margin-bottom:16px;">
            <h1 style="font-size:24px;font-weight:700;letter-spacing:-0.025em;color:#fafafa;margin-bottom:4px;" data-i18n="welcomeBack">
              Welcome back
            </h1>
            <p style="font-size:12px;color:#a1a1aa;line-height:1.4;" data-i18n="welcomeSubtitle">
              ${isSystem?then('Sign in to your system administrator account.', 'Sign in to your ISP workspace account.')}
            </p>
          </div>

          <!-- Main Login Card (Matching AuthLoginForm.tsx) -->
          <div style="background:rgba(24,24,27,0.6);border:1px solid rgba(63,63,70,0.7);border-radius:16px;padding:18px 20px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);backdrop-filter:blur(12px);">

            <!-- Tenant / Platform Identity Header Row -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid rgba(63,63,70,0.5);margin-bottom:14px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:28px;height:28px;border-radius:8px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);display:flex;align-items:center;justify-content:center;color:#22c55e;overflow:hidden;">
                  <#if logoUrl?has_content>
                    <img src="${logoUrl}" alt="${orgName}" style="width:100%;height:100%;object-fit:cover;border-radius:7px;" />
                  <#elseif isSystem>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
                    </svg>
                  <#else>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2">
                      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
                    </svg>
                  </#if>
                </div>
                <div>
                  <div style="font-size:12px;font-weight:700;color:#fff;">
                    ${isSystem?then('K2NET Platform Admin', orgName)}
                  </div>
                  <div style="font-size:10px;color:#a1a1aa;font-family:'JetBrains Mono',monospace;" data-i18n="identitySubtitle">
                    ${isSystem?then('Master IAM & Platform Operations', 'ISP Workspace & Operations')}
                  </div>
                </div>
              </div>

              <!-- Tier Badge -->
              <#if isSystem>
                <span class="ftth-tier-badge" style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:#fbbf24;">
                  SYSTEM ADMIN
                </span>
              <#elseif plan == "ENTERPRISE" || plan == "ENTERPRISE CORE">
                <span class="ftth-tier-badge ftth-badge-enterprise">
                  ${(planDisplayName?has_content)?then(planDisplayName?upper_case, 'ENTERPRISE')}
                </span>
              <#elseif plan == "PRO" || plan == "PROFESSIONAL">
                <span class="ftth-tier-badge ftth-badge-pro">
                  ${(planDisplayName?has_content)?then(planDisplayName?upper_case, 'PROFESSIONAL')}
                </span>
              <#else>
                <span class="ftth-tier-badge ftth-badge-free">
                  ${(planDisplayName?has_content)?then(planDisplayName?upper_case, 'STARTER TRIAL')}
                </span>
              </#if>
            </div>

            <#-- Error message -->
            <#if (messagesPerField.existsError('username','password'))!false>
              <div class="ftth-alert-error" style="margin-bottom:14px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}</span>
              </div>
            </#if>

            <#-- Alert/Info from Keycloak -->
            <#if (message.type)?? && message.type != 'warning' && !((messagesPerField.existsError('username','password'))!false)>
              <div class="ftth-alert-${message.type}" style="margin-bottom:14px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <#if message.type = 'error'><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  <#elseif message.type = 'info'><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                  <#else><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
                  </#if>
                </svg>
                <span>${kcSanitize(message.summary)?no_esc}</span>
              </div>
            </#if>

            <#-- Social SSO Buttons only for Tenant Portals (STRICTLY DISABLED for isSystem) -->
            <#if !isSystem && ((realm.password)!false) && (social.providers)?? && (social.providers?size gt 0)>
              <div class="ftth-social-providers" style="margin-bottom:14px;">
                <#list social.providers as p>
                  <a id="social-${p.alias}" class="ftth-sso-btn ftth-sso-${p.alias}" href="${p.loginUrl}">
                    <#if p.alias == "google">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                      </svg>
                    <#elseif p.alias == "github">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                      </svg>
                    <#else>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                      </svg>
                    </#if>
                    <span>Continue with ${p.displayName}</span>
                  </a>
                </#list>
              </div>

              <div class="ftth-divider" style="margin-bottom:14px;">
                <span>${msg("orContinueWith")}</span>
              </div>
            </#if>

            <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">

              <!-- Username / Email field -->
              <div class="form-group" style="margin-bottom:12px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                  <label for="username" style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a1a1aa;margin:0;" data-i18n="accountEmailLabel">
                    ACCOUNT EMAIL OR USERNAME
                  </label>
                  <span style="font-size:9px;font-family:'JetBrains Mono',monospace;color:#22c55e;" data-i18n="requiredTag">Required</span>
                </div>
                <div style="position:relative;">
                  <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#71717a;pointer-events:none;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  <input tabindex="1" id="username" name="username" type="text"
                    placeholder="${isSystem?then('e.g. admin@isp.net or admin.username', 'e.g. user@' + (realm.name) + '.com')}"
                    value="${(login.username!'')}"
                    autofocus autocomplete="username"
                    style="width:100%;height:38px;border-radius:8px;border:1px solid rgba(63,63,70,0.6);background:rgba(9,9,11,0.6);padding:0 12px 0 34px;font-size:13px;color:#fff;outline:none;"
                    aria-invalid="<#if (messagesPerField.existsError('username','password'))!false>true</#if>">
                </div>
              </div>

              <!-- Password field -->
              <div class="form-group" style="margin-bottom:12px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                  <label for="password" style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a1a1aa;margin:0;" data-i18n="passwordLabel">
                    PASSWORD
                  </label>
                  <#if (realm.resetPasswordAllowed)!false>
                    <a tabindex="5" href="${url.loginResetCredentialsUrl}" style="font-size:11px;font-weight:500;color:#22c55e;text-decoration:none;" data-i18n="forgotPassword">
                      Forgot password?
                    </a>
                  </#if>
                </div>
                <div style="position:relative;">
                  <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#71717a;pointer-events:none;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input tabindex="2" id="password" name="password" type="password"
                    placeholder="••••••••••••"
                    autocomplete="current-password"
                    style="width:100%;height:38px;border-radius:8px;border:1px solid rgba(63,63,70,0.6);background:rgba(9,9,11,0.6);padding:0 12px 0 34px;font-size:13px;color:#fff;outline:none;"
                    aria-invalid="<#if (messagesPerField.existsError('username','password'))!false>true</#if>">
                </div>
              </div>

              <!-- Remember me -->
              <#if ((realm.rememberMe)!false) && !usernameEditDisabled??>
                <div class="ftth-remember" style="margin-bottom:14px;">
                  <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox"
                    <#if (login.rememberMe)??>checked</#if>>
                  <label for="rememberMe" data-i18n="rememberMe">Remember me on this browser</label>
                </div>
              </#if>

              <!-- Hidden fields -->
              <input type="hidden" id="id-hidden-input" name="credentialId"
                <#if (auth.selectedCredential)?has_content>value="${auth.selectedCredential}"</#if>>

              <!-- Submit button (Emerald primary button matching React) -->
              <button tabindex="4" id="kc-login" name="login" type="submit" style="width:100%;height:40px;border-radius:10px;background:#16a34a;color:#fff;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(22,163,74,0.3);transition:all 0.15s ease;">
                <span id="kc-login-text" data-i18n="submitButton">${isSystem?then('Sign In to Platform Admin', 'Continue to ISP Workspace')}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>

            </form>

            <!-- Tier UX Guidance Box (Exact Match with AuthLoginForm.tsx) -->
            <#if isSystem>
              <div style="margin-top:12px;border-radius:10px;border:1px solid rgba(245,158,11,0.25);background:rgba(245,158,11,0.06);padding:10px 12px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">
                  <span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:#fbbf24;display:flex;align-items:center;gap:4px;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span data-i18n="accessModeTag">ACCESS MODE</span>
                  </span>
                  <span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:#fbbf24;" data-i18n="tierGuidanceTitle">MASTER IAM & MFA</span>
                </div>
                <p style="font-size:10px;color:#a1a1aa;margin:0;line-height:1.4;" data-i18n="tierGuidanceBody">
                  Autentikasi tingkat sistem dengan proteksi Keycloak IAM Master Realm dan penegakan MFA wajib.
                </p>
              </div>
            <#elseif plan == "ENTERPRISE" || plan == "ENTERPRISE CORE">
              <div style="margin-top:12px;border-radius:10px;border:1px solid rgba(168,85,247,0.25);background:rgba(168,85,247,0.06);padding:10px 12px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">
                  <span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:#c084fc;display:flex;align-items:center;gap:4px;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span data-i18n="accessModeTag">ENTERPRISE IAM</span>
                  </span>
                  <span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:#c084fc;" data-i18n="tierGuidanceTitle">SAML IdP & MFA</span>
                </div>
                <p style="font-size:10px;color:#a1a1aa;margin:0;line-height:1.4;" data-i18n="tierGuidanceBody">
                  Integrasi langsung Identity Provider perusahaan (Okta, Azure AD, SAML 2.0) dengan penegakan MFA wajib.
                </p>
              </div>
            <#elseif plan == "PRO" || plan == "PROFESSIONAL">
              <div style="margin-top:12px;border-radius:10px;border:1px solid rgba(14,165,233,0.25);background:rgba(14,165,233,0.06);padding:10px 12px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">
                  <span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:#38bdf8;display:flex;align-items:center;gap:4px;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                    </svg>
                    <span data-i18n="accessModeTag">LOGIN METHODS</span>
                  </span>
                  <span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:#38bdf8;" data-i18n="tierGuidanceTitle">PASSWORD + GOOGLE SSO</span>
                </div>
                <p style="font-size:10px;color:#a1a1aa;margin:0;line-height:1.4;" data-i18n="tierGuidanceBody">
                  Tersedia login menggunakan kredensial password langsung atau Single Sign-On Google Workspace.
                </p>
              </div>
            <#else>
              <div style="margin-top:12px;border-radius:10px;border:1px solid rgba(63,63,70,0.7);background:rgba(24,24,27,0.4);padding:10px 12px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">
                  <span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:#a1a1aa;display:flex;align-items:center;gap:4px;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
                      <circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>
                    </svg>
                    <span data-i18n="accessModeTag">LOGIN METHOD</span>
                  </span>
                  <span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:#22c55e;" data-i18n="tierGuidanceTitle">EMAIL + PASSWORD</span>
                </div>
                <p style="font-size:10px;color:#a1a1aa;margin:0;line-height:1.4;" data-i18n="tierGuidanceBody">
                  Otentikasi mandiri berbasis password. Opsi Google Workspace SSO & SAML IdP aktif pada paket Pro & Enterprise.
                </p>
              </div>
            </#if>

          </div><!-- /#ftth-card -->

          <!-- Security notice (Exact match with React footer alert) -->
          <div id="ftth-security-notice" style="border-radius:12px;border:1px solid rgba(34,197,94,0.25);background:rgba(34,197,94,0.05);padding:10px 12px;display:flex;gap:10px;align-items:flex-start;margin-top:12px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" style="flex-shrink:0;margin-top:1px;">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            <#if isSystem>
              <span style="font-size:11px;color:#a1a1aa;line-height:1.4;" data-i18n="securityNoticeSystem">
                Akses terisolasi platform master. Seluruh aktivitas login dipantau dan diaudit secara kriptografis sesuai standar kepatuhan K2NET.
              </span>
            <#else>
              <span style="font-size:11px;color:#a1a1aa;line-height:1.4;" data-i18n="securityNoticeTenant">
                Akses terisolasi multi-tenant. Seluruh aktivitas login dipantau dan diaudit secara kriptografis sesuai standar kepatuhan ISP K2NET.
              </span>
            </#if>
          </div>

        </div><!-- /#ftth-form-area -->

        <!-- Bottom Footer Row (Interactive Clickable Legal Links) -->
        <div id="ftth-footer" style="font-size:11px;color:#a1a1aa;border-top:1px solid rgba(63,63,70,0.6);padding-top:12px;margin-top:12px;flex-shrink:0;position:relative;z-index:20;">
          <p style="margin-bottom:3px;line-height:1.4;">
            <span data-i18n="byContinuing">By continuing, you agree to FTTH GIS's</span>
            <button type="button" id="btn-open-terms" style="background:none;border:none;padding:0;color:#22c55e;text-decoration:underline;cursor:pointer;font-size:11px;font-family:inherit;margin:0 2px;transition:color 0.15s ease;" data-i18n="termsOfService">Terms of Service</button>
            <span data-i18n="and">and</span>
            <button type="button" id="btn-open-privacy" style="background:none;border:none;padding:0;color:#22c55e;text-decoration:underline;cursor:pointer;font-size:11px;font-family:inherit;margin:0 2px;transition:color 0.15s ease;" data-i18n="privacyPolicy">Privacy Policy</button>.
          </p>
          <p style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#71717a;margin:0;">
            &#169; 2026 K2NET Enterprise SaaS Platform. <span data-i18n="allRightsReserved">All rights reserved.</span>
          </p>
        </div>

      </div><!-- /#ftth-left -->

      <!-- ─── RIGHT COLUMN: 3D Isometric Interactive Figure & Testimonial ── -->
      <div id="ftth-right" style="flex:1;min-height:100vh;background:#000000;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;padding:40px 56px;">

        <!-- Ambient Center Emerald Glow spot -->
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);width:460px;height:460px;border-radius:50%;background:radial-gradient(circle, rgba(34,197,94,0.16) 0%, rgba(6,182,212,0.06) 45%, transparent 70%);filter:blur(60px);pointer-events:none;"></div>

        <!-- Dot Grid pattern background overlay -->
        <div style="position:absolute;inset:0;opacity:0.12;pointer-events:none;background-image:radial-gradient(circle, rgba(255,255,255,0.2) 1.2px, transparent 1.2px);background-size:28px 28px;"></div>

        <!-- Top Right Figure Pill Badge -->
        <div style="width:100%;display:flex;justify-content:flex-end;z-index:10;">
          <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:9999px;border:1px solid rgba(63,63,70,0.6);background:rgba(24,24,27,0.6);backdrop-filter:blur(12px);font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;letter-spacing:0.08em;color:#a1a1aa;text-transform:uppercase;">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
            </svg>
            <span>FIG 0.1: PURPOSE-BUILT ARCHITECTURE</span>
          </div>
        </div>

        <!-- Center Interactive 3D Isometric Figure (100% Canonical GSAP React Geometry) -->
        <div id="isometric-container" style="margin:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 0;z-index:10;width:100%;max-width:440px;cursor:pointer;">
          <svg id="iso-figure-svg" viewBox="0 0 280 240" style="width:100%;height:290px;overflow:visible;" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="apertureMutedGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#27272a" stopOpacity="1" />
                <stop offset="85%" stopColor="#09090b" stopOpacity="1" />
              </radialGradient>
            </defs>

            <!-- Ambient Ground Shadow -->
            <ellipse id="ground-shadow" cx="140" cy="193" rx="72" ry="32" fill="rgba(0,0,0,0.85)" style="filter:blur(10px);pointer-events:none;" />

            <!-- Slabs Group injected dynamically by canonical JS generator -->
            <g id="iso-slabs-group" style="cursor:pointer;"></g>
          </svg>
        </div>

        <!-- Bottom Right Testimonial Card (Exact Match with React) -->
        <div style="width:100%;max-width:480px;margin:0 auto;z-index:10;">
          <div style="position:relative;border-radius:16px;border:1px solid rgba(63,63,70,0.7);background:rgba(18,18,21,0.75);padding:24px;backdrop-filter:blur(24px);box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" style="transform:rotate(180deg);margin-bottom:12px;opacity:0.8;">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
            </svg>

            <#if isSystem>
              <blockquote style="font-size:13px;font-weight:400;color:rgba(244,244,245,0.9);line-height:1.6;margin-bottom:16px;font-style:normal;" data-i18n="testimonialQuote">
                &#8220;Managing enterprise fiber-to-the-home geodata networks has never been this seamless. Highly stable, fast geocoding, and fully isolated multi-tenancy.&#8221;
              </blockquote>

              <div style="display:flex;align-items:center;gap:12px;padding-top:12px;border-top:1px solid rgba(63,63,70,0.4);">
                <div style="height:32px;width:32px;border-radius:50%;background:rgba(34,197,94,0.2);border:1px solid rgba(34,197,94,0.4);display:flex;align-items:center;justify-content:center;color:#22c55e;font-weight:700;font-size:12px;">
                  A
                </div>
                <div>
                  <div style="font-size:12px;font-weight:600;color:#fff;">
                    Andiansyah
                  </div>
                  <div style="font-size:10px;color:#a1a1aa;font-family:'JetBrains Mono',monospace;">
                    Chief Technology Officer, K2NET
                  </div>
                </div>
              </div>
            <#else>
              <blockquote style="font-size:13px;font-weight:400;color:rgba(244,244,245,0.9);line-height:1.6;margin-bottom:16px;font-style:normal;" data-i18n="testimonialQuote">
                &#8220;From fiber distribution to optical power level diagnostics, managing our ISP footprint and field operations has never been this effortless.&#8221;
              </blockquote>

              <div style="display:flex;align-items:center;gap:12px;padding-top:12px;border-top:1px solid rgba(63,63,70,0.4);">
                <div style="height:32px;width:32px;border-radius:50%;background:rgba(56,189,248,0.2);border:1px solid rgba(56,189,248,0.4);display:flex;align-items:center;justify-content:center;color:#38bdf8;font-weight:700;font-size:12px;">
                  ISP
                </div>
                <div>
                  <div style="font-size:12px;font-weight:600;color:#fff;">
                    ${orgName} Operations
                  </div>
                  <div style="font-size:10px;color:#a1a1aa;font-family:'JetBrains Mono',monospace;">
                    Network Infrastructure Team • ${planDisplayName}
                  </div>
                </div>
              </div>
            </#if>
          </div>
        </div>

      </div><!-- /#ftth-right -->

    </div><!-- split-screen wrapper -->

    <!-- ============================================================
         Interactive Enterprise Legal Terms & Privacy Modal
         ============================================================ -->
    <div id="ftth-policy-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(10px);z-index:9999;align-items:center;justify-content:center;padding:20px;">
      <div id="ftth-policy-modal-card" style="background:#0e0e11;border:1px solid rgba(63,63,70,0.8);border-radius:18px;width:100%;max-width:820px;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 30px 60px -12px rgba(0,0,0,0.9);overflow:hidden;position:relative;">

        <!-- Modal Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid rgba(63,63,70,0.6);background:rgba(24,24,27,0.7);flex-shrink:0;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:32px;height:32px;border-radius:8px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);display:flex;align-items:center;justify-content:center;color:#22c55e;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:8px;">
                <h2 id="ftth-modal-title" style="font-size:16px;font-weight:700;color:#fff;margin:0;">Terms of Service</h2>
                <span style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:#22c55e;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);padding:1px 6px;border-radius:4px;">v2026.3</span>
              </div>
              <p style="font-size:11px;color:#a1a1aa;margin:2px 0 0 0;font-family:'JetBrains Mono',monospace;">K2NET Enterprise SaaS Platform Governance</p>
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:10px;">
            <!-- Modal Segmented Tab Switcher -->
            <div style="display:inline-flex;background:rgba(9,9,11,0.8);border:1px solid rgba(63,63,70,0.6);border-radius:8px;padding:3px;">
              <button type="button" id="tab-btn-terms" class="active" style="padding:4px 12px;font-size:11px;font-weight:600;border-radius:6px;border:none;cursor:pointer;background:#22c55e;color:#09090b;transition:all 0.15s ease;">
                Terms
              </button>
              <button type="button" id="tab-btn-privacy" style="padding:4px 12px;font-size:11px;font-weight:600;border-radius:6px;border:none;cursor:pointer;background:transparent;color:#a1a1aa;transition:all 0.15s ease;">
                Privacy
              </button>
            </div>

            <!-- Close (X) button -->
            <button type="button" id="btn-close-policy-modal" style="width:32px;height:32px;border-radius:8px;border:1px solid rgba(63,63,70,0.6);background:rgba(24,24,27,0.5);color:#a1a1aa;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s ease;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Modal Scrollable Content Container -->
        <div id="ftth-policy-content-body" style="padding:24px 28px;overflow-y:auto;max-height:calc(88vh - 140px);color:#d4d4d8;font-size:13px;line-height:1.7;">
          <!-- Dynamically populated by JS dictionary based on active tab & locale -->
        </div>

        <!-- Modal Footer -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 24px;border-top:1px solid rgba(63,63,70,0.6);background:rgba(18,18,21,0.9);flex-shrink:0;">
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#71717a;font-family:'JetBrains Mono',monospace;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>TLS 1.3 &bull; AES-256 GCM &bull; ISO/IEC 27001 & UU PDP Compliant</span>
          </div>

          <button type="button" id="btn-policy-acknowledge" style="padding:7px 18px;border-radius:8px;background:#16a34a;color:#fff;font-size:12px;font-weight:600;border:none;cursor:pointer;transition:all 0.15s ease;">
            <span data-i18n="acknowledgeBtn">I Understand & Close</span>
          </button>
        </div>

      </div>
    </div>

    <!-- ============================================================
         Scripts: 1. Canonical 3D Isometric Slabs + GSAP Lifting
                  2. Instant Client-Side i18n Engine (EN / ID)
                  3. Interactive Legal Policy Modal Controller
         ============================================================ -->
    <script>
      (function() {
        // ─── 1. Canonical 3D Isometric Slabs Generator (100% React Geometry) ───
        var K2NET_LOGO_B64 = "data:image/png;base64,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";

        var COS30 = Math.cos(Math.PI / 6);
        var SIN30 = Math.sin(Math.PI / 6);

        function toIsoPt(x, y, z, originX, originY) {
          return {
            x: originX + (x - y) * COS30,
            y: originY + (x + y) * SIN30 - z
          };
        }

        function isoRoundedRectPath(cx, cy, w, h, z, r, originX, originY) {
          var x1 = cx - w / 2, x2 = cx + w / 2, y1 = cy - h / 2, y2 = cy + h / 2;
          var rad = Math.min(r, w / 2 - 0.5, h / 2 - 0.5);
          var p1 = toIsoPt(x1 + rad, y1, z, originX, originY);
          var p2 = toIsoPt(x2 - rad, y1, z, originX, originY);
          var c2 = toIsoPt(x2, y1, z, originX, originY);
          var p3 = toIsoPt(x2, y1 + rad, z, originX, originY);
          var p4 = toIsoPt(x2, y2 - rad, z, originX, originY);
          var c3 = toIsoPt(x2, y2, z, originX, originY);
          var p5 = toIsoPt(x2 - rad, y2, z, originX, originY);
          var p6 = toIsoPt(x1 + rad, y2, z, originX, originY);
          var c4 = toIsoPt(x1, y2, z, originX, originY);
          var p7 = toIsoPt(x1, y2 - rad, z, originX, originY);
          var p8 = toIsoPt(x1, y1 + rad, z, originX, originY);
          var c1 = toIsoPt(x1, y1, z, originX, originY);
          return "M " + p1.x.toFixed(1) + " " + p1.y.toFixed(1) + " L " + p2.x.toFixed(1) + " " + p2.y.toFixed(1) + " Q " + c2.x.toFixed(1) + " " + c2.y.toFixed(1) + " " + p3.x.toFixed(1) + " " + p3.y.toFixed(1) + " L " + p4.x.toFixed(1) + " " + p4.y.toFixed(1) + " Q " + c3.x.toFixed(1) + " " + c3.y.toFixed(1) + " " + p5.x.toFixed(1) + " " + p5.y.toFixed(1) + " L " + p6.x.toFixed(1) + " " + p6.y.toFixed(1) + " Q " + c4.x.toFixed(1) + " " + c4.y.toFixed(1) + " " + p7.x.toFixed(1) + " " + p7.y.toFixed(1) + " L " + p8.x.toFixed(1) + " " + p8.y.toFixed(1) + " Q " + c1.x.toFixed(1) + " " + c1.y.toFixed(1) + " " + p1.x.toFixed(1) + " " + p1.y.toFixed(1) + " Z";
        }

        var layers = [0, 1, 2, 3, 4, 5];
        var slabSize = 50;
        var slabThickness = 7.5;
        var originY = 148;
        var topSlabIndex = 5;
        var cornerRadius = 5.5;
        var apertureRadius = 23;
        var apertureRx = apertureRadius * 1.2247;
        var apertureRy = apertureRadius * 0.7071;
        var zTopFinal = topSlabIndex * (slabThickness + 2) + slabThickness;
        var topCenterY = originY - zTopFinal;

        var slabsGroup = document.getElementById('iso-slabs-group');
        if (slabsGroup) {
          var slabsHtml = "";
          layers.forEach(function(idx) {
            var zBase = idx * (slabThickness + 2);
            var zTop = zBase + slabThickness;
            var isTop = (idx === topSlabIndex);
            var w = slabSize * 2;
            var r = cornerRadius;
            var x1 = -slabSize, x2 = slabSize, y1 = -slabSize, y2 = slabSize;

            var topPath = isoRoundedRectPath(0, 0, w, w, zTop, r, 140, originY);
            var p6Top = toIsoPt(x1 + r, y2, zTop, 140, originY);
            var p5Top = toIsoPt(x2 - r, y2, zTop, 140, originY);
            var c3Top = toIsoPt(x2, y2, zTop, 140, originY);
            var p4Top = toIsoPt(x2, y2 - r, zTop, 140, originY);
            var p3Top = toIsoPt(x2, y1 + r, zTop, 140, originY);
            var c4Top = toIsoPt(x1, y2, zTop, 140, originY);
            var p7Top = toIsoPt(x1, y2 - r, zTop, 140, originY);

            var p6Base = toIsoPt(x1 + r, y2, zBase, 140, originY);
            var p5Base = toIsoPt(x2 - r, y2, zBase, 140, originY);
            var c3Base = toIsoPt(x2, y2, zBase, 140, originY);
            var p4Base = toIsoPt(x2, y2 - r, zBase, 140, originY);
            var p3Base = toIsoPt(x2, y1 + r, zBase, 140, originY);
            var c4Base = toIsoPt(x1, y2, zBase, 140, originY);
            var p7Base = toIsoPt(x1, y2 - r, zBase, 140, originY);

            var leftFace = "M " + p7Top.x.toFixed(1) + " " + p7Top.y.toFixed(1) + " Q " + c4Top.x.toFixed(1) + " " + c4Top.y.toFixed(1) + " " + p6Top.x.toFixed(1) + " " + p6Top.y.toFixed(1) + " L " + p5Top.x.toFixed(1) + " " + p5Top.y.toFixed(1) + " L " + p5Base.x.toFixed(1) + " " + p5Base.y.toFixed(1) + " L " + p6Base.x.toFixed(1) + " " + p6Base.y.toFixed(1) + " Q " + c4Base.x.toFixed(1) + " " + c4Base.y.toFixed(1) + " " + p7Base.x.toFixed(1) + " " + p7Base.y.toFixed(1) + " Z";
            var rightFace = "M " + p5Top.x.toFixed(1) + " " + p5Top.y.toFixed(1) + " Q " + c3Top.x.toFixed(1) + " " + c3Top.y.toFixed(1) + " " + p4Top.x.toFixed(1) + " " + p4Top.y.toFixed(1) + " L " + p3Top.x.toFixed(1) + " " + p3Top.y.toFixed(1) + " L " + p3Base.x.toFixed(1) + " " + p3Base.y.toFixed(1) + " L " + p4Base.x.toFixed(1) + " " + p4Base.y.toFixed(1) + " Q " + c3Base.x.toFixed(1) + " " + c3Base.y.toFixed(1) + " " + p5Base.x.toFixed(1) + " " + p5Base.y.toFixed(1) + " Z";
            var ridge = "M " + p7Top.x.toFixed(1) + " " + p7Top.y.toFixed(1) + " Q " + c4Top.x.toFixed(1) + " " + c4Top.y.toFixed(1) + " " + p6Top.x.toFixed(1) + " " + p6Top.y.toFixed(1) + " L " + p5Top.x.toFixed(1) + " " + p5Top.y.toFixed(1) + " Q " + c3Top.x.toFixed(1) + " " + c3Top.y.toFixed(1) + " " + p4Top.x.toFixed(1) + " " + p4Top.y.toFixed(1);

            slabsHtml += '<g class="iso-slab" data-index="' + idx + '" style="transition:transform 0.35s cubic-bezier(0.25, 1, 0.5, 1);">' +
              '<path d="' + leftFace + '" fill="#09090b" stroke="#3f3f46" stroke-opacity="0.6" stroke-width="0.85" stroke-linejoin="round" stroke-linecap="round" />' +
              '<path d="' + rightFace + '" fill="#000000" stroke="#27272a" stroke-opacity="0.45" stroke-width="0.85" stroke-linejoin="round" stroke-linecap="round" />' +
              '<path d="' + topPath + '" fill="#121215" stroke="#71717a" stroke-opacity="0.85" stroke-width="' + (isTop ? '1' : '0.85') + '" stroke-linejoin="round" stroke-linecap="round" />' +
              '<path d="' + ridge + '" stroke="#a1a1aa" stroke-opacity="0.85" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" fill="none" />';

            if (isTop) {
              slabsHtml += '<ellipse cx="140" cy="' + topCenterY.toFixed(1) + '" rx="' + apertureRx.toFixed(1) + '" ry="' + apertureRy.toFixed(1) + '" fill="url(#apertureMutedGlow)" stroke="#a1a1aa" stroke-opacity="0.9" stroke-width="1.1" />';
              [-8, -4, 0, 4, 8].forEach(function(offset) {
                var halfW = Math.sqrt(Math.max(0, 1 - Math.pow(offset / apertureRy, 2))) * (apertureRx - 3);
                slabsHtml += '<line x1="' + (140 - halfW).toFixed(1) + '" y1="' + (topCenterY + offset).toFixed(1) + '" x2="' + (140 + halfW).toFixed(1) + '" y2="' + (topCenterY + offset).toFixed(1) + '" stroke="#71717a" stroke-opacity="0.4" stroke-width="0.75" stroke-linecap="round" />';
              });
              slabsHtml += '<g transform="translate(140, ' + topCenterY.toFixed(1) + ') matrix(0.866025 0.5 -0.866025 0.5 0 0)">' +
                '<image href="' + K2NET_LOGO_B64 + '" x="-19" y="-19" width="38" height="38" style="filter:brightness(0) invert(1) drop-shadow(0 0 8px rgba(255,255,255,0.85));opacity:0.95;" />' +
                '</g>';
            }

            slabsHtml += '</g>';
          });
          slabsGroup.innerHTML = slabsHtml;
        }

        // ─── Interactive Physics Tracking (Matches GSAP handleSlabsHover) ───
        var container = document.getElementById('isometric-container');
        if (container) {
          container.addEventListener('mousemove', function(e) {
            var slabs = document.querySelectorAll('.iso-slab');
            var rect = container.getBoundingClientRect();
            var svgX = ((e.clientX - rect.left) / rect.width) * 280;
            var svgY = ((e.clientY - rect.top) / rect.height) * 240;

            var dx = svgX - 140;
            var dy = svgY - originY;

            var nx = Math.max(-1, Math.min(1, dx / 55));
            var ny = Math.max(-1, Math.min(1, dy / 50));

            var liftIntensity = Math.max(0.4, 1.2 - ny * 1.1);

            slabs.forEach(function(slab, idx) {
              var targetY = -idx * (5.5 * liftIntensity) - (idx === topSlabIndex ? 6 : 0);
              var targetX = nx * (idx * 2.2);
              slab.style.transform = 'translate(' + targetX.toFixed(1) + 'px, ' + targetY.toFixed(1) + 'px)';
            });
          });

          container.addEventListener('mouseleave', function() {
            var slabs = document.querySelectorAll('.iso-slab');
            slabs.forEach(function(slab) {
              slab.style.transform = 'translate(0px, 0px)';
            });
          });
        }

        // ─── 2. Complete Enterprise Legal Documents (Bilingual Supabase Standard) ─
        var legalDocs = {
          en: {
            termsTitle: "Terms of Service",
            privacyTitle: "Privacy Policy",
            acknowledgeBtn: "I Understand & Acknowledge",
            termsHtml: [
              '<div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.25);border-radius:10px;padding:12px 16px;margin-bottom:20px;">',
                '<strong style="color:#22c55e;font-size:12px;font-family:\'JetBrains Mono\',monospace;display:block;margin-bottom:4px;">ENTERPRISE SAAS MASTER AGREEMENT</strong>',
                '<p style="margin:0;font-size:12px;color:#a1a1aa;">These Terms of Service govern your access to and use of the K2NET FTTH GIS Enterprise SaaS Platform, including all associated microservices, spatial geodata engines, OLT telemetry pollers, and client portal applications.</p>',
              '</div>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">1. SaaS Platform License & Workspace Provisioning</h3>',
              '<p>Subject to compliance with this Agreement and active subscription tier commitments (Starter, Professional, Enterprise Core, or System Admin), K2NET grants your organization a non-exclusive, non-transferable, worldwide license to access and utilize the FTTH GIS platform for designing, mapping, managing, and maintaining fiber-to-the-home and optical distribution network infrastructure.</p>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">2. Identity, Access Management (IAM) & Credential Security</h3>',
              '<p>Authentication is enforced via Keycloak IAM with mandatory Multi-Factor Authentication (MFA) and Policy-Based Access Control (PBAC). You are solely responsible for maintaining the confidentiality of administrative credentials, OAuth2 tokens, and API secret keys. Any unauthorized activity originating from your tenant credentials must be reported to <code style="color:#22c55e;background:#18181b;padding:2px 6px;border-radius:4px;">security@k2net.id</code> within 24 hours.</p>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">3. Customer Data & Spatial Sovereignty (You Own Your Data)</h3>',
              '<p>You retain 100% full intellectual property rights, title, and ownership of all customer data, geospatial vector geometries (ODP, ODC, Closure, Slack, Pole nodes), fiber core topologies, customer address records, and billing metadata uploaded or created within your tenant workspace. K2NET does not claim ownership or sell your proprietary spatial geodata.</p>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">4. Acceptable Use Policy & Zero-Abuse Safeguards</h3>',
              '<p>You agree not to: (a) reverse engineer, decompile, or extract the source code of the platform engines; (b) conduct unauthorized automated stress testing, vulnerability scans, or denial-of-service simulations against Kong gateways or backend APIs without prior written authorization; (c) bypass multi-tenant isolation boundaries; or (d) transmit malicious payloads.</p>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">5. Service Level Agreement (SLA) & High Availability</h3>',
              '<p>K2NET commits to an operational uptime SLA of <strong style="color:#22c55e;">99.9%</strong> for Enterprise tiers, backed by automated 3-tier disaster recovery replication (Local SSD, On-Premise MinIO S3, and Offsite Encrypted Cloud WebDAV). Scheduled maintenance windows will be communicated with at least 48 hours advance notice.</p>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">6. Data Portability & Termination Rights</h3>',
              '<p>You may export your complete geospatial dataset at any time in industry-standard open GIS formats (GeoJSON, ESRI Shapefile, PostGIS SQL dumps, and CSV). Upon subscription termination, a 30-day export grace period is provided before tenant database partition and MinIO storage buckets are cryptographically purged.</p>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">7. Limitation of Liability & Governing Law</h3>',
              '<p>To the maximum extent permitted by applicable law, K2NET shall not be liable for indirect, incidental, or consequential damages. Total liability is capped at the total amount paid by your organization in the preceding twelve (12) months. This agreement is governed by the laws of the Republic of Indonesia.</p>'
            ].join(''),
            privacyHtml: [
              '<div style="background:rgba(56,189,248,0.06);border:1px solid rgba(56,189,248,0.25);border-radius:10px;padding:12px 16px;margin-bottom:20px;">',
                '<strong style="color:#38bdf8;font-size:12px;font-family:\'JetBrains Mono\',monospace;display:block;margin-bottom:4px;">PRIVACY & DATA PROTECTION STANDARDS</strong>',
                '<p style="margin:0;font-size:12px;color:#a1a1aa;">This Privacy Policy explains how K2NET collects, processes, encrypts, and protects organizational telemetry, user credentials, and geospatial data in strict compliance with Indonesian Personal Data Protection Law (UU PDP No. 27/2022) and international privacy frameworks.</p>',
              '</div>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">1. Information We Collect</h3>',
              '<ul style="margin:0 0 14px 20px;padding:0;">',
                '<li style="margin-bottom:6px;"><strong>Account & IAM Metadata:</strong> Work email, user identifier, PBAC role assignments, cryptographic password hashes (bcrypt/Argon2id), and MFA device registrations.</li>',
                '<li style="margin-bottom:6px;"><strong>Infrastructure & OLT Telemetry:</strong> Device IP addresses, SNMP query responses, optical power levels (dBm), interface operational status, and Kong edge API traffic logs.</li>',
                '<li style="margin-bottom:6px;"><strong>Audit Trail Logs:</strong> Nonce timestamps, IP addresses, HTTP user-agent headers, and mutation history recorded by the asynchronous Audit Gateway (:5009).</li>',
              '</ul>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">2. Zero-Trust Multi-Tenant Isolation & Storage Security</h3>',
              '<p>All tenant data is strictly partitioned at the PostgreSQL schema/database level with tenant-scoped connection pooling. All data in transit is encrypted using mandatory <strong style="color:#22c55e;">TLS 1.3</strong>, and all persisted data (PostgreSQL tables, WAL logs, and MinIO S3 object blocks) is encrypted at rest using <strong style="color:#22c55e;">AES-256-GCM</strong>.</p>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">3. Third-Party Gateways & Sub-processors</h3>',
              '<p>To deliver core platform capabilities, we interface with specialized secure microservices: (a) <em>Notification Gateway (:5001)</em> for automated SMS/WhatsApp alerts; (b) <em>Payment Gateway (:5002)</em> integrating PCI-DSS compliant payment providers (Xendit); (c) <em>Map Gateway (:5003)</em> for vector tile and geocoding services; and (d) <em>Storage Gateway (:5004)</em> for isolated MinIO S3 bucket asset storage.</p>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">4. Cookies & Session State</h3>',
              '<p>We only utilize strictly necessary, cryptographic HttpOnly session cookies and JWT Bearer tokens to maintain authenticated state across Kong API gateways. We do not deploy third-party advertising, marketing trackers, or cross-site tracking pixels.</p>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">5. Your Rights & Data Portability</h3>',
              '<p>In accordance with UU PDP and GDPR principles, you maintain the right to access, rectify, export, and delete your personal and organizational records. For inquiries, contact our Data Protection Officer at <code style="color:#38bdf8;background:#18181b;padding:2px 6px;border-radius:4px;">dpo@k2net.id</code>.</p>'
            ].join('')
          },
          id: {
            termsTitle: "Ketentuan Layanan",
            privacyTitle: "Kebijakan Privasi",
            acknowledgeBtn: "Saya Mengerti & Tutup",
            termsHtml: [
              '<div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.25);border-radius:10px;padding:12px 16px;margin-bottom:20px;">',
                '<strong style="color:#22c55e;font-size:12px;font-family:\'JetBrains Mono\',monospace;display:block;margin-bottom:4px;">PERJANJIAN UTAMA SAAS ENTERPRISE</strong>',
                '<p style="margin:0;font-size:12px;color:#a1a1aa;">Ketentuan Layanan ini mengatur hak akses dan penggunaan Platform Enterprise SaaS FTTH GIS K2NET, termasuk seluruh microservice terkait, engine geospasial, poller telemetri OLT, dan aplikasi portal tenant.</p>',
              '</div>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">1. Lisensi Platform SaaS & Penyediaan Ruang Kerja</h3>',
              '<p>Sesuai dengan kepatuhan terhadap Perjanjian ini dan paket langganan aktif (Starter, Professional, Enterprise Core, atau System Admin), K2NET memberikan lisensi non-eksklusif dan non-dapat dialihkan bagi organisasi Anda untuk mengoperasikan platform FTTH GIS guna merancang, memetakan, dan memelihara infrastruktur jaringan fiber optik (FTTH).</p>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">2. Manajemen Identitas (IAM), PBAC & Keamanan Kredensial</h3>',
              '<p>Otentikasi ditegakkan melalui Keycloak IAM dengan Multi-Factor Authentication (MFA) wajib dan Policy-Based Access Control (PBAC). Anda bertanggung jawab penuh menjaga kerahasiaan kredensial admin, token OAuth2, dan API key. Segala insiden keamanan wajib dilaporkan ke <code style="color:#22c55e;background:#18181b;padding:2px 6px;border-radius:4px;">security@k2net.id</code> dalam waktu 24 jam.</p>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">3. Kedaulatan & Kepemilikan Data Spasial (Data Adalah Milik Anda 100%)</h3>',
              '<p>Organisasi Anda memegang 100% hak kekayaan intelektual dan kepemilikan mutlak atas seluruh data pelanggan, koordinat geospasial (titik ODP, ODC, Closure, Tiang, Pelanggan), topologi kabel fiber, dan metadata operasional. K2NET tidak memiliki hak milik dan tidak memperjualbelikan data geospasial tenant.</p>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">4. Kebijakan Penggunaan Wajar & Perlindungan Platform</h3>',
              '<p>Anda dilarang: (a) melakukan rekayasa balik (reverse engineering) atau dekompilasi kode sumber platform; (b) melakukan uji penetrasi / pemindaian kerentanan otomatis tanpa izin tertulis resmi; (c) membypass isolasi multi-tenant; atau (d) mengirimkan muatan berbahaya yang mengganggu gateway API Kong.</p>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">5. Perjanjian Tingkat Layanan (SLA) & Ketersediaan Tinggi</h3>',
              '<p>K2NET berkomitmen terhadap uptime SLA operasional sebesar <strong style="color:#22c55e;">99.9%</strong> untuk tier Enterprise, didukung pemulihan bencana 3-lapis otomatis (SSD Lokal, MinIO S3 On-Premise, dan Offsite Cloud WebDAV). Jadwal pemeliharaan berkala akan diberitahukan minimal 48 jam sebelumnya.</p>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">6. Portabilitas Data & Hak Pengakhiran Layanan</h3>',
              '<p>Anda dapat mengunduh dan mengekspor seluruh dataset geospasial Anda kapan saja dalam format GIS terbuka standar (GeoJSON, ESRI Shapefile, dump SQL PostGIS, dan CSV). Masa tenggang 30 hari diberikan setelah penghentian langganan sebelum data dihapus secara kriptografis.</p>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">7. Batasan Tanggung Jawab & Hukum yang Berlaku</h3>',
              '<p>Batasan tanggung jawab maksimum K2NET dibatasi hingga total biaya langganan yang telah dibayarkan oleh organisasi Anda dalam dua belas (12) bulan terakhir. Perjanjian ini tunduk dan ditafsirkan berdasarkan hukum Negara Republik Indonesia.</p>'
            ].join(''),
            privacyHtml: [
              '<div style="background:rgba(56,189,248,0.06);border:1px solid rgba(56,189,248,0.25);border-radius:10px;padding:12px 16px;margin-bottom:20px;">',
                '<strong style="color:#38bdf8;font-size:12px;font-family:\'JetBrains Mono\',monospace;display:block;margin-bottom:4px;">STANDAR PRIVASI & PERLINDUNGAN DATA</strong>',
                '<p style="margin:0;font-size:12px;color:#a1a1aa;">Kebijakan Privasi ini menjelaskan bagaimana K2NET mengumpulkan, memproses, mengenkripsi, dan melindungi data telemetri, kredensial pengguna, serta data spasial sesuai Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27/2022).</p>',
              '</div>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">1. Informasi yang Kami Kumpulkan</h3>',
              '<ul style="margin:0 0 14px 20px;padding:0;">',
                '<li style="margin-bottom:6px;"><strong>Data Akun & IAM:</strong> Email kerja, ID pengguna, peran PBAC, hash sandi kriptografis (Argon2id/bcrypt), dan kunci MFA.</li>',
                '<li style="margin-bottom:6px;"><strong>Telemetri OLT & Jaringan:</strong> Alamat IP perangkat, respon query SNMP, nilai redaman optik (dBm), status antarmuka OLT, dan log API gateway Kong.</li>',
                '<li style="margin-bottom:6px;"><strong>Log Jejak Audit:</strong> Catatan mutasi database, alamat IP pemanggil, user-agent, dan timestamp kriptografis yang dikelola Audit Gateway (:5009).</li>',
              '</ul>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">2. Isolasi Zero-Trust & Keamanan Penyimpanan Data</h3>',
              '<p>Setiap data tenant terisolasi secara ketat pada partisi PostgreSQL terpisah. Seluruh transmisi data dienkripsi dengan standar wajib <strong style="color:#22c55e;">TLS 1.3</strong>, dan seluruh data tersimpan (database PostgreSQL, WAL log, dan object bucket MinIO S3) dienkripsi menggunakan <strong style="color:#22c55e;">AES-256-GCM</strong>.</p>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">3. Gateway Layanan & Sub-prosesor Pihak Ketiga</h3>',
              '<p>Kami menghubungkan platform dengan gateway mikroservis aman: (a) <em>Notification Gateway (:5001)</em> untuk pengiriman WhatsApp/SMS; (b) <em>Payment Gateway (:5002)</em> integrasi pembayaran PCI-DSS (Xendit); (c) <em>Map Gateway (:5003)</em> untuk peta vektor dan geocoding; serta (d) <em>Storage Gateway (:5004)</em> untuk penyimpanan aset berkas S3 MinIO.</p>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">4. Penggunaan Cookie & Sesi</h3>',
              '<p>Platform hanya menggunakan cookie HttpOnly dan token Bearer JWT yang mutlak diperlukan untuk otentikasi sesi Keycloak. Kami tidak memasang pelacak iklan pihak ketiga atau piksel pemasaran.</p>',
              '<h3 style="color:#fff;font-size:14px;font-weight:700;margin:18px 0 8px 0;">5. Hak Pengguna & Kontak Perlindungan Data (DPO)</h3>',
              '<p>Anda berhak mengakses, memperbaiki, mengekspor (GeoJSON/CSV), dan meminta penghapusan permanen akun Anda sesuai ketentuan UU PDP. Hubungi Petugas Perlindungan Data kami melalui <code style="color:#38bdf8;background:#18181b;padding:2px 6px;border-radius:4px;">dpo@k2net.id</code>.</p>'
            ].join('')
          }
        };

        // ─── 3. Instant Client-Side i18n Translation Engine ─────────────────
        var isSystem = ${isSystem?then('true', 'false')};
        var planName = "${plan}";
        var orgName = "${orgName?js_string}";
        var currentLang = "en";
        var currentModalTab = "terms";

        var dictionary = {
          en: {
            systemDocs: "System Docs",
            welcomeBack: "Welcome back",
            welcomeSubtitle: isSystem ? "Sign in to your system administrator account." : "Sign in to your ISP workspace account.",
            identitySubtitle: isSystem ? "Master IAM & Platform Operations" : "ISP Workspace & Operations",
            accountEmailLabel: "ACCOUNT EMAIL OR USERNAME",
            requiredTag: "Required",
            passwordLabel: "PASSWORD",
            forgotPassword: "Forgot password?",
            rememberMe: "Remember me on this browser",
            submitButton: isSystem ? "Sign In to Platform Admin" : "Continue to ISP Workspace",
            accessModeTag: isSystem ? "ACCESS MODE" : (planName === "ENTERPRISE" ? "ENTERPRISE IAM" : (planName === "PRO" ? "LOGIN METHODS" : "LOGIN METHOD")),
            tierGuidanceTitle: isSystem ? "MASTER IAM & MFA" : (planName === "ENTERPRISE" ? "SAML IdP & MFA" : (planName === "PRO" ? "PASSWORD + GOOGLE SSO" : "EMAIL + PASSWORD")),
            tierGuidanceBody: isSystem ? "System-level authentication protected by Keycloak IAM Master Realm and mandatory MFA enforcement."
              : (planName === "ENTERPRISE" ? "Direct enterprise Identity Provider integration (Okta, Azure AD, SAML 2.0) with enforced MFA."
              : (planName === "PRO" ? "Direct password login or Google Workspace Single Sign-On available."
              : "Self-service password authentication. Google Workspace SSO & SAML IdP available on Pro & Enterprise plans.")),
            securityNoticeSystem: "Master platform isolated access. All authentication attempts are cryptographically audited per K2NET compliance standards.",
            securityNoticeTenant: "Multi-tenant isolated access. All authentication attempts are cryptographically audited per K2NET ISP compliance standards.",
            byContinuing: "By continuing, you agree to FTTH GIS's",
            termsOfService: "Terms of Service",
            and: "and",
            privacyPolicy: "Privacy Policy",
            allRightsReserved: "All rights reserved.",
            acknowledgeBtn: "I Understand & Close",
            usernamePlaceholder: isSystem ? "e.g. admin@isp.net or admin.username" : "e.g. user@" + orgName.toLowerCase().replace(/[^a-z0-9]/g, '') + ".com"
          },
          id: {
            systemDocs: "Dokumentasi Sistem",
            welcomeBack: "Selamat Datang",
            welcomeSubtitle: isSystem ? "Masuk ke akun administrator sistem Anda." : "Masuk ke akun workspace ISP Anda.",
            identitySubtitle: isSystem ? "Master IAM & Operasi Platform" : "Workspace ISP & Operasional",
            accountEmailLabel: "EMAIL AKUN ATAU USERNAME",
            requiredTag: "Wajib",
            passwordLabel: "KATA SANDI",
            forgotPassword: "Lupa kata sandi?",
            rememberMe: "Ingat saya di browser ini",
            submitButton: isSystem ? "Masuk ke Platform Admin" : "Lanjutkan ke Workspace ISP",
            accessModeTag: isSystem ? "MODE AKSES" : (planName === "ENTERPRISE" ? "ENTERPRISE IAM" : (planName === "PRO" ? "METODE LOGIN" : "METODE LOGIN")),
            tierGuidanceTitle: isSystem ? "MASTER IAM & MFA" : (planName === "ENTERPRISE" ? "SAML IdP & MFA" : (planName === "PRO" ? "PASSWORD + GOOGLE SSO" : "EMAIL + PASSWORD")),
            tierGuidanceBody: isSystem ? "Autentikasi tingkat sistem dengan proteksi Keycloak IAM Master Realm dan penegakan MFA wajib."
              : (planName === "ENTERPRISE" ? "Integrasi langsung Identity Provider perusahaan (Okta, Azure AD, SAML 2.0) dengan penegakan MFA wajib."
              : (planName === "PRO" ? "Tersedia login menggunakan kredensial password langsung atau Single Sign-On Google Workspace."
              : "Otentikasi mandiri berbasis password. Opsi Google Workspace SSO & SAML IdP aktif pada paket Pro & Enterprise.")),
            securityNoticeSystem: "Akses terisolasi platform master. Seluruh aktivitas login dipantau dan diaudit secara kriptografis sesuai standar kepatuhan K2NET.",
            securityNoticeTenant: "Akses terisolasi multi-tenant. Seluruh aktivitas login dipantau dan diaudit secara kriptografis sesuai standar kepatuhan ISP K2NET.",
            byContinuing: "Dengan melanjutkan, Anda menyetujui",
            termsOfService: "Ketentuan Layanan",
            and: "dan",
            privacyPolicy: "Kebijakan Privasi",
            allRightsReserved: "Hak cipta dilindungi undang-undang.",
            acknowledgeBtn: "Saya Mengerti & Tutup",
            usernamePlaceholder: isSystem ? "contoh: admin@isp.net atau admin.username" : "contoh: user@" + orgName.toLowerCase().replace(/[^a-z0-9]/g, '') + ".com"
          }
        };

        function renderPolicyModalContent() {
          var docs = legalDocs[currentLang] || legalDocs.en;
          var titleEl = document.getElementById('ftth-modal-title');
          var bodyEl = document.getElementById('ftth-policy-content-body');
          var tabTermsBtn = document.getElementById('tab-btn-terms');
          var tabPrivacyBtn = document.getElementById('tab-btn-privacy');

          if (currentModalTab === "terms") {
            if (titleEl) titleEl.textContent = docs.termsTitle;
            if (bodyEl) bodyEl.innerHTML = docs.termsHtml;
            if (tabTermsBtn) {
              tabTermsBtn.style.background = '#22c55e';
              tabTermsBtn.style.color = '#09090b';
            }
            if (tabPrivacyBtn) {
              tabPrivacyBtn.style.background = 'transparent';
              tabPrivacyBtn.style.color = '#a1a1aa';
            }
          } else {
            if (titleEl) titleEl.textContent = docs.privacyTitle;
            if (bodyEl) bodyEl.innerHTML = docs.privacyHtml;
            if (tabTermsBtn) {
              tabTermsBtn.style.background = 'transparent';
              tabTermsBtn.style.color = '#a1a1aa';
            }
            if (tabPrivacyBtn) {
              tabPrivacyBtn.style.background = '#38bdf8';
              tabPrivacyBtn.style.color = '#09090b';
            }
          }
        }

        function openPolicyModal(tab) {
          currentModalTab = tab || "terms";
          renderPolicyModalContent();
          var modal = document.getElementById('ftth-policy-modal');
          if (modal) {
            modal.style.display = 'flex';
          }
        }

        function closePolicyModal() {
          var modal = document.getElementById('ftth-policy-modal');
          if (modal) {
            modal.style.display = 'none';
          }
        }

        function applyLanguage(lang) {
          currentLang = lang;
          var dict = dictionary[lang] || dictionary.en;
          document.querySelectorAll('[data-i18n]').forEach(function(el) {
            var key = el.getAttribute('data-i18n');
            if (dict[key]) {
              el.textContent = dict[key];
            }
          });

          var usernameInput = document.getElementById('username');
          if (usernameInput && dict.usernamePlaceholder) {
            usernameInput.setAttribute('placeholder', dict.usernamePlaceholder);
          }

          var btns = document.querySelectorAll('.ftth-locale-btn');
          btns.forEach(function(btn) {
            if (btn.getAttribute('data-lang') === lang) {
              btn.style.background = '#22c55e';
              btn.style.color = '#09090b';
              btn.classList.add('active');
            } else {
              btn.style.background = 'transparent';
              btn.style.color = '#a1a1aa';
              btn.classList.remove('active');
            }
          });

          renderPolicyModalContent();

          localStorage.setItem('k2net_login_lang', lang);
          document.documentElement.setAttribute('lang', lang);
        }

        // Bind instant button clicks for language switcher
        var switcher = document.getElementById('k2net-lang-switcher');
        if (switcher) {
          switcher.addEventListener('click', function(e) {
            var btn = e.target.closest('.ftth-locale-btn');
            if (btn) {
              e.preventDefault();
              var targetLang = btn.getAttribute('data-lang');
              applyLanguage(targetLang);
            }
          });
        }

        // Bind Policy Modal triggers
        var btnTerms = document.getElementById('btn-open-terms');
        if (btnTerms) {
          btnTerms.addEventListener('click', function(e) {
            e.preventDefault();
            openPolicyModal('terms');
          });
        }

        var btnPrivacy = document.getElementById('btn-open-privacy');
        if (btnPrivacy) {
          btnPrivacy.addEventListener('click', function(e) {
            e.preventDefault();
            openPolicyModal('privacy');
          });
        }

        var btnCloseModal = document.getElementById('btn-close-policy-modal');
        if (btnCloseModal) {
          btnCloseModal.addEventListener('click', closePolicyModal);
        }

        var btnAcknowledge = document.getElementById('btn-policy-acknowledge');
        if (btnAcknowledge) {
          btnAcknowledge.addEventListener('click', closePolicyModal);
        }

        var tabBtnTerms = document.getElementById('tab-btn-terms');
        if (tabBtnTerms) {
          tabBtnTerms.addEventListener('click', function(e) {
            e.preventDefault();
            currentModalTab = 'terms';
            renderPolicyModalContent();
          });
        }

        var tabBtnPrivacy = document.getElementById('tab-btn-privacy');
        if (tabBtnPrivacy) {
          tabBtnPrivacy.addEventListener('click', function(e) {
            e.preventDefault();
            currentModalTab = 'privacy';
            renderPolicyModalContent();
          });
        }

        // Close on clicking backdrop
        var modalEl = document.getElementById('ftth-policy-modal');
        if (modalEl) {
          modalEl.addEventListener('click', function(e) {
            if (e.target === modalEl) {
              closePolicyModal();
            }
          });
        }

        // Close on Escape key
        window.addEventListener('keydown', function(e) {
          if (e.key === 'Escape' || e.key === 'Esc') {
            closePolicyModal();
          }
        });

        // Initialize saved language preference
        var savedLang = localStorage.getItem('k2net_login_lang');
        if (!savedLang) {
          var navLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
          savedLang = navLang.startsWith('id') ? 'id' : 'en';
        }
        applyLanguage(savedLang);

      })();
    </script>

    </#if>
</@layout.registrationLayout>
