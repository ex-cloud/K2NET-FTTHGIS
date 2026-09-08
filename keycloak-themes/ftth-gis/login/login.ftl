<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "header">
        ${msg("loginAccountTitle")}
    <#elseif section = "form">

    <#-- Context variables detection -->
    <#assign isSystem = (realm.name == "ftth-realm" || realm.name == "master" || ((realm.attributes.isSystem)!'') == 'true')>
    <#assign rawOrgName = (realm.displayName)!((realm.attributes.orgName)!realm.name)>
    <#assign orgName = (rawOrgName?has_content && rawOrgName != realm.name)?then(rawOrgName, isSystem?then('K2NET Platform Admin', rawOrgName))>
    <#assign plan = ((realm.attributes.plan)!'FREE')?upper_case>
    <#assign planDisplayName = ((realm.attributes.planDisplayName)!(isSystem?then('SYSTEM ADMIN', (plan == 'PRO')?then('PROFESSIONAL', (plan == 'ENTERPRISE')?then('ENTERPRISE CORE', 'STARTER TRIAL')))))>
    <#assign logoUrl = ((realm.attributes.logoUrl)!'')>

    <!-- ============================================================
         FTTH GIS — 100% Identical React Split-Screen Interactive Login Page
         ============================================================ -->
    <div class="ftth-login-container" style="display:flex;min-height:100vh;width:100%;font-family:'Inter',sans-serif;background:#09090b;color:#f4f4f5;">

      <!-- ─── LEFT COLUMN: Login Form & Header ─────────────────────────── -->
      <div id="ftth-left" style="width:100%;max-width:44%;min-height:100vh;background:#09090b;display:flex;flex-direction:column;justify-content:space-between;padding:36px 48px;position:relative;border-right:1px solid rgba(39,39,42,0.8);z-index:10;">

        <!-- Top Header Row (Logo + Docs + Theme Toggle) -->
        <div id="ftth-header" style="display:flex;align-items:center;justify-content:space-between;width:100%;z-index:20;">
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
              <span>System Docs</span>
            </a>

            <!-- Language Selector (i18n) -->
            <#if realm.internationalizationEnabled?? && realm.internationalizationEnabled && locale.supported?? && (locale.supported?size gt 1)>
              <div class="ftth-locale-selector">
                <#list locale.supported as l>
                  <a href="${l.url}" class="ftth-locale-btn ${(locale.currentLanguageTag == l.languageTag)?then('active', '')}">
                    <#if l.languageTag == "id">ID<#else>EN</#if>
                  </a>
                </#list>
              </div>
            </#if>
          </div>
        </div>

        <!-- Center Form Area -->
        <div id="ftth-form-area" style="width:100%;max-width:390px;margin:auto;padding:24px 0;z-index:20;">

          <!-- Welcome text (Exact match with React) -->
          <div id="ftth-welcome" style="margin-bottom:20px;">
            <h1 style="font-size:26px;font-weight:700;letter-spacing:-0.025em;color:#fafafa;margin-bottom:4px;">
              Welcome back
            </h1>
            <p style="font-size:13px;color:#a1a1aa;line-height:1.4;">
              ${isSystem?then('Sign in to your system administrator account.', 'Sign in to your ISP workspace account.')}
            </p>
          </div>

          <!-- Main Login Card (Matching AuthLoginForm.tsx) -->
          <div style="background:rgba(24,24,27,0.6);border:1px solid rgba(63,63,70,0.7);border-radius:16px;padding:20px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);backdrop-filter:blur(12px);">

            <!-- Tenant / Platform Identity Header Row -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid rgba(63,63,70,0.5);margin-bottom:16px;">
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
                  <div style="font-size:10px;color:#a1a1aa;font-family:'JetBrains Mono',monospace;">
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
            <#if messagesPerField.existsError('username','password')>
              <div class="ftth-alert-error" style="margin-bottom:14px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}</span>
              </div>
            </#if>

            <#-- Alert/Info from Keycloak -->
            <#if message?has_content && message.type != 'warning' && !messagesPerField.existsError('username','password')>
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
            <#if !isSystem && realm.password && social.providers?? && social.providers?has_content>
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
              <div class="form-group" style="margin-bottom:14px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                  <label for="username" style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a1a1aa;margin:0;">
                    ACCOUNT EMAIL OR USERNAME
                  </label>
                  <span style="font-size:9px;font-family:'JetBrains Mono',monospace;color:#22c55e;">Required</span>
                </div>
                <div style="position:relative;">
                  <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#71717a;pointer-events:none;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  <input tabindex="1" id="username" name="username" type="text"
                    placeholder="${isSystem?then('e.g. admin@isp.net or admin.username', 'e.g. user@' + (realm.name) + '.com')}"
                    value="${(login.username!'')}"
                    autofocus autocomplete="username"
                    style="width:100%;height:40px;border-radius:8px;border:1px solid rgba(63,63,70,0.6);background:rgba(9,9,11,0.6);padding:0 12px 0 34px;font-size:13px;color:#fff;outline:none;"
                    aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>">
                </div>
              </div>

              <!-- Password field -->
              <div class="form-group" style="margin-bottom:14px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                  <label for="password" style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a1a1aa;margin:0;">
                    PASSWORD
                  </label>
                  <#if realm.resetPasswordAllowed>
                    <a tabindex="5" href="${url.loginResetCredentialsUrl}" style="font-size:11px;font-weight:500;color:#22c55e;text-decoration:none;">
                      ${msg("doForgotPassword")}
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
                    style="width:100%;height:40px;border-radius:8px;border:1px solid rgba(63,63,70,0.6);background:rgba(9,9,11,0.6);padding:0 12px 0 34px;font-size:13px;color:#fff;outline:none;"
                    aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>">
                </div>
              </div>

              <!-- Remember me -->
              <#if realm.rememberMe && !usernameEditDisabled??>
                <div class="ftth-remember" style="margin-bottom:16px;">
                  <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox"
                    <#if login.rememberMe??>checked</#if>>
                  <label for="rememberMe">${msg("rememberMe")}</label>
                </div>
              </#if>

              <!-- Hidden fields -->
              <input type="hidden" id="id-hidden-input" name="credentialId"
                <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>>

              <!-- Submit button (Emerald primary button matching React) -->
              <button tabindex="4" id="kc-login" name="login" type="submit" style="width:100%;height:42px;border-radius:10px;background:#16a34a;color:#fff;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(22,163,74,0.3);transition:all 0.15s ease;">
                <span>${isSystem?then('Sign In to Platform Admin', 'Continue to ISP Workspace')}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>

            </form>

            <!-- Tier UX Guidance Box (Exact Match with AuthLoginForm.tsx) -->
            <#if isSystem>
              <div style="margin-top:14px;border-radius:10px;border:1px solid rgba(245,158,11,0.25);background:rgba(245,158,11,0.06);padding:10px 12px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">
                  <span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:#fbbf24;display:flex;align-items:center;gap:4px;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    ACCESS MODE
                  </span>
                  <span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:#fbbf24;">MASTER IAM & MFA</span>
                </div>
                <p style="font-size:10px;color:#a1a1aa;margin:0;line-height:1.4;">
                  Autentikasi tingkat sistem dengan proteksi Keycloak IAM Master Realm dan penegakan MFA wajib.
                </p>
              </div>
            <#elseif plan == "ENTERPRISE">
              <div style="margin-top:14px;border-radius:10px;border:1px solid rgba(168,85,247,0.25);background:rgba(168,85,247,0.06);padding:10px 12px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">
                  <span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:#c084fc;display:flex;align-items:center;gap:4px;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    ENTERPRISE IAM
                  </span>
                  <span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:#c084fc;">SAML IdP & MFA</span>
                </div>
                <p style="font-size:10px;color:#a1a1aa;margin:0;line-height:1.4;">
                  Integrasi langsung Identity Provider perusahaan (Okta, Azure AD, SAML 2.0) dengan penegakan MFA wajib.
                </p>
              </div>
            <#elseif plan == "PRO">
              <div style="margin-top:14px;border-radius:10px;border:1px solid rgba(14,165,233,0.25);background:rgba(14,165,233,0.06);padding:10px 12px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">
                  <span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:#38bdf8;display:flex;align-items:center;gap:4px;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                    </svg>
                    LOGIN METHODS
                  </span>
                  <span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:#38bdf8;">PASSWORD + GOOGLE SSO</span>
                </div>
                <p style="font-size:10px;color:#a1a1aa;margin:0;line-height:1.4;">
                  Tersedia login menggunakan kredensial password langsung atau Single Sign-On Google Workspace.
                </p>
              </div>
            <#else>
              <div style="margin-top:14px;border-radius:10px;border:1px solid rgba(63,63,70,0.7);background:rgba(24,24,27,0.4);padding:10px 12px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">
                  <span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:#a1a1aa;display:flex;align-items:center;gap:4px;">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
                      <circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>
                    </svg>
                    LOGIN METHOD
                  </span>
                  <span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:#22c55e;">EMAIL + PASSWORD</span>
                </div>
                <p style="font-size:10px;color:#a1a1aa;margin:0;line-height:1.4;">
                  Otentikasi mandiri berbasis password. Opsi Google Workspace SSO & SAML IdP aktif pada paket Pro & Enterprise.
                </p>
              </div>
            </#if>

          </div><!-- /#ftth-card -->

          <!-- Security notice (Exact match with React footer alert) -->
          <div id="ftth-security-notice" style="border-radius:12px;border:1px solid rgba(34,197,94,0.25);background:rgba(34,197,94,0.05);padding:12px 14px;display:flex;gap:10px;align-items:flex-start;margin-top:16px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" style="flex-shrink:0;margin-top:1px;">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            <#if isSystem>
              <span style="font-size:11px;color:#a1a1aa;line-height:1.45;">
                Akses terisolasi platform master. Seluruh aktivitas login dipantau dan diaudit secara kriptografis sesuai standar kepatuhan K2NET.
              </span>
            <#else>
              <span style="font-size:11px;color:#a1a1aa;line-height:1.45;">
                Akses terisolasi multi-tenant. Seluruh aktivitas login dipantau dan diaudit secara kriptografis sesuai standar kepatuhan ISP K2NET.
              </span>
            </#if>
          </div>

        </div><!-- /#ftth-form-area -->

        <!-- Bottom Footer Row -->
        <div id="ftth-footer" style="font-size:11px;color:#71717a;border-top:1px solid rgba(39,39,42,0.6);padding-top:14px;">
          <p style="margin-bottom:3px;">
            By continuing, you agree to FTTH GIS&#39;s
            <a href="#" style="color:#a1a1aa;text-decoration:underline;">Terms of Service</a>
            and
            <a href="#" style="color:#a1a1aa;text-decoration:underline;">Privacy Policy</a>.
          </p>
          <p style="font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(113,113,122,0.7);margin:0;">
            &#169; 2026 K2NET Enterprise SaaS Platform. All rights reserved.
          </p>
        </div>

      </div><!-- /#ftth-left -->

      <!-- ─── RIGHT COLUMN: 3D Isometric Interactive Figure & Testimonial ── -->
      <div id="ftth-right" style="flex:1;min-height:100vh;background:#000000;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;padding:40px 56px;">

        <!-- Ambient Center Emerald Glow spot -->
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);width:420px;height:420px;border-radius:50%;background:radial-gradient(circle, rgba(34,197,94,0.14) 0%, rgba(6,182,212,0.06) 45%, transparent 70%);filter:blur(60px);pointer-events:none;"></div>

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

        <!-- Center Interactive 3D Isometric Figure -->
        <div id="isometric-container" style="margin:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 0;z-index:10;width:100%;max-width:440px;cursor:pointer;">
          <svg id="iso-figure-svg" viewBox="0 0 280 240" style="width:100%;height:260px;overflow:visible;" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="apertureMutedGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#27272a" stopOpacity="1" />
                <stop offset="85%" stopColor="#09090b" stopOpacity="1" />
              </radialGradient>
            </defs>

            <!-- Ambient Ground Shadow -->
            <ellipse id="ground-shadow" cx="140" cy="193" rx="72" ry="32" fill="rgba(0,0,0,0.85)" style="filter:blur(12px);transition:transform 0.4s ease;" />

            <!-- 6 Layered Slabs with Hover Lift Transitions -->
            <!-- Slab 0 -->
            <g class="iso-slab" data-index="0" style="transition:transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);">
              <path d="M 97.6 150.3 Q 94.4 148.5 99.4 145.6 L 180.6 98.7 L 180.6 106.2 L 99.4 153.1 Q 94.4 156.0 97.6 157.8 Z" fill="#09090b" stroke="#3f3f46" stroke-opacity="0.6" stroke-width="0.85" />
              <path d="M 180.6 98.7 Q 185.6 95.8 182.4 94.0 L 140.0 69.5 L 140.0 77.0 L 182.4 101.5 Q 185.6 103.3 180.6 106.2 Z" fill="#000000" stroke="#27272a" stroke-opacity="0.45" stroke-width="0.85" />
              <path d="M 140.0 69.5 L 182.4 94.0 Q 185.6 95.8 180.6 98.7 L 140.0 122.2 L 99.4 98.7 Q 94.4 95.8 97.6 94.0 Z" fill="#121215" stroke="#71717a" stroke-opacity="0.85" stroke-width="0.85" />
            </g>

            <!-- Slab 1 -->
            <g class="iso-slab" data-index="1" transform="translate(0, -9.5)" style="transition:transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);">
              <path d="M 97.6 150.3 Q 94.4 148.5 99.4 145.6 L 180.6 98.7 L 180.6 106.2 L 99.4 153.1 Q 94.4 156.0 97.6 157.8 Z" fill="#09090b" stroke="#3f3f46" stroke-opacity="0.6" stroke-width="0.85" />
              <path d="M 180.6 98.7 Q 185.6 95.8 182.4 94.0 L 140.0 69.5 L 140.0 77.0 L 182.4 101.5 Q 185.6 103.3 180.6 106.2 Z" fill="#000000" stroke="#27272a" stroke-opacity="0.45" stroke-width="0.85" />
              <path d="M 140.0 69.5 L 182.4 94.0 Q 185.6 95.8 180.6 98.7 L 140.0 122.2 L 99.4 98.7 Q 94.4 95.8 97.6 94.0 Z" fill="#121215" stroke="#71717a" stroke-opacity="0.85" stroke-width="0.85" />
            </g>

            <!-- Slab 2 -->
            <g class="iso-slab" data-index="2" transform="translate(0, -19)" style="transition:transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);">
              <path d="M 97.6 150.3 Q 94.4 148.5 99.4 145.6 L 180.6 98.7 L 180.6 106.2 L 99.4 153.1 Q 94.4 156.0 97.6 157.8 Z" fill="#09090b" stroke="#3f3f46" stroke-opacity="0.6" stroke-width="0.85" />
              <path d="M 180.6 98.7 Q 185.6 95.8 182.4 94.0 L 140.0 69.5 L 140.0 77.0 L 182.4 101.5 Q 185.6 103.3 180.6 106.2 Z" fill="#000000" stroke="#27272a" stroke-opacity="0.45" stroke-width="0.85" />
              <path d="M 140.0 69.5 L 182.4 94.0 Q 185.6 95.8 180.6 98.7 L 140.0 122.2 L 99.4 98.7 Q 94.4 95.8 97.6 94.0 Z" fill="#121215" stroke="#71717a" stroke-opacity="0.85" stroke-width="0.85" />
            </g>

            <!-- Slab 3 -->
            <g class="iso-slab" data-index="3" transform="translate(0, -28.5)" style="transition:transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);">
              <path d="M 97.6 150.3 Q 94.4 148.5 99.4 145.6 L 180.6 98.7 L 180.6 106.2 L 99.4 153.1 Q 94.4 156.0 97.6 157.8 Z" fill="#09090b" stroke="#3f3f46" stroke-opacity="0.6" stroke-width="0.85" />
              <path d="M 180.6 98.7 Q 185.6 95.8 182.4 94.0 L 140.0 69.5 L 140.0 77.0 L 182.4 101.5 Q 185.6 103.3 180.6 106.2 Z" fill="#000000" stroke="#27272a" stroke-opacity="0.45" stroke-width="0.85" />
              <path d="M 140.0 69.5 L 182.4 94.0 Q 185.6 95.8 180.6 98.7 L 140.0 122.2 L 99.4 98.7 Q 94.4 95.8 97.6 94.0 Z" fill="#121215" stroke="#71717a" stroke-opacity="0.85" stroke-width="0.85" />
            </g>

            <!-- Slab 4 -->
            <g class="iso-slab" data-index="4" transform="translate(0, -38)" style="transition:transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);">
              <path d="M 97.6 150.3 Q 94.4 148.5 99.4 145.6 L 180.6 98.7 L 180.6 106.2 L 99.4 153.1 Q 94.4 156.0 97.6 157.8 Z" fill="#09090b" stroke="#3f3f46" stroke-opacity="0.6" stroke-width="0.85" />
              <path d="M 180.6 98.7 Q 185.6 95.8 182.4 94.0 L 140.0 69.5 L 140.0 77.0 L 182.4 101.5 Q 185.6 103.3 180.6 106.2 Z" fill="#000000" stroke="#27272a" stroke-opacity="0.45" stroke-width="0.85" />
              <path d="M 140.0 69.5 L 182.4 94.0 Q 185.6 95.8 180.6 98.7 L 140.0 122.2 L 99.4 98.7 Q 94.4 95.8 97.6 94.0 Z" fill="#121215" stroke="#71717a" stroke-opacity="0.85" stroke-width="0.85" />
            </g>

            <!-- Slab 5 (Top Slab with Center Aperture & Specular Edge) -->
            <g class="iso-slab" data-index="5" transform="translate(0, -47.5)" style="transition:transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);">
              <path d="M 97.6 150.3 Q 94.4 148.5 99.4 145.6 L 180.6 98.7 L 180.6 106.2 L 99.4 153.1 Q 94.4 156.0 97.6 157.8 Z" fill="#09090b" stroke="#3f3f46" stroke-opacity="0.6" stroke-width="0.85" />
              <path d="M 180.6 98.7 Q 185.6 95.8 182.4 94.0 L 140.0 69.5 L 140.0 77.0 L 182.4 101.5 Q 185.6 103.3 180.6 106.2 Z" fill="#000000" stroke="#27272a" stroke-opacity="0.45" stroke-width="0.85" />
              <path d="M 140.0 69.5 L 182.4 94.0 Q 185.6 95.8 180.6 98.7 L 140.0 122.2 L 99.4 98.7 Q 94.4 95.8 97.6 94.0 Z" fill="#121215" stroke="#a1a1aa" stroke-opacity="0.9" stroke-width="1.1" />

              <!-- Aperture Rim Cavity -->
              <ellipse cx="140" cy="95.5" rx="28.1" ry="16.2" fill="url(#apertureMutedGlow)" stroke="#a1a1aa" stroke-opacity="0.9" stroke-width="1.1" />

              <!-- Aperture Chords -->
              <line x1="120" y1="87.5" x2="160" y2="87.5" stroke="#71717a" stroke-opacity="0.5" stroke-width="0.75" />
              <line x1="114" y1="91.5" x2="166" y2="91.5" stroke="#71717a" stroke-opacity="0.5" stroke-width="0.75" />
              <line x1="112" y1="95.5" x2="168" y2="95.5" stroke="#71717a" stroke-opacity="0.5" stroke-width="0.75" />
              <line x1="114" y1="99.5" x2="166" y2="99.5" stroke="#71717a" stroke-opacity="0.5" stroke-width="0.75" />
              <line x1="120" y1="103.5" x2="160" y2="103.5" stroke="#71717a" stroke-opacity="0.5" stroke-width="0.75" />
            </g>
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
              <blockquote style="font-size:13px;font-weight:400;color:rgba(244,244,245,0.9);line-height:1.6;margin-bottom:16px;font-style:normal;">
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
              <blockquote style="font-size:13px;font-weight:400;color:rgba(244,244,245,0.9);line-height:1.6;margin-bottom:16px;font-style:normal;">
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

    <!-- Interactive 3D Slabs Parallax Lift Script (Vanilla JS matching React GSAP) -->
    <script>
      (function() {
        var container = document.getElementById('isometric-container');
        var svg = document.getElementById('iso-figure-svg');
        var slabs = document.querySelectorAll('.iso-slab');
        var baseOffsets = [0, -9.5, -19, -28.5, -38, -47.5];

        if (container && slabs.length > 0) {
          container.addEventListener('mousemove', function(e) {
            var rect = container.getBoundingClientRect();
            var svgX = ((e.clientX - rect.left) / rect.width) * 280;
            var svgY = ((e.clientY - rect.top) / rect.height) * 240;

            var dx = svgX - 140;
            var dy = svgY - 148;

            var nx = Math.max(-1, Math.min(1, dx / 55));
            var ny = Math.max(-1, Math.min(1, dy / 50));

            var liftIntensity = Math.max(0.4, 1.2 - ny * 1.1);

            slabs.forEach(function(slab, idx) {
              var targetY = baseOffsets[idx] - (idx * (6.5 * liftIntensity)) - (idx === 5 ? 8 : 0);
              var targetX = nx * (idx * 2.5);
              slab.style.transform = 'translate(' + targetX.toFixed(1) + 'px, ' + targetY.toFixed(1) + 'px)';
            });
          });

          container.addEventListener('mouseleave', function() {
            slabs.forEach(function(slab, idx) {
              slab.style.transform = 'translate(0px, ' + baseOffsets[idx] + 'px)';
            });
          });
        }
      })();
    </script>

    </#if>
</@layout.registrationLayout>
