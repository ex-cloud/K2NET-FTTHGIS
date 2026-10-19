package com.company.ftthgis.config.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Validates whether an OpenID Connect / OAuth2 issuer strictly belongs to the dedicated
 * platform realm (ftth-realm), preventing substring/subpath spoofing or cross-tenant realm bypass.
 */
@Component
@Getter
@Setter
public class PlatformRealmValidator {

    @Value("${keycloak.server-url:https://auth-gis.kdua.net}")
    private String keycloakServerUrl = "https://auth-gis.kdua.net";

    public PlatformRealmValidator() {
    }

    public PlatformRealmValidator(String keycloakServerUrl) {
        this.keycloakServerUrl = keycloakServerUrl;
    }

    /**
     * Checks if the given issuer URI strictly matches the canonical platform realm URL.
     * Rejects subpath tricks (e.g. "https://evil.com/realms/ftth-realm" or "https://auth-gis.kdua.net/realms/ftth-realm-fake").
     *
     * @param issuer The issuer string from the JWT
     * @return true if and only if the issuer matches the authentic platform realm
     */
    public boolean isPlatformRealm(String issuer) {
        if (issuer == null || issuer.isBlank()) {
            return false;
        }

        String normalizedIssuer = issuer.replaceAll("/+$", "");

        if (keycloakServerUrl != null && !keycloakServerUrl.isBlank()) {
            String normalizedServerUrl = keycloakServerUrl.replaceAll("/+$", "");
            if (normalizedIssuer.equals(normalizedServerUrl + "/realms/ftth-realm")) {
                return true;
            }
        }

        return normalizedIssuer.equals("https://auth-gis.kdua.net/realms/ftth-realm")
                || normalizedIssuer.equals("http://keycloak:8081/realms/ftth-realm")
                || normalizedIssuer.equals("http://localhost:8081/realms/ftth-realm")
                || normalizedIssuer.equals("http://auth-gis.kdua.net:8081/realms/ftth-realm");
    }
}
