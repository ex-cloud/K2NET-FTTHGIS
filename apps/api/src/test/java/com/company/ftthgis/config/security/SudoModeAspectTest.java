package com.company.ftthgis.config.security;

import com.company.ftthgis.api.exception.SudoRequiredException;
import com.company.ftthgis.config.tenant.AuditContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SudoModeAspectTest {

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
        AuditContext.clear();
    }

    private Jwt buildJwt(String sub, String sid) {
        return new Jwt(
                "mock-token",
                Instant.now(),
                Instant.now().plusSeconds(300),
                Map.of("alg", "RS256"),
                Map.of("sub", sub, "sid", sid)
        );
    }

    private RequireSudoMode annotation(String action) {
        RequireSudoMode ann = mock(RequireSudoMode.class);
        when(ann.action()).thenReturn(action);
        return ann;
    }

    @Test
    void allowsWhenSudoKeyExistsInRedis() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        when(redis.hasKey("auth:sudo:user-1:sid-1")).thenReturn(true);

        Jwt jwt = buildJwt("user-1", "sid-1");
        SecurityContextHolder.getContext().setAuthentication(
                new TestingAuthenticationToken(jwt, null, List.of(new SimpleGrantedAuthority("ROLE_USER")))
        );

        SudoModeAspect aspect = new SudoModeAspect(redis);
        assertDoesNotThrow(() -> aspect.enforceSudoMode(annotation("tenant.sso.update")));
    }

    @Test
    void allowsRegularLoginDuringFreshLoginGraceWindow() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        when(redis.hasKey("auth:sudo:user-1:sid-1")).thenReturn(false);
        when(redis.hasKey("auth:break-glass-exp:user-1")).thenReturn(false);
        when(redis.hasKey("auth:login-fresh:user-1:sid-1")).thenReturn(true);

        Jwt jwt = buildJwt("user-1", "sid-1");
        SecurityContextHolder.getContext().setAuthentication(
                new TestingAuthenticationToken(jwt, null, List.of(new SimpleGrantedAuthority("ROLE_USER")))
        );

        SudoModeAspect aspect = new SudoModeAspect(redis);
        assertDoesNotThrow(() -> aspect.enforceSudoMode(annotation("tenant.security_policy.update")));
    }

    @Test
    void blocksWhenNeitherSudoNorFreshLoginExists() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        when(redis.hasKey("auth:sudo:user-1:sid-1")).thenReturn(false);
        when(redis.hasKey("auth:break-glass-exp:user-1")).thenReturn(false);
        when(redis.hasKey("auth:login-fresh:user-1:sid-1")).thenReturn(false);

        Jwt jwt = buildJwt("user-1", "sid-1");
        SecurityContextHolder.getContext().setAuthentication(
                new TestingAuthenticationToken(jwt, null, List.of(new SimpleGrantedAuthority("ROLE_USER")))
        );

        SudoModeAspect aspect = new SudoModeAspect(redis);
        SudoRequiredException ex = assertThrows(
                SudoRequiredException.class,
                () -> aspect.enforceSudoMode(annotation("tenant.sso.update"))
        );
        assertEquals("tenant.sso.update", ex.getAction());
        assertFalse(ex.isBreakGlassSession());
    }

    @Test
    void blocksBreakGlassEvenWhenFreshLoginKeyExistsUntilCryptographicallyElevated() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        when(redis.hasKey("auth:sudo:user-1:sid-bg")).thenReturn(false);
        when(redis.hasKey("auth:break-glass-exp:user-1")).thenReturn(true);
        when(redis.hasKey("auth:login-fresh:user-1:sid-bg")).thenReturn(true);

        Jwt jwt = buildJwt("user-1", "sid-bg");
        SecurityContextHolder.getContext().setAuthentication(
                new TestingAuthenticationToken(jwt, null, List.of(new SimpleGrantedAuthority("ROLE_USER")))
        );

        SudoModeAspect aspect = new SudoModeAspect(redis);
        SudoRequiredException ex = assertThrows(
                SudoRequiredException.class,
                () -> aspect.enforceSudoMode(annotation("tenant.sso.update"))
        );
        assertTrue(ex.isBreakGlassSession());

        when(redis.hasKey("auth:sudo:user-1:sid-bg")).thenReturn(true);
        assertDoesNotThrow(() -> aspect.enforceSudoMode(annotation("tenant.sso.update")));
    }

    @Test
    void bypassesForApiClientAndImpersonation() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        SudoModeAspect aspect = new SudoModeAspect(redis);

        Jwt jwt = buildJwt("user-1", "sid-1");
        SecurityContextHolder.getContext().setAuthentication(
                new TestingAuthenticationToken(jwt, null, List.of(new SimpleGrantedAuthority("ROLE_API_CLIENT")))
        );
        assertDoesNotThrow(() -> aspect.enforceSudoMode(annotation("tenant.sso.update")));

        SecurityContextHolder.getContext().setAuthentication(
                new TestingAuthenticationToken(jwt, null, List.of(new SimpleGrantedAuthority("ROLE_USER")))
        );
        AuditContext.setImpersonation(
                java.util.UUID.randomUUID(),
                java.util.UUID.randomUUID(),
                java.util.UUID.randomUUID(),
                "demo-isp"
        );
        assertDoesNotThrow(() -> aspect.enforceSudoMode(annotation("tenant.sso.update")));
    }

    @Test
    void controlPlaneTierZeroEndpointsCarryExpectedSudoAnnotations() throws NoSuchMethodException {
        RequireSudoMode impersonateSudo = com.company.ftthgis.api.tenant.ImpersonationController.class
                .getMethod(
                        "start",
                        String.class,
                        com.company.ftthgis.api.tenant.dto.ImpersonationStartRequest.class,
                        Jwt.class
                )
                .getAnnotation(RequireSudoMode.class);
        assertNotNull(impersonateSudo);
        assertEquals("system.support.impersonate", impersonateSudo.action());

        RequireSudoMode trashDeleteSudo = com.company.ftthgis.api.system.TrashController.class
                .getMethod(
                        "permanentDelete",
                        com.company.ftthgis.api.system.dto.TrashDto.TrashActionRequest.class
                )
                .getAnnotation(RequireSudoMode.class);
        assertNotNull(trashDeleteSudo);
        assertEquals("system.trash.permanent_delete", trashDeleteSudo.action());

        RequireSudoMode trashEmptySudo = com.company.ftthgis.api.system.TrashController.class
                .getMethod("emptyTrash", String.class)
                .getAnnotation(RequireSudoMode.class);
        assertNotNull(trashEmptySudo);
        assertEquals("system.trash.empty", trashEmptySudo.action());

        RequireSudoMode moduleStatusSudo = com.company.ftthgis.api.system.PlatformModuleAdminController.class
                .getMethod(
                        "updateModuleStatus",
                        String.class,
                        com.company.ftthgis.api.system.dto.UpdateModuleStatusRequest.class
                )
                .getAnnotation(RequireSudoMode.class);
        assertNotNull(moduleStatusSudo);
        assertEquals("system.modules.status_update", moduleStatusSudo.action());

        RequireSudoMode licenseRevokeSudo = com.company.ftthgis.api.system.OrganizationLicenseController.class
                .getMethod(
                        "revokeLicense",
                        java.util.UUID.class,
                        java.util.UUID.class,
                        com.company.ftthgis.api.system.dto.LicenseRevokeRequest.class
                )
                .getAnnotation(RequireSudoMode.class);
        assertNotNull(licenseRevokeSudo);
        assertEquals("system.licensing.revoke", licenseRevokeSudo.action());

        RequireSudoMode orgDeleteSudo = com.company.ftthgis.api.tenant.OrganizationController.class
                .getMethod("delete", String.class, String.class, String.class)
                .getAnnotation(RequireSudoMode.class);
        assertNotNull(orgDeleteSudo);
        assertEquals("system.organizations.delete", orgDeleteSudo.action());

        RequireSudoMode orgResetRealmSudo = com.company.ftthgis.api.tenant.OrganizationController.class
                .getMethod("resetRealm", String.class)
                .getAnnotation(RequireSudoMode.class);
        assertNotNull(orgResetRealmSudo);
        assertEquals("system.organizations.reset_realm", orgResetRealmSudo.action());
    }
}
