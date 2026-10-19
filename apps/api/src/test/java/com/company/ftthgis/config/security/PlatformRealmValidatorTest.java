package com.company.ftthgis.config.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PlatformRealmValidatorTest {

    private PlatformRealmValidator validator;

    @BeforeEach
    void setUp() {
        validator = new PlatformRealmValidator("https://auth-gis.kdua.net");
    }

    @Test
    @DisplayName("Exact canonical platform realm issuer is accepted")
    void testValidPlatformRealmIssuer() {
        assertTrue(validator.isPlatformRealm("https://auth-gis.kdua.net/realms/ftth-realm"));
        assertTrue(validator.isPlatformRealm("https://auth-gis.kdua.net/realms/ftth-realm/"));
        assertTrue(validator.isPlatformRealm("http://keycloak:8081/realms/ftth-realm"));
        assertTrue(validator.isPlatformRealm("http://localhost:8081/realms/ftth-realm"));
        assertTrue(validator.isPlatformRealm("http://auth-gis.kdua.net:8081/realms/ftth-realm"));
    }

    @Test
    @DisplayName("Tenant realms must be rejected")
    void testTenantRealmRejected() {
        assertFalse(validator.isPlatformRealm("https://auth-gis.kdua.net/realms/tenant-acme"));
        assertFalse(validator.isPlatformRealm("https://auth-gis.kdua.net/realms/org-xyz"));
    }

    @Test
    @DisplayName("Attacker realm subpaths or lookalike realms must be rejected")
    void testSpoofedRealmRejected() {
        // Attacker hosting a realm named ftth-realm on their own domain
        assertFalse(validator.isPlatformRealm("https://evil.com/realms/ftth-realm"));
        assertFalse(validator.isPlatformRealm("https://attacker.org/realms/ftth-realm"));

        // Attacker domain with platform realm embedded
        assertFalse(validator.isPlatformRealm("https://auth-gis.kdua.net.evil.com/realms/ftth-realm"));

        // Similar realm names
        assertFalse(validator.isPlatformRealm("https://auth-gis.kdua.net/realms/ftth-realm-fake"));
        assertFalse(validator.isPlatformRealm("https://auth-gis.kdua.net/realms/ftth-realm/subpath"));
    }

    @Test
    @DisplayName("Null or blank issuer must be rejected")
    void testNullOrBlankIssuer() {
        assertFalse(validator.isPlatformRealm(null));
        assertFalse(validator.isPlatformRealm(""));
        assertFalse(validator.isPlatformRealm("   "));
    }
}
