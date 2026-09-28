package com.company.ftthgis.config.tenant;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrganizationStatusFilterTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private FilterChain filterChain;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    private OrganizationStatusFilter filter;

    @BeforeEach
    void setUp() {
        filter = new OrganizationStatusFilter(organizationRepository);
        SecurityContextHolder.setContext(securityContext);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        OrganizationContext.clear();
    }

    private void mockJwtAuthentication(String issuer) {
        try {
            Jwt jwt = mock(Jwt.class);
            when(jwt.getIssuer()).thenReturn(java.net.URI.create(issuer).toURL());
            when(authentication.getPrincipal()).thenReturn(jwt);
            when(securityContext.getAuthentication()).thenReturn(authentication);
        } catch (java.net.MalformedURLException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    @DisplayName("Active trial organization allows both GET and POST requests")
    void testActiveTrial_AllRequestsAllowed() throws ServletException, IOException {
        Organization org = Organization.builder()
                .id(UUID.randomUUID())
                .name("Active Trial Org")
                .slug("active-trial")
                .realmKey("active-trial")
                .status(Organization.OrganizationStatus.TRIAL)
                .trialExpiresAt(LocalDateTime.now().plusDays(10))
                .build();

        when(organizationRepository.findBySlug("active-trial")).thenReturn(Optional.of(org));
        mockJwtAuthentication("http://localhost:8081/realms/active-trial");

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/network/olts");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertEquals(200, response.getStatus());
    }

    @Test
    @DisplayName("Expired trial during grace period allows GET (Read-Only) but blocks POST")
    void testExpiredTrialGracePeriod_GetAllowed_PostBlocked() throws ServletException, IOException {
        Organization org = Organization.builder()
                .id(UUID.randomUUID())
                .name("Expired Trial Org")
                .slug("expired-trial")
                .realmKey("expired-trial")
                .status(Organization.OrganizationStatus.TRIAL_EXPIRED)
                .trialExpiresAt(LocalDateTime.now().minusDays(2))
                .gracePeriodUntil(LocalDateTime.now().plusDays(5)) // Grace period still active
                .build();

        when(organizationRepository.findBySlug("expired-trial")).thenReturn(Optional.of(org));
        mockJwtAuthentication("http://localhost:8081/realms/expired-trial");

        // 1. GET request -> Allowed
        MockHttpServletRequest getRequest = new MockHttpServletRequest("GET", "/api/v1/network/olts");
        MockHttpServletResponse getResponse = new MockHttpServletResponse();
        filter.doFilterInternal(getRequest, getResponse, filterChain);
        verify(filterChain).doFilter(getRequest, getResponse);

        // 2. POST request -> Blocked with 403 and ORGANIZATION_TRIAL_EXPIRED
        MockHttpServletRequest postRequest = new MockHttpServletRequest("POST", "/api/v1/network/olts");
        MockHttpServletResponse postResponse = new MockHttpServletResponse();
        filter.doFilterInternal(postRequest, postResponse, filterChain);

        assertEquals(403, postResponse.getStatus());
        assertTrue(postResponse.getContentAsString().contains("ORGANIZATION_TRIAL_EXPIRED"));
        assertTrue(postResponse.getContentAsString().contains("Read-Only Grace Period"));
    }

    @Test
    @DisplayName("Expired trial after grace period (Soft-Locked) blocks operational GET requests")
    void testExpiredTrialSoftLocked_AllOperationalRequestsBlocked() throws ServletException, IOException {
        Organization org = Organization.builder()
                .id(UUID.randomUUID())
                .name("Locked Org")
                .slug("locked-trial")
                .realmKey("locked-trial")
                .status(Organization.OrganizationStatus.TRIAL_EXPIRED)
                .trialExpiresAt(LocalDateTime.now().minusDays(20))
                .gracePeriodUntil(LocalDateTime.now().minusDays(5)) // Grace period elapsed -> soft-locked
                .build();

        when(organizationRepository.findBySlug("locked-trial")).thenReturn(Optional.of(org));
        mockJwtAuthentication("http://localhost:8081/realms/locked-trial");

        MockHttpServletRequest getRequest = new MockHttpServletRequest("GET", "/api/v1/network/olts");
        MockHttpServletResponse getResponse = new MockHttpServletResponse();

        filter.doFilterInternal(getRequest, getResponse, filterChain);

        assertEquals(403, getResponse.getStatus());
        assertTrue(getResponse.getContentAsString().contains("ORGANIZATION_TRIAL_EXPIRED"));
        assertTrue(getResponse.getContentAsString().contains("Akses telah dikunci"));
    }

    @Test
    @DisplayName("Expired trial soft-locked tenant can still access billing, user profile, and logout")
    void testExpiredTrialSoftLocked_BillingAndLogoutAllowed() throws ServletException, IOException {
        Organization org = Organization.builder()
                .id(UUID.randomUUID())
                .name("Locked Org")
                .slug("locked-trial")
                .realmKey("locked-trial")
                .status(Organization.OrganizationStatus.TRIAL_EXPIRED)
                .trialExpiresAt(LocalDateTime.now().minusDays(20))
                .gracePeriodUntil(LocalDateTime.now().minusDays(5))
                .build();

        when(organizationRepository.findBySlug("locked-trial")).thenReturn(Optional.of(org));
        mockJwtAuthentication("http://localhost:8081/realms/locked-trial");

        // Billing access
        MockHttpServletRequest billingReq = new MockHttpServletRequest("GET", "/api/v1/billing/invoices");
        MockHttpServletResponse billingResp = new MockHttpServletResponse();
        filter.doFilterInternal(billingReq, billingResp, filterChain);
        verify(filterChain).doFilter(billingReq, billingResp);

        // User profile access
        MockHttpServletRequest meReq = new MockHttpServletRequest("GET", "/api/v1/users/me");
        MockHttpServletResponse meResp = new MockHttpServletResponse();
        filter.doFilterInternal(meReq, meResp, filterChain);
        verify(filterChain).doFilter(meReq, meResp);
    }
}
