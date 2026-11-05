package com.company.ftthgis.service;

import com.company.ftthgis.api.security.dto.*;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.OrganizationSsoConfig;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSsoConfigRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.OptimisticLockingFailureException;

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

        ssoService = new TenantSsoService(
                organizationRepository,
                ssoConfigRepository,
                licenseCryptoService,
                keycloakAdminService,
                objectMapper
        );

        testOrgId = UUID.randomUUID();
        testOrg = Organization.builder()
                .id(testOrgId)
                .name("FiberNet ISP")
                .slug("fibernet")
                .build();

        when(organizationRepository.findBySlug("fibernet")).thenReturn(Optional.of(testOrg));
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
}

