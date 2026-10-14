package com.company.ftthgis.config.security;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantApiKey;
import com.company.ftthgis.domain.tenant.entity.TenantApiToken;
import com.company.ftthgis.domain.tenant.repository.TenantApiKeyRepository;
import com.company.ftthgis.domain.tenant.repository.TenantApiTokenRepository;
import com.company.ftthgis.util.SecretEncryptionUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ScopedTokenAuthenticationFilterTest {

    @Mock
    private TenantApiTokenRepository tokenRepository;

    @Mock
    private TenantApiKeyRepository apiKeyRepository;

    @Mock
    private SecretEncryptionUtil encryptionUtil;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private ObjectMapper objectMapper = new ObjectMapper();
    private ScopedTokenAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        filter = new ScopedTokenAuthenticationFilter(tokenRepository, apiKeyRepository, encryptionUtil, objectMapper);
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should pass through if no scoped token present")
    void testPassThrough() throws Exception {
        when(request.getHeader("X-API-Key")).thenReturn(null);
        when(request.getHeader("X-Scoped-Token")).thenReturn(null);
        when(request.getHeader("Authorization")).thenReturn(null);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    @DisplayName("Should authenticate valid scoped token and inject scopes")
    void testValidScopedToken() throws Exception {
        String rawToken = "k2_tok_garut_1234567890abcdef1234567890abcdef";
        String tokenHash = "dummy-sha256-hash";

        when(request.getHeader("X-API-Key")).thenReturn(null);
        when(request.getHeader("X-Scoped-Token")).thenReturn(rawToken);
        when(encryptionUtil.sha256Hex(rawToken)).thenReturn(tokenHash);

        Organization org = Organization.builder()
                .id(UUID.randomUUID())
                .name("PT Garut Fiber")
                .slug("garut")
                .build();

        TenantApiToken token = TenantApiToken.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .name("Integration Token")
                .tokenHash(tokenHash)
                .scopes("[\"coverage:read\", \"network:read\"]")
                .isRevoked(false)
                .expiresAt(LocalDateTime.now().plusDays(30))
                .build();

        when(tokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(token));

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals("scoped-token:garut:Integration Token", SecurityContextHolder.getContext().getAuthentication().getPrincipal());

        var authorities = SecurityContextHolder.getContext().getAuthentication().getAuthorities();
        assertTrue(authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_SCOPED_CLIENT")));
        assertTrue(authorities.stream().anyMatch(a -> a.getAuthority().equals("scope:coverage:read")));
        assertTrue(authorities.stream().anyMatch(a -> a.getAuthority().equals("coverage.read")));
    }

    @Test
    @DisplayName("Should authenticate valid Developer API Key via X-API-Key header")
    void testValidDeveloperApiKey() throws Exception {
        String rawApiKey = "k2_live_garu_1234567890abcdef1234567890abcdef";
        String keyHash = "api-key-hash-123";

        when(request.getHeader("X-API-Key")).thenReturn(rawApiKey);
        when(encryptionUtil.sha256Hex(rawApiKey)).thenReturn(keyHash);

        Organization org = Organization.builder()
                .id(UUID.randomUUID())
                .name("PT Garut Fiber")
                .slug("garut")
                .build();

        TenantApiKey apiKey = TenantApiKey.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .name("B2B Live API Key")
                .keyPrefix("k2_live_garu")
                .keyHash(keyHash)
                .scopes("read:network,read:telemetry")
                .isActive(true)
                .expiresAt(LocalDateTime.now().plusDays(90))
                .build();

        when(apiKeyRepository.findByKeyHash(keyHash)).thenReturn(Optional.of(apiKey));

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals("api-key:garut:B2B Live API Key", SecurityContextHolder.getContext().getAuthentication().getPrincipal());

        var authorities = SecurityContextHolder.getContext().getAuthentication().getAuthorities();
        assertTrue(authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_API_CLIENT")));
        assertTrue(authorities.stream().anyMatch(a -> a.getAuthority().equals("feature.integration.open_api")));
        assertTrue(authorities.stream().anyMatch(a -> a.getAuthority().equals("network.view")));
        assertTrue(authorities.stream().anyMatch(a -> a.getAuthority().equals("network.monitor")));
    }

    @Test
    @DisplayName("Should reject revoked scoped token with 401")
    void testRevokedScopedToken() throws Exception {
        String rawToken = "k2_tok_garut_revoked1234567890abcdef";
        String tokenHash = "revoked-hash";

        when(request.getHeader("X-API-Key")).thenReturn(null);
        when(request.getHeader("X-Scoped-Token")).thenReturn(null);
        when(request.getHeader("Authorization")).thenReturn("Bearer " + rawToken);
        when(encryptionUtil.sha256Hex(rawToken)).thenReturn(tokenHash);

        TenantApiToken token = TenantApiToken.builder()
                .id(UUID.randomUUID())
                .name("Revoked Token")
                .tokenHash(tokenHash)
                .isRevoked(true)
                .build();

        when(tokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(token));

        filter.doFilterInternal(request, response, filterChain);

        verify(response).sendError(HttpServletResponse.SC_UNAUTHORIZED, "Scoped token has been revoked.");
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    @DisplayName("Should reject expired scoped token with 401")
    void testExpiredScopedToken() throws Exception {
        String rawToken = "k2_tok_garut_expired1234567890abcdef";
        String tokenHash = "expired-hash";

        when(request.getHeader("X-API-Key")).thenReturn(null);
        when(request.getHeader("X-Scoped-Token")).thenReturn(null);
        when(request.getHeader("Authorization")).thenReturn("Bearer " + rawToken);
        when(encryptionUtil.sha256Hex(rawToken)).thenReturn(tokenHash);

        TenantApiToken token = TenantApiToken.builder()
                .id(UUID.randomUUID())
                .name("Expired Token")
                .tokenHash(tokenHash)
                .isRevoked(false)
                .expiresAt(LocalDateTime.now().minusDays(1))
                .build();

        when(tokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(token));

        filter.doFilterInternal(request, response, filterChain);

        verify(response).sendError(HttpServletResponse.SC_UNAUTHORIZED, "Scoped token has expired.");
        verify(filterChain, never()).doFilter(request, response);
    }
}
