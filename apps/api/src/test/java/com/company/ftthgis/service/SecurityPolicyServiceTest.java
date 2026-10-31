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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class SecurityPolicyServiceTest {

    private SystemSettingService settingService;
    private TenantSecurityPolicyRepository tenantPolicyRepository;
    private OrganizationRepository organizationRepository;
    private AuditLoggingService auditLoggingService;
    private KeycloakAdminService keycloakAdminService;
    private com.company.ftthgis.domain.user.repository.UserRepository userRepository;

    private SecurityPolicyService securityPolicyService;

    private Organization testOrg;
    private UUID testOrgId;

    @BeforeEach
    void setUp() {
        settingService = mock(SystemSettingService.class);
        tenantPolicyRepository = mock(TenantSecurityPolicyRepository.class);
        organizationRepository = mock(OrganizationRepository.class);
        auditLoggingService = mock(AuditLoggingService.class);
        keycloakAdminService = mock(KeycloakAdminService.class);
        userRepository = mock(com.company.ftthgis.domain.user.repository.UserRepository.class);

        securityPolicyService = new SecurityPolicyService(
                settingService,
                tenantPolicyRepository,
                organizationRepository,
                auditLoggingService,
                keycloakAdminService,
                userRepository
        );

        testOrgId = UUID.randomUUID();
        testOrg = Organization.builder()
                .id(testOrgId)
                .name("FiberNet ISP")
                .slug("fibernet")
                .build();

        when(organizationRepository.findBySlug("fibernet")).thenReturn(Optional.of(testOrg));

        // Default platform settings mock
        when(settingService.getSettingBoolean("enforce_mfa", false)).thenReturn(false);
        when(settingService.getSettingValue("security.mfa.allowed_methods", "totp,webauthn")).thenReturn("totp,webauthn");
        when(settingService.getSettingValue("security.mfa.grace_period_days", "7")).thenReturn("7");
        when(settingService.getSettingValue("session_idle_timeout", "30")).thenReturn("30");
        when(settingService.getSettingValue("map_auto_lock_duration", "10")).thenReturn("10");
        when(settingService.getSettingBoolean("device_verification_enabled", false)).thenReturn(false);
        when(settingService.getSettingBoolean("security.mfa.tenant_can_enforce", true)).thenReturn(true);
        when(settingService.getSettingBoolean("security.ip_allowlist.tenant_allowed", true)).thenReturn(true);
        when(settingService.getSettingValue("password_min_length", "8")).thenReturn("8");
        when(settingService.getSettingBoolean("password_require_symbols", true)).thenReturn(true);
        when(settingService.getSettingBoolean("password_require_numbers", true)).thenReturn(true);
        when(settingService.getSettingBoolean("password_require_uppercase", true)).thenReturn(true);
        when(settingService.getSettingValue("password_history_limit", "3")).thenReturn("3");
        when(settingService.getSettingValue("password_expiry_days", "90")).thenReturn("90");
    }

    @Test
    @DisplayName("S1: getPlatformPolicy returns baseline defaults accurately")
    void testGetPlatformPolicy_ReturnsBaselineDefaults() {
        PlatformSecurityPolicyDto policy = securityPolicyService.getPlatformPolicy();

        assertNotNull(policy);
        assertFalse(policy.isMfaEnforced());
        assertEquals(List.of("totp", "webauthn"), policy.getAllowedMethods());
        assertEquals(7, policy.getGracePeriodDays());
        assertEquals(30, policy.getSessionIdleTimeout());
        assertEquals(10, policy.getMapAutoLockDuration());
        assertEquals(8, policy.getPasswordMinLength());
        assertTrue(policy.isPasswordRequireSymbols());
    }

    @Test
    @DisplayName("S2: updatePlatformPolicy updates SystemSettingService and triggers audit log")
    void testUpdatePlatformPolicy_UpdatesSettingsAndAudits() {
        UpdatePlatformSecurityPolicyRequest request = new UpdatePlatformSecurityPolicyRequest(
                true,
                List.of("webauthn", "totp"),
                5,
                15,
                5,
                true,
                true,
                true,
                10,
                true,
                true,
                true,
                5,
                60
        );

        securityPolicyService.updatePlatformPolicy(request, "super_admin@k2net.io");

        verify(settingService).updateSettings(argThat(map ->
                "true".equals(map.get("enforce_mfa")) &&
                "15".equals(map.get("session_idle_timeout")) &&
                "10".equals(map.get("password_min_length"))
        ));

        verify(auditLoggingService).logEvent(eq("system"), eq("SECURITY_POLICY_UPDATE"), eq("PLATFORM_POLICY"), anyString(), anyMap(), anyMap(), anyMap());
    }

    @Test
    @DisplayName("S3: getTenantPolicy seeds default policy when none exists")
    void testGetTenantPolicy_SeedsDefaultWhenMissing() {
        when(tenantPolicyRepository.findByOrganizationIdNative(testOrgId)).thenReturn(Optional.empty());
        when(tenantPolicyRepository.save(any(TenantSecurityPolicy.class))).thenAnswer(invocation -> {
            TenantSecurityPolicy p = invocation.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });

        TenantSecurityPolicyDto dto = securityPolicyService.getTenantPolicy("fibernet");

        assertNotNull(dto);
        assertEquals("fibernet", dto.getOrganizationSlug());
        assertFalse(dto.isMfaEnforced());
        assertFalse(dto.isLockedByPlatform());
        assertEquals(30, dto.getSessionIdleMinutes());
        assertEquals(7, dto.getGracePeriodDays());
        verify(tenantPolicyRepository).save(any(TenantSecurityPolicy.class));
    }

    @Test
    @DisplayName("S4: updateTenantPolicy rejects disabling MFA when Platform enforces it (Anti-Loosening Floor)")
    void testUpdateTenantPolicy_RejectsDisablingMfaWhenPlatformEnforces() {
        // Platform enforces MFA globally
        when(settingService.getSettingBoolean("enforce_mfa", false)).thenReturn(true);

        UpdateTenantSecurityPolicyRequest request = new UpdateTenantSecurityPolicyRequest(
                false, // Tenant tries to turn off MFA
                null, null, null, null, null
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                securityPolicyService.updateTenantPolicy("fibernet", request, "admin@fibernet.net")
        );
        assertTrue(ex.getMessage().contains("Cannot disable MFA"));
    }

    @Test
    @DisplayName("S5: updateTenantPolicy rejects session timeout greater than Platform baseline")
    void testUpdateTenantPolicy_RejectsSessionTimeoutLoosening() {
        // Platform session timeout = 30 min
        when(settingService.getSettingValue("session_idle_timeout", "30")).thenReturn("30");

        UpdateTenantSecurityPolicyRequest request = new UpdateTenantSecurityPolicyRequest(
                null, null, null,
                45, // Tenant tries 45 min (looser than 30 min baseline)
                null, null
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                securityPolicyService.updateTenantPolicy("fibernet", request, "admin@fibernet.net")
        );
        assertTrue(ex.getMessage().contains("cannot exceed platform baseline"));
    }

    @Test
    @DisplayName("S6: updateTenantPolicy rejects grace period greater than Platform baseline")
    void testUpdateTenantPolicy_RejectsGracePeriodLoosening() {
        // Platform grace period = 7 days
        when(settingService.getSettingValue("security.mfa.grace_period_days", "7")).thenReturn("7");

        UpdateTenantSecurityPolicyRequest request = new UpdateTenantSecurityPolicyRequest(
                null, null,
                14, // Tenant tries 14 days (looser than 7 days)
                null, null, null
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                securityPolicyService.updateTenantPolicy("fibernet", request, "admin@fibernet.net")
        );
        assertTrue(ex.getMessage().contains("cannot exceed platform baseline"));
    }

    @Test
    @DisplayName("S7: updateTenantPolicy rejects disallowed MFA method")
    void testUpdateTenantPolicy_RejectsDisallowedMethod() {
        // Platform only permits totp and webauthn
        when(settingService.getSettingValue("security.mfa.allowed_methods", "totp,webauthn")).thenReturn("totp,webauthn");

        UpdateTenantSecurityPolicyRequest request = new UpdateTenantSecurityPolicyRequest(
                null,
                List.of("totp", "sms_unsupported"), // sms is not allowed by platform
                null, null, null, null
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                securityPolicyService.updateTenantPolicy("fibernet", request, "admin@fibernet.net")
        );
        assertTrue(ex.getMessage().contains("is not permitted by platform baseline"));
    }

    @Test
    @DisplayName("S8: updateTenantPolicy succeeds when stricter than Platform baseline")
    void testUpdateTenantPolicy_SucceedsWhenStricter() {
        TenantSecurityPolicy existing = TenantSecurityPolicy.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .mfaEnforced(false)
                .allowedMethods("totp,webauthn")
                .sessionIdleMinutes(30)
                .gracePeriodDays(7)
                .build();
        when(tenantPolicyRepository.findByOrganizationIdNative(testOrgId)).thenReturn(Optional.of(existing));
        when(tenantPolicyRepository.save(any(TenantSecurityPolicy.class))).thenAnswer(i -> i.getArgument(0));

        UpdateTenantSecurityPolicyRequest request = new UpdateTenantSecurityPolicyRequest(
                true, // Tenant enforces MFA
                List.of("webauthn"), // Tenant restricts to only WebAuthn (Passkeys)
                3, // Stricter grace period: 3 days
                15, // Stricter timeout: 15 min
                true,
                "192.168.1.0/24"
        );

        TenantSecurityPolicyDto dto = securityPolicyService.updateTenantPolicy("fibernet", request, "admin@fibernet.net");

        assertNotNull(dto);
        assertTrue(dto.isMfaEnforced());
        assertEquals(List.of("webauthn"), dto.getAllowedMethods());
        assertEquals(15, dto.getSessionIdleMinutes());
        assertEquals(3, dto.getGracePeriodDays());
        assertTrue(dto.isDeviceVerificationRequired());
        assertEquals("192.168.1.0/24", dto.getIpAllowlistCidrs());
    }

    @Test
    @DisplayName("S9: resolveEffectivePolicy with null slug returns Platform baseline")
    void testResolveEffectivePolicy_DefaultSlug_ReturnsPlatform() {
        when(settingService.getSettingBoolean("enforce_mfa", false)).thenReturn(true);

        EffectiveSecurityPolicyDto effective = securityPolicyService.resolveEffectivePolicy("default");

        assertNotNull(effective);
        assertTrue(effective.isMfaRequired());
        assertTrue(effective.isMfaEnforcedByPlatform());
        assertFalse(effective.isMfaEnforcedByTenant());
        assertEquals("PLATFORM", effective.getEffectiveSource());
    }

    @Test
    @DisplayName("S10: resolveEffectivePolicy Stricter Wins — Platform ON, Tenant OFF -> MFA Required (PLATFORM)")
    void testResolveEffectivePolicy_PlatformOnTenantOff_MfaRequired() {
        when(settingService.getSettingBoolean("enforce_mfa", false)).thenReturn(true);

        TenantSecurityPolicy tenantPolicy = TenantSecurityPolicy.builder()
                .organization(testOrg)
                .mfaEnforced(false)
                .allowedMethods("totp,webauthn")
                .sessionIdleMinutes(30)
                .gracePeriodDays(7)
                .build();
        when(tenantPolicyRepository.findByOrganizationIdNative(testOrgId)).thenReturn(Optional.of(tenantPolicy));

        EffectiveSecurityPolicyDto effective = securityPolicyService.resolveEffectivePolicy("fibernet");

        assertTrue(effective.isMfaRequired());
        assertTrue(effective.isMfaEnforcedByPlatform());
        assertFalse(effective.isMfaEnforcedByTenant());
        assertEquals("PLATFORM", effective.getEffectiveSource());
    }

    @Test
    @DisplayName("S11: resolveEffectivePolicy Stricter Wins — Platform OFF, Tenant ON -> MFA Required (TENANT)")
    void testResolveEffectivePolicy_PlatformOffTenantOn_MfaRequired() {
        when(settingService.getSettingBoolean("enforce_mfa", false)).thenReturn(false);

        TenantSecurityPolicy tenantPolicy = TenantSecurityPolicy.builder()
                .organization(testOrg)
                .mfaEnforced(true)
                .allowedMethods("totp,webauthn")
                .sessionIdleMinutes(30)
                .gracePeriodDays(7)
                .build();
        when(tenantPolicyRepository.findByOrganizationIdNative(testOrgId)).thenReturn(Optional.of(tenantPolicy));

        EffectiveSecurityPolicyDto effective = securityPolicyService.resolveEffectivePolicy("fibernet");

        assertTrue(effective.isMfaRequired());
        assertFalse(effective.isMfaEnforcedByPlatform());
        assertTrue(effective.isMfaEnforcedByTenant());
        assertEquals("TENANT", effective.getEffectiveSource());
    }

    @Test
    @DisplayName("S12: resolveEffectivePolicy Stricter Wins — Both ON -> STRICTER_COMBINED & Min Values")
    void testResolveEffectivePolicy_BothOn_StricterCombinedWithMinValues() {
        // Platform: MFA=true, session=30m, grace=7d, allowed=[totp, webauthn]
        when(settingService.getSettingBoolean("enforce_mfa", false)).thenReturn(true);
        when(settingService.getSettingValue("session_idle_timeout", "30")).thenReturn("30");
        when(settingService.getSettingValue("security.mfa.grace_period_days", "7")).thenReturn("7");
        when(settingService.getSettingValue("security.mfa.allowed_methods", "totp,webauthn")).thenReturn("totp,webauthn");

        // Tenant: MFA=true, session=10m (stricter), grace=3d (stricter), allowed=[webauthn] (subset)
        TenantSecurityPolicy tenantPolicy = TenantSecurityPolicy.builder()
                .organization(testOrg)
                .mfaEnforced(true)
                .allowedMethods("webauthn")
                .sessionIdleMinutes(10)
                .gracePeriodDays(3)
                .deviceVerificationRequired(true)
                .build();
        when(tenantPolicyRepository.findByOrganizationIdNative(testOrgId)).thenReturn(Optional.of(tenantPolicy));

        EffectiveSecurityPolicyDto effective = securityPolicyService.resolveEffectivePolicy("fibernet");

        assertTrue(effective.isMfaRequired());
        assertTrue(effective.isMfaEnforcedByPlatform());
        assertTrue(effective.isMfaEnforcedByTenant());
        assertEquals("STRICTER_COMBINED", effective.getEffectiveSource());
        assertEquals(10, effective.getSessionIdleMinutes(), "Should resolve to minimum session timeout (10 min)");
        assertEquals(3, effective.getGracePeriodDays(), "Should resolve to minimum grace period (3 days)");
        assertEquals(List.of("webauthn"), effective.getAllowedMethods(), "Should resolve to intersection of allowed methods");
        assertTrue(effective.isDeviceVerificationRequired());
    }

    @Test
    @DisplayName("S13: Reconcile organization members - Assign CONFIGURE_TOTP required action when MFA enforced")
    void testReconcileOrganizationMfa_AssignsRequiredAction() {
        UUID memberId = UUID.randomUUID();
        com.company.ftthgis.domain.user.entity.User member = com.company.ftthgis.domain.user.entity.User.builder()
                .id(memberId)
                .email("tech@fibernet.net")
                .organization(testOrg)
                .mfaEnabled(false)
                .build();

        when(userRepository.findByOrganizationId(testOrgId)).thenReturn(List.of(member));
        when(keycloakAdminService.hasMfaConfigured("k2net-tenants", "tech@fibernet.net")).thenReturn(false);

        securityPolicyService.reconcileOrganizationMfa(testOrg, true);

        verify(keycloakAdminService).addRequiredActionToUser("k2net-tenants", "tech@fibernet.net", "CONFIGURE_TOTP");
        verify(userRepository).save(member);
        assertFalse(member.isMfaEnabled());
    }

    @Test
    @DisplayName("S14: Reset member MFA - Clears Keycloak credentials and updates local user flag")
    void testResetMemberMfa_Success() {
        UUID memberId = UUID.randomUUID();
        com.company.ftthgis.domain.user.entity.User member = com.company.ftthgis.domain.user.entity.User.builder()
                .id(memberId)
                .email("engineer@fibernet.net")
                .organization(testOrg)
                .mfaEnabled(true)
                .build();

        when(userRepository.findById(memberId)).thenReturn(Optional.of(member));

        securityPolicyService.resetMemberMfa("fibernet", memberId, "admin@fibernet.net");

        verify(keycloakAdminService).resetUserMfa("k2net-tenants", "engineer@fibernet.net");
        assertFalse(member.isMfaEnabled());
        verify(userRepository).save(member);
        verify(auditLoggingService).logEvent(eq("fibernet"), eq("MFA_RESET"), eq("USER"),
                eq(memberId.toString()), anyMap(), anyMap(), anyMap());
    }
}
