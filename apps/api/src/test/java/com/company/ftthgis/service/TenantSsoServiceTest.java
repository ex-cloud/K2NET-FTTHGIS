package com.company.ftthgis.service;

import com.company.ftthgis.api.security.dto.*;
import com.company.ftthgis.api.tenant.dto.LicenseEntitlementsDto;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationSsoConfig;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSsoConfigRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.OptimisticLockingFailureException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class TenantSsoServiceTest {

    private OrganizationRepository organizationRepository;
    private OrganizationSsoConfigRepository ssoConfigRepository;
    private LicenseCryptoService licenseCryptoService;
    private KeycloakAdminService keycloakAdminService;
    private ObjectMapper objectMapper;
    private LicenseManagementService licenseManagementService;

    private TenantSsoService ssoService;

    private Organization testOrg;
    private UUID testOrgId;

    @BeforeEach
    void setUp() {
        organizationRepository = mock(OrganizationRepository.class);
        ssoConfigRepository = mock(OrganizationSsoConfigRepository.class);
        licenseCryptoService = mock(LicenseCryptoService.class);
        keycloakAdminService = mock(KeycloakAdminService.class);
        objectMapper = new ObjectMapper();
        licenseManagementService = mock(LicenseManagementService.class);

        ssoService = new TenantSsoService(
                organizationRepository,
                ssoConfigRepository,
                licenseCryptoService,
                keycloakAdminService,
                objectMapper,
                licenseManagementService
        );

        testOrgId = UUID.randomUUID();
        SubscriptionPlan proPlan = SubscriptionPlan.builder()
                .name("PRO")
                .hasSso(true)
                .build();
        testOrg = Organization.builder()
                .id(testOrgId)
                .name("FiberNet ISP")
                .slug("fibernet")
                .subscriptionPlan(proPlan)
                .build();

        when(organizationRepository.findBySlug("fibernet")).thenReturn(Optional.of(testOrg));
        when(licenseManagementService.getEffectiveLicenseEntitlements(testOrgId))
                .thenReturn(LicenseEntitlementsDto.builder().ssoEnabled(true).build());
    }

    @Test
    @DisplayName("S1: getSsoConfig returns empty optional when not configured")
    void testGetSsoConfig_WhenNotFound_ReturnsEmpty() {
        when(ssoConfigRepository.findFirstByOrganizationIdNative(testOrgId)).thenReturn(Optional.empty());

        Optional<TenantSsoConfigDto> result = ssoService.getSsoConfig("fibernet");

        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("S2: getSsoConfig returns masked secret and DTO when configured")
    void testGetSsoConfig_WhenFound_ReturnsMaskedSecretAndDto() {
        OrganizationSsoConfig config = OrganizationSsoConfig.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .providerType("GOOGLE")
                .displayName("Google Workspace")
                .clientId("google-client-123.apps.googleusercontent.com")
                .clientSecretEncrypted("v1:dummyEncryptedSecretPayload")
                .enforceSso(false)
                .allowBreakGlassBypass(true)
                .status("ACTIVE")
                .lastTestStatus("SUCCESS")
                .lastTestAt(LocalDateTime.now())
                .version(1L)
                .build();

        when(ssoConfigRepository.findFirstByOrganizationIdNative(testOrgId)).thenReturn(Optional.of(config));

        Optional<TenantSsoConfigDto> result = ssoService.getSsoConfig("fibernet");

        assertTrue(result.isPresent());
        TenantSsoConfigDto dto = result.get();
        assertEquals("fibernet", dto.getOrganizationSlug());
        assertEquals("GOOGLE", dto.getProviderType());
        assertTrue(dto.isHasClientSecret());
        assertEquals("••••••••••••••••", dto.getMaskedClientSecret());
        assertEquals("SUCCESS", dto.getLastTestStatus());
    }

    @Test
    @DisplayName("S3: updateSsoConfig throws IllegalStateException when enforceSso is enabled without successful probe (Anti-Lockout)")
    void testUpdateSsoConfig_WhenEnforceSsoWithoutProbe_ThrowsIllegalStateException() {
        // Belum pernah test probe (lastTestStatus == null)
        OrganizationSsoConfig existing = OrganizationSsoConfig.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .providerType("OIDC_CUSTOM")
                .clientId("client-123")
                .lastTestStatus(null)
                .build();

        when(ssoConfigRepository.findFirstByOrganizationIdNative(testOrgId)).thenReturn(Optional.of(existing));

        UpdateTenantSsoConfigRequest request = UpdateTenantSsoConfigRequest.builder()
                .providerType("OIDC_CUSTOM")
                .clientId("client-123")
                .enforceSso(true) // Mencoba mengaktifkan tanpa probe
                .build();

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                ssoService.updateSsoConfig("fibernet", request, "admin@fibernet.net")
        );

        assertTrue(ex.getMessage().contains("Gagal menegakkan SSO wajib"));
    }

    @Test
    @DisplayName("S4: updateSsoConfig encrypts plaintext secret and syncs to Keycloak realm")
    void testUpdateSsoConfig_WhenValid_EncryptsSecretAndSyncsToKeycloak() {
        OrganizationSsoConfig existing = OrganizationSsoConfig.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .providerType("OIDC_CUSTOM")
                .clientId("client-123")
                .lastTestStatus("SUCCESS")
                .version(0L)
                .build();

        when(ssoConfigRepository.findFirstByOrganizationIdNative(testOrgId)).thenReturn(Optional.of(existing));
        when(licenseCryptoService.encryptSecret("my-super-secret")).thenReturn("v1:encryptedGcmPayload");
        when(ssoConfigRepository.save(any(OrganizationSsoConfig.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateTenantSsoConfigRequest request = UpdateTenantSsoConfigRequest.builder()
                .providerType("OIDC_CUSTOM")
                .displayName("Okta SSO")
                .clientId("client-123")
                .clientSecret("my-super-secret")
                .issuerUrl("https://dev-12345.okta.com/oauth2/default")
                .enforceSso(true) // Diizinkan karena lastTestStatus == SUCCESS
                .version(0L)
                .build();

        TenantSsoConfigDto result = ssoService.updateSsoConfig("fibernet", request, "admin@fibernet.net");

        assertNotNull(result);
        assertTrue(result.isEnforceSso());
        verify(licenseCryptoService).encryptSecret("my-super-secret");

        // Verifikasi sinkronisasi ke Keycloak k2net-tenants
        verify(keycloakAdminService).upsertRealmIdentityProvider(
                eq("k2net-tenants"),
                eq("sso-fibernet"),
                eq("oidc"),
                eq("Okta SSO"),
                anyMap()
        );

        ArgumentCaptor<OrganizationSsoConfig> captor = ArgumentCaptor.forClass(OrganizationSsoConfig.class);
        verify(ssoConfigRepository).save(captor.capture());
        assertEquals("v1:encryptedGcmPayload", captor.getValue().getClientSecretEncrypted());
    }

    @Test
    @DisplayName("S5: updateSsoConfig throws OptimisticLockingFailureException on version mismatch")
    void testUpdateSsoConfig_OptimisticLockingFailure_ThrowsException() {
        OrganizationSsoConfig existing = OrganizationSsoConfig.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .providerType("GOOGLE")
                .clientId("client-123")
                .version(2L) // Versi di database adalah 2
                .build();

        when(ssoConfigRepository.findFirstByOrganizationIdNative(testOrgId)).thenReturn(Optional.of(existing));

        UpdateTenantSsoConfigRequest request = UpdateTenantSsoConfigRequest.builder()
                .providerType("GOOGLE")
                .clientId("client-123")
                .version(1L) // Client mengirim versi lama 1
                .build();

        assertThrows(OptimisticLockingFailureException.class, () ->
                ssoService.updateSsoConfig("fibernet", request, "admin@fibernet.net")
        );
    }

    @Test
    @DisplayName("S6: deleteSsoConfig deletes from Keycloak and repository")
    void testDeleteSsoConfig_RemovesFromKeycloakAndRepository() {
        OrganizationSsoConfig existing = OrganizationSsoConfig.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .providerType("GOOGLE")
                .build();

        when(ssoConfigRepository.findFirstByOrganizationIdNative(testOrgId)).thenReturn(Optional.of(existing));

        ssoService.deleteSsoConfig("fibernet", "admin@fibernet.net");

        verify(keycloakAdminService).deleteRealmIdentityProvider("k2net-tenants", "sso-fibernet");
        verify(ssoConfigRepository).delete(existing);
    }

    @Test
    @DisplayName("S7: testProbe returns error response when discovery/metadata URL is empty")
    void testTestProbe_WhenDiscoveryUrlEmpty_ReturnsValidationFailure() {
        TestSsoProbeRequest req = TestSsoProbeRequest.builder()
                .providerType("OIDC_CUSTOM")
                .issuerUrl("")
                .metadataUrl(null)
                .build();

        TestSsoProbeResponse res = ssoService.testProbe("fibernet", req);

        assertFalse(res.isSuccess());
        assertTrue(res.getMessage().contains("wajib diisi"));
    }

    @Test
    @DisplayName("S8: testProbe records failure in DB when network connection fails")
    void testTestProbe_WhenNetworkFails_RecordsFailureInDb() {
        OrganizationSsoConfig existing = OrganizationSsoConfig.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .build();
        when(ssoConfigRepository.findFirstByOrganizationIdNative(testOrgId)).thenReturn(Optional.of(existing));

        TestSsoProbeRequest req = TestSsoProbeRequest.builder()
                .providerType("OIDC_CUSTOM")
                .issuerUrl("http://127.0.0.1:59999/non-existent-probe")
                .build();

        TestSsoProbeResponse res = ssoService.testProbe("fibernet", req);

        assertFalse(res.isSuccess());
        assertEquals("FAILED", existing.getLastTestStatus());
        assertNotNull(existing.getLastTestErrorMessage());
        verify(ssoConfigRepository).save(existing);
    }

    @Test
    @DisplayName("S9: discoverSsoByEmail returns active SSO config when domain matches")
    void testDiscoverSsoByEmail_WhenDomainMatches_ReturnsSsoResponse() {
        OrganizationSsoConfig config = OrganizationSsoConfig.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .providerType("MICROSOFT_ENTRA")
                .displayName("Microsoft 365 (Entra ID)")
                .enforceSso(true)
                .allowBreakGlassBypass(true)
                .status("ACTIVE")
                .domainMappings("[\"fibernet.id\", \"fibernet.com\"]")
                .build();

        when(ssoConfigRepository.findActiveConfigByEmailDomainNative("fibernet.id")).thenReturn(Optional.of(config));

        var res = ssoService.discoverSsoByEmail("user@fibernet.id");

        assertTrue(res.isSsoAvailable());
        assertTrue(res.isEnforceSso());
        assertTrue(res.isAllowBreakGlass());
        assertEquals("MICROSOFT_ENTRA", res.getProviderType());
        assertEquals("Microsoft 365 (Entra ID)", res.getDisplayName());
        assertEquals("fibernet", res.getOrganizationSlug());
        assertEquals("fibernet.id", res.getEmailDomain());
    }

    @Test
    @DisplayName("S10: discoverSsoByEmail returns ssoAvailable=false when domain not found or invalid email")
    void testDiscoverSsoByEmail_WhenDomainNotFound_ReturnsSsoUnavailable() {
        when(ssoConfigRepository.findActiveConfigByEmailDomainNative("unknown.com")).thenReturn(Optional.empty());

        var res = ssoService.discoverSsoByEmail("user@unknown.com");
        assertFalse(res.isSsoAvailable());
        assertFalse(res.isEnforceSso());
        assertEquals("unknown.com", res.getEmailDomain());

        var resInvalid = ssoService.discoverSsoByEmail("invalid-email-no-at");
        assertFalse(resInvalid.isSsoAvailable());
    }

    @Test
    @DisplayName("S11: updateSsoConfig rejects SSO configuration when active license disables feature_sso_enabled")
    void testUpdateSsoConfig_WhenLicenseDisablesSso_ThrowsIllegalStateException() {
        when(licenseManagementService.getEffectiveLicenseEntitlements(testOrgId))
                .thenReturn(LicenseEntitlementsDto.builder().ssoEnabled(false).build());

        UpdateTenantSsoConfigRequest request = UpdateTenantSsoConfigRequest.builder()
                .providerType("GOOGLE")
                .clientId("client-123")
                .build();

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                ssoService.updateSsoConfig("fibernet", request, "admin@fibernet.net")
        );
        assertTrue(ex.getMessage().contains("Single Sign-On"));
    }

    @Test
    @DisplayName("S12: updateSsoConfig with KEYCLOAK_OIDC populates full OIDC endpoints and rewrites backchannel URLs to internal Keycloak")
    void testUpdateSsoConfig_KeycloakOidc_PopulatesFullEndpointsAndInternalBackchannel() {
        when(ssoConfigRepository.findFirstByOrganizationIdNative(testOrgId)).thenReturn(Optional.empty());
        when(licenseCryptoService.encryptSecret("k2net-ops-sso-secret-2026")).thenReturn("v1:encSecret");
        when(ssoConfigRepository.save(any(OrganizationSsoConfig.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateTenantSsoConfigRequest request = UpdateTenantSsoConfigRequest.builder()
                .providerType("KEYCLOAK_OIDC")
                .displayName("K2NET Corporate SSO")
                .clientId("k2net-ops-sso-broker")
                .clientSecret("k2net-ops-sso-secret-2026")
                .issuerUrl("https://auth-gis.kdua.net/realms/ftth-realm")
                .enforceSso(false)
                .allowBreakGlassBypass(true)
                .build();

        ssoService.updateSsoConfig("fibernet", request, "admin@fibernet.net");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, String>> configCaptor = ArgumentCaptor.forClass(Map.class);
        verify(keycloakAdminService).upsertRealmIdentityProvider(
                eq("k2net-tenants"),
                eq("sso-fibernet"),
                eq("oidc"),
                eq("K2NET Corporate SSO"),
                configCaptor.capture()
        );

        Map<String, String> kcConfig = configCaptor.getValue();
        assertEquals("https://auth-gis.kdua.net/realms/ftth-realm/protocol/openid-connect/auth", kcConfig.get("authorizationUrl"));
        assertEquals("http://keycloak:8081/realms/ftth-realm/protocol/openid-connect/token", kcConfig.get("tokenUrl"));
        assertEquals("http://keycloak:8081/realms/ftth-realm/protocol/openid-connect/certs", kcConfig.get("jwksUrl"));
        assertEquals("http://keycloak:8081/realms/ftth-realm/protocol/openid-connect/userinfo", kcConfig.get("userInfoUrl"));
        assertEquals("FORCE", kcConfig.get("syncMode"));
    }

    @Test
    @DisplayName("S13: testProbe rejects SSRF issuerUrl even when stale bare metadataUrl is also passed")
    void testTestProbe_RejectsSsrfIssuerUrlWhenStaleBareMetadataUrlPresent() {
        OrganizationSsoConfig existing = OrganizationSsoConfig.builder()
                .id(testOrgId)
                .organization(testOrg)
                .build();
        when(ssoConfigRepository.findFirstByOrganizationIdNative(testOrgId)).thenReturn(Optional.of(existing));

        TestSsoProbeRequest req = TestSsoProbeRequest.builder()
                .providerType("KEYCLOAK_OIDC")
                .issuerUrl("http://169.254.169.254/latest/meta-data")
                .metadataUrl("https://auth-gis.kdua.net/realms/k2net-corporate")
                .build();

        TestSsoProbeResponse res = ssoService.testProbe("fibernet", req);

        assertFalse(res.isSuccess());
        assertEquals("UNHEALTHY", res.getHealthStatus());
        assertEquals("FAILED", existing.getLastTestStatus());
        assertNotNull(res.getMessage());
        assertFalse(res.getMessage().contains("Payload .well-known/openid-configuration tidak lengkap"));
    }

    private String generateTestPemCert(Path dir, String name, String cn, String startDateOpt, int validityDays) throws Exception {
        Path ks = dir.resolve(name + ".p12");
        Path pem = dir.resolve(name + ".pem");
        List<String> genCmd = new ArrayList<>(List.of(
                "keytool", "-genkeypair",
                "-alias", name,
                "-keyalg", "RSA",
                "-keysize", "2048",
                "-validity", String.valueOf(validityDays),
                "-dname", "CN=" + cn,
                "-keystore", ks.toString(),
                "-storepass", "changeit",
                "-storetype", "PKCS12"
        ));
        if (startDateOpt != null) {
            genCmd.add("-startdate");
            genCmd.add(startDateOpt);
        }
        Process gen = new ProcessBuilder(genCmd).redirectErrorStream(true).start();
        assertEquals(0, gen.waitFor());

        Process exp = new ProcessBuilder(
                "keytool", "-exportcert",
                "-alias", name,
                "-rfc",
                "-keystore", ks.toString(),
                "-storepass", "changeit",
                "-file", pem.toString()
        ).redirectErrorStream(true).start();
        assertEquals(0, exp.waitFor());
        return Files.readString(pem);
    }

    @Test
    @DisplayName("S14 (BUG-SAML-01 & 03): updateSsoConfig SAML_CUSTOM tanpa clientId sukses, aktifkan validateSignature=true & strip PEM ke compact DER")
    void testUpdateSsoConfig_SamlWithoutClientId_NormalizesDerAndEnablesSignatureValidation(@TempDir Path tempDir) throws Exception {
        String pemA = generateTestPemCert(tempDir, "certa", "idp-a.fibernet.net", null, 30);
        when(ssoConfigRepository.findFirstByOrganizationIdNative(testOrgId)).thenReturn(Optional.empty());
        when(ssoConfigRepository.save(any(OrganizationSsoConfig.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateTenantSsoConfigRequest request = UpdateTenantSsoConfigRequest.builder()
                .providerType("SAML_CUSTOM")
                .displayName("Fibernet SAML 2.0")
                .entityId("https://idp.fibernet.net/saml/metadata")
                .metadataUrl("https://idp.fibernet.net/saml/metadata.xml")
                .singleSignOnUrl("https://idp.fibernet.net/saml/sso")
                .signingCertificate(pemA)
                .build();

        TenantSsoConfigDto dto = ssoService.updateSsoConfig("fibernet", request, "admin@fibernet.net");

        assertEquals("https://idp.fibernet.net/saml/metadata", dto.getClientId());
        assertNotNull(dto.getSamlCertFingerprint());
        assertFalse(dto.isSamlOverlapActive());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, String>> kcCaptor = ArgumentCaptor.forClass(Map.class);
        verify(keycloakAdminService).upsertRealmIdentityProvider(
                eq("k2net-tenants"),
                eq("sso-fibernet"),
                eq("saml"),
                eq("Fibernet SAML 2.0"),
                kcCaptor.capture()
        );
        Map<String, String> kc = kcCaptor.getValue();
        assertEquals("true", kc.get("validateSignature"));
        assertEquals("true", kc.get("wantAssertionsSigned"));
        assertEquals("false", kc.get("useMetadataDescriptorUrl"));
        assertFalse(kc.get("signingCertificate").contains("BEGIN CERTIFICATE"));
        assertFalse(kc.get("signingCertificate").contains("\n"));
    }

    @Test
    @DisplayName("S15 (BUG-SAML-02): updateSsoConfig dan stageSecondary menolak cert expired serta duplikat SHA-256 fingerprint")
    void testSamlCertValidation_RejectsExpiredAndDuplicate(@TempDir Path tempDir) throws Exception {
        String validPem = generateTestPemCert(tempDir, "valid", "idp-valid.fibernet.net", null, 365);
        String expiredPem = generateTestPemCert(tempDir, "expired", "idp-exp.fibernet.net", "-10d", 5);

        when(ssoConfigRepository.findFirstByOrganizationIdNative(testOrgId)).thenReturn(Optional.empty());
        UpdateTenantSsoConfigRequest expiredReq = UpdateTenantSsoConfigRequest.builder()
                .providerType("SAML_CUSTOM")
                .entityId("https://idp.fibernet.net")
                .singleSignOnUrl("https://idp.fibernet.net/sso")
                .signingCertificate(expiredPem)
                .build();

        IllegalArgumentException expEx = assertThrows(IllegalArgumentException.class, () ->
                ssoService.updateSsoConfig("fibernet", expiredReq, "admin@fibernet.net"));
        assertTrue(expEx.getMessage().contains("kedaluwarsa"));

        OrganizationSsoConfig existing = OrganizationSsoConfig.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .providerType("SAML_CUSTOM")
                .entityId("https://idp.fibernet.net")
                .singleSignOnUrl("https://idp.fibernet.net/sso")
                .signingCertificate(validPem)
                .clientId("https://idp.fibernet.net")
                .build();
        when(ssoConfigRepository.findFirstByOrganizationIdNative(testOrgId)).thenReturn(Optional.of(existing));

        IllegalArgumentException stageExpEx = assertThrows(IllegalArgumentException.class, () ->
                ssoService.stageSecondarySamlCertificate("fibernet", expiredPem, "admin@fibernet.net"));
        assertTrue(stageExpEx.getMessage().contains("kedaluwarsa"));

        IllegalArgumentException dupEx = assertThrows(IllegalArgumentException.class, () ->
                ssoService.stageSecondarySamlCertificate("fibernet", validPem, "admin@fibernet.net"));
        assertTrue(dupEx.getMessage().contains("duplikat"));
    }

    @Test
    @DisplayName("S16 (Fase 7.16): Siklus Stage -> Promote (Clean & Rollback) -> Retire menyinkronkan DER comma-separated ke Keycloak 26.1.1")
    void testSamlDualCertRotationLifecycle(@TempDir Path tempDir) throws Exception {
        String pemA = generateTestPemCert(tempDir, "keya", "idp-key-a.fibernet.net", null, 15);
        String pemB = generateTestPemCert(tempDir, "keyb", "idp-key-b.fibernet.net", null, 365);

        OrganizationSsoConfig config = OrganizationSsoConfig.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .providerType("SAML_CUSTOM")
                .displayName("Fibernet SAML")
                .clientId("https://idp.fibernet.net")
                .entityId("https://idp.fibernet.net")
                .singleSignOnUrl("https://idp.fibernet.net/sso")
                .signingCertificate(pemA)
                .status("ACTIVE")
                .consecutiveProbeFailures(0)
                .healthStatus("DEGRADED")
                .build();

        when(ssoConfigRepository.findFirstByOrganizationIdNative(testOrgId)).thenReturn(Optional.of(config));
        when(ssoConfigRepository.save(any(OrganizationSsoConfig.class))).thenAnswer(inv -> inv.getArgument(0));

        // 1. Stage Cert B -> Dual-Cert Overlap aktif (signingCertificate = derA,derB)
        SamlCertificatesStatusDto staged = ssoService.stageSecondarySamlCertificate("fibernet", pemB, "sec@fibernet.net");
        assertTrue(staged.isOverlapActive());
        assertTrue(staged.getPrimary().isPresent());
        assertTrue(staged.getSecondary().isPresent());
        String fpA = staged.getPrimary().getSha256Fingerprint();
        String fpB = staged.getSecondary().getSha256Fingerprint();
        assertNotEquals(fpA, fpB);

        // 2. Promote dengan keepPreviousAsSecondary = true -> B naik jadi Primary, A turun jadi Secondary rollback
        SamlCertificatesStatusDto rollbackPromoted = ssoService.promoteSecondarySamlCertificate("fibernet", true, "sec@fibernet.net");
        assertTrue(rollbackPromoted.isOverlapActive());
        assertEquals(fpB, rollbackPromoted.getPrimary().getSha256Fingerprint());
        assertEquals(fpA, rollbackPromoted.getSecondary().getSha256Fingerprint());
        assertEquals("HEALTHY", config.getHealthStatus());

        // 3. Retire Secondary -> A dilepas, kembali ke 1 cert (B saja)
        SamlCertificatesStatusDto retired = ssoService.retireSecondarySamlCertificate("fibernet", "sec@fibernet.net");
        assertFalse(retired.isOverlapActive());
        assertEquals(fpB, retired.getPrimary().getSha256Fingerprint());
        assertFalse(retired.getSecondary().isPresent());

        // 4. Verifikasi Keycloak menerima CSV 2 DER saat Stage/Rollback dan 1 DER saat Retire
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, String>> kcCaptor = ArgumentCaptor.forClass(Map.class);
        verify(keycloakAdminService, times(3)).upsertRealmIdentityProvider(
                eq("k2net-tenants"), eq("sso-fibernet"), eq("saml"), eq("Fibernet SAML"), kcCaptor.capture());
        List<Map<String, String>> syncs = kcCaptor.getAllValues();
        assertEquals(2, syncs.get(0).get("signingCertificate").split(",").length);
        assertEquals(2, syncs.get(1).get("signingCertificate").split(",").length);
        assertEquals(1, syncs.get(2).get("signingCertificate").split(",").length);
        assertEquals("true", syncs.get(2).get("validateSignature"));

        // 5. Stage kembali A lalu Promote dengan clean cutover (keepPreviousAsSecondary = false)
        ssoService.stageSecondarySamlCertificate("fibernet", pemA, "sec@fibernet.net");
        SamlCertificatesStatusDto cleanPromoted = ssoService.promoteSecondarySamlCertificate("fibernet", false, "sec@fibernet.net");
        assertFalse(cleanPromoted.isOverlapActive());
        assertEquals(fpA, cleanPromoted.getPrimary().getSha256Fingerprint());
        assertFalse(cleanPromoted.getSecondary().isPresent());
    }
}

