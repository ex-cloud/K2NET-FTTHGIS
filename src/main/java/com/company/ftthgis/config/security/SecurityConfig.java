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
            RateLimitingFilter rateLimitingFilter,
            IpBlockingFilter ipBlockingFilter,
            com.company.ftthgis.config.tenant.OrganizationStatusFilter organizationStatusFilter) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Stateless API tidak butuh CSRF
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(ipBlockingFilter, RateLimitingFilter.class)
                .addFilterAfter(organizationStatusFilter,
                        org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/network/map/**").permitAll()
                        .requestMatchers("/api/v1/network/mvt/**").permitAll()
                        .requestMatchers("/api/v1/network/notifications/**").permitAll()
                        .requestMatchers("/api/v1/network/assets/**").permitAll()
                        .requestMatchers("/api/v1/network/trace-path/**").authenticated()
                        .requestMatchers("/api/v1/network/assets/**").authenticated()
                        .requestMatchers("/api/v1/network/analytics/**").permitAll()
                        .requestMatchers("/api/v1/analytics/**").permitAll() // Correct path for AnalyticsController
                        .requestMatchers("/api/v1/organizations/**").authenticated() // Secured: Must be logged in
                        .requestMatchers("/api/v1/auth/discovery/**").permitAll() // Discovery stays public
                        .requestMatchers("/actuator/health", "/actuator/info", "/actuator/prometheus").permitAll()
                        .requestMatchers("/actuator/**").hasRole("admin")
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .authenticationManagerResolver(authenticationManagerResolver));

        return http.build();
    }

    @org.springframework.beans.factory.annotation.Value("${keycloak.server-url}")
    private String keycloakServerUrl;

    @Bean
    public JwtIssuerAuthenticationManagerResolver authenticationManagerResolver(
            JwtAuthenticationConverter jwtAuthenticationConverter) {
        return new JwtIssuerAuthenticationManagerResolver(issuer -> {
            String cleanIssuer = issuer;
            if (issuer.startsWith("http://auth-gis.k2net.id:8081/realms/")) {
                cleanIssuer = issuer.replace("http://auth-gis.k2net.id:8081", keycloakServerUrl);
            } else if (issuer.startsWith("http://localhost:8081/realms/")) {
                cleanIssuer = issuer.replace("http://localhost:8081", keycloakServerUrl);
            }

            if (cleanIssuer.startsWith(keycloakServerUrl + "/realms/")) {
                String realmName = cleanIssuer.substring((keycloakServerUrl + "/realms/").length());
                if (realmName.contains("/")) {
                    realmName = realmName.substring(0, realmName.indexOf("/"));
                }
                String jwkSetUri = "http://localhost:8081/realms/" + realmName + "/protocol/openid-connect/certs";
                
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
            com.company.ftthgis.domain.user.repository.UserRepository userRepository) {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();

        // Custom converter that combines Role extraction + User Sync
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            // 1. Sync User to Local DB (JIT)
            try {
                userSyncService.syncUserFromJwt(jwt);
            } catch (Exception e) {
                // We don't want to block login if local sync fails, but we should log it
                System.err.println("Failed to sync user from JWT: " + e.getMessage());
            }

            // 2. Extract Roles and dynamic Permissions
            return new KeycloakRoleConverter(roleRepository, userRepository).convert(jwt);
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
     */
    static class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {
        private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(KeycloakRoleConverter.class);
        private final com.company.ftthgis.domain.user.repository.RoleRepository roleRepository;
        private final com.company.ftthgis.domain.user.repository.UserRepository userRepository;

        public KeycloakRoleConverter(
                com.company.ftthgis.domain.user.repository.RoleRepository roleRepository,
                com.company.ftthgis.domain.user.repository.UserRepository userRepository) {
            this.roleRepository = roleRepository;
            this.userRepository = userRepository;
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

            // 3. Map to GrantedAuthorities (Roles + Fine-Grained Permissions)
            for (String roleName : roleNames) {
                // Add the role itself as a standard Spring Security ROLE using exact lowercase
                authorities.add(new SimpleGrantedAuthority("ROLE_" + roleName.toLowerCase()));

                // Fetch fine-grained permissions dynamically from DB
                try {
                    java.util.Optional<com.company.ftthgis.domain.user.entity.Role> roleOpt = java.util.Optional.empty();
                    
                    if (orgId != null) {
                        // First try finding the tenant-specific role
                        roleOpt = roleRepository.findByNameAndOrganizationId(roleName, orgId);
                    }
                    
                    // Fallback to system role if not found
                    if (roleOpt.isEmpty()) {
                        roleOpt = roleRepository.findByNameAndIsSystemRoleTrue(roleName);
                    }
                    
                    // Final fallback to legacy behavior
                    if (roleOpt.isEmpty()) {
                        roleOpt = roleRepository.findByName(roleName);
                    }

                    roleOpt.ifPresent(role -> {
                        if (role.getPermissions() != null) {
                            role.getPermissions().forEach(permission -> {
                                authorities.add(new SimpleGrantedAuthority(permission.getCode()));
                            });
                        }
                    });
                } catch (Exception e) {
                    log.error("Failed to load dynamic permissions for role {}: {}", roleName, e.getMessage());
                }
            }

            log.info("Final Mapped Authorities for {}: {}", jwt.getSubject(), authorities);
            return authorities;
        }
    }
}
