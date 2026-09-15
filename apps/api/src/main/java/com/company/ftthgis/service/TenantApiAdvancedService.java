package com.company.ftthgis.service;

import com.company.ftthgis.api.tenant.dto.*;
import com.company.ftthgis.config.logging.AuditRequired;
import com.company.ftthgis.config.security.WebhookSecurityValidator;
import com.company.ftthgis.domain.tenant.entity.*;
import com.company.ftthgis.domain.tenant.repository.*;
import com.company.ftthgis.util.SecretEncryptionUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenantApiAdvancedService {

    private final OrganizationRepository organizationRepository;
    private final TenantApiTokenRepository tokenRepository;
    private final TenantWebhookEndpointRepository endpointRepository;
    private final TenantWebhookLogRepository logRepository;
    private final WebhookSecurityValidator securityValidator;
    private final SecretEncryptionUtil encryptionUtil;
    private final ObjectMapper objectMapper;

    // ==========================================
    // 1. Scoped Personal Access Tokens
    // ==========================================

    @Transactional(readOnly = true)
    public List<ScopedTokenResponse> listTokens(String idOrSlug) {
        Organization org = resolveOrganization(idOrSlug);
        List<TenantApiToken> tokens = tokenRepository.findByOrganizationOrderByCreatedAtDesc(org);

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
    @AuditRequired(action = "TENANT_SCOPED_TOKEN_CREATED", resourceType = "ORGANIZATION", tenantSlugExpression = "#idOrSlug")
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
    @AuditRequired(action = "TENANT_SCOPED_TOKEN_REVOKED", resourceType = "ORGANIZATION", tenantSlugExpression = "#idOrSlug")
    public void revokeToken(String idOrSlug, UUID tokenId) {
        Organization org = resolveOrganization(idOrSlug);
        TenantApiToken token = tokenRepository.findById(tokenId)
                .orElseThrow(() -> new IllegalArgumentException("Token tidak ditemukan."));

        if (!token.getOrganization().getId().equals(org.getId())) {
            throw new IllegalArgumentException("Token tidak sesuai dengan organisasi.");
        }

        token.setRevoked(true);
        token.setUpdatedAt(LocalDateTime.now());
        tokenRepository.save(token);

        log.info("Scoped API Token '{}' revoked for organization '{}'", token.getName(), org.getSlug());
    }

    // ==========================================
    // 2. Multi-Endpoint Webhook Router
    // ==========================================

    @Transactional(readOnly = true)
    public List<WebhookEndpointResponse> listEndpoints(String idOrSlug) {
        Organization org = resolveOrganization(idOrSlug);
        List<TenantWebhookEndpoint> endpoints = endpointRepository.findByOrganizationOrderByCreatedAtDesc(org);

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
    @AuditRequired(action = "TENANT_WEBHOOK_ENDPOINT_CREATED", resourceType = "ORGANIZATION", tenantSlugExpression = "#idOrSlug")
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
    @AuditRequired(action = "TENANT_WEBHOOK_ENDPOINT_UPDATED", resourceType = "ORGANIZATION", tenantSlugExpression = "#idOrSlug")
    public WebhookEndpointResponse updateEndpoint(String idOrSlug, UUID endpointId, WebhookEndpointRequest request) {
        Organization org = resolveOrganization(idOrSlug);
        TenantWebhookEndpoint endpoint = endpointRepository.findById(endpointId)
                .orElseThrow(() -> new IllegalArgumentException("Endpoint tidak ditemukan."));

        if (!endpoint.getOrganization().getId().equals(org.getId())) {
            throw new IllegalArgumentException("Endpoint tidak sesuai dengan organisasi.");
        }

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
    @AuditRequired(action = "TENANT_WEBHOOK_ENDPOINT_DELETED", resourceType = "ORGANIZATION", tenantSlugExpression = "#idOrSlug")
    public void deleteEndpoint(String idOrSlug, UUID endpointId) {
        Organization org = resolveOrganization(idOrSlug);
        TenantWebhookEndpoint endpoint = endpointRepository.findById(endpointId)
                .orElseThrow(() -> new IllegalArgumentException("Endpoint tidak ditemukan."));

        if (!endpoint.getOrganization().getId().equals(org.getId())) {
            throw new IllegalArgumentException("Endpoint tidak sesuai dengan organisasi.");
        }

        endpointRepository.delete(endpoint);
        log.info("Webhook endpoint '{}' deleted for organization '{}'", endpoint.getName(), org.getSlug());
    }

    @Transactional
    public RollSecretResponse rollEndpointSecret(String idOrSlug, UUID endpointId) {
        Organization org = resolveOrganization(idOrSlug);
        TenantWebhookEndpoint endpoint = endpointRepository.findById(endpointId)
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

    @Transactional
    public TestPingResponse testPingEndpoint(String idOrSlug, UUID endpointId) {
        Organization org = resolveOrganization(idOrSlug);
        TenantWebhookEndpoint endpoint = endpointRepository.findById(endpointId)
                .orElseThrow(() -> new IllegalArgumentException("Endpoint tidak ditemukan."));

        securityValidator.validateUrl(endpoint.getTargetUrl());

        String secret = null;
        if (endpoint.getWebhookSecretEncrypted() != null) {
            try {
                secret = encryptionUtil.decrypt(endpoint.getWebhookSecretEncrypted());
            } catch (Exception ignored) {}
        }

        Map<String, Object> payloadMap = new LinkedHashMap<>();
        payloadMap.put("event", "ping.test_event");
        payloadMap.put("endpoint", endpoint.getName());
        payloadMap.put("tenant", org.getSlug());
        payloadMap.put("timestamp", LocalDateTime.now().toString());
        payloadMap.put("message", "K2NET Multi-Endpoint Ping Verification");

        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(payloadMap);
        } catch (Exception e) {
            payloadJson = "{\"event\":\"ping.test_event\"}";
        }

        String signature = secret != null ? encryptionUtil.computeHmacSha256(secret, payloadJson) : "sha256=none";

        long startTime = System.currentTimeMillis();
        int httpStatus = 0;
        int latencyMs = 0;
        String responseBody = "";
        String errorMessage = null;
        boolean success = false;

        try {
            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint.getTargetUrl()))
                    .timeout(Duration.ofSeconds(5))
                    .header("Content-Type", "application/json")
                    .header("User-Agent", "K2NET-FTTH-Webhook-Engine/1.0")
                    .header("X-K2NET-Event", "ping.test_event")
                    .header("X-K2NET-Signature", signature)
                    .POST(HttpRequest.BodyPublishers.ofString(payloadJson))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            latencyMs = (int) (System.currentTimeMillis() - startTime);
            httpStatus = response.statusCode();
            responseBody = response.body();
            success = httpStatus >= 200 && httpStatus < 300;
        } catch (Exception e) {
            latencyMs = (int) (System.currentTimeMillis() - startTime);
            errorMessage = e.getMessage();
        }

        TenantWebhookLog logItem = TenantWebhookLog.builder()
                .organization(org)
                .endpoint(endpoint)
                .eventName("ping.test_event")
                .targetUrl(endpoint.getTargetUrl())
                .httpStatus(httpStatus)
                .latencyMs(latencyMs)
                .requestPayload(payloadJson)
                .responseBody(responseBody)
                .errorMessage(errorMessage)
                .deliveryStatus(success ? "SUCCESS" : "FAILED_DLQ")
                .createdAt(LocalDateTime.now())
                .build();
        logRepository.save(logItem);

        return TestPingResponse.builder()
                .success(success)
                .status(httpStatus)
                .latencyMs(latencyMs)
                .eventName("ping.test_event")
                .targetUrl(endpoint.getTargetUrl())
                .responseBody(responseBody)
                .errorMessage(errorMessage)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // ==========================================
    // 3. Event Catalog & Payload Simulator
    // ==========================================

    public List<EventSchemaDto> getEventSchemas() {
        return List.of(
                EventSchemaDto.builder()
                        .eventType("cable.fiber_cut")
                        .displayName("LOS / Kabel Fiber Putus")
                        .description("Trigger seketika saat kabel feeder atau distribusi terindikasi putus (LOS alarm).")
                        .severity("CRITICAL")
                        .samplePayloadJson("{\n  \"event\": \"cable.fiber_cut\",\n  \"eventId\": \"evt_7f3b4c1a8e2d\",\n  \"timestamp\": \"2026-09-15T02:45:00Z\",\n  \"data\": {\n    \"cableName\": \"Feeder Core 96 Simpang Garut\",\n    \"cableType\": \"FEEDER\",\n    \"alarmSeverity\": \"CRITICAL\",\n    \"estimatedLocation\": {\"lat\": -7.1952, \"lng\": 107.8921, \"address\": \"Jl. Raya Garut KM 12\"},\n    \"impactSummary\": {\"affectedOdpCount\": 18, \"affectedCustomerCount\": 284}\n  }\n}")
                        .build(),
                EventSchemaDto.builder()
                        .eventType("device.olt_down")
                        .displayName("OLT Unreachable / Mati")
                        .description("Trigger jika SNMP poller daemon gagal menghubungi OLT 3 siklus berturut-turut.")
                        .severity("EMERGENCY")
                        .samplePayloadJson("{\n  \"event\": \"device.olt_down\",\n  \"eventId\": \"evt_8a1c2b3d4e5f\",\n  \"timestamp\": \"2026-09-15T02:46:30Z\",\n  \"data\": {\n    \"oltName\": \"OLT ZTE C320 Tarogong Core\",\n    \"ipAddress\": \"10.200.10.2\",\n    \"vendor\": \"ZTE\",\n    \"alarmSeverity\": \"EMERGENCY\",\n    \"affectedPonPorts\": 8,\n    \"affectedCustomerCount\": 512\n  }\n}")
                        .build(),
                EventSchemaDto.builder()
                        .eventType("odp.capacity_full")
                        .displayName("Port ODP Penuh (100%)")
                        .description("Trigger saat seluruh port splitter pada suatu ODP telah terisi 100%.")
                        .severity("WARNING")
                        .samplePayloadJson("{\n  \"event\": \"odp.capacity_full\",\n  \"eventId\": \"evt_9b2d3c4e5f6a\",\n  \"timestamp\": \"2026-09-15T02:48:10Z\",\n  \"data\": {\n    \"odpCode\": \"ODP-TRG-042/16\",\n    \"totalPorts\": 16,\n    \"allocatedPorts\": 16,\n    \"occupancyRate\": 1.0,\n    \"location\": {\"lat\": -7.1984, \"lng\": 107.8955, \"address\": \"Tiang Telkom No. 14, Simpang Tarogong\"}\n  }\n}")
                        .build(),
                EventSchemaDto.builder()
                        .eventType("tenant.quota_warning")
                        .displayName("Peringatan Kuota Kapasitas (90%)")
                        .description("Trigger saat batas penyimpanan MinIO atau kuota OLT tenant mencapai 90%.")
                        .severity("INFO")
                        .samplePayloadJson("{\n  \"event\": \"tenant.quota_warning\",\n  \"eventId\": \"evt_0c1d2e3f4a5b\",\n  \"timestamp\": \"2026-09-15T02:50:00Z\",\n  \"data\": {\n    \"quotaType\": \"STORAGE_MINIO_GB\",\n    \"usedGb\": 45.2,\n    \"limitGb\": 50.0,\n    \"usagePercent\": 90.4\n  }\n}")
                        .build()
        );
    }

    @Transactional
    public SimulateEventResponse simulateEventDispatch(String idOrSlug, SimulateEventRequest request) {
        Organization org = resolveOrganization(idOrSlug);

        String targetUrl = request.getTargetUrl();
        String secret = null;

        if (request.getEndpointId() != null) {
            Optional<TenantWebhookEndpoint> ep = endpointRepository.findById(request.getEndpointId());
            if (ep.isPresent()) {
                targetUrl = ep.get().getTargetUrl();
                if (ep.get().getWebhookSecretEncrypted() != null) {
                    try {
                        secret = encryptionUtil.decrypt(ep.get().getWebhookSecretEncrypted());
                    } catch (Exception ignored) {}
                }
            }
        }

        if (targetUrl == null || targetUrl.isBlank()) {
            List<TenantWebhookEndpoint> activeEndpoints = endpointRepository.findByOrganizationAndIsActiveTrue(org);
            if (!activeEndpoints.isEmpty()) {
                targetUrl = activeEndpoints.get(0).getTargetUrl();
                if (activeEndpoints.get(0).getWebhookSecretEncrypted() != null) {
                    try {
                        secret = encryptionUtil.decrypt(activeEndpoints.get(0).getWebhookSecretEncrypted());
                    } catch (Exception ignored) {}
                }
            }
        }

        if (targetUrl == null || targetUrl.isBlank()) {
            throw new IllegalArgumentException("Target URL webhook belum dikonfigurasi.");
        }

        securityValidator.validateUrl(targetUrl);

        String payload = request.getCustomPayloadJson();
        if (payload == null || payload.isBlank()) {
            EventSchemaDto schema = getEventSchemas().stream()
                    .filter(s -> s.getEventType().equalsIgnoreCase(request.getEventType()))
                    .findFirst()
                    .orElse(getEventSchemas().get(0));
            payload = schema.getSamplePayloadJson();
        }

        String signature = secret != null ? encryptionUtil.computeHmacSha256(secret, payload) : "sha256=simulation";

        long startTime = System.currentTimeMillis();
        int httpStatus = 0;
        int latencyMs = 0;
        String responseBody = "";
        String errorMessage = null;
        boolean success = false;

        try {
            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .timeout(Duration.ofSeconds(5))
                    .header("Content-Type", "application/json")
                    .header("User-Agent", "K2NET-FTTH-Webhook-Engine/1.0 (Simulation)")
                    .header("X-K2NET-Event", request.getEventType() != null ? request.getEventType() : "simulation.event")
                    .header("X-K2NET-Signature", signature)
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = client.send(req, HttpResponse.BodyHandlers.ofString());
            latencyMs = (int) (System.currentTimeMillis() - startTime);
            httpStatus = response.statusCode();
            responseBody = response.body();
            success = httpStatus >= 200 && httpStatus < 300;
        } catch (Exception e) {
            latencyMs = (int) (System.currentTimeMillis() - startTime);
            errorMessage = e.getMessage();
        }

        TenantWebhookLog logItem = TenantWebhookLog.builder()
                .organization(org)
                .eventName(request.getEventType() != null ? request.getEventType() : "simulation.event")
                .targetUrl(targetUrl)
                .httpStatus(httpStatus)
                .latencyMs(latencyMs)
                .requestPayload(payload)
                .responseBody(responseBody)
                .errorMessage(errorMessage)
                .deliveryStatus(success ? "SUCCESS" : "FAILED_DLQ")
                .createdAt(LocalDateTime.now())
                .build();
        logRepository.save(logItem);

        return SimulateEventResponse.builder()
                .success(success)
                .status(httpStatus)
                .latencyMs(latencyMs)
                .eventType(request.getEventType())
                .targetUrl(targetUrl)
                .requestPayload(payload)
                .responseBody(responseBody)
                .errorMessage(errorMessage)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // ==========================================
    // 4. Dead Letter Queue & Replay
    // ==========================================

    @Transactional(readOnly = true)
    public List<DeadLetterLogResponse> getDeadLetterLogs(String idOrSlug) {
        Organization org = resolveOrganization(idOrSlug);
        List<TenantWebhookLog> logs = logRepository.findByOrganizationAndDeliveryStatusOrderByCreatedAtDesc(org, "FAILED_DLQ");
        List<TenantWebhookLog> retrying = logRepository.findByOrganizationAndDeliveryStatusOrderByCreatedAtDesc(org, "RETRYING");

        List<TenantWebhookLog> all = new ArrayList<>(logs);
        all.addAll(retrying);
        all.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        return all.stream().map(l -> DeadLetterLogResponse.builder()
                .id(l.getId())
                .event(l.getEventName())
                .targetUrl(l.getTargetUrl())
                .status(l.getHttpStatus())
                .latencyMs(l.getLatencyMs())
                .deliveryStatus(l.getDeliveryStatus())
                .retryCount(l.getRetryCount())
                .maxRetries(l.getMaxRetries())
                .nextRetryAt(l.getNextRetryAt())
                .lastAttemptAt(l.getLastAttemptAt())
                .requestPayload(l.getRequestPayload())
                .responseBody(l.getResponseBody())
                .errorMessage(l.getErrorMessage())
                .createdAt(l.getCreatedAt())
                .build()
        ).toList();
    }

    @Transactional
    public TestPingResponse replayFailedWebhook(String idOrSlug, UUID logId) {
        Organization org = resolveOrganization(idOrSlug);
        TenantWebhookLog item = logRepository.findById(logId)
                .orElseThrow(() -> new IllegalArgumentException("Log DLQ tidak ditemukan."));

        if (!item.getOrganization().getId().equals(org.getId())) {
            throw new IllegalArgumentException("Log tidak sesuai dengan organisasi.");
        }

        securityValidator.validateUrl(item.getTargetUrl());

        long startTime = System.currentTimeMillis();
        int httpStatus = 0;
        int latencyMs = 0;
        String responseBody = "";
        String errorMessage = null;
        boolean success = false;

        try {
            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(item.getTargetUrl()))
                    .timeout(Duration.ofSeconds(5))
                    .header("Content-Type", "application/json")
                    .header("User-Agent", "K2NET-FTTH-Webhook-Engine/1.0 (Manual-Replay)")
                    .header("X-K2NET-Event", item.getEventName())
                    .POST(HttpRequest.BodyPublishers.ofString(item.getRequestPayload() != null ? item.getRequestPayload() : "{}"))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            latencyMs = (int) (System.currentTimeMillis() - startTime);
            httpStatus = response.statusCode();
            responseBody = response.body();
            success = httpStatus >= 200 && httpStatus < 300;
        } catch (Exception e) {
            latencyMs = (int) (System.currentTimeMillis() - startTime);
            errorMessage = e.getMessage();
        }

        item.setHttpStatus(httpStatus);
        item.setLatencyMs(latencyMs);
        item.setResponseBody(responseBody);
        item.setErrorMessage(errorMessage);
        item.setDeliveryStatus(success ? "SUCCESS" : "FAILED_DLQ");
        item.setLastAttemptAt(LocalDateTime.now());
        logRepository.save(item);

        log.info("Manual DLQ replay executed for log '{}', result HTTP {}", logId, httpStatus);

        return TestPingResponse.builder()
                .success(success)
                .status(httpStatus)
                .latencyMs(latencyMs)
                .eventName(item.getEventName())
                .targetUrl(item.getTargetUrl())
                .responseBody(responseBody)
                .errorMessage(errorMessage)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // ==========================================
    // 5. API Usage & Latency Analytics (Live Production Data)
    // ==========================================

    @Transactional(readOnly = true)
    public ApiAnalyticsResponse getApiAnalytics(String idOrSlug) {
        Organization org = resolveOrganization(idOrSlug);

        long activeTokens = tokenRepository.findByOrganizationAndIsRevokedFalseOrderByCreatedAtDesc(org).size();
        long activeEndpoints = endpointRepository.findByOrganizationAndIsActiveTrue(org).size();
        long pendingRetries = logRepository.countByOrganizationAndDeliveryStatus(org, "RETRYING");
        long dlqCount = logRepository.countByOrganizationAndDeliveryStatus(org, "FAILED_DLQ");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime since24h = now.minusHours(24);
        LocalDateTime since30d = now.minusDays(30);

        long total24h = logRepository.countByOrganizationAndCreatedAtAfter(org, since24h);
        long total30d = logRepository.countByOrganizationAndCreatedAtAfter(org, since30d);
        long errors24h = logRepository.countByOrganizationAndDeliveryStatusAndCreatedAtAfter(org, "FAILED_DLQ", since24h);

        Double p95Val = logRepository.calculateP95LatencyMsNative(org.getId(), since30d);
        int p95Latency = p95Val != null && p95Val > 0 ? (int) Math.round(p95Val) : 0;

        long count2xx = logRepository.countByStatusRangeNative(org.getId(), 200, 299, since30d);
        long count4xx = logRepository.countByStatusRangeNative(org.getId(), 400, 499, since30d);
        long count5xx = logRepository.countByStatusRangeNative(org.getId(), 500, 599, since30d) + dlqCount;

        double successRate = total30d > 0
                ? Math.round(((double) count2xx / total30d) * 1000.0) / 10.0
                : 100.0;

        // Query real 7-day volume
        LocalDateTime since7d = now.minusDays(6).toLocalDate().atStartOfDay();
        List<Object[]> dailyRows = logRepository.findDailyVolumeNative(org.getId(), since7d);
        Map<String, long[]> dailyMap = new HashMap<>();
        for (Object[] row : dailyRows) {
            String d = (String) row[0];
            long total = ((Number) row[1]).longValue();
            long err = ((Number) row[2]).longValue();
            dailyMap.put(d, new long[]{total, err});
        }

        List<ApiAnalyticsResponse.DailyTrafficPoint> dailyPoints = new ArrayList<>();
        List<ApiAnalyticsResponse.DailyVolumeStat> dailySeries = new ArrayList<>();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            String dateStr = date.format(dtf);
            long[] stats = dailyMap.getOrDefault(dateStr, new long[]{0L, 0L});
            long reqs = stats[0];
            long errs = stats[1];
            long succ = Math.max(0, reqs - errs);

            dailyPoints.add(ApiAnalyticsResponse.DailyTrafficPoint.builder()
                    .date(dateStr)
                    .totalRequests(reqs)
                    .successfulRequests(succ)
                    .failedRequests(errs)
                    .build());

            dailySeries.add(ApiAnalyticsResponse.DailyVolumeStat.builder()
                    .date(dateStr)
                    .requests(reqs)
                    .errors(errs)
                    .build());
        }

        Map<String, Long> statusDist = new LinkedHashMap<>();
        statusDist.put("2xx Success", count2xx);
        statusDist.put("4xx Client Error", count4xx);
        statusDist.put("429 Rate Limited", 0L);
        statusDist.put("5xx Server Error", count5xx);

        ApiAnalyticsResponse.StatusCodeBreakdown breakdown = ApiAnalyticsResponse.StatusCodeBreakdown.builder()
                .status2xx(count2xx)
                .status4xx(count4xx)
                .status5xx(count5xx)
                .build();

        double quotaUsed = total24h > 0
                ? Math.min(100.0, Math.round(((double) total24h / (5000.0 * 60.0 * 24.0)) * 10000.0) / 100.0)
                : 0.0;

        return ApiAnalyticsResponse.builder()
                .totalRequests24h(total24h)
                .totalRequests30d(total30d)
                .successRatePercent(successRate)
                .deliverySuccessRatePercent(successRate)
                .p95LatencyMs(p95Latency)
                .errorCount24h(errors24h)
                .rateLimitQuotaUsedPercent(quotaUsed)
                .totalThrottled429(0)
                .activeTokensCount(activeTokens)
                .activeEndpointsCount(activeEndpoints)
                .pendingRetryCount(pendingRetries)
                .deadLetterCount(dlqCount)
                .dailyTimeseries(dailySeries)
                .dailyTraffic(dailyPoints)
                .statusBreakdown(breakdown)
                .statusDistribution(statusDist)
                .build();
    }

    // --- Helpers ---

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

    private Map<String, Boolean> parseSubscribedEvents(String json) {
        if (json == null || json.isBlank()) return Map.of("fiberCut", true, "oltDown", true);
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Boolean>>() {});
        } catch (Exception e) {
            return Map.of("fiberCut", true, "oltDown", true);
        }
    }
}
