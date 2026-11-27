package com.company.ftthgis.service;

import com.company.ftthgis.api.security.dto.*;
import com.company.ftthgis.config.security.ClientIpResolver;
import com.company.ftthgis.config.security.TenantIpPolicyFilter;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantSecurityPolicy;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.TenantSecurityPolicyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * <h1>Security Policy Service & Effective Policy Resolver</h1>
 * <p>
 * Manages Platform Global Security Baselines (Tier 1) and Tenant Security Policies (Tier 2).
 * Implements the <b>Stricter Wins Principle</b> for multi-tenant SaaS security governance.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityPolicyService {

    private final SystemSettingService settingService;
    private final TenantSecurityPolicyRepository tenantPolicyRepository;
    private final OrganizationRepository organizationRepository;
    private final AuditLoggingService auditLoggingService;
    private final KeycloakAdminService keycloakAdminService;
    private final com.company.ftthgis.domain.user.repository.UserRepository userRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.company.ftthgis.domain.user.repository.UserWebauthnCredentialRepository userWebauthnCredentialRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.data.redis.core.StringRedisTemplate redisTemplate;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    @Lazy
    private TenantIpPolicyFilter tenantIpPolicyFilter;

    // Default constants
    private static final String DEFAULT_ALLOWED_METHODS = "totp,webauthn";
    private static final int DEFAULT_GRACE_PERIOD_DAYS = 7;
    private static final int DEFAULT_SESSION_IDLE_TIMEOUT = 30;
    private static final int DEFAULT_MAP_LOCK_DURATION = 10;

    /**
     * Retrieves the platform global baseline security policy (SYSTEM scope).
     */
    @Transactional(readOnly = true)
    public PlatformSecurityPolicyDto getPlatformPolicy() {
        boolean mfaEnforced = settingService.getSettingBoolean("enforce_mfa", false);
        String allowedMethodsRaw = settingService.getSettingValue("security.mfa.allowed_methods", DEFAULT_ALLOWED_METHODS);
        List<String> allowedMethods = parseMethods(allowedMethodsRaw);
        int gracePeriodDays = getIntSetting("security.mfa.grace_period_days", DEFAULT_GRACE_PERIOD_DAYS);
        int sessionIdleTimeout = getIntSetting("session_idle_timeout", DEFAULT_SESSION_IDLE_TIMEOUT);
        int mapAutoLockDuration = getIntSetting("map_auto_lock_duration", DEFAULT_MAP_LOCK_DURATION);
        boolean deviceVerificationEnabled = settingService.getSettingBoolean("device_verification_enabled",
                settingService.getSettingBoolean("security.device_verification_enabled", false));
        boolean tenantCanEnforceMfa = settingService.getSettingBoolean("security.mfa.tenant_can_enforce", true);
        boolean ipAllowlistTenantAllowed = settingService.getSettingBoolean("security.ip_allowlist.tenant_allowed", true);

        // Password policy rules
        int minLength = getIntSetting("password_min_length", 8);
        boolean requireSymbols = settingService.getSettingBoolean("password_require_symbols", true);
        boolean requireNumbers = settingService.getSettingBoolean("password_require_numbers", true);
        boolean requireUppercase = settingService.getSettingBoolean("password_require_uppercase", true);
        int historyLimit = getIntSetting("password_history_limit", 3);
        int expiryDays = getIntSetting("password_expiry_days", 90);

        return PlatformSecurityPolicyDto.builder()
                .mfaEnforced(mfaEnforced)
                .allowedMethods(allowedMethods)
                .gracePeriodDays(gracePeriodDays)
                .sessionIdleTimeout(sessionIdleTimeout)
                .mapAutoLockDuration(mapAutoLockDuration)
                .deviceVerificationEnabled(deviceVerificationEnabled)
                .tenantCanEnforceMfa(tenantCanEnforceMfa)
                .ipAllowlistTenantAllowed(ipAllowlistTenantAllowed)
                .passwordMinLength(minLength)
                .passwordRequireSymbols(requireSymbols)
                .passwordRequireNumbers(requireNumbers)
                .passwordRequireUppercase(requireUppercase)
                .passwordHistoryLimit(historyLimit)
                .passwordExpiryDays(expiryDays)
                .build();
    }

    /**
     * Updates platform baseline security policy (Super Admin only).
     */
    @Transactional
    public PlatformSecurityPolicyDto updatePlatformPolicy(UpdatePlatformSecurityPolicyRequest request, String actor) {
        Map<String, String> updates = new HashMap<>();

        if (request.mfaEnforced() != null) {
            updates.put("enforce_mfa", request.mfaEnforced().toString());
        }
        if (request.allowedMethods() != null && !request.allowedMethods().isEmpty()) {
            updates.put("security.mfa.allowed_methods", String.join(",", request.allowedMethods()));
        }
        if (request.gracePeriodDays() != null) {
            updates.put("security.mfa.grace_period_days", String.valueOf(Math.max(0, request.gracePeriodDays())));
        }
        if (request.sessionIdleTimeout() != null) {
            updates.put("session_idle_timeout", String.valueOf(Math.max(5, request.sessionIdleTimeout())));
        }
        if (request.mapAutoLockDuration() != null) {
            updates.put("map_auto_lock_duration", String.valueOf(Math.max(1, request.mapAutoLockDuration())));
        }
        if (request.deviceVerificationEnabled() != null) {
            updates.put("device_verification_enabled", request.deviceVerificationEnabled().toString());
            updates.put("security.device_verification_enabled", request.deviceVerificationEnabled().toString());
        }
        if (request.tenantCanEnforceMfa() != null) {
            updates.put("security.mfa.tenant_can_enforce", request.tenantCanEnforceMfa().toString());
        }
        if (request.ipAllowlistTenantAllowed() != null) {
            updates.put("security.ip_allowlist.tenant_allowed", request.ipAllowlistTenantAllowed().toString());
        }
        if (request.passwordMinLength() != null) {
            updates.put("password_min_length", String.valueOf(Math.max(8, request.passwordMinLength())));
        }
        if (request.passwordRequireSymbols() != null) {
            updates.put("password_require_symbols", request.passwordRequireSymbols().toString());
        }
        if (request.passwordRequireNumbers() != null) {
            updates.put("password_require_numbers", request.passwordRequireNumbers().toString());
        }
        if (request.passwordRequireUppercase() != null) {
            updates.put("password_require_uppercase", request.passwordRequireUppercase().toString());
        }
        if (request.passwordHistoryLimit() != null) {
            updates.put("password_history_limit", String.valueOf(Math.max(0, request.passwordHistoryLimit())));
        }
        if (request.passwordExpiryDays() != null) {
            updates.put("password_expiry_days", String.valueOf(Math.max(0, request.passwordExpiryDays())));
        }

        settingService.updateSettings(updates);
        if (tenantIpPolicyFilter != null) {
            tenantIpPolicyFilter.evictPlatformFlag();
        }

        auditLoggingService.logEvent("system", "SECURITY_POLICY_UPDATE", "PLATFORM_POLICY", "global",
                Map.of(), Map.of("updatedKeys", updates.keySet()), Map.of("actor", actor != null ? actor : "system"));

        log.info("🛡️ Platform baseline security policy updated by {}: {}", actor, updates.keySet());
        return getPlatformPolicy();
    }

    /**
     * Retrieves the security policy for a specific tenant organization.
     */
    @Transactional
    public TenantSecurityPolicyDto getTenantPolicy(String orgSlug) {
        return getTenantPolicy(orgSlug, null, null);
    }

    /**
     * Retrieves the security policy for a specific tenant organization with caller IP/Country context.
     */
    @Transactional
    public TenantSecurityPolicyDto getTenantPolicy(String orgSlug, String callerIp, String callerCountry) {
        Organization org = organizationRepository.findBySlug(orgSlug)
                .orElseThrow(() -> new IllegalArgumentException("Tenant organization not found: " + orgSlug));

        PlatformSecurityPolicyDto platform = getPlatformPolicy();

        TenantSecurityPolicy policy = tenantPolicyRepository.findByOrganizationIdNative(org.getId())
                .orElseGet(() -> {
                    // Seed default policy if not present
                    TenantSecurityPolicy newPolicy = TenantSecurityPolicy.builder()
                            .organization(org)
                            .mfaEnforced(false)
                            .allowSocialLogin(false)
                            .allowedMethods(String.join(",", platform.getAllowedMethods()))
                            .gracePeriodDays(platform.getGracePeriodDays())
                            .sessionIdleMinutes(platform.getSessionIdleTimeout())
                            .deviceVerificationRequired(false)
                            .ipPolicyMode("ENFORCE")
                            .allowBreakGlassIpBypass(true)
                            .build();
                    return tenantPolicyRepository.save(newPolicy);
                });

        boolean effectiveMfa = platform.isMfaEnforced() || policy.isMfaEnforced();
        boolean isLockedByPlatform = platform.isMfaEnforced();
        String effectiveIpMode = normalizeIpPolicyMode(policy.getIpPolicyMode());

        return TenantSecurityPolicyDto.builder()
                .id(policy.getId())
                .organizationSlug(org.getSlug())
                .organizationName(org.getName())
                .mfaEnforced(policy.isMfaEnforced())
                .allowSocialLogin(policy.isAllowSocialLogin())
                .googleHostedDomain(policy.getGoogleHostedDomain())
                .allowedMethods(parseMethods(policy.getAllowedMethods()))
                .gracePeriodDays(policy.getGracePeriodDays())
                .sessionIdleMinutes(policy.getSessionIdleMinutes())
                .deviceVerificationRequired(policy.isDeviceVerificationRequired())
                .ipAllowlistCidrs(policy.getIpAllowlistCidrs())
                .ipPolicyMode(effectiveIpMode)
                .allowedCountries(ClientIpResolver.parseCountriesCsv(policy.getAllowedCountries()))
                .allowBreakGlassIpBypass(policy.isAllowBreakGlassIpBypass())
                .ipAllowlistPlatformAllowed(platform.isIpAllowlistTenantAllowed())
                .callerIp(callerIp)
                .callerCountry(callerCountry)
                .effectiveMfaEnforced(effectiveMfa)
                .isLockedByPlatform(isLockedByPlatform)
                .updatedAt(policy.getUpdatedAt() != null ? policy.getUpdatedAt() : policy.getCreatedAt())
                .build();
    }

    /**
     * Updates tenant security policy with Anti-Loosening validation.
     */
    @Transactional
    public TenantSecurityPolicyDto updateTenantPolicy(String orgSlug, UpdateTenantSecurityPolicyRequest request, String actor) {
        return updateTenantPolicy(orgSlug, request, actor, null, null);
    }

    /**
     * Updates tenant security policy with Anti-Loosening and Anti-Lockout validation.
     */
    @Transactional
    public TenantSecurityPolicyDto updateTenantPolicy(String orgSlug, UpdateTenantSecurityPolicyRequest request, String actor, String clientIp) {
        return updateTenantPolicy(orgSlug, request, actor, clientIp, null);
    }

    /**
     * Updates tenant security policy with Anti-Loosening and IP/Country Anti-Lockout validation.
     */
    @Transactional
    public TenantSecurityPolicyDto updateTenantPolicy(String orgSlug, UpdateTenantSecurityPolicyRequest request, String actor, String clientIp, String clientCountry) {
        Organization org = organizationRepository.findBySlug(orgSlug)
                .orElseThrow(() -> new IllegalArgumentException("Tenant organization not found: " + orgSlug));

        PlatformSecurityPolicyDto platform = getPlatformPolicy();

        // 1. Validation Floor: Tenant CANNOT relax Platform Baseline!
        if (platform.isMfaEnforced() && request.mfaEnforced() != null && !request.mfaEnforced()) {
            throw new IllegalArgumentException("Cannot disable MFA: Multi-Factor Authentication is enforced globally by Platform policy.");
        }

        if (request.sessionIdleMinutes() != null && request.sessionIdleMinutes() > platform.getSessionIdleTimeout()) {
            throw new IllegalArgumentException(String.format(
                    "Session idle timeout (%d min) cannot exceed platform baseline (%d min). Stricter timeout required.",
                    request.sessionIdleMinutes(), platform.getSessionIdleTimeout()));
        }

        if (request.gracePeriodDays() != null && request.gracePeriodDays() > platform.getGracePeriodDays()) {
            throw new IllegalArgumentException(String.format(
                    "MFA grace period (%d days) cannot exceed platform baseline (%d days).",
                    request.gracePeriodDays(), platform.getGracePeriodDays()));
        }

        if (request.allowedMethods() != null && !request.allowedMethods().isEmpty()) {
            List<String> platformMethods = platform.getAllowedMethods();
            for (String method : request.allowedMethods()) {
                if (!platformMethods.contains(method.toLowerCase(Locale.ROOT).trim())) {
                    throw new IllegalArgumentException(String.format(
                            "MFA method '%s' is not permitted by platform baseline allowed methods: %s",
                            method, platformMethods));
                }
            }
        }

        TenantSecurityPolicy policy = tenantPolicyRepository.findByOrganizationIdNative(org.getId())
                .orElseGet(() -> TenantSecurityPolicy.builder().organization(org).build());

        if (request.mfaEnforced() != null) {
            if (Boolean.TRUE.equals(request.mfaEnforced())
                    && actor != null && !actor.isBlank() && !"admin".equalsIgnoreCase(actor)) {
                boolean callerHasMfa = keycloakAdminService.hasMfaConfigured("k2net-tenants", actor);
                if (!callerHasMfa) {
                    var callerOpt = userRepository.findByEmail(actor);
                    if (callerOpt.isEmpty()) {
                        callerOpt = userRepository.findByUsername(actor);
                    }
                    if (callerOpt.isPresent()) {
                        var callerUser = callerOpt.get();
                        callerHasMfa = callerUser.isMfaEnabled()
                                || (userWebauthnCredentialRepository != null
                                    && !userWebauthnCredentialRepository.findAllByUserId(callerUser.getId()).isEmpty());
                    }
                }
                if (!callerHasMfa) {
                    throw new IllegalArgumentException(
                            "Anti-Lockout Protection: Anda wajib mengaktifkan Authenticator App (2FA/TOTP) atau Passkey (FIDO2) pada akun Anda terlebih dahulu di menu Account Preferences → Security & 2FA sebelum mewajibkan MFA untuk seluruh anggota organisasi.");
                }
            }
            policy.setMfaEnforced(request.mfaEnforced());
        }
        if (request.allowedMethods() != null && !request.allowedMethods().isEmpty()) {
            policy.setAllowedMethods(String.join(",", request.allowedMethods()));
        }
        if (request.gracePeriodDays() != null) {
            policy.setGracePeriodDays(Math.max(0, request.gracePeriodDays()));
        }
        if (request.sessionIdleMinutes() != null) {
            policy.setSessionIdleMinutes(Math.max(5, request.sessionIdleMinutes()));
        }
        if (request.deviceVerificationRequired() != null) {
            policy.setDeviceVerificationRequired(request.deviceVerificationRequired());
        }
        if (request.allowSocialLogin() != null) {
            policy.setAllowSocialLogin(request.allowSocialLogin());
        }
        if (request.googleHostedDomain() != null) {
            String rawHd = request.googleHostedDomain().trim().toLowerCase(Locale.ROOT);
            if (rawHd.startsWith("@")) {
                rawHd = rawHd.substring(1).trim();
            }
            if (rawHd.isBlank()) {
                policy.setGoogleHostedDomain(null);
            } else {
                String cleanHd = TenantSsoDomainService.normalizeAndValidateDomain(rawHd);
                policy.setGoogleHostedDomain(cleanHd);
                try {
                    keycloakAdminService.ensureIdentityProviderForwardParameter("k2net-tenants", "google", "hd");
                } catch (Exception e) {
                    log.debug("Could not reconcile Keycloak Google forwardParameters: {}", e.getMessage());
                }
            }
        }

        // IP Allowlist & Country Geofencing Policy (Platform Toggle + Anti-Lockout Validation)
        boolean touchesIpPolicy = request.ipAllowlistCidrs() != null
                || request.ipPolicyMode() != null
                || request.allowedCountries() != null
                || request.allowBreakGlassIpBypass() != null;
        if (touchesIpPolicy && !platform.isIpAllowlistTenantAllowed()) {
            throw new IllegalArgumentException(
                    "Platform policy disables tenant IP allowlist & geofencing configuration."
            );
        }

        if (request.ipPolicyMode() != null) {
            String normalizedMode = normalizeIpPolicyModeStrict(request.ipPolicyMode());
            policy.setIpPolicyMode(normalizedMode);
        } else if (policy.getIpPolicyMode() == null || policy.getIpPolicyMode().isBlank()) {
            policy.setIpPolicyMode("ENFORCE");
        }

        if (request.allowBreakGlassIpBypass() != null) {
            policy.setAllowBreakGlassIpBypass(request.allowBreakGlassIpBypass());
        }

        if (request.ipAllowlistCidrs() != null) {
            String rawCidrs = request.ipAllowlistCidrs().trim();
            if (!rawCidrs.isBlank()) {
                List<String> validCidrs = ClientIpResolver.parseAndNormalizeCidrListStrict(rawCidrs);
                policy.setIpAllowlistCidrs(String.join(",", validCidrs));
            } else {
                policy.setIpAllowlistCidrs(null);
            }
        }

        if (request.allowedCountries() != null) {
            List<String> cleanCountries = ClientIpResolver.normalizeCountriesStrict(request.allowedCountries());
            policy.setAllowedCountries(cleanCountries.isEmpty() ? null : String.join(",", cleanCountries));
        }

        String targetMode = normalizeIpPolicyMode(policy.getIpPolicyMode());
        if ("ENFORCE".equals(targetMode)) {
            validateCallerAntiLockout(policy, clientIp, clientCountry);
        }

        TenantSecurityPolicy saved = tenantPolicyRepository.save(policy);

        if (request.mfaEnforced() != null) {
            reconcileOrganizationMfa(org, saved.isMfaEnforced());
        }

        if (tenantIpPolicyFilter != null) {
            tenantIpPolicyFilter.evictTenant(org.getId(), org.getSlug());
        }
        if (redisTemplate != null && org.getSlug() != null) {
            try {
                redisTemplate.delete("auth:tenant-ctx:" + org.getSlug().toLowerCase(Locale.ROOT));
            } catch (Exception ignored) {}
        }

        auditLoggingService.logEvent(org.getSlug(), "TENANT_SECURITY_POLICY_UPDATE", "TENANT_POLICY",
                saved.getId() != null ? saved.getId().toString() : "unknown", Map.of(),
                Map.of(
                        "mfaEnforced", saved.isMfaEnforced(),
                        "allowSocialLogin", saved.isAllowSocialLogin(),
                        "googleHostedDomain", saved.getGoogleHostedDomain() != null ? saved.getGoogleHostedDomain() : "",
                        "ipPolicyMode", normalizeIpPolicyMode(saved.getIpPolicyMode()),
                        "ipAllowlistCount", saved.getIpAllowlistCidrs() != null && !saved.getIpAllowlistCidrs().isBlank()
                                ? saved.getIpAllowlistCidrs().split(",").length : 0,
                        "allowedCountries", saved.getAllowedCountries() != null ? saved.getAllowedCountries() : "",
                        "allowBreakGlassIpBypass", saved.isAllowBreakGlassIpBypass()
                ),
                Map.of("actor", actor != null ? actor : "admin"));

        log.info("🛡️ Tenant security policy updated for org '{}' by {}: MFA={}, Social={}, IPMode={}, Countries={}, SessionIdle={}m",
                orgSlug, actor, saved.isMfaEnforced(), saved.isAllowSocialLogin(), saved.getIpPolicyMode(), saved.getAllowedCountries(), saved.getSessionIdleMinutes());

        return getTenantPolicy(orgSlug, clientIp, clientCountry);
    }

    @Transactional(readOnly = true)
    public IpPolicyDryRunResponse dryRunIpPolicy(String orgSlug, IpPolicyDryRunRequest request, String callerIp, String callerCountry) {
        organizationRepository.findBySlug(orgSlug)
                .orElseThrow(() -> new IllegalArgumentException("Tenant organization not found: " + orgSlug));

        String mode = request.ipPolicyMode() != null && !request.ipPolicyMode().isBlank()
                ? normalizeIpPolicyModeStrict(request.ipPolicyMode())
                : "ENFORCE";
        List<String> normalizedCidrs = ClientIpResolver.parseAndNormalizeCidrListStrict(request.ipAllowlistCidrs());
        List<String> normalizedCountries = ClientIpResolver.normalizeCountriesStrict(request.allowedCountries());

        String evalIp = callerIp;
        if (request.testIp() != null && !request.testIp().isBlank()) {
            String rawTestIp = request.testIp().trim();
            String candidate = rawTestIp;
            if (rawTestIp.endsWith("/32")) {
                String base = rawTestIp.substring(0, rawTestIp.length() - 3).trim();
                var addr = ClientIpResolver.parseLiteralInetAddress(base);
                candidate = (addr instanceof java.net.Inet4Address) ? base : "";
            } else if (rawTestIp.endsWith("/128")) {
                String base = rawTestIp.substring(0, rawTestIp.length() - 4).trim();
                var addr = ClientIpResolver.parseLiteralInetAddress(base);
                candidate = (addr instanceof java.net.Inet6Address) ? base : "";
            }
            if (candidate.isEmpty() || !ClientIpResolver.isLiteralIpAddress(candidate)) {
                throw new IllegalArgumentException(
                        "Invalid Test IP format: '" + rawTestIp + "'. Enter a single IPv4/IPv6 address (e.g. 203.0.113.10 or 203.0.113.10/32)."
                );
            }
            evalIp = candidate;
        }
        String evalCountry = callerCountry;
        if (request.testCountry() != null && !request.testCountry().isBlank()) {
            evalCountry = ClientIpResolver.normalizeSingleCountry(request.testCountry());
            if (evalCountry == null) {
                throw new IllegalArgumentException(
                        "Invalid Test Country code: '" + request.testCountry().trim() + "'. Use a 2-letter ISO-3166 code (e.g. ID, SG, US)."
                );
            }
        }

        if ("DISABLED".equals(mode)) {
            return IpPolicyDryRunResponse.builder()
                    .allowed(true)
                    .wouldBlockInEnforce(false)
                    .mode(mode)
                    .reason("policy_disabled")
                    .evaluatedIp(evalIp)
                    .evaluatedCountry(evalCountry)
                    .normalizedCidrs(normalizedCidrs)
                    .normalizedCountries(normalizedCountries)
                    .callerIp(callerIp)
                    .callerCountry(callerCountry)
                    .build();
        }

        String cidrCsv = normalizedCidrs.isEmpty() ? null : String.join(",", normalizedCidrs);
        ClientIpResolver.PolicyDecision decision = ClientIpResolver.evaluateAndPolicy(
                evalIp, evalCountry, cidrCsv, normalizedCountries
        );
        boolean effectiveAllowed = "MONITOR_ONLY".equals(mode) || decision.allowed();

        return IpPolicyDryRunResponse.builder()
                .allowed(effectiveAllowed)
                .wouldBlockInEnforce(!decision.allowed())
                .mode(mode)
                .reason(decision.reason())
                .evaluatedIp(evalIp)
                .evaluatedCountry(evalCountry)
                .normalizedCidrs(normalizedCidrs)
                .normalizedCountries(normalizedCountries)
                .callerIp(callerIp)
                .callerCountry(callerCountry)
                .build();
    }

    @Transactional(readOnly = true)
    public List<SystemIpPolicyOverviewDto> getSystemIpPolicyOverview() {
        return tenantPolicyRepository.findAllWithOrganizationOrderByUpdatedAtDesc()
                .stream()
                .map(p -> {
                    int cidrCount = 0;
                    if (p.getIpAllowlistCidrs() != null && !p.getIpAllowlistCidrs().isBlank()) {
                        cidrCount = (int) Arrays.stream(p.getIpAllowlistCidrs().split(","))
                                .map(String::trim)
                                .filter(s -> !s.isEmpty())
                                .count();
                    }
                    return SystemIpPolicyOverviewDto.builder()
                            .organizationId(p.getOrganization().getId())
                            .organizationName(p.getOrganization().getName())
                            .organizationSlug(p.getOrganization().getSlug())
                            .ipPolicyMode(normalizeIpPolicyMode(p.getIpPolicyMode()))
                            .cidrCount(cidrCount)
                            .allowedCountries(ClientIpResolver.parseCountriesCsv(p.getAllowedCountries()))
                            .allowBreakGlassIpBypass(p.isAllowBreakGlassIpBypass())
                            .updatedAt(p.getUpdatedAt() != null ? p.getUpdatedAt() : p.getCreatedAt())
                            .updatedBy(p.getUpdatedBy())
                            .build();
                })
                .toList();
    }

    private void validateCallerAntiLockout(TenantSecurityPolicy policy, String clientIp, String clientCountry) {
        String cidrs = policy.getIpAllowlistCidrs();
        if (cidrs != null && !cidrs.isBlank()
                && clientIp != null && !clientIp.isBlank()
                && !clientIp.equals("127.0.0.1") && !clientIp.equals("0:0:0:0:0:0:0:1") && !clientIp.equals("::1")) {
            if (!ClientIpResolver.isIpInCidrList(clientIp, cidrs)) {
                throw new IllegalArgumentException(String.format(
                        "Anti-Lockout Protection: Alamat IP Anda saat ini (%s) tidak termasuk dalam daftar CIDR yang dimasukkan. Penyimpanan dibatalkan untuk mencegah Anda terkunci dari sistem.",
                        clientIp));
            }
        }
        List<String> allowedCountries = ClientIpResolver.parseCountriesCsv(policy.getAllowedCountries());
        String normalizedCallerCountry = ClientIpResolver.normalizeSingleCountry(clientCountry);
        if (!allowedCountries.isEmpty() && normalizedCallerCountry != null && !allowedCountries.contains(normalizedCallerCountry)) {
            throw new IllegalArgumentException(String.format(
                    "Anti-Lockout Protection: Kode negara Anda saat ini (%s) tidak termasuk dalam daftar negara yang diizinkan (%s).",
                    normalizedCallerCountry, String.join(", ", allowedCountries)));
        }
    }

    private static String normalizeIpPolicyMode(String raw) {
        if (raw == null || raw.isBlank()) {
            return "ENFORCE";
        }
        String up = raw.trim().toUpperCase(Locale.ROOT);
        if ("DISABLED".equals(up) || "MONITOR_ONLY".equals(up) || "ENFORCE".equals(up)) {
            return up;
        }
        return "ENFORCE";
    }

    private static String normalizeIpPolicyModeStrict(String raw) {
        String up = raw != null ? raw.trim().toUpperCase(Locale.ROOT) : "";
        if (!"DISABLED".equals(up) && !"MONITOR_ONLY".equals(up) && !"ENFORCE".equals(up)) {
            throw new IllegalArgumentException("Mode kebijakan IP harus bernilai DISABLED, MONITOR_ONLY, atau ENFORCE.");
        }
        return up;
    }

    /**
     * Memvalidasi dan menormalkan format CIDR (IPv4/IPv6 literal, tanpa resolusi DNS).
     */
    public static String normalizeCidr(String input) {
        return ClientIpResolver.normalizeCidrStrict(input);
    }

    /**
     * Memeriksa apakah alamat IP berada di dalam jangkauan subnet CIDR secara fail-closed.
     */
    public static boolean isIpInCidr(String ipStr, String cidr) {
        return ClientIpResolver.isIpInCidrList(ipStr, cidr);
    }

    /**
     * Reconciles Keycloak required actions and user flags for all members of an organization.
     */
    public void reconcileOrganizationMfa(Organization org, boolean mfaEnforced) {
        try {
            List<com.company.ftthgis.domain.user.entity.User> members = userRepository.findByOrganizationId(org.getId());
            log.info("🔄 Reconciling MFA enforcement ({}) for {} members of org '{}'", mfaEnforced, members.size(), org.getSlug());
            for (var member : members) {
                if (member.getEmail() == null || member.getEmail().isBlank()) continue;
                boolean hasKeycloakMfa = keycloakAdminService.hasMfaConfigured("k2net-tenants", member.getEmail());
                boolean hasWebauthn = userWebauthnCredentialRepository != null
                        && !userWebauthnCredentialRepository.findAllByUserId(member.getId()).isEmpty();
                member.setMfaEnabled(hasKeycloakMfa || hasWebauthn);
                // Ensure headless Direct Grant is never deadlocked by legacy CONFIGURE_TOTP required action
                keycloakAdminService.removeRequiredActionFromUser("k2net-tenants", member.getEmail(), "CONFIGURE_TOTP");
                userRepository.save(member);
            }
        } catch (Exception e) {
            log.warn("Could not complete MFA reconciliation for org '{}': {}", org.getSlug(), e.getMessage());
        }
    }

    /**
     * Resets MFA credentials for a tenant member and re-assigns required action (Admin Action / Break-Glass).
     */
    @Transactional
    public void resetMemberMfa(String orgSlug, UUID memberId, String operatorEmail) {
        Organization org = organizationRepository.findBySlug(orgSlug)
                .orElseThrow(() -> new NoSuchElementException("Organization not found: " + orgSlug));

        var member = userRepository.findById(memberId)
                .orElseThrow(() -> new NoSuchElementException("Member user not found: " + memberId));

        if (member.getOrganization() == null || !member.getOrganization().getId().equals(org.getId())) {
            throw new IllegalArgumentException("User " + memberId + " does not belong to organization " + orgSlug);
        }

        // Break-glass check: If member is the organization owner or primary admin, log with heightened severity
        boolean isOwner = false;
        if (member.getEmail() != null) {
            String memberEmail = member.getEmail().toLowerCase(Locale.ROOT);
            isOwner = (org.getConfigs() != null && org.getConfigs().stream().anyMatch(c ->
                    "billing_email".equalsIgnoreCase(c.getConfigKey()) && memberEmail.equalsIgnoreCase(c.getConfigValue())))
                    || memberEmail.startsWith("admin@")
                    || memberEmail.startsWith("owner@");
        }
        if (isOwner) {
            log.warn("⚠️ BREAK-GLASS MFA RESET initiated on organization owner {} by operator {}", member.getEmail(), operatorEmail);
        }

        // Reset MFA in Keycloak (removes otp/webauthn credentials and re-assigns CONFIGURE_TOTP required action)
        keycloakAdminService.resetUserMfa("k2net-tenants", member.getEmail());

        // Update local database
        member.setMfaEnabled(false);
        userRepository.save(member);

        // Audit log
        auditLoggingService.logEvent(org.getSlug(), "MFA_RESET", "USER",
                member.getId().toString(),
                Map.of("mfaEnabled", true),
                Map.of("mfaEnabled", false, "requiredAction", "CONFIGURE_TOTP"),
                Map.of("operator", operatorEmail, "targetEmail", member.getEmail(), "isOwner", isOwner));

        log.info("🛡️ Member MFA reset completed for user {} in org {} by {}", member.getEmail(), orgSlug, operatorEmail);
    }

    /**
     * Resolves the Effective Security Policy applying the Stricter Wins algorithm.
     */
    @Transactional(readOnly = true)
    public EffectiveSecurityPolicyDto resolveEffectivePolicy(String orgSlug) {
        PlatformSecurityPolicyDto platform = getPlatformPolicy();

        if (orgSlug == null || orgSlug.isBlank() || "system".equalsIgnoreCase(orgSlug) || "default".equalsIgnoreCase(orgSlug)) {
            return EffectiveSecurityPolicyDto.builder()
                    .organizationSlug("system")
                    .mfaRequired(platform.isMfaEnforced())
                    .allowedMethods(platform.getAllowedMethods())
                    .gracePeriodDays(platform.getGracePeriodDays())
                    .sessionIdleMinutes(platform.getSessionIdleTimeout())
                    .deviceVerificationRequired(platform.isDeviceVerificationEnabled())
                    .isMfaEnforcedByPlatform(platform.isMfaEnforced())
                    .isMfaEnforcedByTenant(false)
                    .effectiveSource("PLATFORM")
                    .build();
        }

        Optional<Organization> orgOpt = organizationRepository.findBySlug(orgSlug);
        if (orgOpt.isEmpty()) {
            return EffectiveSecurityPolicyDto.builder()
                    .organizationSlug(orgSlug)
                    .mfaRequired(platform.isMfaEnforced())
                    .allowedMethods(platform.getAllowedMethods())
                    .gracePeriodDays(platform.getGracePeriodDays())
                    .sessionIdleMinutes(platform.getSessionIdleTimeout())
                    .deviceVerificationRequired(platform.isDeviceVerificationEnabled())
                    .isMfaEnforcedByPlatform(platform.isMfaEnforced())
                    .isMfaEnforcedByTenant(false)
                    .effectiveSource("PLATFORM")
                    .build();
        }

        Organization org = orgOpt.get();
        TenantSecurityPolicy policy = tenantPolicyRepository.findByOrganizationIdNative(org.getId()).orElse(null);

        boolean tenantMfa = policy != null && policy.isMfaEnforced();
        boolean effectiveMfa = platform.isMfaEnforced() || tenantMfa;

        List<String> effectiveMethods;
        if (policy != null && policy.getAllowedMethods() != null && !policy.getAllowedMethods().isBlank()) {
            List<String> tenantMethods = parseMethods(policy.getAllowedMethods());
            List<String> intersection = tenantMethods.stream()
                    .filter(platform.getAllowedMethods()::contains)
                    .collect(Collectors.toList());
            effectiveMethods = !intersection.isEmpty() ? intersection : platform.getAllowedMethods();
        } else {
            effectiveMethods = platform.getAllowedMethods();
        }

        int effectiveGrace = policy != null ? Math.min(platform.getGracePeriodDays(), policy.getGracePeriodDays()) : platform.getGracePeriodDays();
        int effectiveSession = policy != null ? Math.min(platform.getSessionIdleTimeout(), policy.getSessionIdleMinutes()) : platform.getSessionIdleTimeout();
        boolean effectiveDeviceCheck = platform.isDeviceVerificationEnabled() || (policy != null && policy.isDeviceVerificationRequired());

        String source;
        if (platform.isMfaEnforced() && tenantMfa) {
            source = "STRICTER_COMBINED";
        } else if (platform.isMfaEnforced()) {
            source = "PLATFORM";
        } else if (tenantMfa) {
            source = "TENANT";
        } else {
            source = "PLATFORM";
        }

        return EffectiveSecurityPolicyDto.builder()
                .organizationSlug(orgSlug)
                .mfaRequired(effectiveMfa)
                .allowedMethods(effectiveMethods)
                .gracePeriodDays(effectiveGrace)
                .sessionIdleMinutes(effectiveSession)
                .deviceVerificationRequired(effectiveDeviceCheck)
                .isMfaEnforcedByPlatform(platform.isMfaEnforced())
                .isMfaEnforcedByTenant(tenantMfa)
                .effectiveSource(source)
                .build();
    }

    // Helper utilities
    private List<String> parseMethods(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of("totp", "webauthn");
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> s.toLowerCase(Locale.ROOT))
                .distinct()
                .collect(Collectors.toList());
    }

    private int getIntSetting(String key, int defaultValue) {
        try {
            return Integer.parseInt(settingService.getSettingValue(key, String.valueOf(defaultValue)));
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}

