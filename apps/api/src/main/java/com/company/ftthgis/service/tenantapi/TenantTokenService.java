package com.company.ftthgis.service.tenantapi;

import com.company.ftthgis.api.tenant.dto.ScopedTokenCreateRequest;
import com.company.ftthgis.api.tenant.dto.ScopedTokenCreateResponse;
import com.company.ftthgis.api.tenant.dto.ScopedTokenResponse;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantApiToken;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.TenantApiTokenRepository;
import com.company.ftthgis.util.SecretEncryptionUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenantTokenService {

    private final OrganizationRepository organizationRepository;
    private final TenantApiTokenRepository tokenRepository;
    private final SecretEncryptionUtil encryptionUtil;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<ScopedTokenResponse> listTokens(String idOrSlug) {
        Organization org = resolveOrganization(idOrSlug);
        List<TenantApiToken> tokens = tokenRepository.findByOrganizationIdNative(org.getId());

        return tokens.stream().map(t -> ScopedTokenResponse.builder()
                .id(t.getId())
                .name(t.getName())
                .tokenPrefix(t.getTokenPrefix())
                .tokenLast4(t.getTokenLast4())
                .maskedToken(t.getTokenPrefix() + "••••••••" + t.getTokenLast4())
                .scopes(parseScopes(t.getScopes()))
                .expiresAt(t.getExpiresAt())
                .lastUsedAt(t.getLastUsedAt())
                .isRevoked(t.isRevoked())
                .createdAt(t.getCreatedAt())
                .build()
        ).toList();
    }

    @Transactional
    public ScopedTokenCreateResponse createScopedToken(String idOrSlug, ScopedTokenCreateRequest request) {
        Organization org = resolveOrganization(idOrSlug);

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Nama token tidak boleh kosong.");
        }

        List<String> scopes = request.getScopes() != null && !request.getScopes().isEmpty()
                ? request.getScopes()
                : List.of("coverage:read");

        String randomHex = encryptionUtil.generateSecureToken(16);
        String cleanSlug = org.getSlug().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "-");
        String plainTextToken = "k2_tok_" + cleanSlug + "_" + randomHex;

        String prefix = "k2_tok_" + (cleanSlug.length() > 6 ? cleanSlug.substring(0, 6) : cleanSlug) + "_";
        String last4 = randomHex.substring(randomHex.length() - 4);
        String hash = encryptionUtil.sha256Hex(plainTextToken);

        LocalDateTime expiresAt = null;
        if (request.getExpirationDays() != null && request.getExpirationDays() > 0) {
            expiresAt = LocalDateTime.now().plusDays(request.getExpirationDays());
        }

        String scopesJson;
        try {
            scopesJson = objectMapper.writeValueAsString(scopes);
        } catch (Exception e) {
            scopesJson = "[\"coverage:read\"]";
        }

        TenantApiToken token = TenantApiToken.builder()
                .organization(org)
                .name(request.getName().trim())
                .tokenHash(hash)
                .tokenPrefix(prefix)
                .tokenLast4(last4)
                .scopes(scopesJson)
                .expiresAt(expiresAt)
                .isRevoked(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        TenantApiToken saved = tokenRepository.save(token);

        log.info("Scoped API Token '{}' created for organization '{}' with scopes: {}",
                saved.getName(), org.getSlug(), scopes);

        return ScopedTokenCreateResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .plainTextToken(plainTextToken)
                .token(plainTextToken)
                .tokenPrefix(prefix)
                .tokenLast4(last4)
                .maskedToken(prefix + "••••••••" + last4)
                .scopes(scopes)
                .expiresAt(saved.getExpiresAt())
                .message("Token API berhasil dibuat. Salin token ini sekarang karena tidak dapat ditampilkan kembali.")
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Transactional
    public void revokeToken(String idOrSlug, UUID tokenId) {
        Organization org = resolveOrganization(idOrSlug);
        int updated = tokenRepository.revokeTokenNative(org.getId(), tokenId);
        if (updated == 0) {
            throw new IllegalArgumentException("Token tidak ditemukan untuk organisasi ini.");
        }
        log.info("Scoped API Token '{}' revoked for organization '{}'", tokenId, org.getSlug());
    }

    private Organization resolveOrganization(String idOrSlug) {
        try {
            UUID uuid = UUID.fromString(idOrSlug);
            return organizationRepository.findById(uuid)
                    .or(() -> organizationRepository.findBySlug(idOrSlug))
                    .orElseThrow(() -> new IllegalArgumentException("Organisasi tidak ditemukan: " + idOrSlug));
        } catch (IllegalArgumentException e) {
            return organizationRepository.findBySlug(idOrSlug)
                    .orElseThrow(() -> new IllegalArgumentException("Organisasi tidak ditemukan: " + idOrSlug));
        }
    }

    private List<String> parseScopes(String json) {
        if (json == null || json.isBlank()) return List.of("coverage:read");
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of("coverage:read");
        }
    }
}
