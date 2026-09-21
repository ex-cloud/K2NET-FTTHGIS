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

          <!-- Main Card -->
          <div class="ftth-card">
            <!-- Responsive Card Header with Tier Badge -->
            <div class="ftth-card-header">
              <div class="ftth-card-header-left">
                <div class="ftth-card-header-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                </div>
                <div class="ftth-card-header-text">
                  <span class="ftth-card-title">${orgName}</span>
                  <span class="ftth-card-subtitle">Authenticator TOTP Device Setup</span>
                </div>
              </div>
              <div class="ftth-tier-badge">
                <span>${planDisplayName}</span>
              </div>
            </div>

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
                  '<circle cx="90" cy="75" r="78" stroke="url(#fig07-ringFadeMobile)" stroke-width="0.75" stroke-dasharray="2 6" />' +
                  '<circle cx="90" cy="75" r="66" stroke="url(#fig07-ringFadeMobile)" stroke-width="0.8" />' +
                  '<circle cx="90" cy="75" r="54" stroke="url(#fig07-ringFadeMobile)" stroke-width="0.65" stroke-dasharray="1 5" />' +
                  '<g id="hud-ticks-mobile" stroke="#bef264" stroke-opacity="0.25" stroke-width="0.8"></g>' +
                '</g>' +
                '<g class="k2net-hud-inner-mobile" style="transform-origin:90px 75px;animation:k2net-rotate-hud-reverse 140s linear infinite;">' +
                  '<line x1="90" y1="2" x2="90" y2="10" stroke="#bef264" stroke-opacity="0.4" stroke-width="1" />' +
                  '<line x1="90" y1="140" x2="90" y2="148" stroke="#bef264" stroke-opacity="0.4" stroke-width="1" />' +
                  '<line x1="17" y1="75" x2="25" y2="75" stroke="#bef264" stroke-opacity="0.4" stroke-width="1" />' +
                  '<line x1="155" y1="75" x2="163" y2="75" stroke="#bef264" stroke-opacity="0.4" stroke-width="1" />' +
                '</g>' +
              '</svg>' +
              '<canvas id="mobile-quantum-orb-canvas" width="160" height="150" style="width:160px;height:150px;filter:drop-shadow(0 0 20px rgba(74,222,128,0.3));"></canvas>' +
            '</div>';

          // Build mobile radar ticks along r=66
          var mTicksGroup = document.getElementById('hud-ticks-mobile');
          if (mTicksGroup) {
            var mcx = 90, mcy = 75, mr = 66, mCount = 24;
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
                    '<circle cx="170" cy="170" r="160" stroke="url(#fig07-ringFadeDesktop)" stroke-width="0.75" stroke-dasharray="2 8" />' +
                    '<circle cx="170" cy="170" r="136" stroke="url(#fig07-ringFadeDesktop)" stroke-width="0.8" />' +
                    '<circle cx="170" cy="170" r="112" stroke="url(#fig07-ringFadeDesktop)" stroke-width="0.65" stroke-dasharray="1 6" />' +
                    '<g id="hud-ticks-desktop" stroke="#bef264" stroke-opacity="0.25" stroke-width="0.8"></g>' +
                  '</g>' +
                  '<g class="k2net-hud-inner" style="transform-origin:170px 170px;animation:k2net-rotate-hud-reverse 140s linear infinite;">' +
                    '<line x1="170" y1="6" x2="170" y2="18" stroke="#bef264" stroke-opacity="0.4" stroke-width="1" />' +
                    '<line x1="170" y1="322" x2="170" y2="334" stroke="#bef264" stroke-opacity="0.4" stroke-width="1" />' +
                    '<line x1="6" y1="170" x2="18" y2="170" stroke="#bef264" stroke-opacity="0.4" stroke-width="1" />' +
                    '<line x1="322" y1="170" x2="334" y2="170" stroke="#bef264" stroke-opacity="0.4" stroke-width="1" />' +
                  '</g>' +
                '</svg>' +
                '<canvas id="quantum-orb-canvas" width="320" height="320" style="width:320px;height:320px;filter:drop-shadow(0 0 28px rgba(74,222,128,0.3));"></canvas>' +
              '</div>';

            // Build desktop radar ticks along r=136
            var dTicksGroup = document.getElementById('hud-ticks-desktop');
            if (dTicksGroup) {
              var dcx = 170, dcy = 170, dr = 136, dCount = 36;
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
        }
      })();
    </script>

    </#if>
</@layout.registrationLayout>
