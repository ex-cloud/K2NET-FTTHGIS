package com.company.ftthgis.config;

import lombok.RequiredArgsConstructor;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class KeycloakConfig {

    private final KeycloakProperties properties;

    @Bean
    public Keycloak keycloak() {
        KeycloakBuilder builder = KeycloakBuilder.builder()
                .serverUrl(properties.getServerUrl())
                .realm(properties.getRealm())
                .grantType(properties.getGrantType())
                .clientId(properties.getClientId());

        if (properties.getClientSecret() != null) {
            builder.clientSecret(properties.getClientSecret());
        }

        if ("password".equalsIgnoreCase(properties.getGrantType())) {
            builder.username(properties.getUsername())
                   .password(properties.getPassword());
        }

        return builder.build();
    }
}
