package com.company.ftthgis.config;

import lombok.RequiredArgsConstructor;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import static org.keycloak.OAuth2Constants.CLIENT_CREDENTIALS;

@Configuration
@RequiredArgsConstructor
public class KeycloakConfig {

    private final KeycloakProperties properties;

    @Bean
    public Keycloak keycloak() {
        return KeycloakBuilder.builder()
                .serverUrl(properties.getServerUrl())
                .realm(properties.getRealm())
                .grantType(CLIENT_CREDENTIALS)
                .clientId(properties.getClientId())
                .clientSecret(properties.getClientSecret())
                .build();
    }
}
