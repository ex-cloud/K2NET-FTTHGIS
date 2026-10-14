package com.company.ftthgis.config.security;

import com.company.ftthgis.config.tenant.TenantContext;
import com.company.ftthgis.domain.tenant.entity.TenantApiKey;
import com.company.ftthgis.domain.tenant.entity.TenantApiToken;
import com.company.ftthgis.domain.tenant.repository.TenantApiKeyRepository;
import com.company.ftthgis.domain.tenant.repository.TenantApiTokenRepository;
import com.company.ftthgis.util.SecretEncryptionUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * ScopedTokenAuthenticationFilter — Zero-Trust Authentication for Granular Scoped API Tokens
 * and Developer REST API Keys (PKG_OPEN_API).
 * 
 * Intercepts requests bearing:
 * 1. "X-API-Key: k2_live_..."
 * 2. "Authorization: Bearer k2_live_..." / "Authorization: Bearer k2_test_..."
 * 3. "X-Scoped-Token: k2_tok_..."
 * 4. "Authorization: Bearer k2_tok_..."
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ScopedTokenAuthenticationFilter extends OncePerRequestFilter {

    private final TenantApiTokenRepository tokenRepository;
    private final TenantApiKeyRepository apiKeyRepository;
    private final SecretEncryptionUtil encryptionUtil;
    private final ObjectMapper objectMapper;

    public static final String SCOPED_TOKEN_PREFIX = "k2_tok_";
    public static final String API_KEY_PREFIX_LIVE = "k2_live_";
    public static final String API_KEY_PREFIX_TEST = "k2_test_";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String token = extractApiKeyOrToken(request);

        if (token != null) {
            String tokenHash = encryptionUtil.sha256Hex(token);

            // Case A: Developer API Key (k2_live_... / k2_test_... or via X-API-Key)
            if (token.startsWith(API_KEY_PREFIX_LIVE) || token.startsWith(API_KEY_PREFIX_TEST) || request.getHeader("X-API-Key") != null) {
                Optional<TenantApiKey> apiKeyOpt = apiKeyRepository.findByKeyHash(tokenHash);
                if (apiKeyOpt.isPresent()) {
                    TenantApiKey apiKey = apiKeyOpt.get();

                    if (!apiKey.isActive()) {
                        log.warn("API Key Authentication Rejected: Key '{}' (ID: {}) is inactive", apiKey.getName(), apiKey.getId());
                        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "API key has been deactivated.");
                        return;
                    }

                    if (apiKey.getExpiresAt() != null && apiKey.getExpiresAt().isBefore(LocalDateTime.now())) {
                        log.warn("API Key Authentication Rejected: Key '{}' (ID: {}) has expired", apiKey.getName(), apiKey.getId());
                        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "API key has expired.");
                        return;
                    }

                    try {
                        apiKey.setLastUsedAt(LocalDateTime.now());
                        apiKeyRepository.save(apiKey);
                    } catch (Exception e) {
                        log.debug("Could not update lastUsedAt for API key {}: {}", apiKey.getId(), e.getMessage());
                    }

                    List<GrantedAuthority> authorities = new ArrayList<>();
                    authorities.add(new SimpleGrantedAuthority("ROLE_API_CLIENT"));
                    authorities.add(new SimpleGrantedAuthority("feature.integration.open_api"));

                    if (apiKey.getScopes() != null && !apiKey.getScopes().isBlank()) {
                        String[] scopes = apiKey.getScopes().split(",");
                        for (String sc : scopes) {
                            String clean = sc.trim().toLowerCase();
                            if (!clean.isEmpty()) {
                                authorities.add(new SimpleGrantedAuthority("scope:" + clean));
                                authorities.add(new SimpleGrantedAuthority(clean.replace(":", ".")));
                                // Standard permission equivalencies
                                if (clean.contains("read") && clean.contains("network")) {
                                    authorities.add(new SimpleGrantedAuthority("network.view"));
                                    authorities.add(new SimpleGrantedAuthority("projects.view"));
                                }
                                if (clean.contains("telemetry")) {
                                    authorities.add(new SimpleGrantedAuthority("network.monitor"));
                                }
                                if (clean.contains("customer")) {
                                    authorities.add(new SimpleGrantedAuthority("customer.view"));
                                }
                            }
                        }
                    }

                    String principal = "api-key:" + (apiKey.getOrganization() != null ? apiKey.getOrganization().getSlug() : "unknown") + ":" + apiKey.getName();
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            principal,
                            null,
                            authorities
                    );

                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    if (apiKey.getOrganization() != null) {
                        TenantContext.setTenantId(apiKey.getOrganization().getSlug());
                    }

                    log.debug("Developer API Key Authenticated: '{}' for tenant '{}'", apiKey.getName(),
                            apiKey.getOrganization() != null ? apiKey.getOrganization().getSlug() : "none");
                    filterChain.doFilter(request, response);
                    return;
                }
            }

            // Case B: Scoped Personal Access Token (k2_tok_...)
            if (token.startsWith(SCOPED_TOKEN_PREFIX)) {
                Optional<TenantApiToken> tokenOpt = tokenRepository.findByTokenHash(tokenHash);

                if (tokenOpt.isEmpty()) {
                    log.warn("Scoped Token Authentication Failed: Token hash not found");
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid scoped token.");
                    return;
                }

                TenantApiToken apiToken = tokenOpt.get();

                if (apiToken.isRevoked()) {
                    log.warn("Scoped Token Authentication Rejected: Token '{}' (ID: {}) is revoked", apiToken.getName(), apiToken.getId());
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Scoped token has been revoked.");
                    return;
                }

                if (apiToken.getExpiresAt() != null && apiToken.getExpiresAt().isBefore(LocalDateTime.now())) {
                    log.warn("Scoped Token Authentication Rejected: Token '{}' (ID: {}) has expired at {}", apiToken.getName(), apiToken.getId(), apiToken.getExpiresAt());
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Scoped token has expired.");
                    return;
                }

                try {
                    apiToken.setLastUsedAt(LocalDateTime.now());
                    tokenRepository.save(apiToken);
                } catch (Exception e) {
                    log.debug("Could not update lastUsedAt for token {}: {}", apiToken.getId(), e.getMessage());
                }

                List<GrantedAuthority> authorities = new ArrayList<>();
                authorities.add(new SimpleGrantedAuthority("ROLE_SCOPED_CLIENT"));

                if (apiToken.getScopes() != null && !apiToken.getScopes().isBlank()) {
                    try {
                        List<String> scopeList = objectMapper.readValue(apiToken.getScopes(), new TypeReference<List<String>>() {});
                        for (String scope : scopeList) {
                            if (scope != null && !scope.isBlank()) {
                                String cleanScope = scope.trim().toLowerCase();
                                authorities.add(new SimpleGrantedAuthority("scope:" + cleanScope));
                                authorities.add(new SimpleGrantedAuthority(cleanScope.replace(":", ".")));
                            }
                        }
                    } catch (Exception e) {
                        log.warn("Could not parse scopes JSON for token {}: {}", apiToken.getId(), e.getMessage());
                    }
                }

                String principal = "scoped-token:" + (apiToken.getOrganization() != null ? apiToken.getOrganization().getSlug() : "unknown") + ":" + apiToken.getName();
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        authorities
                );

                SecurityContextHolder.getContext().setAuthentication(authentication);

                if (apiToken.getOrganization() != null) {
                    TenantContext.setTenantId(apiToken.getOrganization().getSlug());
                }

                log.debug("Scoped Token Authenticated: '{}' with scopes {}", apiToken.getName(), apiToken.getScopes());
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractApiKeyOrToken(HttpServletRequest request) {
        String apiKeyHeader = request.getHeader("X-API-Key");
        if (apiKeyHeader != null && !apiKeyHeader.isBlank()) {
            return apiKeyHeader.trim();
        }

        String customHeader = request.getHeader("X-Scoped-Token");
        if (customHeader != null && !customHeader.isBlank()) {
            return customHeader.trim();
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            if (token.startsWith(SCOPED_TOKEN_PREFIX) || token.startsWith(API_KEY_PREFIX_LIVE) || token.startsWith(API_KEY_PREFIX_TEST)) {
                return token;
            }
        }

        return null;
    }
}
