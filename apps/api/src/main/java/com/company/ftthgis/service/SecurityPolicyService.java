package com.company.ftthgis.service;

import com.company.ftthgis.api.security.dto.EffectiveSecurityPolicyDto;
import com.company.ftthgis.api.security.dto.PlatformSecurityPolicyDto;
import com.company.ftthgis.api.security.dto.TenantSecurityPolicyDto;
import com.company.ftthgis.api.security.dto.UpdatePlatformSecurityPolicyRequest;
import com.company.ftthgis.api.security.dto.UpdateTenantSecurityPolicyRequest;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantSecurityPolicy;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.TenantSecurityPolicyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
        Organization org = organizationRepository.findBySlug(orgSlug)
                .orElseThrow(() -> new IllegalArgumentException("Tenant organization not found: " + orgSlug));

        PlatformSecurityPolicyDto platform = getPlatformPolicy();

        TenantSecurityPolicy policy = tenantPolicyRepository.findByOrganizationIdNative(org.getId())
                .orElseGet(() -> {
                    // Seed default policy if not present
                    TenantSecurityPolicy newPolicy = TenantSecurityPolicy.builder()
                            .organization(org)
                            .mfaEnforced(false)
                            .allowedMethods(String.join(",", platform.getAllowedMethods()))
                            .gracePeriodDays(platform.getGracePeriodDays())
                            .sessionIdleMinutes(platform.getSessionIdleTimeout())
                            .deviceVerificationRequired(false)
                            .build();
                    return tenantPolicyRepository.save(newPolicy);
                });

        boolean effectiveMfa = platform.isMfaEnforced() || policy.isMfaEnforced();
        boolean isLockedByPlatform = platform.isMfaEnforced();

        return TenantSecurityPolicyDto.builder()
                .id(policy.getId())
                .organizationSlug(org.getSlug())
                .organizationName(org.getName())
                .mfaEnforced(policy.isMfaEnforced())
                .allowedMethods(parseMethods(policy.getAllowedMethods()))
                .gracePeriodDays(policy.getGracePeriodDays())
                .sessionIdleMinutes(policy.getSessionIdleMinutes())
                .deviceVerificationRequired(policy.isDeviceVerificationRequired())
                .ipAllowlistCidrs(policy.getIpAllowlistCidrs())
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
        if (request.ipAllowlistCidrs() != null) {
            policy.setIpAllowlistCidrs(request.ipAllowlistCidrs().trim());
        }

        TenantSecurityPolicy saved = tenantPolicyRepository.save(policy);

        auditLoggingService.logEvent(org.getSlug(), "TENANT_SECURITY_POLICY_UPDATE", "TENANT_POLICY",
                saved.getId().toString(), Map.of(), Map.of("mfaEnforced", saved.isMfaEnforced()),
                Map.of("actor", actor != null ? actor : "tenant_admin"));

        log.info("🛡️ Tenant security policy updated for org '{}' by {}: MFA={}, SessionIdle={}m",
                orgSlug, actor, saved.isMfaEnforced(), saved.getSessionIdleMinutes());

        return getTenantPolicy(orgSlug);
    }

    /**
     * Resolves the Effective Security Policy applying the Stricter Wins algorithm.
     */
    @Transactional(readOnly = true)
    public EffectiveSecurityPolicyDto resolveEffectivePolicy(String orgSlug) {
        PlatformSecurityPolicyDto platform = getPlatformPolicy();

        if (orgSlug == null || orgSlug.isBlank() || "default".equalsIgnoreCase(orgSlug)) {
            return EffectiveSecurityPolicyDto.builder()
                    .organizationSlug("default")
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

