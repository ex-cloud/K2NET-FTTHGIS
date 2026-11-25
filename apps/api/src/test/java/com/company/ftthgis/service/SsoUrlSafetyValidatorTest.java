package com.company.ftthgis.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.net.InetAddress;
import java.net.URI;

import static org.junit.jupiter.api.Assertions.*;

class SsoUrlSafetyValidatorTest {

    private final SsoUrlSafetyValidator validator = new SsoUrlSafetyValidator();

    @Test
    @DisplayName("Mengizinkan URL HTTPS dengan alamat IP publik valid")
    void allowsPublicHttpsUrl() {
        URI uri = validator.validateAndResolve(
                "https://8.8.8.8/.well-known/openid-configuration",
                false,
                "keycloak"
        );
        assertEquals("https", uri.getScheme());
        assertEquals("8.8.8.8", uri.getHost());
    }

    @Test
    @DisplayName("Menolak HTTP plaintext publik dan userInfo dalam URL")
    void rejectsPlainHttpAndUserInfo() {
        assertThrows(IllegalArgumentException.class, () ->
                validator.validateAndResolve("http://8.8.8.8/.well-known/openid-configuration", false, "keycloak"));
        assertThrows(IllegalArgumentException.class, () ->
                validator.validateAndResolve("https://admin:secret@8.8.8.8/.well-known/openid-configuration", false, "keycloak"));
    }

    @Test
    @DisplayName("Menolak loopback, cloud metadata, RFC1918 private, dan Tailscale CGNAT (SSRF Guard)")
    void rejectsInternalAndPrivateTargets() {
        assertThrows(IllegalArgumentException.class, () ->
                validator.validateAndResolve("https://127.0.0.1/meta", false, "keycloak"));
        assertThrows(IllegalArgumentException.class, () ->
                validator.validateAndResolve("https://localhost/meta", false, "keycloak"));
        assertThrows(IllegalArgumentException.class, () ->
                validator.validateAndResolve("https://169.254.169.254/latest/meta-data", false, "keycloak"));
        assertThrows(IllegalArgumentException.class, () ->
                validator.validateAndResolve("https://10.0.0.5/internal", false, "keycloak"));
        assertThrows(IllegalArgumentException.class, () ->
                validator.validateAndResolve("https://172.18.0.5:9090/actuator", false, "keycloak"));
        assertThrows(IllegalArgumentException.class, () ->
                validator.validateAndResolve("https://192.168.1.1/router", false, "keycloak"));
        assertThrows(IllegalArgumentException.class, () ->
                validator.validateAndResolve("https://100.110.205.109:9005/minio", false, "keycloak"));
    }

    @Test
    @DisplayName("Mengizinkan host internal Keycloak hanya ketika dipetakan eksplisit")
    void allowsInternalKeycloakOnlyWhenMapped() {
        URI allowed = validator.validateAndResolve(
                "http://keycloak:8081/realms/k2net-tenants/.well-known/openid-configuration",
                true,
                "keycloak"
        );
        assertEquals("keycloak", allowed.getHost());

        assertThrows(IllegalArgumentException.class, () ->
                validator.validateAndResolve(
                        "http://keycloak:8081/realms/k2net-tenants/.well-known/openid-configuration",
                        false,
                        "keycloak"
                ));
    }

    @Test
    @DisplayName("Memeriksa klasifikasi public vs ULA IPv6")
    void classifiesIpv6UlaAsNonPublic() throws Exception {
        assertTrue(SsoUrlSafetyValidator.isPublicRoutableAddress(InetAddress.getByName("2606:4700:4700::1111")));
        assertFalse(SsoUrlSafetyValidator.isPublicRoutableAddress(InetAddress.getByName("fc00::1")));
        assertFalse(SsoUrlSafetyValidator.isPublicRoutableAddress(InetAddress.getByName("::1")));
    }
}
