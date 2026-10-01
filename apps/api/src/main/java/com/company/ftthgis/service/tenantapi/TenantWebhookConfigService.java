package com.company.ftthgis.service.tenantapi;

import com.company.ftthgis.api.tenant.dto.RollSecretResponse;
import com.company.ftthgis.api.tenant.dto.WebhookEndpointRequest;
import com.company.ftthgis.api.tenant.dto.WebhookEndpointResponse;
import com.company.ftthgis.config.security.WebhookSecurityValidator;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantWebhookEndpoint;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.TenantWebhookEndpointRepository;
import com.company.ftthgis.util.SecretEncryptionUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenantWebhookConfigService {

    private final OrganizationRepository organizationRepository;
    private final TenantWebhookEndpointRepository endpointRepository;
    private final WebhookSecurityValidator securityValidator;
    private final SecretEncryptionUtil encryptionUtil;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<WebhookEndpointResponse> listEndpoints(String idOrSlug) {
        Organization org = resolveOrganization(idOrSlug);
        List<TenantWebhookEndpoint> endpoints = endpointRepository.findByOrganizationIdNative(org.getId());

        return endpoints.stream().map(e -> WebhookEndpointResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .targetUrl(e.getTargetUrl())
                .webhookSecretMasked(e.getWebhookSecretEncrypted() != null ? "whsec_••••••••••••" : null)
                .hasSecret(e.getWebhookSecretEncrypted() != null && !e.getWebhookSecretEncrypted().isBlank())
                .isActive(e.isActive())
                .subscribedEvents(parseSubscribedEvents(e.getSubscribedEvents()))
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build()
        ).toList();
    }

    @Transactional
    public WebhookEndpointResponse createEndpoint(String idOrSlug, WebhookEndpointRequest request) {
        Organization org = resolveOrganization(idOrSlug);

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Nama endpoint tidak boleh kosong.");
        }
        if (request.getTargetUrl() == null || request.getTargetUrl().trim().isEmpty()) {
            throw new IllegalArgumentException("URL target webhook tidak boleh kosong.");
        }

        // SSRF Pre-flight check
        securityValidator.validateUrl(request.getTargetUrl());

        String initialSecret = "whsec_" + org.getSlug() + "_" + encryptionUtil.generateSecureToken(16);
        String encryptedSecret = encryptionUtil.encrypt(initialSecret);

        String eventsJson;
        try {
            eventsJson = objectMapper.writeValueAsString(request.getSubscribedEvents() != null ? request.getSubscribedEvents() : Map.of());
        } catch (Exception e) {
            eventsJson = "{}";
        }

        TenantWebhookEndpoint endpoint = TenantWebhookEndpoint.builder()
                .organization(org)
                .name(request.getName().trim())
                .targetUrl(request.getTargetUrl().trim())
                .webhookSecretEncrypted(encryptedSecret)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .subscribedEvents(eventsJson)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        TenantWebhookEndpoint saved = endpointRepository.save(endpoint);
        log.info("Webhook endpoint '{}' created for organization '{}'", saved.getName(), org.getSlug());

        return WebhookEndpointResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .targetUrl(saved.getTargetUrl())
                .webhookSecretMasked("whsec_••••••••••••")
                .hasSecret(true)
                .isActive(saved.isActive())
                .subscribedEvents(parseSubscribedEvents(saved.getSubscribedEvents()))
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    @Transactional
    public WebhookEndpointResponse updateEndpoint(String idOrSlug, UUID endpointId, WebhookEndpointRequest request) {
        Organization org = resolveOrganization(idOrSlug);
        TenantWebhookEndpoint endpoint = endpointRepository.findByIdAndOrganizationIdNative(org.getId(), endpointId)
                .orElseThrow(() -> new IllegalArgumentException("Endpoint tidak ditemukan."));

        if (request.getTargetUrl() != null && !request.getTargetUrl().trim().isEmpty()) {
            securityValidator.validateUrl(request.getTargetUrl());
            endpoint.setTargetUrl(request.getTargetUrl().trim());
        }
        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            endpoint.setName(request.getName().trim());
        }
        if (request.getIsActive() != null) {
            endpoint.setActive(request.getIsActive());
        }
        if (request.getSubscribedEvents() != null) {
            try {
                endpoint.setSubscribedEvents(objectMapper.writeValueAsString(request.getSubscribedEvents()));
            } catch (Exception e) {
                log.error("Failed to serialize events: {}", e.getMessage());
            }
        }

        endpoint.setUpdatedAt(LocalDateTime.now());
        TenantWebhookEndpoint saved = endpointRepository.save(endpoint);

        return WebhookEndpointResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .targetUrl(saved.getTargetUrl())
                .webhookSecretMasked(saved.getWebhookSecretEncrypted() != null ? "whsec_••••••••••••" : null)
                .hasSecret(saved.getWebhookSecretEncrypted() != null)
                .isActive(saved.isActive())
                .subscribedEvents(parseSubscribedEvents(saved.getSubscribedEvents()))
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    @Transactional
    public void deleteEndpoint(String idOrSlug, UUID endpointId) {
        Organization org = resolveOrganization(idOrSlug);
        int deleted = endpointRepository.deleteEndpointNative(org.getId(), endpointId);
        if (deleted == 0) {
            throw new IllegalArgumentException("Endpoint tidak ditemukan untuk organisasi ini.");
        }
        log.info("Webhook endpoint '{}' deleted for organization '{}'", endpointId, org.getSlug());
    }

    @Transactional
    public RollSecretResponse rollEndpointSecret(String idOrSlug, UUID endpointId) {
        Organization org = resolveOrganization(idOrSlug);
        TenantWebhookEndpoint endpoint = endpointRepository.findByIdAndOrganizationIdNative(org.getId(), endpointId)
                .orElseThrow(() -> new IllegalArgumentException("Endpoint tidak ditemukan."));

        String randomHex = encryptionUtil.generateSecureToken(16);
        String plainTextSecret = "whsec_" + org.getSlug() + "_" + randomHex;
        endpoint.setWebhookSecretEncrypted(encryptionUtil.encrypt(plainTextSecret));
        endpoint.setUpdatedAt(LocalDateTime.now());
        endpointRepository.save(endpoint);

        return RollSecretResponse.builder()
                .plainTextSecret(plainTextSecret)
                .webhookSecretMasked("whsec_••••••••••••" + randomHex.substring(randomHex.length() - 4))
                .message("Secret HMAC baru berhasil dibuat untuk endpoint '" + endpoint.getName() + "'.")
                .build();
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

    private Map<String, Boolean> parseSubscribedEvents(String json) {
        if (json == null || json.isBlank()) return Map.of("fiberCut", true, "oltDown", true);
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Boolean>>() {});
        } catch (Exception e) {
            return Map.of("fiberCut", true, "oltDown", true);
        }
    }
}
