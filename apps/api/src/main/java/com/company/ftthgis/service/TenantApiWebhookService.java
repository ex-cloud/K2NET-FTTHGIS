package com.company.ftthgis.service;

import com.company.ftthgis.api.tenant.dto.*;
import com.company.ftthgis.config.logging.AuditRequired;
import com.company.ftthgis.config.security.WebhookSecurityValidator;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantWebhookConfig;
import com.company.ftthgis.domain.tenant.entity.TenantWebhookLog;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.TenantWebhookConfigRepository;
import com.company.ftthgis.domain.tenant.repository.TenantWebhookLogRepository;
import com.company.ftthgis.util.SecretEncryptionUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenantApiWebhookService {

    private final OrganizationRepository organizationRepository;
    private final TenantWebhookConfigRepository configRepository;
    private final TenantWebhookLogRepository logRepository;
    private final WebhookSecurityValidator securityValidator;
    private final SecretEncryptionUtil encryptionUtil;
    private final ObjectMapper objectMapper;

    @Value("${app.kong.admin-url:http://kong:8001}")
    private String kongAdminUrl;

    /**
     * Resolves organization and returns active API key overview (masked, with rate limit & dates).
     */
    @Transactional(readOnly = true)
    public ApiKeyOverviewResponse getApiKeyOverview(String idOrSlug) {
        Organization org = resolveOrganization(idOrSlug);
        TenantWebhookConfig config = getOrCreateConfig(org);

        String maskedKey = config.getApiKeyPrefix() + "••••••••" + config.getApiKeyLast4();

        return ApiKeyOverviewResponse.builder()
                .apiKeyPrefix(config.getApiKeyPrefix())
                .apiKeyLast4(config.getApiKeyLast4())
                .maskedApiKey(maskedKey)
                .rateLimitPerMinute(config.getRateLimitPerMinute())
                .hasActiveKey(config.isActive())
                .createdAt(config.getCreatedAt())
                .updatedAt(config.getUpdatedAt())
                .build();
    }

    /**
     * Regenerates API key for an organization (Show-Once pattern).
     * Hashes key for DB storage, syncs with Kong key-auth, and streams audit event.
     */
    @Transactional
    @AuditRequired(action = "TENANT_API_KEY_REGENERATED", resourceType = "ORGANIZATION", tenantSlugExpression = "#idOrSlug")
    public RegenerateApiKeyResponse regenerateApiKey(String idOrSlug) {
        Organization org = resolveOrganization(idOrSlug);
        TenantWebhookConfig config = getOrCreateConfig(org);

        // Generate secure 32-hex random token
        String randomHex = encryptionUtil.generateSecureToken(16); // 16 bytes = 32 hex chars
        String cleanSlug = org.getSlug().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "-");
        String plainTextKey = "k2_live_" + cleanSlug + "_" + randomHex;

        String prefix = "k2_live_" + (cleanSlug.length() > 8 ? cleanSlug.substring(0, 8) : cleanSlug) + "_";
        String last4 = randomHex.substring(randomHex.length() - 4);
        String hash = encryptionUtil.sha256Hex(plainTextKey);

        config.setApiKeyHash(hash);
        config.setApiKeyPrefix(prefix);
        config.setApiKeyLast4(last4);
        config.setUpdatedAt(LocalDateTime.now());
        configRepository.save(config);

        // Sync with Kong Key-Auth consumer asynchronously or gracefully
        syncKongKeyAuth(org.getSlug(), plainTextKey);

        String maskedKey = prefix + "••••••••" + last4;

        log.info("API Key regenerated for organization '{}' (prefix: {})", org.getSlug(), prefix);

        return RegenerateApiKeyResponse.builder()
                .plainTextApiKey(plainTextKey)
                .apiKeyPrefix(prefix)
                .apiKeyLast4(last4)
                .maskedApiKey(maskedKey)
                .rateLimitPerMinute(config.getRateLimitPerMinute())
                .message("API Key baru berhasil diterbitkan. Simpan API Key ini sekarang karena tidak akan ditampilkan lagi.")
                .updatedAt(config.getUpdatedAt())
                .build();
    }

    /**
     * Retrieves webhook configuration (URL, masked secret, subscribed events).
     */
    @Transactional(readOnly = true)
    public WebhookConfigResponse getWebhookConfig(String idOrSlug) {
        Organization org = resolveOrganization(idOrSlug);
        TenantWebhookConfig config = getOrCreateConfig(org);

        String maskedSecret = null;
        if (config.getWebhookSecretEncrypted() != null && !config.getWebhookSecretEncrypted().isBlank()) {
            maskedSecret = "whsec_" + (org.getSlug().length() > 6 ? org.getSlug().substring(0, 6) : org.getSlug()) + "_••••••••";
        }

        Map<String, Boolean> events = parseSubscribedEvents(config.getSubscribedEvents());

        return WebhookConfigResponse.builder()
                .webhookUrl(config.getWebhookUrl())
                .webhookSecretMasked(maskedSecret)
                .hasSecret(config.getWebhookSecretEncrypted() != null && !config.getWebhookSecretEncrypted().isBlank())
                .isActive(config.isActive())
                .subscribedEvents(events)
                .updatedAt(config.getUpdatedAt())
                .build();
    }

    /**
     * Updates webhook URL and event subscriptions. Validates URL against SSRF policy.
     */
    @Transactional
    @AuditRequired(action = "TENANT_WEBHOOK_CONFIG_UPDATED", resourceType = "ORGANIZATION", tenantSlugExpression = "#idOrSlug")
    public WebhookConfigResponse updateWebhookConfig(String idOrSlug, WebhookConfigRequest request) {
        Organization org = resolveOrganization(idOrSlug);
        TenantWebhookConfig config = getOrCreateConfig(org);

        if (request.getWebhookUrl() != null && !request.getWebhookUrl().trim().isEmpty()) {
            // SSRF Pre-flight validation
            securityValidator.validateUrl(request.getWebhookUrl());
            config.setWebhookUrl(request.getWebhookUrl().trim());
        } else {
            config.setWebhookUrl(null);
        }

        if (request.getIsActive() != null) {
            config.setActive(request.getIsActive());
        }

        if (request.getSubscribedEvents() != null) {
            try {
                config.setSubscribedEvents(objectMapper.writeValueAsString(request.getSubscribedEvents()));
            } catch (Exception e) {
                log.error("Failed to serialize subscribed events: {}", e.getMessage());
            }
        }

        config.setUpdatedAt(LocalDateTime.now());
        configRepository.save(config);

        log.info("Webhook config updated for organization '{}'", org.getSlug());
        return getWebhookConfig(idOrSlug);
    }

    /**
     * Rolls / regenerates HMAC Webhook Secret (Show-Once pattern).
     * Encrypts secret with AES-256-GCM for DB storage, returns plaintext secret once.
     */
    @Transactional
    @AuditRequired(action = "TENANT_WEBHOOK_SECRET_ROLLED", resourceType = "ORGANIZATION", tenantSlugExpression = "#idOrSlug")
    public RollSecretResponse rollWebhookSecret(String idOrSlug) {
        Organization org = resolveOrganization(idOrSlug);
        TenantWebhookConfig config = getOrCreateConfig(org);

        String randomHex = encryptionUtil.generateSecureToken(16);
        String cleanSlug = org.getSlug().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "-");
        String plainTextSecret = "whsec_" + cleanSlug + "_" + randomHex;

        String encrypted = encryptionUtil.encrypt(plainTextSecret);
        config.setWebhookSecretEncrypted(encrypted);
        config.setUpdatedAt(LocalDateTime.now());
        configRepository.save(config);

        String masked = "whsec_" + (cleanSlug.length() > 6 ? cleanSlug.substring(0, 6) : cleanSlug) + "_••••••••" + randomHex.substring(randomHex.length() - 4);

        log.info("Webhook HMAC secret rolled for organization '{}'", org.getSlug());

        return RollSecretResponse.builder()
                .plainTextSecret(plainTextSecret)
                .webhookSecretMasked(masked)
                .message("Secret HMAC baru berhasil dibuat. Salin sekarang untuk memverifikasi signature X-K2NET-Signature pada NOC Anda.")
                .build();
    }

    /**
     * Executes real HTTP Test Ping with HMAC signature and SSRF validation.
     * Records latency and response status to tenant_webhook_logs.
     */
    @Transactional
    public TestPingResponse testPingWebhook(String idOrSlug, TestPingRequest request) {
        Organization org = resolveOrganization(idOrSlug);
        TenantWebhookConfig config = getOrCreateConfig(org);

        String targetUrl = request != null && request.getTargetUrl() != null && !request.getTargetUrl().isBlank()
                ? request.getTargetUrl().trim()
                : config.getWebhookUrl();

        if (targetUrl == null || targetUrl.isBlank()) {
            throw new IllegalArgumentException("URL target webhook belum dikonfigurasi.");
        }

        // 1. SSRF Pre-flight check
        securityValidator.validateUrl(targetUrl);

        // 2. Resolve secret
        String secret = null;
        if (request != null && request.getSecret() != null && !request.getSecret().isBlank()) {
            secret = request.getSecret().trim();
        } else if (config.getWebhookSecretEncrypted() != null) {
            try {
                secret = encryptionUtil.decrypt(config.getWebhookSecretEncrypted());
            } catch (Exception e) {
                log.warn("Could not decrypt webhook secret, proceeding without HMAC: {}", e.getMessage());
            }
        }

        // 3. Construct test payload
        Map<String, Object> payloadMap = new LinkedHashMap<>();
        payloadMap.put("event", "ping.test_event");
        payloadMap.put("tenant", org.getSlug());
        payloadMap.put("timestamp", LocalDateTime.now().toString());
        payloadMap.put("message", "K2NET NOC Webhook Live Verification Ping");

        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(payloadMap);
        } catch (Exception e) {
            payloadJson = "{\"event\":\"ping.test_event\"}";
        }

        // 4. Compute HMAC signature
        String signatureHeader = secret != null ? encryptionUtil.computeHmacSha256(secret, payloadJson) : "sha256=none";

        // 5. Dispatch HTTP Request
        int httpStatus = 0;
        int latencyMs = 0;
        String responseBody = "";
        String errorMessage = null;
        boolean success = false;

        long startTime = System.currentTimeMillis();
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(5))
                    .build();

            HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .timeout(Duration.ofSeconds(5))
                    .header("Content-Type", "application/json")
                    .header("User-Agent", "K2NET-FTTH-Webhook-Engine/1.0")
                    .header("X-K2NET-Event", "ping.test_event")
                    .header("X-K2NET-Signature", signatureHeader)
                    .POST(HttpRequest.BodyPublishers.ofString(payloadJson));

            HttpResponse<String> response = client.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofString());
            latencyMs = (int) (System.currentTimeMillis() - startTime);
            httpStatus = response.statusCode();
            responseBody = response.body();
            if (responseBody != null && responseBody.length() > 1000) {
                responseBody = responseBody.substring(0, 1000) + "... [truncated]";
            }
            success = httpStatus >= 200 && httpStatus < 300;
        } catch (Exception e) {
            latencyMs = (int) (System.currentTimeMillis() - startTime);
            errorMessage = e.getMessage();
            log.warn("Test ping failed to target '{}': {}", targetUrl, e.getMessage());
        }

        // 6. Record to tenant_webhook_logs
        TenantWebhookLog deliveryLog = TenantWebhookLog.builder()
                .organization(org)
                .eventName("ping.test_event")
                .targetUrl(targetUrl)
                .httpStatus(httpStatus)
                .latencyMs(latencyMs)
                .requestPayload(payloadJson)
                .responseBody(responseBody)
                .errorMessage(errorMessage)
                .createdAt(LocalDateTime.now())
                .build();
        logRepository.save(deliveryLog);

        return TestPingResponse.builder()
                .success(success)
                .status(httpStatus)
                .latencyMs(latencyMs)
                .eventName("ping.test_event")
                .targetUrl(targetUrl)
                .responseBody(responseBody)
                .errorMessage(errorMessage)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Retrieves recent delivery logs for an organization.
     */
    @Transactional(readOnly = true)
    public List<TenantWebhookLogResponse> getWebhookLogs(String idOrSlug) {
        Organization org = resolveOrganization(idOrSlug);
        List<TenantWebhookLog> logs = logRepository.findTop20ByOrganizationOrderByCreatedAtDesc(org);

        return logs.stream().map(l -> TenantWebhookLogResponse.builder()
                .id(l.getId())
                .event(l.getEventName())
                .targetUrl(l.getTargetUrl())
                .status(l.getHttpStatus())
                .latencyMs(l.getLatencyMs())
                .responseBody(l.getResponseBody())
                .errorMessage(l.getErrorMessage())
                .createdAt(l.getCreatedAt())
                .build()
        ).toList();
    }

    // --- Private Helpers ---

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

    private TenantWebhookConfig getOrCreateConfig(Organization org) {
        return configRepository.findByOrganizationIdNative(org.getId()).orElseGet(() -> {
            String initialHex = encryptionUtil.generateSecureToken(16);
            String cleanSlug = org.getSlug() != null ? org.getSlug().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "-") : "tenant";
            String prefix = "k2_live_" + (cleanSlug.length() > 8 ? cleanSlug.substring(0, 8) : cleanSlug) + "_";
            String last4 = initialHex.substring(initialHex.length() - 4);
            String fullKey = prefix + initialHex;
            String hash = encryptionUtil.sha256Hex(fullKey);

            TenantWebhookConfig newConfig = TenantWebhookConfig.builder()
                    .organization(org)
                    .apiKeyHash(hash)
                    .apiKeyPrefix(prefix)
                    .apiKeyLast4(last4)
                    .rateLimitPerMinute(5000)
                    .isActive(true)
                    .subscribedEvents("{\"fiberCut\": true, \"oltDown\": true, \"odpFull\": true, \"quotaAlert\": false}")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            return configRepository.save(newConfig);
        });
    }

    private Map<String, Boolean> parseSubscribedEvents(String json) {
        if (json == null || json.isBlank()) {
            return Map.of("fiberCut", true, "oltDown", true, "odpFull", true, "quotaAlert", false);
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Boolean>>() {});
        } catch (Exception e) {
            return Map.of("fiberCut", true, "oltDown", true, "odpFull", true, "quotaAlert", false);
        }
    }

    private void syncKongKeyAuth(String slug, String apiKey) {
        try {
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(2000);
            factory.setReadTimeout(2000);
            RestTemplate restTemplate = new RestTemplate(factory);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // 1. Ensure consumer exists
            Map<String, String> consumerBody = Map.of("username", slug);
            HttpEntity<Map<String, String>> consumerReq = new HttpEntity<>(consumerBody, headers);
            try {
                restTemplate.put(kongAdminUrl + "/consumers/" + slug, consumerReq);
            } catch (Exception ignored) {
                // Ignore if consumer already exists
            }

            // 2. Add key-auth credential
            Map<String, String> keyBody = Map.of("key", apiKey);
            HttpEntity<Map<String, String>> keyReq = new HttpEntity<>(keyBody, headers);
            restTemplate.postForEntity(kongAdminUrl + "/consumers/" + slug + "/key-auth", keyReq, String.class);
            log.info("Kong key-auth credential synced for consumer '{}'", slug);
        } catch (Exception e) {
            log.warn("Could not sync Kong key-auth for consumer '{}' (Kong might be offline or using db-less): {}", slug, e.getMessage());
        }
    }
}
