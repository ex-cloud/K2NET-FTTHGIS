<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true; section>
    <#if section = "header">
        ${msg("emailVerifyTitle")}
    <#elseif section = "form">

    <#-- Context variables detection -->
    <#assign isSystem = (realm.name == "ftth-realm" || realm.name == "master" || ((realm.attributes.isSystem)!'') == 'true')>
    <#assign rawOrgName = (realm.displayName)!((realm.attributes.orgName)!realm.name)>
    <#assign orgName = (rawOrgName?has_content && rawOrgName != realm.name)?then(rawOrgName, isSystem?then('FTTH GIS Platform', rawOrgName))>
    <#assign plan = ((realm.attributes.plan)!'FREE')?upper_case>
    <#assign planDisplayName = ((realm.attributes.planDisplayName)!(isSystem?then('System Admin', (plan == 'PRO')?then('Professional', (plan == 'ENTERPRISE')?then('Enterprise Core', 'Starter Trial')))))>
    <#assign logoUrl = ((realm.attributes.logoUrl)!'')>

    <!-- ============================================================
         FTTH GIS — Split-Screen Email Verification
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

          <a id="ftth-docs-link" href="${url.loginUrl}">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            <span>${msg("backToLogin")}</span>
          </a>
        </div>

        <!-- Center Form Area -->
        <div id="ftth-form-area">

          <!-- Welcome text -->
          <div id="ftth-welcome">
            <h1>Check Your Inbox</h1>
            <p>We've sent an email verification link to <strong>${(user.email!'your registered address')}</strong>.</p>
          </div>

          <!-- Card -->
          <div id="ftth-card">

            <div style="text-align:center;padding:20px 0;">
              <div style="width:64px;height:64px;border-radius:50%;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>

              <p style="font-size:13px;color:var(--zinc-300);line-height:1.6;margin-bottom:20px;">
                Please click the link in the email to verify your address and continue to the FTTH GIS dashboard.
              </p>

              <div style="padding-top:14px;border-top:1px solid rgba(63,63,70,0.4);">
                <p style="font-size:12px;color:var(--zinc-500);margin-bottom:10px;">Didn't receive the email?</p>
                <a href="${url.loginAction}" style="display:inline-block;padding:8px 16px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(63,63,70,0.6);color:#fff;font-size:12px;font-weight:500;text-decoration:none;">
                  Resend Verification Email
                </a>
              </div>
            </div>

          </div>

          <!-- Footer notice -->
          <div id="ftth-footer">
            <span>&copy; 2026 K2NET Enterprise. Email Verification Engine.</span>
          </div>

        </div>

      </div>

      <!-- RIGHT COLUMN: BRAND & QUOTE -->
      <div id="ftth-right">
        <div id="ftth-right-grid"></div>
        <div id="ftth-right-glow" class="${isSystem?then('is-system', 'is-tenant')}"></div>

        <div id="ftth-quote-card">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
            <div style="display:flex;gap:4px;">
              <span style="width:8px;height:8px;border-radius:50%;background:#ef4444;display:inline-block;"></span>
              <span style="width:8px;height:8px;border-radius:50%;background:#eab308;display:inline-block;"></span>
              <span style="width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block;"></span>
            </div>
            <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--zinc-500);text-transform:uppercase;letter-spacing:0.08em;">
              Identity Verification
            </span>
          </div>

          <p id="ftth-quote-text">
            &ldquo;Verifying email ownership ensures reliable incident alert routing and cryptographic communication across network operations.&rdquo;
          </p>

          <div id="ftth-author">
            <div id="ftth-author-avatar" class="${isSystem?then('is-system', 'is-tenant')}">
              ${isSystem?then('SYS', 'SEC')}
            </div>
            <div id="ftth-author-info">
              <div id="ftth-author-name">K2NET Notification Gateway</div>
              <div id="ftth-author-role">Security Communications Mesh</div>
            </div>
          </div>
        </div>
      </div>

    </div>

    </#if>
</@layout.registrationLayout>
