package com.company.ftthgis.config.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.oauth2.server.resource.authentication.JwtIssuerAuthenticationManagerResolver;
import org.springframework.context.annotation.Lazy;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;

import java.util.Collection;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Mengizinkan @PreAuthorize di Controller
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http,
            JwtIssuerAuthenticationManagerResolver authenticationManagerResolver,
            BearerTokenResolver bearerTokenResolver,
            RateLimitingFilter rateLimitingFilter,
            IpBlockingFilter ipBlockingFilter,
            ScopedTokenAuthenticationFilter scopedTokenAuthenticationFilter,
            com.company.ftthgis.config.tenant.OrganizationStatusFilter organizationStatusFilter,
            com.company.ftthgis.config.tenant.TenantFilter tenantFilter,
            com.company.ftthgis.config.tenant.ImpersonationContextFilter impersonationContextFilter,
            com.company.ftthgis.config.logging.ApiRequestLoggingFilter apiRequestLoggingFilter,
            AuditingAccessDeniedHandler auditingAccessDeniedHandler) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Stateless API tidak butuh CSRF
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(ipBlockingFilter, RateLimitingFilter.class)
                .addFilterBefore(apiRequestLoggingFilter, IpBlockingFilter.class)
                .addFilterBefore(scopedTokenAuthenticationFilter,
                        org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter.class)
                .addFilterAfter(organizationStatusFilter,
                        org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter.class)
                .addFilterAfter(tenantFilter, com.company.ftthgis.config.tenant.OrganizationStatusFilter.class)
                .addFilterAfter(impersonationContextFilter, com.company.ftthgis.config.tenant.TenantFilter.class)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/network/map/**").permitAll()
                        .requestMatchers("/api/v1/network/mvt/**").permitAll()
                        .requestMatchers("/api/v1/network/notifications/**").permitAll()
                        .requestMatchers("/api/v1/payments/callback", "/api/payments/callback").permitAll()
                        .requestMatchers("/api/v1/network/trace-path/**").authenticated()
                        .requestMatchers("/api/v1/network/assets/**").authenticated()
                        .requestMatchers("/api/v1/organizations/register").permitAll() // Self-service tenant registration
                        .requestMatchers("/api/v1/organizations/check-slug/**").permitAll() // Slug availability check
                        .requestMatchers("/api/v1/organizations/*/auth-methods").permitAll() // Public auth methods discovery
                        .requestMatchers("/api/v1/public/organizations/**").permitAll() // Public organization resolver
                        .requestMatchers("/api/v1/public/files/**").permitAll() // Public whitelabel assets (logos, favicons)
                        .requestMatchers("/api/v1/organizations/**").authenticated() // Secured: Must be logged in
                        .requestMatchers("/api/v1/auth/discovery/**").permitAll() // Discovery stays public
                        .requestMatchers("/api/v1/auth/oauth-gate/**").permitAll() // Internal OAuth gate (protected by secret header)
                        .requestMatchers("/api/v1/system/impersonate/exchange").permitAll() // Exchange code is public (single-use 60s)
                        .requestMatchers("/api/v1/system/impersonate/refresh-token").permitAll() // Refresh token relay guarded by session ID
                        .requestMatchers("/api/v1/system/impersonate/status").permitAll() // Session countdown status check
                        .requestMatchers("/api/v1/system/impersonate/exit").permitAll() // Terminate session from tenant portal guarded by session ID
                        .requestMatchers("/api/github/webhook").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info", "/actuator/prometheus").permitAll()
                        .requestMatchers("/actuator/**").hasRole("admin")
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2
                    .authenticationManagerResolver(authenticationManagerResolver)
                    .bearerTokenResolver(bearerTokenResolver))
                .exceptionHandling(ex -> ex.accessDeniedHandler(auditingAccessDeniedHandler));

        return http.build();
    }

    @org.springframework.beans.factory.annotation.Value("${keycloak.server-url}")
    private String keycloakServerUrl;

    @org.springframework.beans.factory.annotation.Value("${keycloak.internal-url:http://localhost:8081}")
    private String keycloakInternalUrl;

    @Bean
    public BearerTokenResolver bearerTokenResolver(
            com.company.ftthgis.service.auth.StreamTicketService streamTicketService) {
        DefaultBearerTokenResolver defaultResolver = new DefaultBearerTokenResolver();
        defaultResolver.setAllowUriQueryParameter(false);
        return request -> {
            // 1. Resolve Bearer token from standard Authorization header
            String token = defaultResolver.resolve(request);
            if (token != null) {
                if (token.startsWith(ScopedTokenAuthenticationFilter.SCOPED_TOKEN_PREFIX)
                        || token.startsWith(ScopedTokenAuthenticationFilter.API_KEY_PREFIX_LIVE)
                        || token.startsWith(ScopedTokenAuthenticationFilter.API_KEY_PREFIX_TEST)) {
                    return null; // Handled by ScopedTokenAuthenticationFilter
                }
                return token;
            }

            // 2. Resolve single-use stream ticket (?ticket=st_...) for SSE streams
            String ticket = request.getParameter("ticket");
            if (ticket != null && !ticket.isBlank()) {
                String redeemedToken = streamTicketService.redeemTicket(ticket);
                if (redeemedToken != null) {
                    return redeemedToken;
                }
            }

            // 3. Fallback for backward compatibility during client migration
            String legacyToken = request.getParameter("access_token");
            if (legacyToken != null && !legacyToken.isBlank()) {
                return legacyToken;
            }

            return null;
        };
    }

    @Bean
    public JwtIssuerAuthenticationManagerResolver authenticationManagerResolver(
            JwtAuthenticationConverter jwtAuthenticationConverter) {
        return new JwtIssuerAuthenticationManagerResolver(issuer -> {
            String cleanIssuer = issuer;
            if (issuer.startsWith("http://auth-gis.kdua.net:8081/realms/")) {
                cleanIssuer = issuer.replace("http://auth-gis.kdua.net:8081", keycloakServerUrl);
            } else if (issuer.startsWith("http://localhost:8081/realms/")) {
                cleanIssuer = issuer.replace("http://localhost:8081", keycloakServerUrl);
            }

            if (cleanIssuer.startsWith(keycloakServerUrl + "/realms/")) {
                String realmName = cleanIssuer.substring((keycloakServerUrl + "/realms/").length());
                if (realmName.contains("/")) {
                    realmName = realmName.substring(0, realmName.indexOf("/"));
                }
                String jwkSetUri = keycloakInternalUrl + "/realms/" + realmName + "/protocol/openid-connect/certs";
                
                org.springframework.security.oauth2.jwt.NimbusJwtDecoder jwtDecoder = 
                    org.springframework.security.oauth2.jwt.NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
                
                final String finalIssuer = issuer;
                final String finalCleanIssuer = cleanIssuer;
                org.springframework.security.oauth2.core.OAuth2TokenValidator<org.springframework.security.oauth2.jwt.Jwt> issuerValidator = jwt -> {
                    String tokenIssuer = jwt.getIssuer() != null ? jwt.getIssuer().toString() : "";
                    if (tokenIssuer.equals(finalIssuer) || tokenIssuer.equals(finalCleanIssuer)) {
                        return org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.success();
                    }
                    return org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.failure(
                        new org.springframework.security.oauth2.core.OAuth2Error(
                            "invalid_token", "The issuer " + tokenIssuer + " is not trusted", null
                        )
                    );
                };
                
                org.springframework.security.oauth2.core.OAuth2TokenValidator<org.springframework.security.oauth2.jwt.Jwt> delegatingValidator = 
                    new org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator<>(
                        org.springframework.security.oauth2.jwt.JwtValidators.createDefault(),
                        issuerValidator
                    );
                jwtDecoder.setJwtValidator(delegatingValidator);
                
                var provider = new org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationProvider(jwtDecoder);
                provider.setJwtAuthenticationConverter(jwtAuthenticationConverter);
                return provider::authenticate;
            }
            throw new RuntimeException("Unknown issuer: " + issuer);
        });
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter(
            @Lazy com.company.ftthgis.service.UserSyncService userSyncService,
            com.company.ftthgis.domain.user.repository.RoleRepository roleRepository,
            com.company.ftthgis.domain.user.repository.UserRepository userRepository,
            PlatformRealmValidator platformRealmValidator) {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();

        // Custom converter that combines Role extraction + User Sync
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            // 1. Sync User to Local DB (JIT)
            try {
                userSyncService.syncUserFromJwt(jwt);
            } catch (org.springframework.security.core.AuthenticationException e) {
                throw e; // Rethrow to block login
            } catch (Exception e) {
                // Ignore transient database connection errors
                System.err.println("Generic error syncing user from JWT: " + e.getMessage());
            }

            // 2. Extract Roles and dynamic Permissions via strict Allowlist
            return new KeycloakRoleConverter(roleRepository, userRepository, platformRealmValidator).convert(jwt);
        });

        return converter;
    }

    @org.springframework.beans.factory.annotation.Value("${app.security.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Permissive patterns for development to avoid localhost vs 127.0.0.1 issues
        configuration.setAllowedOriginPatterns(List.of("*"));

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Converter untuk mengambil Role dari 'realm_access' di token JWT Keycloak,
     * lalu memetakan ke tabel permissions di local Database berdasarkan organisasi.
     * Menggunakan Strict Allowlist: Role dari tenant realm HANYA diakui jika terdaftar di database organisasi.
     */
    static class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {
        private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(KeycloakRoleConverter.class);
        private final com.company.ftthgis.domain.user.repository.RoleRepository roleRepository;
        private final com.company.ftthgis.domain.user.repository.UserRepository userRepository;
        private final PlatformRealmValidator platformRealmValidator;

        public KeycloakRoleConverter(
                com.company.ftthgis.domain.user.repository.RoleRepository roleRepository,
                com.company.ftthgis.domain.user.repository.UserRepository userRepository,
                PlatformRealmValidator platformRealmValidator) {
            this.roleRepository = roleRepository;
            this.userRepository = userRepository;
            this.platformRealmValidator = platformRealmValidator;
        }

        @Override
        @SuppressWarnings("unchecked")
        public Collection<GrantedAuthority> convert(Jwt jwt) {
            java.util.Set<String> roleNames = new java.util.HashSet<>();

            // Debug: Log complete claims if debug level is enabled
            log.debug("Full JWT Claims for Subject {}: {}", jwt.getSubject(), jwt.getClaims());

            // 1. Extract Realm Roles
            Map<String, Object> realmAccess = (Map<String, Object>) jwt.getClaims().get("realm_access");
            if (realmAccess != null && realmAccess.containsKey("roles")) {
                Collection<String> realmRoles = (Collection<String>) realmAccess.get("roles");
                log.debug("Extracted Realm Roles: {}", realmRoles);
                roleNames.addAll(realmRoles);
            }

            // 2. Extract Client Roles (specifically for our frontend client)
            Map<String, Object> resourceAccess = (Map<String, Object>) jwt.getClaims().get("resource_access");
            if (resourceAccess != null && resourceAccess.containsKey("ftth-gis-frontend")) {
                Map<String, Object> clientAccess = (Map<String, Object>) resourceAccess.get("ftth-gis-frontend");
                if (clientAccess != null && clientAccess.containsKey("roles")) {
                    Collection<String> clientRoles = (Collection<String>) clientAccess.get("roles");
                    log.debug("Extracted Client Roles: {}", clientRoles);
                    roleNames.addAll(clientRoles);
                }
            }

            Collection<GrantedAuthority> authorities = new java.util.HashSet<>();

            // Extract User Organization ID for Tenant-Isolated Roles
            java.util.UUID orgId = null;
            try {
                java.util.UUID userId = java.util.UUID.fromString(jwt.getSubject());
                var userOpt = userRepository.findById(userId);
                if (userOpt.isPresent() && userOpt.get().getOrganization() != null) {
                    orgId = userOpt.get().getOrganization().getId();
                }
            } catch (Exception e) {
                log.warn("Could not extract organization for user {}: {}", jwt.getSubject(), e.getMessage());
            }

            // Check if JWT originates from the dedicated platform realm (ftth-realm) via Exact Match
            String issuer = jwt.getIssuer() != null ? jwt.getIssuer().toString() : "";
            boolean isPlatformRealm = platformRealmValidator.isPlatformRealm(issuer);

            // 3. Map to GrantedAuthorities via Strict Allowlist (Roles + Fine-Grained Permissions)
            for (String roleName : roleNames) {
                if (roleName == null || roleName.isBlank()) continue;
                String cleanRole = roleName.toLowerCase().replaceFirst("^role_", "");

                java.util.Optional<com.company.ftthgis.domain.user.entity.Role> roleOpt = java.util.Optional.empty();

                if (isPlatformRealm) {
                    // Platform Realm Allowlist:
                    // Only recognize roles that exist as System Roles in DB or general fallback
                    roleOpt = roleRepository.findByNameAndIsSystemRoleTrue(cleanRole);
                    if (roleOpt.isEmpty()) {
                        roleOpt = roleRepository.findByName(cleanRole);
                    }
                    if (roleOpt.isEmpty()) {
                        roleOpt = roleRepository.findByName(roleName);
                    }

                    if (roleOpt.isPresent()) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + cleanRole));
                        var role = roleOpt.get();
                        if (role.getPermissions() != null) {
                            role.getPermissions().forEach(permission -> {
                                if (permission.getCode() != null && !permission.getCode().isBlank()) {
                                    authorities.add(new SimpleGrantedAuthority(permission.getCode()));
                                }
                            });
                        }
                    } else {
                        log.debug("Ignored unmapped platform role [{}] for user {}", cleanRole, jwt.getSubject());
                    }
                } else {
                    // Non-Platform / Tenant Realm Allowlist:
                    // STRICT ISOLATION: A tenant token can NEVER claim super_admin or any platform role.
                    // The role MUST exist in this organization's database boundary.
                    if ("super_admin".equals(cleanRole) || cleanRole.startsWith("system_") || cleanRole.startsWith("platform_")) {
                        log.warn("🚨 Blocked non-platform realm user {} from claiming privileged role [{}]", jwt.getSubject(), cleanRole);
                        continue;
                    }

                    if (orgId != null) {
                        roleOpt = roleRepository.findByNameAndOrganizationId(cleanRole, orgId);
                    }

                    if (roleOpt.isEmpty()) {
                        roleOpt = roleRepository.findByName(cleanRole)
                                .filter(r -> "TENANT".equalsIgnoreCase(r.getScope()));
                    }

                    if (roleOpt.isPresent()) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + cleanRole));
                        var role = roleOpt.get();
                        if (role.getPermissions() != null) {
                            role.getPermissions().forEach(permission -> {
                                // Double defense: Block any system.* permissions for non-platform realm tokens
                                if (permission.getCode() != null && permission.getCode().startsWith("system.")) {
                                    log.warn("🚨 Blocked system permission {} for non-platform realm user {}", permission.getCode(), jwt.getSubject());
                                    return;
                                }
                                authorities.add(new SimpleGrantedAuthority(permission.getCode()));
                            });
                        }
                    } else {
                        log.warn("Blocked unregistered role [{}] for non-platform user {} in org {}", cleanRole, jwt.getSubject(), orgId);
                    }
                }
            }

            log.info("Final Mapped Authorities for {}: {}", jwt.getSubject(), authorities);
            return authorities;
        }
    }
}
