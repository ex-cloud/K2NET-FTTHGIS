package com.company.ftthgis.service.tenantapi;

import com.company.ftthgis.api.tenant.dto.ApiKeyResponseDto;
import com.company.ftthgis.api.tenant.dto.CreateApiKeyRequest;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantApiKey;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSlugAliasRepository;
import com.company.ftthgis.domain.tenant.repository.TenantApiKeyRepository;
import com.company.ftthgis.util.SecretEncryptionUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TenantApiKeyServiceTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private OrganizationSlugAliasRepository slugAliasRepository;

    @Mock
    private TenantApiKeyRepository apiKeyRepository;

    @Mock
    private SecretEncryptionUtil encryptionUtil;

    @InjectMocks
    private TenantApiKeyService apiKeyService;

    private Organization organization;
    private UUID orgId;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();
        organization = Organization.builder()
                .id(orgId)
                .name("PT Cicadas Fiber")
                .slug("cicadas")
                .build();

        when(organizationRepository.findBySlug("cicadas")).thenReturn(Optional.of(organization));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
        when(encryptionUtil.generateSecureToken(anyInt())).thenReturn("mockedentropy1234567890abcdef");
        when(encryptionUtil.sha256Hex(anyString())).thenReturn("mockedhash1234567890abcdef");
    }

    @Test
    @DisplayName("Should list API keys for organization")
    void testListApiKeys() {
        TenantApiKey key = TenantApiKey.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .name("Production Key")
                .keyPrefix("k2_live_cica")
                .keyHash("mockedhash")
                .scopes("read:network,read:telemetry")
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();

        when(apiKeyRepository.findByOrganizationIdNative(orgId)).thenReturn(List.of(key));

        List<ApiKeyResponseDto> result = apiKeyService.listApiKeys("cicadas");

        assertEquals(1, result.size());
        assertEquals("Production Key", result.get(0).getName());
        assertEquals("k2_live_cica", result.get(0).getKeyPrefix());
        assertTrue(result.get(0).isActive());
        assertEquals(2, result.get(0).getScopes().size());
        assertNull(result.get(0).getPlainTextKey()); // Masked on list
    }

    @Test
    @DisplayName("Should create developer API key and return plain text key once")
    void testCreateApiKey_Success() {
        CreateApiKeyRequest request = CreateApiKeyRequest.builder()
                .name("Mobile App Backend")
                .scopes(List.of("read:network", "write:network"))
                .expirationDays(30)
                .build();

        when(apiKeyRepository.save(any(TenantApiKey.class))).thenAnswer(invocation -> {
            TenantApiKey k = invocation.getArgument(0);
            k.setId(UUID.randomUUID());
            k.setCreatedAt(LocalDateTime.now());
            return k;
        });

        ApiKeyResponseDto response = apiKeyService.createApiKey("cicadas", request);

        assertNotNull(response);
        assertEquals("Mobile App Backend", response.getName());
        assertNotNull(response.getPlainTextKey());
        assertTrue(response.getPlainTextKey().startsWith("k2_live_cica_"));
        assertNotNull(response.getExpiresAt());
        assertTrue(response.isActive());
        verify(apiKeyRepository).save(any(TenantApiKey.class));
    }

    @Test
    @DisplayName("Should reject API key creation with empty name")
    void testCreateApiKey_EmptyName() {
        CreateApiKeyRequest request = CreateApiKeyRequest.builder()
                .name("")
                .build();

        assertThrows(IllegalArgumentException.class, () -> apiKeyService.createApiKey("cicadas", request));
    }

    @Test
    @DisplayName("Should revoke API key successfully")
    void testRevokeApiKey() {
        UUID keyId = UUID.randomUUID();
        when(apiKeyRepository.revokeKeyNative(orgId, keyId)).thenReturn(1);

        assertDoesNotThrow(() -> apiKeyService.revokeApiKey("cicadas", keyId));
        verify(apiKeyRepository).revokeKeyNative(orgId, keyId);
    }

    @Test
    @DisplayName("Should delete API key successfully")
    void testDeleteApiKey() {
        UUID keyId = UUID.randomUUID();
        TenantApiKey key = TenantApiKey.builder()
                .id(keyId)
                .organization(organization)
                .build();

        when(apiKeyRepository.findByIdAndOrganizationIdNative(orgId, keyId)).thenReturn(Optional.of(key));

        assertDoesNotThrow(() -> apiKeyService.deleteApiKey("cicadas", keyId));
        verify(apiKeyRepository).delete(key);
    }
}
