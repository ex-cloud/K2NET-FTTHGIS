<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true displayMessage=!((messagesPerField.existsError('password','password-confirm'))!false); section>
    <#if section = "header">
        ${msg("updatePasswordTitle")}
    <#elseif section = "form">

    <#-- Context variables detection -->
    <#assign isSystem = (realm.name == "ftth-realm" || realm.name == "master" || ((realm.attributes.isSystem)!'') == 'true')>
    <#assign rawOrgName = (realm.displayName)!((realm.attributes.orgName)!realm.name)>
    <#assign orgName = (rawOrgName?has_content && rawOrgName != realm.name)?then(rawOrgName, isSystem?then('K2NET Platform Admin', rawOrgName))>
    <#assign plan = ((realm.attributes.plan)!'FREE')?upper_case>
    <#assign planDisplayName = ((realm.attributes.planDisplayName)!(isSystem?then('SYSTEM ADMIN', (plan == 'PRO' || plan == 'PROFESSIONAL')?then('PROFESSIONAL', (plan == 'ENTERPRISE' || plan == 'ENTERPRISE CORE')?then('ENTERPRISE CORE', 'STARTER TRIAL')))))>
    <#assign logoUrl = ((realm.attributes.logoUrl)!'')>

    <!-- ============================================================
         FTTH GIS — Split-Screen Update Password
         ============================================================ -->
    <div class="ftth-login-container" style="display:flex;min-height:100vh;width:100%;font-family:'Inter',sans-serif;background:#09090b;color:#f4f4f5;overflow-x:hidden;">

      <!-- ─── LEFT COLUMN: Update Password Form ─────────────────────────── -->
      <div id="ftth-left" style="min-height:100vh;overflow-y:auto;background:#09090b;display:flex;flex-direction:column;justify-content:space-between;position:relative;border-right:1px solid rgba(39,39,42,0.8);z-index:10;">

        <!-- Top Header Row -->
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
              <span data-i18n="systemDocs">Docs</span>
            </a>

            <!-- Language Selector -->
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

        <!-- Ambient Mobile Emerald Glow & Grid (visible only on mobile) -->
        <div id="ftth-mobile-glow"></div>
        <div id="ftth-mobile-grid"></div>

        <!-- Center Form Area -->
        <div id="ftth-form-area" style="width:100%;max-width:390px;margin:auto;padding:12px 0;z-index:20;">

          <!-- Mobile 3D Hero (visible only on mobile) -->
          <div id="ftth-mobile-hero">
            <div id="mobile-isometric-container"></div>
          </div>

          <!-- Welcome text -->
          <div id="ftth-welcome" style="margin-bottom:16px;">
            <h1 style="font-size:24px;font-weight:700;letter-spacing:-0.025em;color:#fafafa;margin-bottom:4px;" data-i18n="updateTitle">
              Update Password
            </h1>
            <p style="font-size:12px;color:#a1a1aa;line-height:1.4;" data-i18n="updateSubtitle">
              Set a strong, new password to secure your ISP workspace account.
            </p>
          </div>

          <!-- Main Card -->
          <div style="background:rgba(24,24,27,0.6);border:1px solid rgba(63,63,70,0.7);border-radius:16px;padding:18px 20px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);backdrop-filter:blur(12px);">

            <#-- Error message -->
            <#if (messagesPerField.existsError('password','password-confirm'))!false>
              <div class="ftth-alert-error" style="margin-bottom:14px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>${kcSanitize(messagesPerField.getFirstError('password','password-confirm'))?no_esc}</span>
              </div>
            </#if>

            <form id="kc-passwd-update-form" action="${url.loginAction}" method="post">

              <!-- New Password field -->
              <div class="form-group" style="margin-bottom:12px;">
                <label for="password-new" style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a1a1aa;margin-bottom:6px;display:block;" data-i18n="newPasswordLabel">
                  ${msg("passwordNew")}
                </label>
                <div style="position:relative;">
                  <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#71717a;pointer-events:none;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input tabindex="1" id="password-new" name="password-new" type="password"
                    placeholder="••••••••••••" autofocus autocomplete="new-password"
                    style="width:100%;height:38px;border-radius:8px;border:1px solid rgba(63,63,70,0.6);background:rgba(9,9,11,0.6);padding:0 12px 0 34px;font-size:13px;color:#fff;outline:none;"
                    aria-invalid="<#if (messagesPerField.existsError('password','password-confirm'))!false>true</#if>">
                </div>
              </div>

              <!-- Confirm Password field -->
              <div class="form-group" style="margin-bottom:14px;">
                <label for="password-confirm" style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a1a1aa;margin-bottom:6px;display:block;" data-i18n="confirmPasswordLabel">
                  ${msg("passwordConfirm")}
                </label>
                <div style="position:relative;">
                  <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#71717a;pointer-events:none;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <input tabindex="2" id="password-confirm" name="password-confirm" type="password"
                    placeholder="••••••••••••" autocomplete="new-password"
                    style="width:100%;height:38px;border-radius:8px;border:1px solid rgba(63,63,70,0.6);background:rgba(9,9,11,0.6);padding:0 12px 0 34px;font-size:13px;color:#fff;outline:none;"
                    aria-invalid="<#if (messagesPerField.existsError('password','password-confirm'))!false>true</#if>">
                </div>
              </div>

              <!-- Submit button -->
              <button tabindex="3" id="kc-login" name="login" type="submit" style="width:100%;height:40px;border-radius:10px;background:#16a34a;color:#fff;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(22,163,74,0.3);transition:all 0.15s ease;">
                <span data-i18n="savePasswordBtn">Save New Password</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>

            </form>

          </div><!-- /#ftth-card -->

          <!-- Security notice -->
          <div id="ftth-security-notice" style="border-radius:12px;border:1px solid rgba(34,197,94,0.25);background:rgba(34,197,94,0.05);padding:10px 12px;display:flex;gap:10px;align-items:flex-start;margin-top:12px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" style="flex-shrink:0;margin-top:1px;">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            <span style="font-size:11px;color:#a1a1aa;line-height:1.4;" data-i18n="updateSecurityNotice">
              Kata sandi harus minimal 8 karakter dengan kombinasi huruf besar, angka, dan simbol unik.
            </span>
          </div>

        </div><!-- /#ftth-form-area -->

        <!-- Bottom Footer Row -->
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
      <div id="ftth-right" style="flex:1;min-height:100vh;background:#050a07;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;padding:40px 56px;">

        <!-- Global Ambient Center Emerald Glow spot -->
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);width:560px;height:560px;border-radius:50%;background:radial-gradient(circle, rgba(34,197,94,0.2) 0%, rgba(16,185,129,0.08) 40%, transparent 70%);filter:blur(60px);pointer-events:none;"></div>

        <!-- Global Tech Dot-Matrix pattern background overlay -->
        <div style="position:absolute;inset:0;opacity:0.32;pointer-events:none;background-image:radial-gradient(circle, rgba(74,222,128,0.4) 1.1px, transparent 1.1px);background-size:18px 18px;-webkit-mask-image:radial-gradient(circle at 50% 45%, black 45%, transparent 92%);mask-image:radial-gradient(circle at 50% 45%, black 45%, transparent 92%);"></div>

        <!-- Top Right Figure Pill Badge -->
        <div style="width:100%;display:flex;justify-content:flex-end;z-index:10;">
          <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:9999px;border:1px solid rgba(63,63,70,0.6);background:rgba(24,24,27,0.6);backdrop-filter:blur(12px);font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;letter-spacing:0.08em;color:#a1a1aa;text-transform:uppercase;">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
            </svg>
            <span id="hero-fig-badge-text">FIG 0.1: PURPOSE-BUILT ARCHITECTURE</span>
          </div>
        </div>

        <!-- Center Interactive 3D Isometric Figure -->
        <div id="isometric-container" style="margin:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 0;z-index:10;width:100%;max-width:440px;cursor:pointer;">
          <svg id="iso-figure-svg" viewBox="0 0 280 240" style="width:100%;height:290px;overflow:visible;" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="apertureMutedGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#27272a" stopOpacity="1" />
                <stop offset="85%" stopColor="#09090b" stopOpacity="1" />
              </radialGradient>
            </defs>
            <ellipse id="ground-shadow" cx="140" cy="193" rx="72" ry="32" fill="rgba(0,0,0,0.85)" style="filter:blur(10px);pointer-events:none;" />
            <g id="iso-slabs-group" style="cursor:pointer;"></g>
          </svg>
        </div>

        <!-- Bottom Right Testimonial Card -->
        <div style="width:100%;max-width:480px;margin:0 auto;z-index:10;">
          <div style="position:relative;border-radius:16px;border:1px solid rgba(63,63,70,0.7);background:rgba(18,18,21,0.75);padding:24px;backdrop-filter:blur(24px);box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" style="transform:rotate(180deg);margin-bottom:12px;opacity:0.8;">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
            </svg>

            <blockquote style="font-size:13px;font-weight:400;color:rgba(244,244,245,0.9);line-height:1.6;margin-bottom:16px;" data-i18n="testimonialQuote">
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
          </div>
        </div>

      </div><!-- /#ftth-right -->

    </div><!-- split-screen wrapper -->

    <!-- Interactive Policy Modal -->
    <div id="ftth-policy-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(10px);z-index:9999;align-items:center;justify-content:center;padding:20px;">
      <div id="ftth-policy-modal-card" style="background:#0e0e11;border:1px solid rgba(63,63,70,0.8);border-radius:18px;width:100%;max-width:820px;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 30px 60px -12px rgba(0,0,0,0.9);overflow:hidden;position:relative;">
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
            <div style="display:inline-flex;background:rgba(9,9,11,0.8);border:1px solid rgba(63,63,70,0.6);border-radius:8px;padding:3px;">
              <button type="button" id="tab-btn-terms" class="active" style="padding:4px 12px;font-size:11px;font-weight:600;border-radius:6px;border:none;cursor:pointer;background:#22c55e;color:#09090b;transition:all 0.15s ease;">Terms</button>
              <button type="button" id="tab-btn-privacy" style="padding:4px 12px;font-size:11px;font-weight:600;border-radius:6px;border:none;cursor:pointer;background:transparent;color:#a1a1aa;transition:all 0.15s ease;">Privacy</button>
            </div>
            <button type="button" id="btn-close-policy-modal" style="width:32px;height:32px;border-radius:8px;border:1px solid rgba(63,63,70,0.6);background:rgba(24,24,27,0.5);color:#a1a1aa;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s ease;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        <div id="ftth-policy-content-body" style="padding:24px 28px;overflow-y:auto;max-height:calc(88vh - 140px);color:#d4d4d8;font-size:13px;line-height:1.7;"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 24px;border-top:1px solid rgba(63,63,70,0.6);background:rgba(18,18,21,0.9);flex-shrink:0;">
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#71717a;font-family:'JetBrains Mono',monospace;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>TLS 1.3 &bull; AES-256 GCM &bull; ISO/IEC 27001</span>
          </div>
          <button type="button" id="btn-policy-acknowledge" style="padding:7px 18px;border-radius:8px;background:#16a34a;color:#fff;font-size:12px;font-weight:600;border:none;cursor:pointer;transition:all 0.15s ease;">
            <span data-i18n="acknowledgeBtn">I Understand & Close</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Scripts -->
    <script>
      (function() {
        // ─── 1. Canonical 3D Figure Dispatcher & Generator (FIG 0.1 to FIG 0.7) ───
        var activeHero = "fig-07";
        try {
          var urlParams = new URLSearchParams(window.location.search);
          activeHero = urlParams.get('hero') || 
                       (document.cookie.match(/k2net_global_login_hero=([^;]+)/) || [])[1] || 
                       localStorage.getItem('k2net_active_login_hero') || 
                       localStorage.getItem('k2net_login_hero_variant') || 
                       "fig-07";
        } catch(e) {}

        var badgeTextEl = document.getElementById('hero-fig-badge-text');

        function initQuantumOrb(canvas, orbRadius, interactiveContainer) {
          if (!canvas) return;
          var ctx = canvas.getContext('2d');
          if (!ctx) return;

          var mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
          var startT = Date.now();

          if (interactiveContainer) {
            interactiveContainer.addEventListener('mousemove', function(e) {
              var rect = interactiveContainer.getBoundingClientRect();
              var nx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
              var ny = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
              mouse.targetX = Math.max(-1.2, Math.min(1.2, nx));
              mouse.targetY = Math.max(-1.2, Math.min(1.2, ny));
            });
            interactiveContainer.addEventListener('mouseleave', function() {
              mouse.targetX = 0;
              mouse.targetY = 0;
            });
          }

          var particles = [];
          for (var i = 0; i < 36; i++) {
            particles.push({
              angle: (Math.PI * 0.15) + (i / 36) * (Math.PI * 0.7),
              radOffset: (Math.random() - 0.5) * 6,
              size: 0.6 + Math.random() * 1.3,
              speed: 0.2 + Math.random() * 0.6,
              phase: Math.random() * Math.PI * 2,
              alpha: 0.3 + Math.random() * 0.7
            });
          }

          function draw() {
            mouse.x += (mouse.targetX - mouse.x) * 0.08;
            mouse.y += (mouse.targetY - mouse.y) * 0.08;
            var elapsed = (Date.now() - startT) * 0.001;

            var w = canvas.width;
            var h = canvas.height;
            var cx = w / 2;
            var cy = h / 2;
            var mx = mouse.x * 12;
            var my = mouse.y * 10;

            ctx.clearRect(0, 0, w, h);

            // 1. Outer Corona Glow
            var corona = ctx.createRadialGradient(cx + mx * 0.3, cy + my * 0.3, orbRadius * 0.7, cx, cy, orbRadius * 1.45);
            corona.addColorStop(0, 'rgba(74, 222, 128, 0.35)');
            corona.addColorStop(0.35, 'rgba(34, 197, 94, 0.18)');
            corona.addColorStop(0.7, 'rgba(22, 101, 52, 0.05)');
            corona.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = corona;
            ctx.beginPath();
            ctx.arc(cx, cy, orbRadius * 1.45, 0, Math.PI * 2);
            ctx.fill();

            // 2. Base Sphere Fill (Deep Obsidian Green Abyss)
            var bodyGrad = ctx.createRadialGradient(cx - orbRadius * 0.25 + mx, cy - orbRadius * 0.25 + my, orbRadius * 0.05, cx, cy, orbRadius);
            bodyGrad.addColorStop(0, '#07170c');
            bodyGrad.addColorStop(0.45, '#030905');
            bodyGrad.addColorStop(0.8, '#020503');
            bodyGrad.addColorStop(0.95, '#0d2b14');
            bodyGrad.addColorStop(1, '#1e5c2d');
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
            ctx.fill();

            // 3. Clip to sphere interior
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
            ctx.clip();

            // 3a. Deep Volumetric Fluid Ambient Glow
            var deepGlow = ctx.createRadialGradient(cx + mx * 0.4, cy - orbRadius * 0.1 + my * 0.4, orbRadius * 0.1, cx, cy, orbRadius * 0.95);
            deepGlow.addColorStop(0, 'rgba(101, 163, 13, 0.25)');
            deepGlow.addColorStop(0.4, 'rgba(22, 101, 52, 0.15)');
            deepGlow.addColorStop(0.8, 'rgba(5, 30, 14, 0.06)');
            deepGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = deepGlow;
            ctx.fillRect(0, 0, w, h);

            // 3b. Multi-Octave Organic Fluid Plasma Wave 1 (Deep Layer)
            ctx.beginPath();
            var waveY1 = cy - orbRadius * 0.2 + my * 0.35;
            ctx.moveTo(cx - orbRadius, cy);
            for (var x = -orbRadius; x <= orbRadius; x += 2) {
              var normX = x / orbRadius;
              var curve = Math.sqrt(Math.max(0, 1 - normX * normX));
              var wave = Math.sin(normX * 4.2 + elapsed * 1.4) * (orbRadius * 0.11)
                       + Math.cos(normX * 7.8 - elapsed * 1.8) * (orbRadius * 0.055)
                       + Math.sin(normX * 11.5 + elapsed * 2.6) * (orbRadius * 0.025);
              ctx.lineTo(cx + x, waveY1 + wave * curve);
            }
            ctx.lineTo(cx + orbRadius, cy + orbRadius);
            ctx.lineTo(cx - orbRadius, cy + orbRadius);
            ctx.closePath();
            var waveGrad1 = ctx.createLinearGradient(cx, waveY1 - orbRadius * 0.25, cx, cy + orbRadius * 0.6);
            waveGrad1.addColorStop(0, 'rgba(132, 204, 22, 0.35)');
            waveGrad1.addColorStop(0.3, 'rgba(74, 222, 128, 0.20)');
            waveGrad1.addColorStop(0.7, 'rgba(20, 83, 45, 0.08)');
            waveGrad1.addColorStop(1, 'rgba(1, 5, 2, 0.7)');
            ctx.fillStyle = waveGrad1;
            ctx.fill();
            ctx.strokeStyle = 'rgba(163, 230, 53, 0.55)';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // 3c. Multi-Octave Organic Fluid Wave 2 (Main Luminous Folds)
            ctx.beginPath();
            var waveY2 = cy - orbRadius * 0.08 + my * 0.55;
            ctx.moveTo(cx - orbRadius, cy);
            for (var x2 = -orbRadius; x2 <= orbRadius; x2 += 2) {
              var normX2 = x2 / orbRadius;
              var curve2 = Math.sqrt(Math.max(0, 1 - normX2 * normX2));
              var wave2 = Math.sin(normX2 * 4.8 - elapsed * 1.6 + 1.0) * (orbRadius * 0.13)
                        + Math.cos(normX2 * 8.6 + elapsed * 2.1) * (orbRadius * 0.065)
                        + Math.sin(normX2 * 13.0 - elapsed * 3.1) * (orbRadius * 0.03);
              ctx.lineTo(cx + x2, waveY2 + wave2 * curve2);
            }
            ctx.lineTo(cx + orbRadius, cy + orbRadius);
            ctx.lineTo(cx - orbRadius, cy + orbRadius);
            ctx.closePath();
            var waveGrad2 = ctx.createLinearGradient(cx, waveY2 - orbRadius * 0.2, cx, cy + orbRadius * 0.75);
            waveGrad2.addColorStop(0, 'rgba(190, 242, 100, 0.48)');
            waveGrad2.addColorStop(0.25, 'rgba(134, 239, 172, 0.28)');
            waveGrad2.addColorStop(0.6, 'rgba(21, 128, 61, 0.12)');
            waveGrad2.addColorStop(1, 'rgba(2, 6, 3, 0.88)');
            ctx.fillStyle = waveGrad2;
            ctx.fill();
            ctx.strokeStyle = 'rgba(217, 249, 157, 0.80)';
            ctx.lineWidth = 1.4;
            ctx.shadowColor = '#84cc16';
            ctx.shadowBlur = 6;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // 3d. Bioluminescent Micro-Particles
            for (var p = 0; p < particles.length; p++) {
              var pt = particles[p];
              var cAng = pt.angle + Math.sin(elapsed * pt.speed + pt.phase) * 0.08;
              var pr = orbRadius * 0.86 + pt.radOffset;
              var px = cx + Math.cos(cAng) * pr;
              var py = cy + Math.sin(cAng) * pr;
              var pulse = 0.5 + 0.5 * Math.sin(elapsed * 2.5 + pt.phase);
              ctx.fillStyle = 'rgba(190, 242, 100, ' + (pt.alpha * pulse).toFixed(2) + ')';
              ctx.beginPath();
              ctx.arc(px, py, pt.size, 0, Math.PI * 2);
              ctx.fill();
            }

            // 3e. Smooth Fresnel Volumetric Edge Glow (Gambar 2 - No harsh white spot!)
            var fresnel = ctx.createRadialGradient(cx, cy, orbRadius * 0.70, cx, cy, orbRadius);
            fresnel.addColorStop(0, 'rgba(0, 0, 0, 0)');
            fresnel.addColorStop(0.60, 'rgba(34, 197, 94, 0.06)');
            fresnel.addColorStop(0.84, 'rgba(132, 204, 22, 0.35)');
            fresnel.addColorStop(0.95, 'rgba(190, 242, 100, 0.75)');
            fresnel.addColorStop(1, 'rgba(236, 252, 203, 0.92)');
            ctx.fillStyle = fresnel;
            ctx.beginPath();
            ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

            // 4. Luminous Outer Rim Perimeter
            ctx.save();
            ctx.strokeStyle = 'rgba(217, 249, 157, 0.88)';
            ctx.lineWidth = 1.25;
            ctx.shadowColor = '#84cc16';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            requestAnimationFrame(draw);
          }
          requestAnimationFrame(draw);
        }

        // Initialize Mobile Hero Orb (Active for mobile screens)
        var mobileContainer = document.getElementById('mobile-isometric-container');
        if (mobileContainer) {
          mobileContainer.innerHTML = 
            '<div style="position:relative;width:100%;max-width:180px;height:150px;display:flex;align-items:center;justify-content:center;">' +
              '<svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;" viewBox="0 0 180 150" fill="none">' +
                '<defs>' +
                  '<linearGradient id="fig07-ringFadeMobile" x1="0%" y1="0%" x2="100%" y2="100%">' +
                    '<stop offset="0%" stop-color="#bef264" stop-opacity="0.30" />' +
                    '<stop offset="50%" stop-color="#4ade80" stop-opacity="0.08" />' +
                    '<stop offset="100%" stop-color="#bef264" stop-opacity="0.25" />' +
                  '</linearGradient>' +
                '</defs>' +
                '<g class="k2net-hud-grid-mobile" style="transform-origin:90px 75px;animation:k2net-rotate-hud 100s linear infinite;">' +
                  '<circle cx="90" cy="75" r="70" stroke="url(#fig07-ringFadeMobile)" stroke-width="0.75" stroke-dasharray="2 6" />' +
                  '<circle cx="90" cy="75" r="64" stroke="url(#fig07-ringFadeMobile)" stroke-width="0.8" />' +
                  '<g id="hud-ticks-mobile" stroke="#bef264" stroke-opacity="0.25" stroke-width="0.8"></g>' +
                '</g>' +
                '<g class="k2net-hud-inner-mobile" style="transform-origin:90px 75px;animation:k2net-rotate-hud-reverse 140s linear infinite;">' +
                  '<line x1="90" y1="6" x2="90" y2="14" stroke="#bef264" stroke-opacity="0.4" stroke-width="1" />' +
                  '<line x1="90" y1="136" x2="90" y2="144" stroke="#bef264" stroke-opacity="0.4" stroke-width="1" />' +
                  '<line x1="21" y1="75" x2="29" y2="75" stroke="#bef264" stroke-opacity="0.4" stroke-width="1" />' +
                  '<line x1="151" y1="75" x2="159" y2="75" stroke="#bef264" stroke-opacity="0.4" stroke-width="1" />' +
                '</g>' +
              '</svg>' +
              '<canvas id="mobile-quantum-orb-canvas" width="160" height="150" style="width:160px;height:150px;filter:drop-shadow(0 0 20px rgba(74,222,128,0.3));"></canvas>' +
            '</div>';

          // Build mobile radar ticks along r=64
          var mTicksGroup = document.getElementById('hud-ticks-mobile');
          if (mTicksGroup) {
            var mcx = 90, mcy = 75, mr = 64, mCount = 24;
            for (var mi = 0; mi < mCount; mi++) {
              if (mi % 4 === 0) continue;
              var mAngle = (mi / mCount) * Math.PI * 2;
              var mx1 = mcx + Math.cos(mAngle) * (mr - 2.5);
              var my1 = mcy + Math.sin(mAngle) * (mr - 2.5);
              var mx2 = mcx + Math.cos(mAngle) * (mr + 2.5);
              var my2 = mcy + Math.sin(mAngle) * (mr + 2.5);
              var mLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
              mLine.setAttribute('x1', mx1.toFixed(2));
              mLine.setAttribute('y1', my1.toFixed(2));
              mLine.setAttribute('x2', mx2.toFixed(2));
              mLine.setAttribute('y2', my2.toFixed(2));
              mTicksGroup.appendChild(mLine);
            }
          }

          var mobileCanvas = document.getElementById('mobile-quantum-orb-canvas');
          if (mobileCanvas) {
            initQuantumOrb(mobileCanvas, 42, mobileContainer);
          }
        }

        // Initialize Desktop Hero
        if (activeHero === "fig-07") {
          if (badgeTextEl) badgeTextEl.textContent = "FIG 0.7: QUANTUM ORB";
          var container = document.getElementById('isometric-container');
          if (container) {
            container.innerHTML = 
              '<div style="position:relative;width:100%;max-width:340px;height:290px;display:flex;align-items:center;justify-content:center;cursor:pointer;">' +
                '<svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;" viewBox="0 0 340 340" fill="none">' +
                  '<defs>' +
                    '<linearGradient id="fig07-ringFadeDesktop" x1="0%" y1="0%" x2="100%" y2="100%">' +
                      '<stop offset="0%" stop-color="#bef264" stop-opacity="0.30" />' +
                      '<stop offset="50%" stop-color="#4ade80" stop-opacity="0.08" />' +
                      '<stop offset="100%" stop-color="#bef264" stop-opacity="0.25" />' +
                    '</linearGradient>' +
                  '</defs>' +
                  '<g class="k2net-hud-grid" style="transform-origin:170px 170px;animation:k2net-rotate-hud 100s linear infinite;">' +
                    '<circle cx="170" cy="170" r="156" stroke="url(#fig07-ringFadeDesktop)" stroke-width="0.75" stroke-dasharray="2 8" />' +
                    '<circle cx="170" cy="170" r="144" stroke="url(#fig07-ringFadeDesktop)" stroke-width="0.8" />' +
                    '<g id="hud-ticks-desktop" stroke="#bef264" stroke-opacity="0.25" stroke-width="0.8"></g>' +
                  '</g>' +
                  '<g class="k2net-hud-inner" style="transform-origin:170px 170px;animation:k2net-rotate-hud-reverse 140s linear infinite;">' +
                    '<line x1="170" y1="10" x2="170" y2="22" stroke="#bef264" stroke-opacity="0.4" stroke-width="1" />' +
                    '<line x1="170" y1="318" x2="170" y2="330" stroke="#bef264" stroke-opacity="0.4" stroke-width="1" />' +
                    '<line x1="10" y1="170" x2="22" y2="170" stroke="#bef264" stroke-opacity="0.4" stroke-width="1" />' +
                    '<line x1="318" y1="170" x2="330" y2="170" stroke="#bef264" stroke-opacity="0.4" stroke-width="1" />' +
                  '</g>' +
                '</svg>' +
                '<canvas id="quantum-orb-canvas" width="320" height="320" style="width:320px;height:320px;filter:drop-shadow(0 0 28px rgba(74,222,128,0.3));"></canvas>' +
              '</div>';

            // Build desktop radar ticks along r=144
            var dTicksGroup = document.getElementById('hud-ticks-desktop');
            if (dTicksGroup) {
              var dcx = 170, dcy = 170, dr = 144, dCount = 36;
              for (var di = 0; di < dCount; di++) {
                if (di % 6 === 0) continue;
                var dAngle = (di / dCount) * Math.PI * 2;
                var dx1 = dcx + Math.cos(dAngle) * (dr - 3);
                var dy1 = dcy + Math.sin(dAngle) * (dr - 3);
                var dx2 = dcx + Math.cos(dAngle) * (dr + 3);
                var dy2 = dcy + Math.sin(dAngle) * (dr + 3);
                var dLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                dLine.setAttribute('x1', dx1.toFixed(2));
                dLine.setAttribute('y1', dy1.toFixed(2));
                dLine.setAttribute('x2', dx2.toFixed(2));
                dLine.setAttribute('y2', dy2.toFixed(2));
                dTicksGroup.appendChild(dLine);
              }
            }

            var canvas = document.getElementById('quantum-orb-canvas');
            if (canvas) {
              initQuantumOrb(canvas, 86, container);
            }
          }
        } else {
        // ─── Standard FIG 0.1 Isometric Slabs Generator ───
        var K2NET_LOGO_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAI8AAACVCAYAAABhLqluAAAACXBIWXMAAAsSAAALEgHS3X78AAAgAElEQVR4nO19B5gcxZX/q+oJuzubtNJqVxKKSKBMBoOxsQGDbTJ/A38bBwwmnM/5MGfO9pnzAbYJBkzyYTDJ+O4cCOYwWYgcLAkJIwQCJCQkIWm1QRtnprur7uue6dmaN6+6e9Jql9P7vv46V/z174Wq7mZSSihFFnx/ZZQxqGMMahiwWicJxoA5C2fAMvvObuaYs88zB/z2uXq/dz1nwL30OHf2Gc+cd+/l3M0GgPPMtnc955nt3PXeeZ45bzibTnqcGZl9dzt3vcGBG9y9RrmecYND5np3293PXs8M53xE2c9ek7neAHc/ktvPbHvpRQz3esNZu/vZbWI/4l3vbHvno9ntaOb48wCwKmqwZ+oAekrq5AApCjxz/+lVp1EaGYNGBizGGAwBQIoxd7GdvsyCyF0ynesectGQAUJ2nwXuOx0PeJ8NAwWyQFHOO0jJAc/Nn2cv4NR5DsxQ0+OMGdn0MsBjzOCZfYNngGtky+Ne6+xnC2hwBuq+cz7CM/d597uLAbn9iLufSS+STS9iDF/vbEey97vbhfvcu947H83sN0UMtjhqsE9EDHYkALwWNdgNdQB3jDh45nx3hdOOTU6hGECaMdj55tX7DVSyILulOrJ1yG6KGuyEiMG+EzXYbAC4pA7g2kpkFgiePb+zwlFNE8ABDUDX29fsn97dz2NTOtPiYxGDXRPNqL2z6gBWlpOeL3hmfntFMwOod/Jdd93+Q+VktFtGj+y05Y8B4MdRg51XjirTgmfGt5aPYwAxBzjrf3WAtbvvP1zSmRaLIwZ7Mmqwh+oAziqlciR4pn1zebNjvDOAzg3XHyD+rzf0h1W2DtmLogZ7LGKwvzYZ7Jxiq1kAnqnfWNaUAQ7r2njD6ANOzn0rQ2Sp8YkPoXgAAoDvj4/x3xXVF2o7TvnHZfGsR9W56cYD7V3VVJUASDnyfw1cm/qthRGDPRc12MfHx/hrYe/LgWfy15c5HTaeAfRtvunAVDULSxZkFwMmjHyYQbWp37ourrAT22uNpWGraph2pxqelwpsJYKwY+W7JvUa4zX5vQx6/tNfQ1H2v3H1zC3P3Sg/64HAAAAAElFTkSuQmCC";
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
          return "M " + p1.x.toFixed(1) + " " + p1.y.toFixed(1) + 
                 " L " + p2.x.toFixed(1) + " " + p2.y.toFixed(1) + 
                 " Q " + c2.x.toFixed(1) + " " + c2.y.toFixed(1) + " " + p3.x.toFixed(1) + " " + p3.y.toFixed(1) + 
                 " L " + p4.x.toFixed(1) + " " + p4.y.toFixed(1) + 
                 " Q " + c3.x.toFixed(1) + " " + c3.y.toFixed(1) + " " + p5.x.toFixed(1) + " " + p5.y.toFixed(1) + 
                 " L " + p6.x.toFixed(1) + " " + p6.y.toFixed(1) + 
                 " Q " + c4.x.toFixed(1) + " " + c4.y.toFixed(1) + " " + p7.x.toFixed(1) + " " + p7.y.toFixed(1) + 
                 " L " + p8.x.toFixed(1) + " " + p8.y.toFixed(1) + 
                 " Q " + c1.x.toFixed(1) + " " + c1.y.toFixed(1) + " " + p1.x.toFixed(1) + " " + p1.y.toFixed(1) + " Z";
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

            var leftFace = "M " + p7Top.x.toFixed(1) + " " + p7Top.y.toFixed(1) + 
                           " Q " + c4Top.x.toFixed(1) + " " + c4Top.y.toFixed(1) + " " + p6Top.x.toFixed(1) + " " + p6Top.y.toFixed(1) + 
                           " L " + p5Top.x.toFixed(1) + " " + p5Top.y.toFixed(1) + 
                           " L " + p5Base.x.toFixed(1) + " " + p5Base.y.toFixed(1) + 
                           " L " + p6Base.x.toFixed(1) + " " + p6Base.y.toFixed(1) + 
                           " Q " + c4Base.x.toFixed(1) + " " + c4Base.y.toFixed(1) + " " + p7Base.x.toFixed(1) + " " + p7Base.y.toFixed(1) + " Z";

            var rightFace = "M " + p5Top.x.toFixed(1) + " " + p5Top.y.toFixed(1) + 
                            " Q " + c3Top.x.toFixed(1) + " " + c3Top.y.toFixed(1) + " " + p4Top.x.toFixed(1) + " " + p4Top.y.toFixed(1) + 
                            " L " + p3Top.x.toFixed(1) + " " + p3Top.y.toFixed(1) + 
                            " L " + p3Base.x.toFixed(1) + " " + p3Base.y.toFixed(1) + 
                            " L " + p4Base.x.toFixed(1) + " " + p4Base.y.toFixed(1) + 
                            " Q " + c3Base.x.toFixed(1) + " " + c3Base.y.toFixed(1) + " " + p5Base.x.toFixed(1) + " " + p5Base.y.toFixed(1) + " Z";

            var ridge = "M " + p7Top.x.toFixed(1) + " " + p7Top.y.toFixed(1) + 
                        " Q " + c4Top.x.toFixed(1) + " " + c4Top.y.toFixed(1) + " " + p6Top.x.toFixed(1) + " " + p6Top.y.toFixed(1) + 
                        " L " + p5Top.x.toFixed(1) + " " + p5Top.y.toFixed(1) + 
                        " Q " + c3Top.x.toFixed(1) + " " + c3Top.y.toFixed(1) + " " + p4Top.x.toFixed(1) + " " + p4Top.y.toFixed(1);

            slabsHtml += '<g class="iso-slab" data-index="' + idx + '" style="transition:transform 0.35s cubic-bezier(0.25, 1, 0.5, 1);">' +
              '<path d="' + leftFace + '" fill="#09090b" stroke="#3f3f46" stroke-opacity="0.6" stroke-width="0.85" />' +
              '<path d="' + rightFace + '" fill="#000000" stroke="#27272a" stroke-opacity="0.45" stroke-width="0.85" />' +
              '<path d="' + topPath + '" fill="#121215" stroke="#71717a" stroke-opacity="0.85" stroke-width="' + (isTop ? '1' : '0.85') + '" />' +
              '<path d="' + ridge + '" stroke="#a1a1aa" stroke-opacity="0.85" stroke-width="1.1" fill="none" />';

            if (isTop) {
              slabsHtml += '<ellipse cx="140" cy="' + topCenterY.toFixed(1) + '" rx="' + apertureRx.toFixed(1) + '" ry="' + apertureRy.toFixed(1) + '" fill="url(#apertureMutedGlow)" stroke="#a1a1aa" stroke-opacity="0.9" stroke-width="1.1" />';
              slabsHtml += '<g transform="translate(140, ' + topCenterY.toFixed(1) + ') matrix(0.866025 0.5 -0.866025 0.5 0 0)">' +
                '<image href="' + K2NET_LOGO_B64 + '" x="-19" y="-19" width="38" height="38" style="filter:brightness(0) invert(1) drop-shadow(0 0 8px rgba(255,255,255,0.85));opacity:0.95;" />' +
                '</g>';
            }
            slabsHtml += '</g>';
          });
          slabsGroup.innerHTML = slabsHtml;
        }

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
      }

        // i18n
        var dictionary = {
          en: {
            updateTitle: "Update Password",
            updateSubtitle: "Set a strong, new password to secure your ISP workspace account.",
            newPasswordLabel: "NEW PASSWORD",
            confirmPasswordLabel: "CONFIRM PASSWORD",
            savePasswordBtn: "Save New Password",
            updateSecurityNotice: "Passwords must be at least 8 characters with a mix of uppercase letters, numbers, and symbols.",
            systemDocs: "Docs",
            byContinuing: "By continuing, you agree to FTTH GIS's",
            termsOfService: "Terms of Service",
            and: "and",
            privacyPolicy: "Privacy Policy",
            allRightsReserved: "All rights reserved.",
            acknowledgeBtn: "I Understand & Close"
          },
          id: {
            updateTitle: "Perbarui Kata Sandi",
            updateSubtitle: "Buat kata sandi baru yang kuat untuk mengamankan akun workspace ISP Anda.",
            newPasswordLabel: "KATA SANDI BARU",
            confirmPasswordLabel: "KONFIRMASI KATA SANDI",
            savePasswordBtn: "Simpan Kata Sandi Baru",
            updateSecurityNotice: "Kata sandi harus minimal 8 karakter dengan kombinasi huruf besar, angka, dan simbol unik.",
            systemDocs: "Dokumentasi",
            byContinuing: "Dengan melanjutkan, Anda menyetujui",
            termsOfService: "Ketentuan Layanan",
            and: "dan",
            privacyPolicy: "Kebijakan Privasi",
            allRightsReserved: "Hak cipta dilindungi undang-undang.",
            acknowledgeBtn: "Saya Mengerti & Tutup"
          }
        };

        function applyLanguage(lang) {
          var dict = dictionary[lang] || dictionary.en;
          document.querySelectorAll('[data-i18n]').forEach(function(el) {
            var key = el.getAttribute('data-i18n');
            if (dict[key]) el.textContent = dict[key];
          });
          var btns = document.querySelectorAll('.ftth-locale-btn');
          btns.forEach(function(btn) {
            if (btn.getAttribute('data-lang') === lang) {
              btn.style.background = '#22c55e'; btn.style.color = '#09090b'; btn.classList.add('active');
            } else {
              btn.style.background = 'transparent'; btn.style.color = '#a1a1aa'; btn.classList.remove('active');
            }
          });
          localStorage.setItem('k2net_login_lang', lang);
          document.documentElement.setAttribute('lang', lang);
        }

        var switcher = document.getElementById('k2net-lang-switcher');
        if (switcher) {
          switcher.addEventListener('click', function(e) {
            var btn = e.target.closest('.ftth-locale-btn');
            if (btn) { e.preventDefault(); applyLanguage(btn.getAttribute('data-lang')); }
          });
        }

        var savedLang = localStorage.getItem('k2net_login_lang') || 'en';
        applyLanguage(savedLang);

      })();
    </script>

    </#if>
</@layout.registrationLayout>
