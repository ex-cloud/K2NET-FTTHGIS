package com.company.ftthgis.service.tenantapi;

import com.company.ftthgis.api.tenant.dto.*;
import com.company.ftthgis.config.security.SSRFSafeHttpClient;
import com.company.ftthgis.config.security.WebhookSecurityValidator;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantWebhook;
import com.company.ftthgis.domain.tenant.entity.TenantWebhookDelivery;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationSlugAliasRepository;
import com.company.ftthgis.domain.tenant.repository.TenantWebhookDeliveryRepository;
import com.company.ftthgis.domain.tenant.repository.TenantWebhookRepository;
import com.company.ftthgis.util.SecretEncryptionUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenantWebhookService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationSlugAliasRepository slugAliasRepository;
    private final TenantWebhookRepository webhookRepository;
    private final TenantWebhookDeliveryRepository deliveryRepository;
    private final WebhookSecurityValidator securityValidator;
    private final SSRFSafeHttpClient httpClient;
    private final SecretEncryptionUtil encryptionUtil;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<WebhookResponseDto> listWebhooks(String idOrSlug) {
        Organization org = resolveOrganization(idOrSlug);
        List<TenantWebhook> webhooks = webhookRepository.findByOrganizationIdNative(org.getId());
        return webhooks.stream().map(this::mapToDto).toList();
    }

    @Transactional
    public WebhookResponseDto createWebhook(String idOrSlug, CreateWebhookRequest request) {
        Organization org = resolveOrganization(idOrSlug);

        if (request.getUrl() == null || request.getUrl().trim().isEmpty()) {
            throw new IllegalArgumentException("URL webhook tidak boleh kosong.");
        }

        securityValidator.validateUrl(request.getUrl().trim());

        String signingSecret = "whsec_" + encryptionUtil.generateSecureToken(24);
        List<String> events = request.getEvents() != null && !request.getEvents().isEmpty()
                ? request.getEvents()
                : List.of("network.olt.status", "network.outage", "customer.created");

        TenantWebhook webhook = TenantWebhook.builder()
                .organization(org)
                .name(request.getName() != null && !request.getName().isBlank() ? request.getName().trim() : "Default Webhook")
                .url(request.getUrl().trim())
                .signingSecret(signingSecret)
                .events(String.join(",", events))
                .isActive(true)
                .headers(request.getHeaders())
                .failureCount(0)
                .build();

        TenantWebhook saved = webhookRepository.save(webhook);
        log.info("📡 Tenant Webhook '{}' created for org '{}' (URL: {})", saved.getName(), org.getSlug(), saved.getUrl());
        return mapToDto(saved);
    }

    @Transactional
    public WebhookResponseDto updateWebhook(String idOrSlug, UUID webhookId, CreateWebhookRequest request) {
        Organization org = resolveOrganization(idOrSlug);
        TenantWebhook webhook = webhookRepository.findByIdAndOrganizationIdNative(org.getId(), webhookId)
                .orElseThrow(() -> new IllegalArgumentException("Webhook tidak ditemukan."));

        if (request.getUrl() != null && !request.getUrl().isBlank()) {
            securityValidator.validateUrl(request.getUrl().trim());
            webhook.setUrl(request.getUrl().trim());
        }
        if (request.getName() != null && !request.getName().isBlank()) {
            webhook.setName(request.getName().trim());
        }
        if (request.getEvents() != null && !request.getEvents().isEmpty()) {
            webhook.setEvents(String.join(",", request.getEvents()));
        }
        if (request.getHeaders() != null) {
            webhook.setHeaders(request.getHeaders());
        }

        TenantWebhook updated = webhookRepository.save(webhook);
        log.info("📡 Tenant Webhook '{}' updated for org '{}'", updated.getName(), org.getSlug());
        return mapToDto(updated);
    }

    @Transactional
    public void deleteWebhook(String idOrSlug, UUID webhookId) {
        Organization org = resolveOrganization(idOrSlug);
        int deleted = webhookRepository.deleteWebhookNative(org.getId(), webhookId);
        if (deleted == 0) {
            throw new IllegalArgumentException("Webhook tidak ditemukan atau tidak berada di organisasi ini.");
        }
        log.info("🗑️ Tenant Webhook '{}' deleted for org '{}'", webhookId, org.getSlug());
    }

    @Transactional
    public RollSecretResponse rollSecret(String idOrSlug, UUID webhookId) {
        Organization org = resolveOrganization(idOrSlug);
        TenantWebhook webhook = webhookRepository.findByIdAndOrganizationIdNative(org.getId(), webhookId)
                .orElseThrow(() -> new IllegalArgumentException("Webhook tidak ditemukan."));

        String newSecret = "whsec_" + encryptionUtil.generateSecureToken(24);
        webhook.setSigningSecret(newSecret);
        webhookRepository.save(webhook);
        log.info("🔄 Webhook secret rolled for webhook '{}' (Org: {})", webhook.getId(), org.getSlug());

        return RollSecretResponse.builder()
                .plainTextSecret(newSecret)
                .webhookSecretMasked("whsec_••••••••" + newSecret.substring(Math.max(0, newSecret.length() - 4)))
                .message("Webhook secret berhasil di-roll.")
                .build();
    }

    @Transactional
    public TestPingResponse testPing(String idOrSlug, UUID webhookId) {
        Organization org = resolveOrganization(idOrSlug);
        TenantWebhook webhook = webhookRepository.findByIdAndOrganizationIdNative(org.getId(), webhookId)
                .orElseThrow(() -> new IllegalArgumentException("Webhook tidak ditemukan."));

        securityValidator.validateUrl(webhook.getUrl());

        Map<String, Object> payloadMap = new LinkedHashMap<>();
        payloadMap.put("event", "ping.test_event");
        payloadMap.put("webhookId", webhook.getId().toString());
        payloadMap.put("tenant", org.getSlug());
        payloadMap.put("timestamp", LocalDateTime.now().toString());
        payloadMap.put("message", "K2NET Developer Webhook Ping Verification");

        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(payloadMap);
        } catch (Exception e) {
            payloadJson = "{\"event\":\"ping.test_event\"}";
        }

        String signature = encryptionUtil.computeHmacSha256(webhook.getSigningSecret(), payloadJson);

        Map<String, String> headers = new LinkedHashMap<>();
        headers.put("X-K2NET-Event", "ping.test_event");
        headers.put("X-K2NET-Signature-256", signature);
        headers.put("X-K2NET-Signature", signature);

        SSRFSafeHttpClient.HttpResponse httpResp = httpClient.executePost(webhook.getUrl(), payloadJson, headers);
        int statusCode = httpResp.getStatusCode();
        long durationMs = httpResp.getLatencyMs();
        String responseBody = httpResp.getBody();
        String errorMessage = httpResp.getErrorMessage();
        boolean success = httpResp.isSuccess();

        // Save delivery receipt
        TenantWebhookDelivery delivery = TenantWebhookDelivery.builder()
                .organization(org)
                .webhook(webhook)
                .eventType("ping.test_event")
                .payload(payloadJson)
                .responseStatusCode(statusCode)
                .responseBody(responseBody)
                .executionDurationMs(durationMs)
                .status(success ? "SUCCESS" : "FAILED")
                .errorMessage(errorMessage)
                .attemptNumber(1)
                .deliveredAt(LocalDateTime.now())
                .build();
        deliveryRepository.save(delivery);

        // Update webhook status
        webhook.setLastDeliveryAt(LocalDateTime.now());
        webhook.setLastDeliveryStatus(success ? "SUCCESS" : "FAILED");
        if (!success) {
            webhook.setFailureCount(webhook.getFailureCount() + 1);
        } else {
            webhook.setFailureCount(0);
        }
        webhookRepository.save(webhook);

        return TestPingResponse.builder()
                .success(success)
                .status(statusCode)
                .latencyMs((int) durationMs)
                .eventName("ping.test_event")
                .targetUrl(webhook.getUrl())
                .responseBody(responseBody)
                .errorMessage(errorMessage)
                .timestamp(LocalDateTime.now())
                .build();
    }

    @Transactional(readOnly = true)
    public List<WebhookDeliveryResponseDto> listDeliveries(String idOrSlug, UUID webhookId) {
        Organization org = resolveOrganization(idOrSlug);
        TenantWebhook webhook = webhookRepository.findByIdAndOrganizationIdNative(org.getId(), webhookId)
                .orElseThrow(() -> new IllegalArgumentException("Webhook tidak ditemukan."));

        List<TenantWebhookDelivery> deliveries = deliveryRepository.findRecentByWebhookIdNative(webhook.getId(), 50);
        return deliveries.stream().map(this::mapDeliveryToDto).toList();
    }

    @Async("taskExecutor")
    public void dispatchWebhookEventAsync(Organization org, String eventType, Object payload) {
        if (org == null || eventType == null) return;
        try {
            List<TenantWebhook> activeWebhooks = webhookRepository.findActiveByOrganizationIdNative(org.getId());
            if (activeWebhooks.isEmpty()) return;

            String payloadJson = objectMapper.writeValueAsString(payload);

            for (TenantWebhook webhook : activeWebhooks) {
                // Check if subscribed
                if (webhook.getEvents() != null && !webhook.getEvents().contains(eventType)) {
                    continue;
                }

                try {
                    String signature = encryptionUtil.computeHmacSha256(webhook.getSigningSecret(), payloadJson);
                    Map<String, String> headers = new LinkedHashMap<>();
                    headers.put("X-K2NET-Event", eventType);
                    headers.put("X-K2NET-Signature-256", signature);
                    headers.put("X-K2NET-Signature", signature);

                    SSRFSafeHttpClient.HttpResponse httpResp = httpClient.executePost(webhook.getUrl(), payloadJson, headers);
                    boolean success = httpResp.isSuccess();

                    TenantWebhookDelivery delivery = TenantWebhookDelivery.builder()
                            .organization(org)
                            .webhook(webhook)
                            .eventType(eventType)
                            .payload(payloadJson)
                            .responseStatusCode(httpResp.getStatusCode())
                            .responseBody(httpResp.getBody())
                            .executionDurationMs((long) httpResp.getLatencyMs())
                            .status(success ? "SUCCESS" : "FAILED")
                            .errorMessage(httpResp.getErrorMessage())
                            .attemptNumber(1)
                            .deliveredAt(LocalDateTime.now())
                            .build();
                    deliveryRepository.save(delivery);

                    webhook.setLastDeliveryAt(LocalDateTime.now());
                    webhook.setLastDeliveryStatus(success ? "SUCCESS" : "FAILED");
                    if (!success) {
                        webhook.setFailureCount(webhook.getFailureCount() + 1);
                    }
                    webhookRepository.save(webhook);
                } catch (Exception ex) {
                    log.warn("Failed to dispatch webhook event '{}' to {}: {}", eventType, webhook.getUrl(), ex.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error in dispatchWebhookEventAsync for org {}: {}", org.getSlug(), e.getMessage());
        }
    }

    private WebhookResponseDto mapToDto(TenantWebhook webhook) {
        List<String> eventList = webhook.getEvents() != null && !webhook.getEvents().isBlank()
                ? Arrays.stream(webhook.getEvents().split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList()
                : List.of();

        return WebhookResponseDto.builder()
                .id(webhook.getId())
                .name(webhook.getName())
                .url(webhook.getUrl())
                .signingSecret(webhook.getSigningSecret())
                .events(eventList)
                .isActive(webhook.isActive())
                .headers(webhook.getHeaders())
                .failureCount(webhook.getFailureCount())
                .lastDeliveryAt(webhook.getLastDeliveryAt())
                .lastDeliveryStatus(webhook.getLastDeliveryStatus())
                .createdAt(webhook.getCreatedAt())
                .build();
    }

    private WebhookDeliveryResponseDto mapDeliveryToDto(TenantWebhookDelivery delivery) {
        return WebhookDeliveryResponseDto.builder()
                .id(delivery.getId())
                .webhookId(delivery.getWebhook() != null ? delivery.getWebhook().getId() : null)
                .eventType(delivery.getEventType())
                .payload(delivery.getPayload())
                .responseStatusCode(delivery.getResponseStatusCode())
                .responseBody(delivery.getResponseBody())
                .executionDurationMs(delivery.getExecutionDurationMs())
                .status(delivery.getStatus())
                .errorMessage(delivery.getErrorMessage())
                .attemptNumber(delivery.getAttemptNumber())
                .deliveredAt(delivery.getDeliveredAt())
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
