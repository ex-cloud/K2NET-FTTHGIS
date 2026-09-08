<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        ${msg("termsTitle")}
    <#elseif section = "form">

    <#-- Context variables detection -->
    <#assign isSystem = (realm.name == "ftth-realm" || realm.name == "master" || ((realm.attributes.isSystem)!'') == 'true')>
    <#assign rawOrgName = (realm.displayName)!((realm.attributes.orgName)!realm.name)>
    <#assign orgName = (rawOrgName?has_content && rawOrgName != realm.name)?then(rawOrgName, isSystem?then('FTTH GIS Platform', rawOrgName))>
    <#assign plan = ((realm.attributes.plan)!'FREE')?upper_case>
    <#assign planDisplayName = ((realm.attributes.planDisplayName)!(isSystem?then('System Admin', (plan == 'PRO')?then('Professional', (plan == 'ENTERPRISE')?then('Enterprise Core', 'Starter Trial')))))>
    <#assign logoUrl = ((realm.attributes.logoUrl)!'')>

    <!-- ============================================================
         FTTH GIS — Split-Screen Terms and Conditions (T&C)
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
            <h1>${msg("termsTitle")}</h1>
            <p>Please review and accept our Terms of Service and Privacy Policy to proceed.</p>
          </div>

          <!-- Card -->
          <div id="ftth-card">

            <div style="max-height:240px;overflow-y:auto;background:rgba(9,9,11,0.6);border:1px solid rgba(63,63,70,0.5);border-radius:8px;padding:14px 16px;font-size:13px;line-height:1.6;color:var(--zinc-300);margin-bottom:20px;">
              <div id="kc-terms-text">
                ${kcSanitize(msg("termsText"))?no_esc}
              </div>
            </div>

            <form class="form-actions" action="${url.loginAction}" method="POST" style="display:flex;flex-direction:column;gap:10px;">
              <button class="ftth-btn-primary" name="accept" id="kc-accept" type="submit">
                ${msg("doAccept")}
              </button>
              <button type="submit" name="cancel" id="kc-decline" style="width:100%;height:40px;border-radius:8px;background:transparent;border:1px solid rgba(63,63,70,0.5);color:var(--zinc-400);font-size:13px;font-weight:500;cursor:pointer;transition:all 0.15s ease;">
                ${msg("doDecline")}
              </button>
            </form>

          </div>

          <!-- Footer notice -->
          <div id="ftth-footer">
            <span>&copy; 2026 K2NET Enterprise. Terms & Conditions Enforcement.</span>
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
              Compliance & Governance
            </span>
          </div>

          <p id="ftth-quote-text">
            &ldquo;Security, operational transparency, and data integrity form the bedrock of our high-reliability FTTH telemetry network.&rdquo;
          </p>

          <div id="ftth-author">
            <div id="ftth-author-avatar" class="${isSystem?then('is-system', 'is-tenant')}">
              ${isSystem?then('SYS', 'SEC')}
            </div>
            <div id="ftth-author-info">
              <div id="ftth-author-name">K2NET Security & Compliance Team</div>
              <div id="ftth-author-role">Identity and Access Management Governance</div>
            </div>
          </div>
        </div>
      </div>

    </div>

    </#if>
</@layout.registrationLayout>
