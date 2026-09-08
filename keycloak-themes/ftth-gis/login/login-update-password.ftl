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
      <div id="ftth-left" style="width:100%;max-width:44%;min-height:100vh;max-height:100vh;overflow-y:auto;background:#09090b;display:flex;flex-direction:column;justify-content:space-between;padding:24px 44px;position:relative;border-right:1px solid rgba(39,39,42,0.8);z-index:10;">

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

        <!-- Center Form Area -->
        <div id="ftth-form-area" style="width:100%;max-width:390px;margin:auto;padding:12px 0;z-index:20;">

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
      <div id="ftth-right" style="flex:1;min-height:100vh;background:#000000;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;padding:40px 56px;">
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);width:460px;height:460px;border-radius:50%;background:radial-gradient(circle, rgba(34,197,94,0.16) 0%, rgba(6,182,212,0.06) 45%, transparent 70%);filter:blur(60px);pointer-events:none;"></div>
        <div style="position:absolute;inset:0;opacity:0.12;pointer-events:none;background-image:radial-gradient(circle, rgba(255,255,255,0.2) 1.2px, transparent 1.2px);background-size:28px 28px;"></div>

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
        var K2NET_LOGO_B64 = "data:image/png;base64,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";
        var COS30 = Math.cos(Math.PI / 6), SIN30 = Math.sin(Math.PI / 6);
        function toIsoPt(x, y, z, originX, originY) {
          return { x: originX + (x - y) * COS30, y: originY + (x + y) * SIN30 - z };
        }
        function isoRoundedRectPath(cx, cy, w, h, z, r, originX, originY) {
          var x1 = cx - w / 2, x2 = cx + w / 2, y1 = cy - h / 2, y2 = cy + h / 2;
          var rad = Math.min(r, w / 2 - 0.5, h / 2 - 0.5);
          var p1 = toIsoPt(x1 + rad, y1, z, originX, originY), p2 = toIsoPt(x2 - rad, y1, z, originX, originY);
          var c2 = toIsoPt(x2, y1, z, originX, originY), p3 = toIsoPt(x2, y1 + rad, z, originX, originY);
          var p4 = toIsoPt(x2, y2 - rad, z, originX, originY), c3 = toIsoPt(x2, y2, z, originX, originY);
          var p5 = toIsoPt(x2 - rad, y2, z, originX, originY), p6 = toIsoPt(x1 + rad, y2, z, originX, originY);
          var c4 = toIsoPt(x1, y2, z, originX, originY), p7 = toIsoPt(x1, y2 - rad, z, originX, originY);
          var p8 = toIsoPt(x1, y1 + rad, z, originX, originY), c1 = toIsoPt(x1, y1, z, originX, originY);
          return "M " + p1.x.toFixed(1) + " " + p1.y.toFixed(1) + " L " + p2.x.toFixed(1) + " " + p2.y.toFixed(1) + " Q " + c2.x.toFixed(1) + " " + c2.y.toFixed(1) + " " + p3.x.toFixed(1) + " " + p3.y.toFixed(1) + " L " + p4.x.toFixed(1) + " " + p4.y.toFixed(1) + " Q " + c3.x.toFixed(1) + " " + c3.y.toFixed(1) + " " + p5.x.toFixed(1) + " " + p5.y.toFixed(1) + " L " + p6.x.toFixed(1) + " " + p6.y.toFixed(1) + " Q " + c4.x.toFixed(1) + " " + c4.y.toFixed(1) + " " + p7.x.toFixed(1) + " " + p7.y.toFixed(1) + " L " + p8.x.toFixed(1) + " " + p8.y.toFixed(1) + " Q " + c1.x.toFixed(1) + " " + c1.y.toFixed(1) + " " + p1.x.toFixed(1) + " " + p1.y.toFixed(1) + " Z";
        }

        var layers = [0, 1, 2, 3, 4, 5], slabSize = 50, slabThickness = 7.5, originY = 148, topSlabIndex = 5;
        var cornerRadius = 5.5, apertureRadius = 23, apertureRx = apertureRadius * 1.2247, apertureRy = apertureRadius * 0.7071;
        var zTopFinal = topSlabIndex * (slabThickness + 2) + slabThickness, topCenterY = originY - zTopFinal;
        var slabsGroup = document.getElementById('iso-slabs-group');
        if (slabsGroup) {
          var slabsHtml = "";
          layers.forEach(function(idx) {
            var zBase = idx * (slabThickness + 2), zTop = zBase + slabThickness, isTop = (idx === topSlabIndex);
            var w = slabSize * 2, r = cornerRadius, x1 = -slabSize, x2 = slabSize, y1 = -slabSize, y2 = slabSize;
            var topPath = isoRoundedRectPath(0, 0, w, w, zTop, r, 140, originY);
            var p6Top = toIsoPt(x1 + r, y2, zTop, 140, originY), p5Top = toIsoPt(x2 - r, y2, zTop, 140, originY);
            var c3Top = toIsoPt(x2, y2, zTop, 140, originY), p4Top = toIsoPt(x2, y2 - r, zTop, 140, originY);
            var p3Top = toIsoPt(x2, y1 + r, zTop, 140, originY), c4Top = toIsoPt(x1, y2, zTop, 140, originY), p7Top = toIsoPt(x1, y2 - r, zTop, 140, originY);
            var p6Base = toIsoPt(x1 + r, y2, zBase, 140, originY), p5Base = toIsoPt(x2 - r, y2, zBase, 140, originY);
            var c3Base = toIsoPt(x2, y2, zBase, 140, originY), p4Base = toIsoPt(x2, y2 - r, zBase, 140, originY);
            var p3Base = toIsoPt(x2, y1 + r, zBase, 140, originY), c4Base = toIsoPt(x1, y2, zBase, 140, originY), p7Base = toIsoPt(x1, y2 - r, zBase, 140, originY);

            var leftFace = "M " + p7Top.x.toFixed(1) + " " + p7Top.y.toFixed(1) + " Q " + c4Top.x.toFixed(1) + " " + c4Top.y.toFixed(1) + " " + p6Top.x.toFixed(1) + " " + p6Top.y.toFixed(1) + " L " + p5Top.x.toFixed(1) + " " + p5Top.y.toFixed(1) + " L " + p5Base.x.toFixed(1) + " " + p5Base.y.toFixed(1) + " L " + p6Base.x.toFixed(1) + " " + p6Base.y.toFixed(1) + " Q " + c4Base.x.toFixed(1) + " " + c4Base.y.toFixed(1) + " " + p7Base.x.toFixed(1) + " " + p7Base.y.toFixed(1) + " Z";
            var rightFace = "M " + p5Top.x.toFixed(1) + " " + p5Top.y.toFixed(1) + " Q " + c3Top.x.toFixed(1) + " " + c3Top.y.toFixed(1) + " " + p4Top.x.toFixed(1) + " " + p4Top.y.toFixed(1) + " L " + p3Top.x.toFixed(1) + " " + p3Top.y.toFixed(1) + " L " + p3Base.x.toFixed(1) + " " + p3Base.y.toFixed(1) + " L " + p4Base.x.toFixed(1) + " " + p4Base.y.toFixed(1) + " Q " + c3Base.x.toFixed(1) + " " + c3Base.y.toFixed(1) + " " + p5Base.x.toFixed(1) + " " + p5Base.y.toFixed(1) + " Z";
            var ridge = "M " + p7Top.x.toFixed(1) + " " + p7Top.y.toFixed(1) + " Q " + c4Top.x.toFixed(1) + " " + c4Top.y.toFixed(1) + " " + p6Top.x.toFixed(1) + " " + p6Top.y.toFixed(1) + " L " + p5Top.x.toFixed(1) + " " + p5Top.y.toFixed(1) + " Q " + c3Top.x.toFixed(1) + " " + c3Top.y.toFixed(1) + " " + p4Top.x.toFixed(1) + " " + p4Top.y.toFixed(1);

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
            var dx = svgX - 140, dy = svgY - originY;
            var nx = Math.max(-1, Math.min(1, dx / 55)), ny = Math.max(-1, Math.min(1, dy / 50));
            var liftIntensity = Math.max(0.4, 1.2 - ny * 1.1);
            slabs.forEach(function(slab, idx) {
              var targetY = -idx * (5.5 * liftIntensity) - (idx === topSlabIndex ? 6 : 0);
              var targetX = nx * (idx * 2.2);
              slab.style.transform = 'translate(' + targetX.toFixed(1) + 'px, ' + targetY.toFixed(1) + 'px)';
            });
          });
          container.addEventListener('mouseleave', function() {
            var slabs = document.querySelectorAll('.iso-slab');
            slabs.forEach(function(slab) { slab.style.transform = 'translate(0px, 0px)'; });
          });
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
