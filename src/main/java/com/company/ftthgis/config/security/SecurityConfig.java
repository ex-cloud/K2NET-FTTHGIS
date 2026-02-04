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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
            JwtAuthenticationConverter jwtAuthenticationConverter) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Stateless API tidak butuh CSRF
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/network/map/**").permitAll()
                        .requestMatchers("/api/v1/network/trace-path/**").permitAll()
                        .requestMatchers("/api/v1/network/mvt/**").permitAll()
                        .requestMatchers("/api/v1/network/analytics/**").permitAll()
                        .requestMatchers("/api/v1/network/assets/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter)));

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter(
            com.company.ftthgis.service.UserSyncService userSyncService) {
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

            // 2. Extract Roles (existing logic)
            return new KeycloakRoleConverter().convert(jwt);
        });

        return converter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000")); // Frontend Next.js
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Converter untuk mengambil Role dari 'realm_access' di token JWT Keycloak.
     */
    static class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {
        @Override
        @SuppressWarnings("unchecked")
        public Collection<GrantedAuthority> convert(Jwt jwt) {
            Map<String, Object> realmAccess = (Map<String, Object>) jwt.getClaims().get("realm_access");

            if (realmAccess == null || realmAccess.isEmpty()) {
                return List.of();
            }

            Collection<String> roles = (Collection<String>) realmAccess.get("roles");
            return roles.stream()
                    .map(roleName -> "ROLE_" + roleName.toUpperCase())
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());
        }
    }
}
