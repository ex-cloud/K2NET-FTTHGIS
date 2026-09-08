<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        ${msg("termsTitle")}
    <#elseif section = "form">

    <#-- Context variables detection -->
    <#assign isSystem = (realm.name == "ftth-realm" || realm.name == "master" || ((realm.attributes.isSystem)!'') == 'true')>
    <#assign rawOrgName = (realm.displayName)!((realm.attributes.orgName)!realm.name)>
    <#assign orgName = (rawOrgName?has_content && rawOrgName != realm.name)?then(rawOrgName, isSystem?then('K2NET Platform Admin', rawOrgName))>
    <#assign plan = ((realm.attributes.plan)!'FREE')?upper_case>
    <#assign planDisplayName = ((realm.attributes.planDisplayName)!(isSystem?then('SYSTEM ADMIN', (plan == 'PRO' || plan == 'PROFESSIONAL')?then('PROFESSIONAL', (plan == 'ENTERPRISE' || plan == 'ENTERPRISE CORE')?then('ENTERPRISE CORE', 'STARTER TRIAL')))))>
    <#assign logoUrl = ((realm.attributes.logoUrl)!'')>

    <!-- ============================================================
         FTTH GIS — Split-Screen Terms and Conditions (T&C)
         ============================================================ -->
    <div class="ftth-login-container" style="display:flex;min-height:100vh;width:100%;font-family:'Inter',sans-serif;background:#09090b;color:#f4f4f5;overflow-x:hidden;">

      <!-- LEFT COLUMN -->
      <div id="ftth-left" style="width:100%;max-width:48%;min-height:100vh;max-height:100vh;overflow-y:auto;background:#09090b;display:flex;flex-direction:column;justify-content:space-between;padding:24px 44px;position:relative;border-right:1px solid rgba(39,39,42,0.8);z-index:10;">

        <!-- Header -->
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
        </div>

        <!-- Center Content Area -->
        <div id="ftth-form-area" style="width:100%;max-width:440px;margin:auto;padding:12px 0;z-index:20;">

          <!-- Welcome / Header text -->
          <div id="ftth-welcome" style="margin-bottom:16px;">
            <h1 style="font-size:22px;font-weight:700;letter-spacing:-0.025em;color:#fafafa;margin-bottom:4px;">
              Terms of Service & Privacy
            </h1>
            <p style="font-size:12px;color:#a1a1aa;line-height:1.4;">
              Please review and acknowledge the K2NET Enterprise SaaS Platform terms and spatial sovereignty governance.
            </p>
          </div>

          <!-- Legal Content Card -->
          <div style="background:rgba(24,24,27,0.6);border:1px solid rgba(63,63,70,0.7);border-radius:16px;padding:18px 20px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);backdrop-filter:blur(12px);">

            <div style="max-height:280px;overflow-y:auto;background:rgba(9,9,11,0.7);border:1px solid rgba(63,63,70,0.5);border-radius:8px;padding:14px 16px;font-size:12px;line-height:1.6;color:#d4d4d8;margin-bottom:16px;">
              <div style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(63,63,70,0.5);">
                <strong style="color:#22c55e;font-family:'JetBrains Mono',monospace;font-size:11px;display:block;">1. SPATIAL DATA SOVEREIGNTY (YOU OWN YOUR DATA)</strong>
                <p style="margin:4px 0 0 0;font-size:11px;color:#a1a1aa;">You retain 100% full intellectual property rights and title to all customer data, geospatial fiber lines, ODP coordinates, and network topology assets.</p>
              </div>
              <div style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(63,63,70,0.5);">
                <strong style="color:#22c55e;font-family:'JetBrains Mono',monospace;font-size:11px;display:block;">2. ZERO-TRUST ISOLATION & ENCRYPTION</strong>
                <p style="margin:4px 0 0 0;font-size:11px;color:#a1a1aa;">All data is strictly partitioned per tenant and protected by mandatory TLS 1.3 in transit and AES-256-GCM encryption at rest.</p>
              </div>
              <div>
                <strong style="color:#22c55e;font-family:'JetBrains Mono',monospace;font-size:11px;display:block;">3. HIGH-AVAILABILITY 99.9% UPTIME SLA</strong>
                <p style="margin:4px 0 0 0;font-size:11px;color:#a1a1aa;">Enterprise SLA with automated 3-tier disaster recovery backup replication across local SSD, on-premise MinIO S3, and offsite cloud WebDAV.</p>
              </div>
            </div>

            <form class="form-actions" action="${url.loginAction}" method="POST" style="display:flex;flex-direction:column;gap:10px;">
              <button tabindex="1" class="ftth-btn-primary" name="accept" id="kc-accept" type="submit" style="width:100%;height:40px;border-radius:10px;background:#16a34a;color:#fff;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(22,163,74,0.3);transition:all 0.15s ease;">
                <span>I Accept Terms & Conditions</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
                </svg>
              </button>
              <button tabindex="2" type="submit" name="cancel" id="kc-decline" style="width:100%;height:36px;border-radius:8px;background:transparent;border:1px solid rgba(63,63,70,0.5);color:#a1a1aa;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.15s ease;">
                Decline & Sign Out
              </button>
            </form>

          </div>

          <!-- Footer notice -->
          <div id="ftth-footer" style="font-size:11px;color:#71717a;border-top:1px solid rgba(63,63,70,0.6);padding-top:12px;margin-top:14px;">
            <span>&copy; 2026 K2NET Enterprise SaaS Platform. Terms & Privacy Governance.</span>
          </div>

        </div>

      </div>

      <!-- RIGHT COLUMN: BRAND & QUOTE -->
      <div id="ftth-right" style="flex:1;min-height:100vh;background:#000000;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;padding:40px 56px;">
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);width:460px;height:460px;border-radius:50%;background:radial-gradient(circle, rgba(34,197,94,0.16) 0%, rgba(6,182,212,0.06) 45%, transparent 70%);filter:blur(60px);pointer-events:none;"></div>
        <div style="position:absolute;inset:0;opacity:0.12;pointer-events:none;background-image:radial-gradient(circle, rgba(255,255,255,0.2) 1.2px, transparent 1.2px);background-size:28px 28px;"></div>

        <div style="width:100%;display:flex;justify-content:flex-end;z-index:10;">
          <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:9999px;border:1px solid rgba(63,63,70,0.6);background:rgba(24,24,27,0.6);backdrop-filter:blur(12px);font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;letter-spacing:0.08em;color:#a1a1aa;text-transform:uppercase;">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            <span>SECURITY & COMPLIANCE GOVERNANCE</span>
          </div>
        </div>

        <div style="width:100%;max-width:480px;margin:auto;z-index:10;">
          <div style="position:relative;border-radius:16px;border:1px solid rgba(63,63,70,0.7);background:rgba(18,18,21,0.75);padding:24px;backdrop-filter:blur(24px);box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" style="transform:rotate(180deg);margin-bottom:12px;opacity:0.8;">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
            </svg>

            <blockquote style="font-size:13px;font-weight:400;color:rgba(244,244,245,0.9);line-height:1.6;margin-bottom:16px;">
              &#8220;Security, operational transparency, and spatial data sovereignty form the bedrock of our high-reliability FTTH telemetry network.&#8221;
            </blockquote>

            <div style="display:flex;align-items:center;gap:12px;padding-top:12px;border-top:1px solid rgba(63,63,70,0.4);">
              <div style="height:32px;width:32px;border-radius:50%;background:rgba(34,197,94,0.2);border:1px solid rgba(34,197,94,0.4);display:flex;align-items:center;justify-content:center;color:#22c55e;font-weight:700;font-size:12px;">
                SEC
              </div>
              <div>
                <div style="font-size:12px;font-weight:600;color:#fff;">
                  K2NET Security & Compliance Team
                </div>
                <div style="font-size:10px;color:#a1a1aa;font-family:'JetBrains Mono',monospace;">
                  Identity & Data Governance
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>

    </#if>
</@layout.registrationLayout>
