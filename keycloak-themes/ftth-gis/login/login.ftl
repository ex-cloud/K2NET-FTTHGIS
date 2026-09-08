<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "header">
        ${msg("loginAccountTitle")}
    <#elseif section = "form">

    <#-- Context variables detection -->
    <#assign isSystem = (realm.name == "ftth-realm" || realm.name == "master" || ((realm.attributes.isSystem)!'') == 'true')>
    <#assign rawOrgName = (realm.displayName)!((realm.attributes.orgName)!realm.name)>
    <#assign orgName = (rawOrgName?has_content && rawOrgName != realm.name)?then(rawOrgName, isSystem?then('FTTH GIS Platform', rawOrgName))>
    <#assign plan = ((realm.attributes.plan)!'FREE')?upper_case>
    <#assign planDisplayName = ((realm.attributes.planDisplayName)!(isSystem?then('System Admin', (plan == 'PRO')?then('Professional', (plan == 'ENTERPRISE')?then('Enterprise Core', 'Starter Trial')))))>
    <#assign logoUrl = ((realm.attributes.logoUrl)!'')>

    <!-- ============================================================
         FTTH GIS — Unified 1-Step Split-Screen Login
         ============================================================ -->
    <div class="ftth-login-container" style="display:flex;min-height:100vh;width:100%;font-family:'Inter',sans-serif;">

      <!-- LEFT COLUMN -->
      <div id="ftth-left">

        <!-- Header -->
        <div id="ftth-header">
          <div id="ftth-logo">
            <div id="ftth-logo-icon" class="${isSystem?then('is-system', 'is-tenant')}">
              <#if logoUrl?has_content>
                <img src="${logoUrl}" alt="${orgName}" style="width:16px;height:16px;object-fit:contain;border-radius:2px;" />
              <#elseif isSystem>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              <#else>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
                  <path d="M9 22v-4h6v4"/>
                  <path d="M8 6h.01"/>
                  <path d="M16 6h.01"/>
                  <path d="M8 10h.01"/>
                  <path d="M16 10h.01"/>
                  <path d="M8 14h.01"/>
                  <path d="M16 14h.01"/>
                </svg>
              </#if>
            </div>
            <div style="display:flex;flex-direction:column;gap:2px;">
              <span id="ftth-logo-text">${isSystem?then('FTTH GIS PLATFORM', orgName)}</span>
              <#if !isSystem>
                <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--zinc-500);letter-spacing:0.05em;">FTTH GEOSPATIAL WORKSPACE</span>
              </#if>
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:8px;">
            <!-- Subscription Plan Badge -->
            <#if isSystem>
              <span class="ftth-tier-badge ftth-badge-system">
                <span class="ftth-badge-dot"></span>
                SYSTEM ADMIN
              </span>
            <#elseif plan == "ENTERPRISE">
              <span class="ftth-tier-badge ftth-badge-enterprise">
                <span class="ftth-badge-dot"></span>
                ENTERPRISE CORE
              </span>
            <#elseif plan == "PRO">
              <span class="ftth-tier-badge ftth-badge-pro">
                <span class="ftth-badge-dot"></span>
                PROFESSIONAL
              </span>
            <#else>
              <span class="ftth-tier-badge ftth-badge-free">
                <span class="ftth-badge-dot"></span>
                STARTER TRIAL
              </span>
            </#if>

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

            <a id="ftth-docs-link" href="https://system-gis.kdua.net/gateways/overview" target="_blank" title="System Documentation">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              <span>Docs</span>
            </a>
          </div>
        </div>

        <!-- Center Form Area -->
        <div id="ftth-form-area">

          <!-- Welcome text -->
          <div id="ftth-welcome">
            <#if isSystem>
              <h1>${msg("doLogIn")} • Platform Admin</h1>
              <p>Master IAM & Platform Operations with elevated security audit.</p>
            <#else>
              <h1>${msg("doLogIn")} • ${orgName}</h1>
              <p>Access fiber routes, optical distribution points, and subscriber telemetry.</p>
            </#if>
          </div>

          <!-- Card -->
          <div id="ftth-card">

            <#-- Error message -->
            <#if messagesPerField.existsError('username','password')>
              <div class="ftth-alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}</span>
              </div>
            <#elseif message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
              <div class="${(message.type == 'error')?then('ftth-alert-error', 'ftth-alert-info')}">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <#if message.type == 'error'>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  <#else>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
                  </#if>
                </svg>
                <span>${kcSanitize(message.summary)?no_esc}</span>
              </div>
            </#if>

            <#-- Social SSO Buttons (Google, GitHub, SAML, Okta) if enabled for realm -->
            <#if realm.password && social.providers?? && social.providers?has_content>
              <div class="ftth-social-providers">
                <#list social.providers as p>
                  <a id="social-${p.alias}" class="ftth-sso-btn ftth-sso-${p.alias}" href="${p.loginUrl}">
                    <#if p.alias == "google">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                      </svg>
                    <#elseif p.alias == "github">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                      </svg>
                    <#else>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                      </svg>
                    </#if>
                    <span>Continue with ${p.displayName}</span>
                  </a>
                </#list>
              </div>

              <div class="ftth-divider">
                <span>${msg("orContinueWith")}</span>
              </div>
            </#if>

            <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">

              <!-- Username / Email field -->
              <div class="form-group">
                <label for="username">
                  <#if !realm.loginWithEmailAllowed>
                    ${msg("username")}
                  <#elseif !realm.registrationEmailAsUsername>
                    ${msg("usernameOrEmail")}
                  <#else>
                    ${msg("email")}
                  </#if>
                </label>
                <input tabindex="1" id="username" name="username" type="text"
                  placeholder="${isSystem?then('admin.user or admin@kdua.net', 'admin@' + (realm.name) + '.com')}"
                  value="${(login.username!'')}"
                  autofocus autocomplete="username"
                  aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>">
              </div>

              <!-- Password field -->
              <div class="form-group">
                <div class="ftth-pw-header">
                  <label for="password">${msg("password")}</label>
                  <#if realm.resetPasswordAllowed>
                    <a tabindex="5" href="${url.loginResetCredentialsUrl}">
                      ${msg("doForgotPassword")}
                    </a>
                  </#if>
                </div>
                <input tabindex="2" id="password" name="password" type="password"
                  placeholder="••••••••••••"
                  autocomplete="current-password"
                  aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>">
              </div>

              <!-- Remember me -->
              <#if realm.rememberMe && !usernameEditDisabled??>
                <div class="ftth-remember">
                  <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox"
                    <#if login.rememberMe??>checked</#if>>
                  <label for="rememberMe">${msg("rememberMe")}</label>
                </div>
              </#if>

              <!-- Hidden fields -->
              <input type="hidden" id="id-hidden-input" name="credentialId"
                <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>>

              <!-- Submit button -->
              <button tabindex="4" id="kc-login" name="login" type="submit">
                <span>${isSystem?then('Sign In to Platform Admin', 'Sign In to Workspace')}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>

              <#if auth?has_content && auth.showTryAnotherWayLink()>
                <div style="margin-top:14px;text-align:center;">
                  <a href="${url.loginAction}" id="try-another-way" style="font-size:11px;color:var(--zinc-400);text-decoration:none;">
                    ${msg("doTryAnotherWay")}
                  </a>
                </div>
              </#if>

            </form>

          </div><!-- /#ftth-card -->

          <!-- Security notice -->
          <div id="ftth-security-notice" class="${isSystem?then('notice-system', 'notice-tenant')}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <#if isSystem>
              <span>Authorized administrator access only. All actions are logged and audited in accordance with SOC2 & ISO27001 standards.</span>
            <#else>
              <span>Tenant-isolated cryptographic session. End-to-end multi-tenant governance with zero cross-tenant leakage.</span>
            </#if>
          </div>

        </div><!-- /#ftth-form-area -->

        <!-- Footer -->
        <div id="ftth-footer">
          <p>
            By continuing, you agree to FTTH GIS&#39;s
            <a href="#">Terms of Service</a>
            and
            <a href="#">Privacy Policy</a>.
          </p>
          <p class="copyright">&#169; 2026 K2NET Enterprise SaaS Platform. All rights reserved.</p>
        </div>

      </div><!-- /#ftth-left -->

      <!-- RIGHT COLUMN -->
      <div id="ftth-right">
        <div id="ftth-dot-grid"></div>

        <div id="ftth-testimonial">
          <svg id="ftth-quote-icon" width="32" height="32" style="width:32px;height:32px;max-width:32px;max-height:32px;flex-shrink:0;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
          </svg>

          <#if isSystem>
            <blockquote id="ftth-blockquote">
              &#8220;Managing enterprise fiber-to-the-home geodata networks has never been this seamless. Highly stable, fast geocoding, and fully isolated multi-tenancy.&#8221;
            </blockquote>

            <div id="ftth-author">
              <div id="ftth-avatar">A</div>
              <div>
                <div id="ftth-author-name">Andiansyah</div>
                <div id="ftth-author-title">Chief Technology Officer, K2NET</div>
              </div>
            </div>
          <#else>
            <blockquote id="ftth-blockquote">
              &#8220;From fiber distribution to optical power level diagnostics, managing our ISP footprint and field operations has never been this effortless.&#8221;
            </blockquote>

            <div id="ftth-author">
              <div id="ftth-avatar">ISP</div>
              <div>
                <div id="ftth-author-name">${orgName} Operations</div>
                <div id="ftth-author-title">Network Infrastructure Team • ${planDisplayName}</div>
              </div>
            </div>
          </#if>
        </div>
      </div><!-- /#ftth-right -->

    </div><!-- split-screen wrapper -->

    </#if>
</@layout.registrationLayout>
