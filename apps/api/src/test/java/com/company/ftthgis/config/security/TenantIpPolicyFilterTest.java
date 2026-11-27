package com.company.ftthgis.config.security;

import com.company.ftthgis.config.tenant.AuditContext;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantSecurityPolicy;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.TenantSecurityPolicyRepository;
import com.company.ftthgis.service.AuditLoggingService;
import com.company.ftthgis.service.SystemSettingService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class TenantIpPolicyFilterTest {

    private OrganizationRepository organizationRepository;
    private TenantSecurityPolicyRepository tenantPolicyRepository;
    private SystemSettingService settingService;
    private AuditLoggingService auditLoggingService;
    private StringRedisTemplate redisTemplate;
    private TenantIpPolicyFilter filter;

    private Organization org;

    @BeforeEach
    void setUp() throws Exception {
        organizationRepository = mock(OrganizationRepository.class);
        tenantPolicyRepository = mock(TenantSecurityPolicyRepository.class);
        settingService = mock(SystemSettingService.class);
        auditLoggingService = mock(AuditLoggingService.class);
        redisTemplate = mock(StringRedisTemplate.class);

        filter = new TenantIpPolicyFilter(
                organizationRepository,
                tenantPolicyRepository,
                settingService,
                auditLoggingService
        );
        var field = TenantIpPolicyFilter.class.getDeclaredField("redisTemplate");
        field.setAccessible(true);
        field.set(filter, redisTemplate);

        org = Organization.builder()
                .id(UUID.randomUUID())
                .name("PT Nusantara")
                .slug("nusantara")
                .build();
        when(organizationRepository.findBySlug("nusantara")).thenReturn(Optional.of(org));
        when(settingService.getSettingBoolean("security.ip_allowlist.tenant_allowed", true)).thenReturn(true);
        setTenantJwt("user-123", "nusantara", "https://auth-gis.kdua.net/realms/k2net-tenants");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        AuditContext.clear();
    }

    private void setTenantJwt(String sub, String tenantSlug, String issuer) {
        Jwt jwt = Jwt.withTokenValue("tok")
                .header("alg", "RS256")
                .subject(sub)
                .claim("tenant_slug", tenantSlug)
                .claim("email", "admin@nusantara.net")
                .issuer(issuer)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(300))
                .build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt, List.of()));
    }

    @Test
    @DisplayName("Blocks API call with HTTP 403 in ENFORCE mode when IP or Country fails AND rule")
    void testEnforceBlocksOutsideIpAndCountry() throws Exception {
        when(tenantPolicyRepository.findByOrganizationIdNative(org.getId())).thenReturn(Optional.of(
                TenantSecurityPolicy.builder()
                        .organization(org)
                        .ipPolicyMode("ENFORCE")
                        .ipAllowlistCidrs("203.0.113.0/24")
                        .allowedCountries("ID,SG")
                        .allowBreakGlassIpBypass(true)
                        .build()
        ));

        // 1. Outside IP -> 403
        MockHttpServletRequest reqBadIp = new MockHttpServletRequest("GET", "/api/v1/projects");
        reqBadIp.addHeader("CF-Connecting-IP", "198.51.100.44");
        reqBadIp.addHeader("CF-IPCountry", "ID");
        MockHttpServletResponse respBadIp = new MockHttpServletResponse();
        MockFilterChain chain1 = new MockFilterChain();
        filter.doFilter(reqBadIp, respBadIp, chain1);
        assertEquals(403, respBadIp.getStatus());
        assertTrue(respBadIp.getContentAsString().contains("TENANT_IP_GEOFENCE_DENIED"));
        verify(auditLoggingService, atLeastOnce()).logEvent(
                eq("nusantara"), eq("SECURITY_IP_POLICY_BLOCKED"), anyString(), anyString(), anyMap(), anyMap(), anyMap());

        // 2. Inside IP but disallowed Country -> 403 (AND rule)
        MockHttpServletRequest reqBadCountry = new MockHttpServletRequest("GET", "/api/v1/projects");
        reqBadCountry.addHeader("CF-Connecting-IP", "203.0.113.25");
        reqBadCountry.addHeader("CF-IPCountry", "RU");
        MockHttpServletResponse respBadCountry = new MockHttpServletResponse();
        filter.doFilter(reqBadCountry, respBadCountry, new MockFilterChain());
        assertEquals(403, respBadCountry.getStatus());

        // 3. Inside IP + Allowed Country -> 200 pass-through
        MockHttpServletRequest reqOk = new MockHttpServletRequest("GET", "/api/v1/projects");
        reqOk.addHeader("CF-Connecting-IP", "203.0.113.25");
        reqOk.addHeader("CF-IPCountry", "ID");
        MockHttpServletResponse respOk = new MockHttpServletResponse();
        filter.doFilter(reqOk, respOk, new MockFilterChain());
        assertEquals(200, respOk.getStatus());
    }

    @Test
    @DisplayName("MONITOR_ONLY allows request with X-K2NET-IP-Policy-Shadow header and shadow audit event")
    void testMonitorOnlyAllowsWithShadowHeader() throws Exception {
        when(tenantPolicyRepository.findByOrganizationIdNative(org.getId())).thenReturn(Optional.of(
                TenantSecurityPolicy.builder()
                        .organization(org)
                        .ipPolicyMode("MONITOR_ONLY")
                        .ipAllowlistCidrs("203.0.113.0/24")
                        .allowedCountries("ID")
                        .build()
        ));

        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/v1/projects");
        req.addHeader("CF-Connecting-IP", "198.51.100.77");
        req.addHeader("CF-IPCountry", "US");
        MockHttpServletResponse resp = new MockHttpServletResponse();
        filter.doFilter(req, resp, new MockFilterChain());

        assertEquals(200, resp.getStatus());
        assertEquals("WOULD_BLOCK", resp.getHeader("X-K2NET-IP-Policy-Shadow"));
        verify(auditLoggingService).logEvent(
                eq("nusantara"), eq("SECURITY_IP_POLICY_SHADOW_HIT"), anyString(), anyString(), anyMap(), anyMap(), anyMap());
    }

    @Test
    @DisplayName("Bypasses filter for Super Admin Impersonation, Platform Realm, SCIM/Internal paths, and Break-Glass")
    void testSafetyExclusionsAndBreakGlassBypass() throws Exception {
        when(tenantPolicyRepository.findByOrganizationIdNative(org.getId())).thenReturn(Optional.of(
                TenantSecurityPolicy.builder()
                        .organization(org)
                        .ipPolicyMode("ENFORCE")
                        .ipAllowlistCidrs("203.0.113.0/24")
                        .allowBreakGlassIpBypass(true)
                        .build()
        ));

        // 1. Super Admin Impersonation
        AuditContext.setImpersonation(UUID.randomUUID(), UUID.randomUUID(), org.getId(), "nusantara");
        MockHttpServletRequest impReq = new MockHttpServletRequest("GET", "/api/v1/projects");
        impReq.addHeader("CF-Connecting-IP", "198.51.100.99");
        MockHttpServletResponse impResp = new MockHttpServletResponse();
        filter.doFilter(impReq, impResp, new MockFilterChain());
        assertEquals(200, impResp.getStatus());
        AuditContext.clear();

        // 2. Active Break-Glass session in Redis when allowBreakGlassIpBypass=true
        when(redisTemplate.hasKey("auth:break-glass-exp:user-123")).thenReturn(true);
        MockHttpServletRequest bgReq = new MockHttpServletRequest("GET", "/api/v1/projects");
        bgReq.addHeader("CF-Connecting-IP", "198.51.100.99");
        MockHttpServletResponse bgResp = new MockHttpServletResponse();
        filter.doFilter(bgReq, bgResp, new MockFilterChain());
        assertEquals(200, bgResp.getStatus());

        // 3. SCIM webhook route skipped by shouldNotFilter
        MockHttpServletRequest scimReq = new MockHttpServletRequest("POST", "/api/v1/scim/v2/nusantara/Users");
        scimReq.addHeader("CF-Connecting-IP", "198.51.100.99");
        MockHttpServletResponse scimResp = new MockHttpServletResponse();
        filter.doFilter(scimReq, scimResp, new MockFilterChain());
        assertEquals(200, scimResp.getStatus());

        // 4. Platform realm token skipped
        setTenantJwt("sys-1", "nusantara", "https://auth-gis.kdua.net/realms/ftth-realm");
        MockHttpServletRequest sysReq = new MockHttpServletRequest("GET", "/api/v1/projects");
        sysReq.addHeader("CF-Connecting-IP", "198.51.100.99");
        MockHttpServletResponse sysResp = new MockHttpServletResponse();
        filter.doFilter(sysReq, sysResp, new MockFilterChain());
        assertEquals(200, sysResp.getStatus());
    }
}
