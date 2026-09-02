<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "header">
        ${msg("loginAccountTitle")}
    <#elseif section = "form">

    <!-- ============================================================
         FTTH GIS — Split-Screen Login Layout
         ============================================================ -->
    <div style="display:flex;min-height:100vh;width:100%;font-family:'Inter',sans-serif;">

      <!-- LEFT COLUMN -->
      <div id="ftth-left">

        <!-- Header -->
        <div id="ftth-header">
          <div id="ftth-logo">
            <div id="ftth-logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <span id="ftth-logo-text">FTTH GIS Portal</span>
          </div>
          <a id="ftth-docs-link" href="https://system-gis.kdua.net/gateways/overview" target="_blank">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            System Docs
          </a>
        </div>

        <!-- Center Form Area -->
        <div id="ftth-form-area">

          <!-- Welcome text -->
          <div id="ftth-welcome">
            <h1>Welcome back</h1>
            <p>Sign in to your system administrator account.</p>
          </div>

          <!-- Card -->
          <div id="ftth-card">

            <#if messagesPerField.existsError('username','password')>
              <div style="display:flex;align-items:flex-start;gap:10px;border-radius:8px;border:1px solid rgba(239,68,68,0.3);background:rgba(239,68,68,0.1);padding:12px;font-size:12px;color:#f87171;margin-bottom:16px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px;">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}</span>
              </div>
            </#if>

            <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">

              <!-- Username field -->
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
                  placeholder="admin.user or admin@example.com"
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
                  placeholder="••••••••"
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
              <input tabindex="4" id="kc-login" name="login" type="submit" value="${msg("doLogIn")}"/>

            </form>

          </div><!-- /#ftth-card -->

          <!-- Security notice -->
          <div id="ftth-security-notice">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Authorized access only. All actions are logged and audited in accordance with global compliance standards.</span>
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
          <p class="copyright">&#169; 2026 K2NET Enterprise SaaS Platform.</p>
        </div>

      </div><!-- /#ftth-left -->

      <!-- RIGHT COLUMN -->
      <div id="ftth-right">
        <div id="ftth-dot-grid"></div>

        <div id="ftth-testimonial">
          <!-- Quote icon (rotated 180deg via CSS) -->
          <svg id="ftth-quote-icon" width="32" height="32" style="width:32px;height:32px;max-width:32px;max-height:32px;flex-shrink:0;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
          </svg>

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
        </div>
      </div><!-- /#ftth-right -->

    </div><!-- split-screen wrapper -->

    </#if>
</@layout.registrationLayout>
