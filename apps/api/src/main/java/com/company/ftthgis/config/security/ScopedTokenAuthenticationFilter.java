package com.company.ftthgis.config.security;

import com.company.ftthgis.config.tenant.TenantContext;
import com.company.ftthgis.domain.tenant.entity.TenantApiToken;
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
import java.util.List;
import java.util.Optional;

/**
 * ScopedTokenAuthenticationFilter — Zero-Trust Authentication for Granular Scoped API Tokens.
 * 
 * Intercepts requests bearing "Authorization: Bearer k2_tok_..." or "X-Scoped-Token: k2_tok_...".
 * Computes SHA-256 hash, validates expiration & revocation status, and populates SecurityContext 
 * with granular scope authorities (e.g. "scope:coverage:read", "scope:network:read").
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ScopedTokenAuthenticationFilter extends OncePerRequestFilter {

    private final TenantApiTokenRepository tokenRepository;
    private final SecretEncryptionUtil encryptionUtil;
    private final ObjectMapper objectMapper;

    public static final String SCOPED_TOKEN_PREFIX = "k2_tok_";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String token = extractScopedToken(request);

        if (token != null && token.startsWith(SCOPED_TOKEN_PREFIX)) {
            String tokenHash = encryptionUtil.sha256Hex(token);
            Optional<TenantApiToken> tokenOpt = tokenRepository.findByTokenHash(tokenHash);

            if (tokenOpt.isEmpty()) {
                log.warn("Scoped Token Authentication Failed: Token hash not found");
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid scoped token.");
                return;
            }

            TenantApiToken apiToken = tokenOpt.get();

            // 1. Check Revocation
            if (apiToken.isRevoked()) {
                log.warn("Scoped Token Authentication Rejected: Token '{}' (ID: {}) is revoked", apiToken.getName(), apiToken.getId());
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Scoped token has been revoked.");
                return;
            }

            // 2. Check Expiration
            if (apiToken.getExpiresAt() != null && apiToken.getExpiresAt().isBefore(LocalDateTime.now())) {
                log.warn("Scoped Token Authentication Rejected: Token '{}' (ID: {}) has expired at {}", apiToken.getName(), apiToken.getId(), apiToken.getExpiresAt());
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Scoped token has expired.");
                return;
            }

            // 3. Update last used timestamp async / inline
            try {
                apiToken.setLastUsedAt(LocalDateTime.now());
                tokenRepository.save(apiToken);
            } catch (Exception e) {
                log.debug("Could not update lastUsedAt for token {}: {}", apiToken.getId(), e.getMessage());
            }

            // 4. Build Granted Authorities from scopes JSON
            List<GrantedAuthority> authorities = new ArrayList<>();
            authorities.add(new SimpleGrantedAuthority("ROLE_SCOPED_CLIENT"));
            
            if (apiToken.getScopes() != null && !apiToken.getScopes().isBlank()) {
                try {
                    List<String> scopeList = objectMapper.readValue(apiToken.getScopes(), new TypeReference<List<String>>() {});
                    for (String scope : scopeList) {
                        if (scope != null && !scope.isBlank()) {
                            String cleanScope = scope.trim().toLowerCase();
                            authorities.add(new SimpleGrantedAuthority("scope:" + cleanScope));
                            // Also provide direct authority mapping (e.g. coverage:read -> coverage.view)
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

            // 5. Populate Tenant Context if organization is present
            if (apiToken.getOrganization() != null) {
                TenantContext.setTenantId(apiToken.getOrganization().getSlug());
            }

            log.debug("Scoped Token Authenticated: '{}' with scopes {}", apiToken.getName(), apiToken.getScopes());
        }

        filterChain.doFilter(request, response);
    }

    private String extractScopedToken(HttpServletRequest request) {
        String customHeader = request.getHeader("X-Scoped-Token");
        if (customHeader != null && !customHeader.isBlank()) {
            return customHeader.trim();
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            if (token.startsWith(SCOPED_TOKEN_PREFIX)) {
                return token;
            }
        }

        return null;
    }
}
