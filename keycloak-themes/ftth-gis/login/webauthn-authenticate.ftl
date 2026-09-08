<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true displayMessage=true; section>
    <#if section = "header">
        ${msg("webauthn-login-title")}
    <#elseif section = "form">

    <#-- Context variables detection -->
    <#assign isSystem = (realm.name == "ftth-realm" || realm.name == "master" || ((realm.attributes.isSystem)!'') == 'true')>
    <#assign rawOrgName = (realm.displayName)!((realm.attributes.orgName)!realm.name)>
    <#assign orgName = (rawOrgName?has_content && rawOrgName != realm.name)?then(rawOrgName, isSystem?then('FTTH GIS Platform', rawOrgName))>
    <#assign plan = ((realm.attributes.plan)!'FREE')?upper_case>
    <#assign planDisplayName = ((realm.attributes.planDisplayName)!(isSystem?then('System Admin', (plan == 'PRO')?then('Professional', (plan == 'ENTERPRISE')?then('Enterprise Core', 'Starter Trial')))))>
    <#assign logoUrl = ((realm.attributes.logoUrl)!'')>

    <!-- ============================================================
         FTTH GIS — Split-Screen Passkey / WebAuthn Authentication
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
            <span>Cancel</span>
          </a>
        </div>

        <!-- Center Form Area -->
        <div id="ftth-form-area">

          <!-- Welcome text -->
          <div id="ftth-welcome">
            <h1>Biometric / Passkey Login</h1>
            <p>Authenticate with TouchID, FaceID, Windows Hello, or YubiKey.</p>
          </div>

          <!-- Card -->
          <div id="ftth-card">

            <div style="text-align:center;padding:16px 0;">
              <div style="width:72px;height:72px;border-radius:50%;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
                  <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/>
                </svg>
              </div>

              <p style="font-size:13px;color:var(--zinc-300);line-height:1.6;margin-bottom:20px;">
                Touch your fingerprint sensor, look into your camera, or plug in your security key when prompted.
              </p>

              <form id="webauthn-authenticate" action="${url.loginAction}" method="post">
                <input type="hidden" id="clientDataJSON" name="clientDataJSON"/>
                <input type="hidden" id="authenticatorData" name="authenticatorData"/>
                <input type="hidden" id="signature" name="signature"/>
                <input type="hidden" id="credentialId" name="credentialId"/>
                <input type="hidden" id="userHandle" name="userHandle"/>
                <input type="hidden" id="error" name="error"/>

                <button tabindex="1" class="ftth-btn-primary" type="button" id="authenticateWebAuthnButton" onclick="window.authenticateByWebAuthn && window.authenticateByWebAuthn()">
                  Authenticate with Passkey
                </button>
              </form>
            </div>

          </div>

          <!-- Footer notice -->
          <div id="ftth-footer">
            <span>&copy; 2026 K2NET Enterprise. FIDO2 / WebAuthn Standard.</span>
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
              FIDO2 Passwordless
            </span>
          </div>

          <p id="ftth-quote-text">
            &ldquo;Cryptographic passkeys eliminate phishing vectors entirely by binding hardware credentials to the verified K2NET domain.&rdquo;
          </p>

          <div id="ftth-author">
            <div id="ftth-author-avatar" class="${isSystem?then('is-system', 'is-tenant')}">
              ${isSystem?then('SYS', 'FIDO')}
            </div>
            <div id="ftth-author-info">
              <div id="ftth-author-name">K2NET Cryptographic Identity</div>
              <div id="ftth-author-role">Hardware Security Assurance</div>
            </div>
          </div>
        </div>
      </div>

    </div>

    </#if>
</@layout.registrationLayout>
