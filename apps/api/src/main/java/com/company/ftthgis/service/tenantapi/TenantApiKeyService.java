package com.company.ftthgis.service.tenantapi;

import com.company.ftthgis.api.tenant.dto.ApiKeyResponseDto;
import com.company.ftthgis.api.tenant.dto.CreateApiKeyRequest;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantApiKey;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSlugAliasRepository;
import com.company.ftthgis.domain.tenant.repository.TenantApiKeyRepository;
import com.company.ftthgis.util.SecretEncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenantApiKeyService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationSlugAliasRepository slugAliasRepository;
    private final TenantApiKeyRepository apiKeyRepository;
    private final SecretEncryptionUtil encryptionUtil;

    @Transactional(readOnly = true)
    public List<ApiKeyResponseDto> listApiKeys(String idOrSlug) {
        Organization org = resolveOrganization(idOrSlug);
        List<TenantApiKey> keys = apiKeyRepository.findByOrganizationIdNative(org.getId());

        return keys.stream().map(this::mapToDto).toList();
    }

    @Transactional
    public ApiKeyResponseDto createApiKey(String idOrSlug, CreateApiKeyRequest request) {
        Organization org = resolveOrganization(idOrSlug);

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Nama API Key tidak boleh kosong.");
        }

        List<String> scopes = request.getScopes() != null && !request.getScopes().isEmpty()
                ? request.getScopes()
                : List.of("read:network", "read:telemetry");

        String cleanSlug = org.getSlug().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
        String prefixTag = cleanSlug.length() > 4 ? cleanSlug.substring(0, 4) : cleanSlug;
        String keyPrefix = "k2_live_" + prefixTag;

        String randomEntropy = encryptionUtil.generateSecureToken(24);
        String plainTextKey = keyPrefix + "_" + randomEntropy;
        String keyHash = encryptionUtil.sha256Hex(plainTextKey);

        LocalDateTime expiresAt = null;
        if (request.getExpirationDays() != null && request.getExpirationDays() > 0) {
            expiresAt = LocalDateTime.now().plusDays(request.getExpirationDays());
        }

        TenantApiKey apiKey = TenantApiKey.builder()
                .organization(org)
                .name(request.getName().trim())
                .keyPrefix(keyPrefix)
                .keyHash(keyHash)
                .scopes(String.join(",", scopes))
                .isActive(true)
                .expiresAt(expiresAt)
                .build();

        TenantApiKey saved = apiKeyRepository.save(apiKey);
        log.info("🔑 Developer API Key '{}' created for org '{}' (ID: {})", saved.getName(), org.getSlug(), saved.getId());

        ApiKeyResponseDto dto = mapToDto(saved);
        dto.setPlainTextKey(plainTextKey); // Only shown once upon creation
        return dto;
    }

    @Transactional
    public void revokeApiKey(String idOrSlug, UUID keyId) {
        Organization org = resolveOrganization(idOrSlug);
        int updated = apiKeyRepository.revokeKeyNative(org.getId(), keyId);
        if (updated == 0) {
            throw new IllegalArgumentException("API Key tidak ditemukan atau tidak berada di organisasi ini.");
        }
        log.info("🔒 Developer API Key '{}' revoked for org '{}'", keyId, org.getSlug());
    }

    @Transactional
    public void deleteApiKey(String idOrSlug, UUID keyId) {
        Organization org = resolveOrganization(idOrSlug);
        TenantApiKey key = apiKeyRepository.findByIdAndOrganizationIdNative(org.getId(), keyId)
                .orElseThrow(() -> new IllegalArgumentException("API Key tidak ditemukan."));
        apiKeyRepository.delete(key);
        log.info("🗑️ Developer API Key '{}' deleted for org '{}'", keyId, org.getSlug());
    }

    private ApiKeyResponseDto mapToDto(TenantApiKey key) {
        List<String> scopeList = key.getScopes() != null && !key.getScopes().isBlank()
                ? Arrays.stream(key.getScopes().split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList()
                : List.of();

        String masked = key.getKeyPrefix() != null ? key.getKeyPrefix() + "_••••••••" : "k2_live_••••••••";

        return ApiKeyResponseDto.builder()
                .id(key.getId())
                .name(key.getName())
                .keyPrefix(key.getKeyPrefix())
                .maskedKey(masked)
                .scopes(scopeList)
                .isActive(key.isActive())
                .lastUsedAt(key.getLastUsedAt())
                .expiresAt(key.getExpiresAt())
                .createdAt(key.getCreatedAt())
                .build();
    }

    private Organization resolveOrganization(String idOrSlug) {
        if (idOrSlug == null || idOrSlug.trim().isEmpty()) {
            throw new IllegalArgumentException("Identifier organisasi tidak boleh kosong.");
        }
        try {
            UUID id = UUID.fromString(idOrSlug);
            return organizationRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Organisasi tidak ditemukan untuk ID: " + idOrSlug));
        } catch (IllegalArgumentException notUuid) {
            return organizationRepository.findBySlug(idOrSlug)
                    .or(() -> slugAliasRepository.findByOldSlug(idOrSlug).map(com.company.ftthgis.domain.tenant.entity.OrganizationSlugAlias::getOrganization))
                    .orElseThrow(() -> new IllegalArgumentException("Organisasi tidak ditemukan untuk Slug: " + idOrSlug));
        }
    }
}
