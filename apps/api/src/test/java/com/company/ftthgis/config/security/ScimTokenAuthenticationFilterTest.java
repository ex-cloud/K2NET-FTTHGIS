package com.company.ftthgis.config.security;

import com.company.ftthgis.api.tenant.dto.LicenseEntitlementsDto;
import com.company.ftthgis.config.tenant.OrganizationContext;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationScimToken;
import com.company.ftthgis.domain.tenant.repository.OrganizationScimTokenRepository;
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;
import com.company.ftthgis.service.LicenseManagementService;
import com.company.ftthgis.util.SecretEncryptionUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScimTokenAuthenticationFilterTest {

    @Mock
    private OrganizationScimTokenRepository tokenRepository;
    @Mock
    private TenantLicenseRepository tenantLicenseRepository;
    @Mock
    private LicenseManagementService licenseManagementService;
    @Mock
    private FilterChain filterChain;

    private SecretEncryptionUtil encryptionUtil;
    private ScimTokenAuthenticationFilter filter;
    private Organization opsOrg;
    private String rawToken;
    private OrganizationScimToken activeToken;

    @BeforeEach
    void setUp() {
        encryptionUtil = new SecretEncryptionUtil("test-encryption-key-32-chars-ok!", "test");
        filter = new ScimTokenAuthenticationFilter(
                tokenRepository,
                tenantLicenseRepository,
                licenseManagementService,
                encryptionUtil,
                new ObjectMapper()
        );
        opsOrg = Organization.builder()
                .id(UUID.randomUUID())
                .slug("ops")
                .name("K2NET Ops")
                .status(Organization.OrganizationStatus.ACTIVE)
                .build();
        rawToken = "k2_scim_deadbeef_0123456789abcdef0123456789abcdef";
        activeToken = OrganizationScimToken.builder()
                .id(UUID.randomUUID())
                .organization(opsOrg)
                .name("Okta Prod")
                .tokenPrefix("k2_scim_deadbeef")
                .tokenHash(encryptionUtil.sha256Hex(rawToken))
                .isActive(true)
                .expiresAt(OffsetDateTime.now().plusDays(30))
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        OrganizationContext.clear();
    }

    @Test
    void validTokenAndEnterpriseOrg_passesFilterChain() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/v1/scim/v2/ops/Users");
        req.addHeader("Authorization", "Bearer " + rawToken);
        MockHttpServletResponse res = new MockHttpServletResponse();

        when(tokenRepository.findByTokenHashWithOrganization(activeToken.getTokenHash()))
                .thenReturn(Optional.of(activeToken));
        when(licenseManagementService.getEffectiveLicenseEntitlements(opsOrg.getId()))
                .thenReturn(LicenseEntitlementsDto.builder().ssoEnabled(true).build());

        filter.doFilter(req, res, filterChain);

        verify(filterChain).doFilter(req, res);
        assertThat(res.getStatus()).isEqualTo(200);
    }

    @Test
    void crossTenantSlugMismatch_returns403ScimError() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/v1/scim/v2/victim-isp/Users");
        req.addHeader("Authorization", "Bearer " + rawToken);
        MockHttpServletResponse res = new MockHttpServletResponse();

        when(tokenRepository.findByTokenHashWithOrganization(activeToken.getTokenHash()))
                .thenReturn(Optional.of(activeToken));

        filter.doFilter(req, res, filterChain);

        verifyNoInteractions(filterChain);
        assertThat(res.getStatus()).isEqualTo(403);
        assertThat(res.getContentType()).contains("application/scim+json");
        assertThat(res.getContentAsString()).contains("urn:ietf:params:scim:api:messages:2.0:Error");
    }

    @Test
    void missingToken_returns401ScimError() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/v1/scim/v2/ops/ServiceProviderConfig");
        MockHttpServletResponse res = new MockHttpServletResponse();

        filter.doFilter(req, res, filterChain);

        verifyNoInteractions(filterChain);
        assertThat(res.getStatus()).isEqualTo(401);
        assertThat(res.getContentAsString()).contains("urn:ietf:params:scim:api:messages:2.0:Error");
    }

    @Test
    void nonEnterpriseSsoEntitlement_returns403ScimError() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/v1/scim/v2/ops/Users");
        req.addHeader("Authorization", "Bearer " + rawToken);
        MockHttpServletResponse res = new MockHttpServletResponse();

        when(tokenRepository.findByTokenHashWithOrganization(activeToken.getTokenHash()))
                .thenReturn(Optional.of(activeToken));
        when(licenseManagementService.getEffectiveLicenseEntitlements(opsOrg.getId()))
                .thenReturn(LicenseEntitlementsDto.builder().ssoEnabled(false).build());

        filter.doFilter(req, res, filterChain);

        verifyNoInteractions(filterChain);
        assertThat(res.getStatus()).isEqualTo(403);
    }
}
