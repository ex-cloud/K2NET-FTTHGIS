package com.company.ftthgis.config;

import com.company.ftthgis.config.security.WebhookSecurityValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.net.InetAddress;

import static org.junit.jupiter.api.Assertions.*;

class WebhookSecurityValidatorTest {

    private WebhookSecurityValidator validator;

    @BeforeEach
    void setUp() {
        validator = new WebhookSecurityValidator();
    }

    @Test
    @DisplayName("Should reject null or empty URL")
    void testNullOrEmptyUrl() {
        assertThrows(IllegalArgumentException.class, () -> validator.validateUrl(null));
        assertThrows(IllegalArgumentException.class, () -> validator.validateUrl("   "));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "http://api.example.com/webhook",
        "ftp://example.com/file",
        "file:///etc/passwd",
        "gopher://example.com/7"
    })
    @DisplayName("Should reject non-HTTPS URLs")
    void testRejectNonHttps(String url) {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> validator.validateUrl(url));
        assertTrue(ex.getMessage().contains("HTTPS"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "https://localhost/webhook",
        "https://backend/api",
        "https://ftth-backend/api",
        "https://gateway-payment/api",
        "https://ftth-postgres/api",
        "https://keycloak/auth",
        "https://kong:8001/admin"
    })
    @DisplayName("Should reject internal docker hostnames")
    void testRejectInternalHosts(String url) {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> validator.validateUrl(url));
        assertTrue(ex.getMessage().contains("SSRF") || ex.getMessage().contains("FQDN") || ex.getMessage().contains("internal"));
    }

    @Test
    @DisplayName("Should identify restricted IP addresses")
    void testIsRestrictedIp() throws Exception {
        assertTrue(validator.isRestrictedIp(InetAddress.getByName("127.0.0.1")));
        assertTrue(validator.isRestrictedIp(InetAddress.getByName("10.0.1.5")));
        assertTrue(validator.isRestrictedIp(InetAddress.getByName("172.18.0.2")));
        assertTrue(validator.isRestrictedIp(InetAddress.getByName("172.31.255.255")));
        assertTrue(validator.isRestrictedIp(InetAddress.getByName("192.168.1.100")));
        assertTrue(validator.isRestrictedIp(InetAddress.getByName("169.254.169.254")));
        assertTrue(validator.isRestrictedIp(InetAddress.getByName("0.0.0.0")));
        assertTrue(validator.isRestrictedIp(InetAddress.getByName("::1")));

        // Public IP should NOT be restricted
        assertFalse(validator.isRestrictedIp(InetAddress.getByName("8.8.8.8")));
        assertFalse(validator.isRestrictedIp(InetAddress.getByName("1.1.1.1")));
    }
}
