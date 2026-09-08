<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true displayMessage=!messagesPerField.existsError('password','password-confirm'); section>
    <#if section = "header">
        ${msg("updatePasswordTitle")}
    <#elseif section = "form">

    <#-- Context variables detection -->
    <#assign isSystem = (realm.name == "ftth-realm" || realm.name == "master" || ((realm.attributes.isSystem)!'') == 'true')>
    <#assign rawOrgName = (realm.displayName)!((realm.attributes.orgName)!realm.name)>
    <#assign orgName = (rawOrgName?has_content && rawOrgName != realm.name)?then(rawOrgName, isSystem?then('FTTH GIS Platform', rawOrgName))>
    <#assign plan = ((realm.attributes.plan)!'FREE')?upper_case>
    <#assign planDisplayName = ((realm.attributes.planDisplayName)!(isSystem?then('System Admin', (plan == 'PRO')?then('Professional', (plan == 'ENTERPRISE')?then('Enterprise Core', 'Starter Trial')))))>
    <#assign logoUrl = ((realm.attributes.logoUrl)!'')>

    <!-- ============================================================
         FTTH GIS — Split-Screen Update Password
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

          <a id="ftth-docs-link" href="https://system-gis.kdua.net/gateways/overview" target="_blank">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            <span>Docs</span>
          </a>
        </div>

        <!-- Center Form Area -->
        <div id="ftth-form-area">

          <!-- Welcome text -->
          <div id="ftth-welcome">
            <h1>Update Password</h1>
            <p>Set a new password to secure your account.</p>
          </div>

          <!-- Card -->
          <div id="ftth-card">

            <#if messagesPerField.existsError('password','password-confirm')>
              <div class="ftth-alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>${kcSanitize(messagesPerField.getFirstError('password','password-confirm'))?no_esc}</span>
              </div>
            </#if>

            <form id="kc-passwd-update-form" action="${url.loginAction}" method="post">

              <!-- New Password field -->
              <div class="form-group">
                <label for="password-new">${msg("passwordNew")}</label>
                <input tabindex="1" id="password-new" name="password-new" type="password"
                  placeholder="••••••••••••" autofocus autocomplete="new-password"
                  aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true</#if>">
              </div>

              <!-- Confirm Password field -->
              <div class="form-group">
                <label for="password-confirm">${msg("passwordConfirm")}</label>
                <input tabindex="2" id="password-confirm" name="password-confirm" type="password"
                  placeholder="••••••••••••" autocomplete="new-password"
                  aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true</#if>">
              </div>

              <!-- Submit button -->
              <button tabindex="3" id="kc-login" name="login" type="submit">
                <span>Save New Password</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>

            </form>

          </div><!-- /#ftth-card -->

          <!-- Security notice -->
          <div id="ftth-security-notice" class="${isSystem?then('notice-system', 'notice-tenant')}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Passwords must be at least 8 characters long and include a mix of uppercase letters, numbers, and symbols.</span>
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
