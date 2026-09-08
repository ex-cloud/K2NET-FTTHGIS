<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true displayMessage=!messagesPerField.existsError('totp','userLabel'); section>
    <#if section = "header">
        ${msg("loginTotpTitle")}
    <#elseif section = "form">

    <#-- Context variables detection -->
    <#assign isSystem = (realm.name == "ftth-realm" || realm.name == "master" || ((realm.attributes.isSystem)!'') == 'true')>
    <#assign rawOrgName = (realm.displayName)!((realm.attributes.orgName)!realm.name)>
    <#assign orgName = (rawOrgName?has_content && rawOrgName != realm.name)?then(rawOrgName, isSystem?then('FTTH GIS Platform', rawOrgName))>
    <#assign plan = ((realm.attributes.plan)!'FREE')?upper_case>
    <#assign planDisplayName = ((realm.attributes.planDisplayName)!(isSystem?then('System Admin', (plan == 'PRO')?then('Professional', (plan == 'ENTERPRISE')?then('Enterprise Core', 'Starter Trial')))))>
    <#assign logoUrl = ((realm.attributes.logoUrl)!'')>

    <!-- ============================================================
         FTTH GIS — Split-Screen Setup Two-Factor Authentication (TOTP)
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
          </div>
        </div>

        <!-- Center Form Area -->
        <div id="ftth-form-area">

          <!-- Welcome text -->
          <div id="ftth-welcome">
            <h1>Setup Two-Factor Authenticator</h1>
            <p>Scan the QR code with Google Authenticator, Microsoft Authenticator, or Authy.</p>
          </div>

          <!-- Card -->
          <div id="ftth-card">

            <#if messagesPerField.existsError('totp','userLabel')>
              <div class="ftth-alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>${kcSanitize(messagesPerField.getFirstError('totp','userLabel'))?no_esc}</span>
              </div>
            </#if>

            <form id="kc-totp-settings-form" action="${url.loginAction}" method="post">

              <!-- QR Code Display -->
              <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:20px;padding:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(63,63,70,0.5);border-radius:8px;">
                <img id="kc-totp-secret-qr-code" src="data:image/png;base64, ${totp.totpSecretQrCode}" alt="Authenticator QR Code" style="width:160px;height:160px;border-radius:6px;background:#fff;padding:8px;" />
                <div style="margin-top:12px;font-size:11px;color:var(--zinc-400);font-family:'JetBrains Mono',monospace;text-align:center;word-break:break-all;">
                  Manual Key: <strong style="color:var(--zinc-200);">${totp.totpSecretEncoded}</strong>
                </div>
              </div>

              <!-- Verification OTP Code -->
              <div class="form-group">
                <label for="totp">${msg("authenticatorCode")}</label>
                <input tabindex="1" id="totp" name="totp" type="text" inputmode="numeric"
                  placeholder="000000" maxlength="6" autofocus autocomplete="one-time-code"
                  style="text-align:center;letter-spacing:0.25em;font-size:18px;font-family:'JetBrains Mono',monospace;font-weight:600;"
                  aria-invalid="<#if messagesPerField.existsError('totp')>true</#if>">
              </div>

              <!-- Device Label -->
              <div class="form-group">
                <label for="userLabel">${msg("loginTotpDeviceName")}</label>
                <input tabindex="2" id="userLabel" name="userLabel" type="text"
                  placeholder="e.g. Work Phone / MacBook TouchID"
                  value="${(totp.userLabel!'')}"
                  aria-invalid="<#if messagesPerField.existsError('userLabel')>true</#if>">
              </div>

              <input type="hidden" id="totpSecret" name="totpSecret" value="${totp.totpSecret}" />

              <#if mode?? && mode = "manual">
                <input type="hidden" id="mode" name="mode" value="${mode}"/>
              </#if>

              <!-- Submit button -->
              <button tabindex="3" class="ftth-btn-primary" name="submitAction" type="submit" style="margin-top:12px;">
                Confirm & Activate 2FA
              </button>

              <#if isAppInitiatedAction??>
                <button type="submit" name="cancel-aia" value="true" style="width:100%;height:40px;margin-top:8px;border-radius:8px;background:transparent;border:1px solid rgba(63,63,70,0.5);color:var(--zinc-400);font-size:13px;cursor:pointer;">
                  Cancel
                </button>
              </#if>

            </form>

          </div>

          <!-- Footer notice -->
          <div id="ftth-footer">
            <span>&copy; 2026 K2NET Enterprise. Time-based One-Time Password (TOTP).</span>
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
              Hardware Security Token
            </span>
          </div>

          <p id="ftth-quote-text">
            &ldquo;Enforcing strong Two-Factor Authentication neutralizes 99.9% of automated credential stuffing attacks across our distributed NOC.&rdquo;
          </p>

          <div id="ftth-author">
            <div id="ftth-author-avatar" class="${isSystem?then('is-system', 'is-tenant')}">
              ${isSystem?then('SYS', 'MFA')}
            </div>
            <div id="ftth-author-info">
              <div id="ftth-author-name">K2NET Cyber Security Team</div>
              <div id="ftth-author-role">Zero-Trust Identity Protection</div>
            </div>
          </div>
        </div>
      </div>

    </div>

    </#if>
</@layout.registrationLayout>
