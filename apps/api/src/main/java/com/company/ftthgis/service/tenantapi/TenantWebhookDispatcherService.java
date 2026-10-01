package com.company.ftthgis.service.tenantapi;

import com.company.ftthgis.api.tenant.dto.*;
import com.company.ftthgis.config.security.SSRFSafeHttpClient;
import com.company.ftthgis.config.security.WebhookSecurityValidator;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantWebhookEndpoint;
import com.company.ftthgis.domain.tenant.entity.TenantWebhookLog;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.TenantApiTokenRepository;
import com.company.ftthgis.domain.tenant.repository.TenantWebhookEndpointRepository;
import com.company.ftthgis.domain.tenant.repository.TenantWebhookLogRepository;
import com.company.ftthgis.util.SecretEncryptionUtil;
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
public class TenantWebhookDispatcherService {

    private final OrganizationRepository organizationRepository;
    private final TenantApiTokenRepository tokenRepository;
    private final TenantWebhookEndpointRepository endpointRepository;
    private final TenantWebhookLogRepository logRepository;
    private final WebhookSecurityValidator securityValidator;
    private final SecretEncryptionUtil encryptionUtil;
    private final ObjectMapper objectMapper;
    private final SSRFSafeHttpClient ssrfSafeHttpClient;

    @Transactional
    public TestPingResponse testPingEndpoint(String idOrSlug, UUID endpointId) {
        Organization org = resolveOrganization(idOrSlug);
        TenantWebhookEndpoint endpoint = endpointRepository.findByIdAndOrganizationIdNative(org.getId(), endpointId)
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

        Map<String, String> headers = new LinkedHashMap<>();
        headers.put("X-K2NET-Event", "ping.test_event");
        headers.put("X-K2NET-Signature", signature);

        SSRFSafeHttpClient.HttpResponse httpResp = ssrfSafeHttpClient.executePost(endpoint.getTargetUrl(), payloadJson, headers);
        int httpStatus = httpResp.getStatusCode();
        int latencyMs = httpResp.getLatencyMs();
        String responseBody = httpResp.getBody();
        String errorMessage = httpResp.getErrorMessage();
        boolean success = httpResp.isSuccess();

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

        Map<String, String> headers = new LinkedHashMap<>();
        headers.put("X-K2NET-Event", request.getEventType() != null ? request.getEventType() : "simulation.event");
        headers.put("X-K2NET-Signature", signature);

        SSRFSafeHttpClient.HttpResponse httpResp = ssrfSafeHttpClient.executePost(targetUrl, payload, headers);
        int httpStatus = httpResp.getStatusCode();
        int latencyMs = httpResp.getLatencyMs();
        String responseBody = httpResp.getBody();
        String errorMessage = httpResp.getErrorMessage();
        boolean success = httpResp.isSuccess();

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

    @Transactional(readOnly = true)
    public List<DeadLetterLogResponse> getDeadLetterLogs(String idOrSlug) {
        Organization org = resolveOrganization(idOrSlug);
        List<TenantWebhookLog> logs = logRepository.findByStatusAndOrganizationIdNative(org.getId(), "FAILED_DLQ", 100);
        List<TenantWebhookLog> retrying = logRepository.findByStatusAndOrganizationIdNative(org.getId(), "RETRYING", 100);

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

    public record TimeRangeWindow(LocalDateTime since, LocalDateTime until, int daysSpan) {}

    public TimeRangeWindow parseTimeRange(String rangeStr) {
        LocalDateTime now = LocalDateTime.now();
        if (rangeStr == null || rangeStr.isBlank()) {
            return new TimeRangeWindow(now.minusHours(24), now, 1);
        }

        String trimmed = rangeStr.trim().toLowerCase(Locale.ROOT);
        if (trimmed.startsWith("custom:")) {
            try {
                String raw = rangeStr.substring(7);
                String[] parts = raw.split("_");
                if (parts.length == 2) {
                    LocalDateTime from = java.time.Instant.parse(parts[0]).atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
                    LocalDateTime to = java.time.Instant.parse(parts[1]).atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
                    long days = Math.max(1, Duration.between(from, to).toDays() + 1);
                    return new TimeRangeWindow(from, to, (int) Math.min(days, 90));
                }
            } catch (Exception e) {
                log.warn("Failed to parse custom date range: {}", rangeStr);
            }
        }

        return switch (trimmed) {
            case "10m" -> new TimeRangeWindow(now.minusMinutes(10), now, 1);
            case "30m" -> new TimeRangeWindow(now.minusMinutes(30), now, 1);
            case "1h", "60m" -> new TimeRangeWindow(now.minusHours(1), now, 1);
            case "3h" -> new TimeRangeWindow(now.minusHours(3), now, 1);
            case "7d" -> new TimeRangeWindow(now.minusDays(6).toLocalDate().atStartOfDay(), now, 7);
            case "14d" -> new TimeRangeWindow(now.minusDays(13).toLocalDate().atStartOfDay(), now, 14);
            case "28d", "30d" -> new TimeRangeWindow(now.minusDays(29).toLocalDate().atStartOfDay(), now, 30);
            default -> new TimeRangeWindow(now.minusHours(24), now, 1);
        };
    }

    @Transactional(readOnly = true)
    public ApiAnalyticsResponse getApiAnalytics(String idOrSlug) {
        return getApiAnalytics(idOrSlug, "24h");
    }

    @Transactional(readOnly = true)
    public ApiAnalyticsResponse getApiAnalytics(String idOrSlug, String rangeStr) {
        Organization org = resolveOrganization(idOrSlug);

        long activeTokens = tokenRepository.countActiveByOrganizationIdNative(org.getId());
        long activeEndpoints = endpointRepository.countActiveByOrganizationIdNative(org.getId());
        long pendingRetries = logRepository.countByStatusAndOrganizationIdNative(org.getId(), "RETRYING");
        long dlqCount = logRepository.countByStatusAndOrganizationIdNative(org.getId(), "FAILED_DLQ");

        TimeRangeWindow window = parseTimeRange(rangeStr);
        LocalDateTime since = window.since();
        LocalDateTime until = window.until();

        long totalRequestsInRange = logRepository.countBetweenNative(org.getId(), since, until);
        long errorsInRange = logRepository.countByStatusBetweenNative(org.getId(), "FAILED_DLQ", since, until);

        Double p95Val = logRepository.calculateP95LatencyMsBetweenNative(org.getId(), since, until);
        int p95Latency = p95Val != null && p95Val > 0 ? (int) Math.round(p95Val) : 0;

        long count2xx = logRepository.countByStatusRangeBetweenNative(org.getId(), 200, 299, since, until);
        long count4xx = logRepository.countByStatusRangeBetweenNative(org.getId(), 400, 499, since, until);
        long count5xx = logRepository.countByStatusRangeBetweenNative(org.getId(), 500, 599, since, until) + errorsInRange;

        double successRate = totalRequestsInRange > 0
                ? Math.round(((double) count2xx / totalRequestsInRange) * 1000.0) / 10.0
                : 100.0;

        // Query series volume
        int daysSpan = Math.max(1, window.daysSpan());
        List<Object[]> dailyRows = logRepository.findDailyVolumeBetweenNative(org.getId(), since, until);
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

        int daysToIterate = Math.max(daysSpan, 7);
        for (int i = daysToIterate - 1; i >= 0; i--) {
            LocalDate date = until.minusDays(i).toLocalDate();
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

        double quotaUsed = totalRequestsInRange > 0
                ? Math.min(100.0, Math.round(((double) totalRequestsInRange / (5000.0 * 60.0 * 24.0)) * 10000.0) / 100.0)
                : 0.0;

        return ApiAnalyticsResponse.builder()
                .totalRequests24h(totalRequestsInRange)
                .totalRequests30d(totalRequestsInRange)
                .successRatePercent(successRate)
                .deliverySuccessRatePercent(successRate)
                .p95LatencyMs(p95Latency)
                .errorCount24h(errorsInRange)
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
}
