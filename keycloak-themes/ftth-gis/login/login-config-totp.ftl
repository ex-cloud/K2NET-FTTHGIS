<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true displayMessage=!((messagesPerField.existsError('totp','userLabel'))!false); section>
    <#if section = "header">
        ${msg("loginTotpTitle")}
    <#elseif section = "form">

    <#-- Context variables detection -->
    <#assign isSystem = (realm.name == "ftth-realm" || realm.name == "master" || ((realm.attributes.isSystem)!'') == 'true')>
    <#assign rawOrgName = (realm.displayName)!((realm.attributes.orgName)!realm.name)>
    <#assign orgName = (rawOrgName?has_content && rawOrgName != realm.name)?then(rawOrgName, isSystem?then('K2NET Platform Admin', rawOrgName))>
    <#assign plan = ((realm.attributes.plan)!'FREE')?upper_case>
    <#assign planDisplayName = ((realm.attributes.planDisplayName)!(isSystem?then('SYSTEM ADMIN', (plan == 'PRO' || plan == 'PROFESSIONAL')?then('PROFESSIONAL', (plan == 'ENTERPRISE' || plan == 'ENTERPRISE CORE')?then('ENTERPRISE CORE', 'STARTER TRIAL')))))>
    <#assign logoUrl = ((realm.attributes.logoUrl)!'')>

    <!-- ============================================================
         FTTH GIS — Split-Screen Setup Two-Factor Authentication (TOTP)
         ============================================================ -->
    <div class="ftth-login-container" style="display:flex;min-height:100vh;width:100%;font-family:'Inter',sans-serif;background:#09090b;color:#f4f4f5;overflow-x:hidden;">

      <!-- ─── LEFT COLUMN: TOTP Setup Form ─────────────────────────────── -->
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
            <h1 style="font-size:24px;font-weight:700;letter-spacing:-0.025em;color:#fafafa;margin-bottom:4px;">
              Setup Authenticator
            </h1>
            <p style="font-size:12px;color:#a1a1aa;line-height:1.4;">
              Scan the QR code with Google Authenticator, Microsoft Authenticator, or Authy app.
            </p>
          </div>

          <!-- Main Card -->
          <div style="background:rgba(24,24,27,0.6);border:1px solid rgba(63,63,70,0.7);border-radius:16px;padding:18px 20px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);backdrop-filter:blur(12px);">

            <#if (messagesPerField.existsError('totp','userLabel'))!false>
              <div class="ftth-alert-error" style="margin-bottom:14px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>${kcSanitize(messagesPerField.getFirstError('totp','userLabel'))?no_esc}</span>
              </div>
            </#if>

            <form id="kc-totp-settings-form" action="${url.loginAction}" method="post">

              <!-- QR Code Display -->
              <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:16px;padding:14px;background:rgba(9,9,11,0.8);border:1px solid rgba(63,63,70,0.5);border-radius:12px;">
                <img id="kc-totp-secret-qr-code" src="data:image/png;base64, ${(totp.totpSecretQrCode)!''}" alt="Authenticator QR Code" style="width:140px;height:140px;border-radius:6px;background:#fff;padding:6px;" />
                <div style="margin-top:10px;font-size:10px;color:#a1a1aa;font-family:'JetBrains Mono',monospace;text-align:center;word-break:break-all;">
                  Key: <strong style="color:#22c55e;">${(totp.totpSecretEncoded)!''}</strong>
                </div>
              </div>

              <!-- Verification Code -->
              <div class="form-group" style="margin-bottom:12px;">
                <label for="totp" style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a1a1aa;margin-bottom:6px;display:block;">
                  ${msg("authenticatorCode")}
                </label>
                <input tabindex="1" id="totp" name="totp" type="text" inputmode="numeric"
                  placeholder="000000" maxlength="6" autofocus autocomplete="one-time-code"
                  style="width:100%;height:40px;border-radius:8px;border:1px solid rgba(34,197,94,0.4);background:rgba(9,9,11,0.6);padding:0 12px;font-size:18px;color:#22c55e;outline:none;text-align:center;letter-spacing:6px;font-weight:700;font-family:'JetBrains Mono',monospace;"
                  aria-invalid="<#if (messagesPerField.existsError('totp'))!false>true</#if>">
              </div>

              <!-- Device Label -->
              <div class="form-group" style="margin-bottom:14px;">
                <label for="userLabel" style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a1a1aa;margin-bottom:6px;display:block;">
                  ${msg("loginTotpDeviceName")}
                </label>
                <input tabindex="2" id="userLabel" name="userLabel" type="text"
                  placeholder="e.g. Work Phone / MacBook TouchID"
                  value="${(totp.userLabel!'')}"
                  style="width:100%;height:38px;border-radius:8px;border:1px solid rgba(63,63,70,0.6);background:rgba(9,9,11,0.6);padding:0 12px;font-size:13px;color:#fff;outline:none;"
                  aria-invalid="<#if (messagesPerField.existsError('userLabel'))!false>true</#if>">
              </div>

              <input type="hidden" id="totpSecret" name="totpSecret" value="${(totp.totpSecret)!''}" />

              <#if mode?? && mode = "manual">
                <input type="hidden" id="mode" name="mode" value="${mode}"/>
              </#if>

              <!-- Submit button -->
              <button tabindex="3" class="ftth-btn-primary" name="submitAction" type="submit" style="width:100%;height:40px;border-radius:10px;background:#16a34a;color:#fff;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(22,163,74,0.3);transition:all 0.15s ease;">
                <span>Confirm & Activate 2FA</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>

              <#if isAppInitiatedAction??>
                <button type="submit" name="cancel-aia" value="true" style="width:100%;height:36px;margin-top:8px;border-radius:8px;background:transparent;border:1px solid rgba(63,63,70,0.5);color:#a1a1aa;font-size:12px;cursor:pointer;transition:all 0.15s ease;">
                  Cancel
                </button>
              </#if>

            </form>

          </div><!-- /#ftth-card -->

          <!-- Security notice -->
          <div id="ftth-security-notice" style="border-radius:12px;border:1px solid rgba(34,197,94,0.25);background:rgba(34,197,94,0.05);padding:10px 12px;display:flex;gap:10px;align-items:flex-start;margin-top:12px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" style="flex-shrink:0;margin-top:1px;">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            <span style="font-size:11px;color:#a1a1aa;line-height:1.4;">
              Two-Factor Authentication safeguards your account from unauthorized credential access.
            </span>
          </div>

        </div><!-- /#ftth-form-area -->

        <!-- Bottom Footer Row -->
        <div id="ftth-footer" style="font-size:11px;color:#a1a1aa;border-top:1px solid rgba(63,63,70,0.6);padding-top:12px;margin-top:12px;flex-shrink:0;position:relative;z-index:20;">
          <p style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#71717a;margin:0;">
            &#169; 2026 K2NET Enterprise SaaS Platform. All rights reserved.
          </p>
        </div>

      </div><!-- /#ftth-left -->

      <!-- ─── RIGHT COLUMN: 3D Isometric Figure & Testimonial ───────────── -->
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

        <div style="width:100%;max-width:480px;margin:0 auto;z-index:10;">
          <div style="position:relative;border-radius:16px;border:1px solid rgba(63,63,70,0.7);background:rgba(18,18,21,0.75);padding:24px;backdrop-filter:blur(24px);box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" style="transform:rotate(180deg);margin-bottom:12px;opacity:0.8;">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
            </svg>

            <blockquote style="font-size:13px;font-weight:400;color:rgba(244,244,245,0.9);line-height:1.6;margin-bottom:16px;">
              &#8220;Security, operational transparency, and data integrity form the bedrock of our high-reliability FTTH telemetry network.&#8221;
            </blockquote>

            <div style="display:flex;align-items:center;gap:12px;padding-top:12px;border-top:1px solid rgba(63,63,70,0.4);">
              <div style="height:32px;width:32px;border-radius:50%;background:rgba(34,197,94,0.2);border:1px solid rgba(34,197,94,0.4);display:flex;align-items:center;justify-content:center;color:#22c55e;font-weight:700;font-size:12px;">
                MFA
              </div>
              <div>
                <div style="font-size:12px;font-weight:600;color:#fff;">
                  K2NET Cyber Security Team
                </div>
                <div style="font-size:10px;color:#a1a1aa;font-family:'JetBrains Mono',monospace;">
                  Zero-Trust Identity Protection
                </div>
              </div>
            </div>
          </div>
        </div>

      </div><!-- /#ftth-right -->

    </div><!-- split-screen wrapper -->

    <!-- Scripts -->
    <script>
      (function() {
        var activeHero = "fig-01";
        try {
          activeHero = localStorage.getItem('k2net_active_login_hero') || 
                       localStorage.getItem('k2net_login_hero_variant') || 
                       (document.cookie.match(/k2net_global_login_hero=([^;]+)/) || [])[1] || 
                       "fig-01";
        } catch(e) {}

        var badgeTextEl = document.getElementById('hero-fig-badge-text');

        if (activeHero === "fig-07") {
          if (badgeTextEl) badgeTextEl.textContent = "FIG 0.7: QUANTUM ORB";
          var container = document.getElementById('isometric-container');
          if (container) {
            container.innerHTML = 
              '<div style="position:relative;width:100%;max-width:340px;height:290px;display:flex;align-items:center;justify-content:center;cursor:pointer;">' +
                '<svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;" viewBox="0 0 320 320" fill="none">' +
                  '<circle id="orb-ring-1" cx="160" cy="160" r="140" stroke="#22c55e" stroke-opacity="0.18" stroke-width="1" stroke-dasharray="4 6" />' +
                  '<circle id="orb-ring-2" cx="160" cy="160" r="118" stroke="#22c55e" stroke-opacity="0.25" stroke-width="0.85" />' +
                  '<circle id="orb-ring-3" cx="160" cy="160" r="98" stroke="#22c55e" stroke-opacity="0.35" stroke-width="0.75" />' +
                '</svg>' +
                '<canvas id="quantum-orb-canvas" width="280" height="280" style="width:280px;height:280px;filter:drop-shadow(0 0 32px rgba(34,197,94,0.45));"></canvas>' +
              '</div>';

            var canvas = document.getElementById('quantum-orb-canvas');
            if (canvas) {
              var ctx = canvas.getContext('2d');
              var orbRadius = 78;
              var mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
              var startT = Date.now();

              container.addEventListener('mousemove', function(e) {
                var rect = container.getBoundingClientRect();
                var nx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
                var ny = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
                mouse.targetX = Math.max(-1.2, Math.min(1.2, nx));
                mouse.targetY = Math.max(-1.2, Math.min(1.2, ny));
              });

              container.addEventListener('mouseleave', function() {
                mouse.targetX = 0;
                mouse.targetY = 0;
              });

              function drawOrb() {
                if (!ctx) return;
                mouse.x += (mouse.targetX - mouse.x) * 0.08;
                mouse.y += (mouse.targetY - mouse.y) * 0.08;
                var elapsed = (Date.now() - startT) * 0.001;

                var cx = canvas.width / 2;
                var cy = canvas.height / 2;
                var mx = mouse.x * 18;
                var my = mouse.y * 14;

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Corona Glow
                var corona = ctx.createRadialGradient(cx + mx * 0.4, cy + my * 0.4, orbRadius * 0.65, cx, cy, orbRadius * 1.38);
                corona.addColorStop(0, 'rgba(34, 197, 94, 0.45)');
                corona.addColorStop(0.5, 'rgba(74, 222, 128, 0.2)');
                corona.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = corona;
                ctx.beginPath();
                ctx.arc(cx, cy, orbRadius * 1.38, 0, Math.PI * 2);
                ctx.fill();

                // Core Sphere
                var core = ctx.createRadialGradient(cx - orbRadius * 0.35 + mx, cy - orbRadius * 0.35 + my, orbRadius * 0.08, cx, cy, orbRadius);
                core.addColorStop(0, '#0a160f');
                core.addColorStop(0.65, '#040705');
                core.addColorStop(0.86, '#15803d');
                core.addColorStop(0.97, '#4ade80');
                core.addColorStop(1, '#86efac');
                ctx.fillStyle = core;
                ctx.beginPath();
                ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
                ctx.fill();

                // Fluid waves
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
                ctx.clip();

                var wave = ctx.createRadialGradient(cx + Math.sin(elapsed) * 14, cy + Math.cos(elapsed * 0.8) * 14, orbRadius * 0.2, cx, cy, orbRadius);
                wave.addColorStop(0, 'rgba(34, 197, 94, 0.18)');
                wave.addColorStop(0.7, 'rgba(22, 101, 52, 0.06)');
                wave.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
                ctx.fillStyle = wave;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Specular bead
                var spec = ctx.createRadialGradient(cx - orbRadius * 0.38 + mx * 0.8, cy - orbRadius * 0.38 + my * 0.8, 1, cx - orbRadius * 0.38 + mx * 0.8, cy - orbRadius * 0.38 + my * 0.8, orbRadius * 0.28);
                spec.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
                spec.addColorStop(0.35, 'rgba(134, 239, 172, 0.35)');
                spec.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = spec;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.restore();
                requestAnimationFrame(drawOrb);
              }
              requestAnimationFrame(drawOrb);
            }
          }
        }

        // ─── Mobile Mini Orb Renderer ─────────────────────────────────────────
        (function() {
          var mc = document.getElementById('mobile-isometric-container');
          if (!mc) return;
          mc.innerHTML = '<canvas id="m-orb-canvas" width="120" height="120" style="width:120px;height:120px;filter:drop-shadow(0 0 20px rgba(34,197,94,0.45));"></canvas>';
          var c = document.getElementById('m-orb-canvas');
          if (!c) return;
          var ctx = c.getContext('2d');
          var r = 46, cx = 60, cy = 60, tStart = Date.now();
          function drawMobileOrb() {
            var el = (Date.now() - tStart) * 0.001;
            ctx.clearRect(0, 0, 120, 120);
            var g = ctx.createRadialGradient(cx, cy, r * 0.65, cx, cy, r * 1.35);
            g.addColorStop(0, 'rgba(34,197,94,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r * 1.35, 0, Math.PI * 2); ctx.fill();
            var c2 = ctx.createRadialGradient(cx - r*0.35, cy - r*0.35, r*0.08, cx, cy, r);
            c2.addColorStop(0, '#0a160f'); c2.addColorStop(0.65, '#040705'); c2.addColorStop(0.86, '#15803d'); c2.addColorStop(1, '#4ade80');
            ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
            ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
            var wg = ctx.createRadialGradient(cx + Math.sin(el)*10, cy + Math.cos(el*0.8)*10, r*0.2, cx, cy, r);
            wg.addColorStop(0, 'rgba(34,197,94,0.15)'); wg.addColorStop(1, 'rgba(0,0,0,0.35)');
            ctx.fillStyle = wg; ctx.fillRect(0, 0, 120, 120);
            var s = ctx.createRadialGradient(cx - r*0.38, cy - r*0.38, 1, cx - r*0.38, cy - r*0.38, r*0.28);
            s.addColorStop(0, 'rgba(255,255,255,0.75)'); s.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = s; ctx.fillRect(0, 0, 120, 120); ctx.restore();
            requestAnimationFrame(drawMobileOrb);
          }
          requestAnimationFrame(drawMobileOrb);
        })();

      })();
    </script>

    </#if>
</@layout.registrationLayout>
