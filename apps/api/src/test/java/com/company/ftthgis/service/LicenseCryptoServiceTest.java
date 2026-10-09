package com.company.ftthgis.service;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class LicenseCryptoServiceTest {

    private LicenseCryptoService cryptoService;

    @BeforeEach
    void setUp() {
        cryptoService = new LicenseCryptoService("test-secret-encryption-key-for-ftth-gis-32b!!", new ObjectMapper());
    }

    @Test
    @DisplayName("generateLicenseKey should produce canonical format matching K2NET-{TIER}-{HEX8}-{CHECKSUM4}")
    void testGenerateLicenseKeyFormat() {
        String proKey = cryptoService.generateLicenseKey("PRO");
        assertNotNull(proKey);
        assertTrue(proKey.matches("^K2NET-PRO-[0-9A-F]{8}-[0-9A-F]{4}$"), "Key must match canonical regex: " + proKey);
        assertTrue(cryptoService.verifyLicenseChecksum(proKey), "Generated key checksum must be valid");

        String entKey = cryptoService.generateLicenseKey("ENTERPRISE");
        assertTrue(entKey.startsWith("K2NET-ENT-"));
        assertTrue(cryptoService.verifyLicenseChecksum(entKey));

        String starterKey = cryptoService.generateLicenseKey("STARTER");
        assertTrue(starterKey.startsWith("K2NET-STARTER-"));
        assertTrue(cryptoService.verifyLicenseChecksum(starterKey));
    }

    @Test
    @DisplayName("verifyLicenseChecksum should reject tampered keys and malformed input")
    void testVerifyLicenseChecksumTampering() {
        String validKey = cryptoService.generateLicenseKey("PRO");
        assertTrue(cryptoService.verifyLicenseChecksum(validKey));

        // Tamper by altering a character in the random hex section
        String[] parts = validKey.split("-");
        char alteredHexChar = parts[2].charAt(0) == 'A' ? 'B' : 'A';
        String tamperedHex = alteredHexChar + parts[2].substring(1);
        String tamperedKey = parts[0] + "-" + parts[1] + "-" + tamperedHex + "-" + parts[3];

        assertFalse(cryptoService.verifyLicenseChecksum(tamperedKey), "Tampered key must fail checksum verification");

        // Tamper checksum
        String tamperedChecksumKey = parts[0] + "-" + parts[1] + "-" + parts[2] + "-9999";
        assertFalse(cryptoService.verifyLicenseChecksum(tamperedChecksumKey));

        // Null and malformed
        assertFalse(cryptoService.verifyLicenseChecksum(null));
        assertFalse(cryptoService.verifyLicenseChecksum(""));
        assertFalse(cryptoService.verifyLicenseChecksum("INVALID-FORMAT"));
        assertFalse(cryptoService.verifyLicenseChecksum("K2NET-PRO-ABCD"));
    }

    @Test
    @DisplayName("signLicenseMetadata and verifyLicenseSignature should detect altered metadata")
    void testSignAndVerifyLicenseMetadata() {
        UUID orgId = UUID.randomUUID();
        String planName = "PRO";
        String key = "K2NET-PRO-12345678-ABCD";
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime validUntil = now.plusYears(1);
        String machineFingerprint = "hw-server-01";

        String sig = cryptoService.signLicenseMetadata(orgId, planName, key, now, validUntil, machineFingerprint);
        assertNotNull(sig);
        assertEquals(64, sig.length(), "HMAC-SHA256 hex signature must be 64 characters");

        // Valid verify
        assertTrue(cryptoService.verifyLicenseSignature(orgId, planName, key, now, validUntil, machineFingerprint, sig));

        // Tampered orgId
        assertFalse(cryptoService.verifyLicenseSignature(UUID.randomUUID(), planName, key, now, validUntil, machineFingerprint, sig));

        // Tampered date
        assertFalse(cryptoService.verifyLicenseSignature(orgId, planName, key, now, validUntil.plusDays(1), machineFingerprint, sig));

        // Tampered plan
        assertFalse(cryptoService.verifyLicenseSignature(orgId, "ENTERPRISE", key, now, validUntil, machineFingerprint, sig));
    }

    @Test
    @DisplayName("Offline certificate round-trip generation and parsing should preserve integrity")
    void testOfflineCertificateRoundTrip() {
        Organization org = Organization.builder()
                .id(UUID.randomUUID())
                .name("ISP Intranet Garut")
                .slug("isp-garut")
                .build();

        SubscriptionPlan plan = SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .name("ENTERPRISE")
                .build();

        String licenseKey = cryptoService.generateLicenseKey("ENTERPRISE");

        TenantLicense license = TenantLicense.builder()
                .organization(org)
                .subscriptionPlan(plan)
                .licenseKey(licenseKey)
                .validFrom(LocalDateTime.now())
                .validUntil(LocalDateTime.now().plusYears(1))
                .machineFingerprint("hw-fingerprint-001")
                .overrideMaxProjects(25)
                .overrideMaxOdps(12000)
                .featureSsoEnabled(true)
                .featureApiEnabled(true)
                .featureAiCopilotEnabled(true)
                .build();

        String cert = cryptoService.generateOfflineCertificate(license, org);
        assertNotNull(cert);
        assertTrue(cert.contains("BEGIN K2NET LICENSE CERTIFICATE"));
        assertTrue(cert.contains("END K2NET LICENSE CERTIFICATE"));

        LicenseCryptoService.OfflineLicensePayload parsed = cryptoService.parseAndVerifyOfflineCertificate(cert);
        assertNotNull(parsed);
        assertEquals(licenseKey, parsed.getLicenseKey());
        assertEquals(org.getId().toString(), parsed.getOrganizationId());
        assertEquals("ENTERPRISE", parsed.getPlanName());
        assertEquals(25, parsed.getMaxProjects());
        assertEquals(12000, parsed.getMaxOdps());
        assertTrue(parsed.isFeatureAiCopilotEnabled());
        assertEquals("hw-fingerprint-001", parsed.getMachineFingerprint());
    }

    @Test
    @DisplayName("Offline certificate tampering should throw IllegalArgumentException")
    void testOfflineCertificateTamperingDetected() {
        Organization org = Organization.builder()
                .id(UUID.randomUUID())
                .name("ISP Tamper")
                .slug("isp-tamper")
                .build();

        String licenseKey = cryptoService.generateLicenseKey("PRO");
        TenantLicense license = TenantLicense.builder()
                .organization(org)
                .licenseKey(licenseKey)
                .validFrom(LocalDateTime.now())
                .validUntil(LocalDateTime.now().plusMonths(3))
                .build();

        String cert = cryptoService.generateOfflineCertificate(license, org);

        // Tamper with content by modifying a character in the Base64 payload
        int middle = cert.length() / 2;
        char alteredChar = cert.charAt(middle) == 'A' ? 'B' : 'A';
        String tamperedCert = cert.substring(0, middle) + alteredChar + cert.substring(middle + 1);

        assertThrows(IllegalArgumentException.class, () ->
                cryptoService.parseAndVerifyOfflineCertificate(tamperedCert)
        );
    }

    @Test
    @DisplayName("verifyMachineFingerprint should evaluate hardware binding accurately")
    void testVerifyMachineFingerprint() {
        assertTrue(cryptoService.verifyMachineFingerprint("hw-1234", "hw-1234"));
        assertTrue(cryptoService.verifyMachineFingerprint("HW-1234", "hw-1234")); // case insensitive
        assertFalse(cryptoService.verifyMachineFingerprint("hw-1234", "hw-9999"));
        assertFalse(cryptoService.verifyMachineFingerprint("hw-1234", null));

        // Unbound cloud license (expected is null)
        assertTrue(cryptoService.verifyMachineFingerprint(null, "any-machine"));
        assertTrue(cryptoService.verifyMachineFingerprint("", "any-machine"));
    }
}
