package com.company.ftthgis.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import jakarta.ws.rs.client.Client;
import jakarta.ws.rs.client.ClientBuilder;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.DeserializationFeature;
import org.jboss.resteasy.plugins.providers.jackson.ResteasyJackson2Provider;

@Configuration(proxyBeanMethods = false)
@RequiredArgsConstructor
@Slf4j
public class KeycloakConfig {

    private final KeycloakProperties properties;

    /**
     * Custom Jackson provider subclass to avoid RESTEasy's
     * "Provider already registered" warning. Since this is a
     * different class, it won't conflict with the auto-discovered one.
     */
    static class LenientJacksonProvider extends ResteasyJackson2Provider {
        LenientJacksonProvider() {
            ObjectMapper mapper = new ObjectMapper();
            mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            setMapper(mapper);
        }
    }

    @Bean
    public Keycloak keycloak() {
        Client client = ClientBuilder.newBuilder()
                .register(new LenientJacksonProvider(), 1)
                .build();

        String url = properties.getInternalUrl();
        if (url == null || url.trim().isEmpty()) {
            url = properties.getServerUrl();
        }

        KeycloakBuilder builder = KeycloakBuilder.builder()
                .serverUrl(url)
                .realm(properties.getRealm())
                .grantType(properties.getGrantType())
                .clientId(properties.getClientId())
                .resteasyClient(client);

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
