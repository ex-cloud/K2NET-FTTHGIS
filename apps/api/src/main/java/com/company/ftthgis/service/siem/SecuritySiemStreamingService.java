package com.company.ftthgis.service.siem;

import com.company.ftthgis.api.security.dto.*;
import com.company.ftthgis.config.security.SSRFSafeHttpClient;
import com.company.ftthgis.config.security.WebhookSecurityValidator;
import com.company.ftthgis.domain.tenant.entity.*;
import com.company.ftthgis.domain.tenant.repository.OrganizationMemberRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.TenantSiemDeliveryRepository;
import com.company.ftthgis.domain.tenant.repository.TenantSiemEndpointRepository;
import com.company.ftthgis.service.AuditLoggingService;
import com.company.ftthgis.service.EmailService;
import com.company.ftthgis.service.LicenseManagementService;
import com.company.ftthgis.util.SecretEncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecuritySiemStreamingService {

    public static final int CIRCUIT_BREAKER_THRESHOLD = 20;
    public static final int MAX_ATTEMPTS = 5;
    private static final int[] BACKOFF_SECONDS = {0, 30, 120, 600, 1800};
    private static final List<String> DEFAULT_CATEGORIES = List.of("AUTH", "SSO", "SCIM", "SECURITY", "ADMIN");
    private static final Set<String> VALID_CATEGORIES = Set.of("AUTH", "SSO", "SCIM", "SECURITY", "ADMIN");
    private static final Set<String> ADMIN_ROLE_NAMES = Set.of("owner", "admin", "security_officer");

    private final TenantSiemEndpointRepository endpointRepository;
    private final TenantSiemDeliveryRepository deliveryRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final WebhookSecurityValidator securityValidator;
    private final SSRFSafeHttpClient ssrfSafeHttpClient;
    private final SecretEncryptionUtil encryptionUtil;
    private final SiemPayloadFormatter payloadFormatter;
    private final EmailService emailService;
    private final LicenseManagementService licenseManagementService;
    private final AuditLoggingService auditLoggingService;

    // -------------------------------------------------------------------------
    // Public CRUD & Management (Tenant Portal)
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<SiemEndpointDto> listEndpoints(String slug) {
        Organization org = resolveOrganization(slug);
        return endpointRepository.findByOrganizationIdOrderByCreatedAtDesc(org.getId())
                .stream()
                .map(this::mapEndpointToDto)
                .toList();
    }

    @Transactional
    public SiemEndpointDto createEndpoint(String slug, UpsertSiemEndpointRequest request, String actor) {
        Organization org = resolveOrganization(slug);
        String normalizedUrl = request.getTargetUrl().trim();
        securityValidator.validateUrl(normalizedUrl);

        String plainSecret = "whsec_siem_" + encryptionUtil.generateSecureToken(24);
        String encryptedSecret = encryptionUtil.encrypt(plainSecret);
        String prefix = buildSecretPrefix(plainSecret);

        String authHeaderName = normalizeHeaderName(request.getCustomAuthHeaderName());
        String authHeaderEncrypted = null;
        if (request.getCustomAuthHeaderValue() != null && !request.getCustomAuthHeaderValue().isBlank()) {
            if (authHeaderName == null) {
                authHeaderName = "Authorization";
            }
            authHeaderEncrypted = encryptionUtil.encrypt(request.getCustomAuthHeaderValue().trim());
        }

        TenantSiemEndpoint endpoint = TenantSiemEndpoint.builder()
                .organization(org)
                .name(request.getName().trim())
                .targetUrl(normalizedUrl)
                .targetFormat(request.getTargetFormat() != null ? request.getTargetFormat() : SiemTargetFormat.GENERIC_JSON)
                .signingSecretEncrypted(encryptedSecret)
                .signingSecretPrefix(prefix)
                .customAuthHeaderName(authHeaderName)
                .customAuthHeaderEncrypted(authHeaderEncrypted)
                .eventCategories(serializeCategories(request.getEventCategories()))
                .minSeverity(normalizeSeverity(request.getMinSeverity()))
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .consecutiveFailures(0)
                .build();

        TenantSiemEndpoint saved = endpointRepository.save(endpoint);
        auditLoggingService.logEvent(
                org.getSlug(),
                "SECURITY_SIEM_ENDPOINT_CREATED",
                "SIEM_ENDPOINT",
                saved.getId().toString(),
                Map.of(),
                Map.of("name", saved.getName(), "format", saved.getTargetFormat().name(), "minSeverity", saved.getMinSeverity()),
                Map.of("actor", actor != null ? actor : "admin")
        );

        SiemEndpointDto dto = mapEndpointToDto(saved);
        dto.setPlainTextSecret(plainSecret); // Show-Once
        return dto;
    }

    @Transactional
    public SiemEndpointDto updateEndpoint(String slug, UUID endpointId, UpsertSiemEndpointRequest request, String actor) {
        Organization org = resolveOrganization(slug);
        TenantSiemEndpoint endpoint = endpointRepository.findByIdAndOrganizationId(endpointId, org.getId())
                .orElseThrow(() -> new NoSuchElementException("SIEM endpoint tidak ditemukan."));

        String normalizedUrl = request.getTargetUrl().trim();
        securityValidator.validateUrl(normalizedUrl);

        endpoint.setName(request.getName().trim());
        endpoint.setTargetUrl(normalizedUrl);
        if (request.getTargetFormat() != null) {
            endpoint.setTargetFormat(request.getTargetFormat());
        }
        if (request.getEventCategories() != null) {
            endpoint.setEventCategories(serializeCategories(request.getEventCategories()));
        }
        if (request.getMinSeverity() != null) {
            endpoint.setMinSeverity(normalizeSeverity(request.getMinSeverity()));
        }
        if (Boolean.TRUE.equals(request.getClearCustomAuthHeader())) {
            endpoint.setCustomAuthHeaderName(null);
            endpoint.setCustomAuthHeaderEncrypted(null);
        } else {
            String headerName = normalizeHeaderName(request.getCustomAuthHeaderName());
            if (headerName != null) {
                endpoint.setCustomAuthHeaderName(headerName);
            }
            if (request.getCustomAuthHeaderValue() != null && !request.getCustomAuthHeaderValue().isBlank()) {
                if (endpoint.getCustomAuthHeaderName() == null) {
                    endpoint.setCustomAuthHeaderName("Authorization");
                }
                endpoint.setCustomAuthHeaderEncrypted(encryptionUtil.encrypt(request.getCustomAuthHeaderValue().trim()));
            }
        }
        if (request.getIsActive() != null) {
            endpoint.setActive(request.getIsActive());
            if (Boolean.TRUE.equals(request.getIsActive())) {
                endpoint.setConsecutiveFailures(0);
                endpoint.setAutoDisabledAt(null);
                endpoint.setAutoDisabledReason(null);
            }
        }

        TenantSiemEndpoint saved = endpointRepository.save(endpoint);
        auditLoggingService.logEvent(
                org.getSlug(),
                "SECURITY_SIEM_ENDPOINT_UPDATED",
                "SIEM_ENDPOINT",
                saved.getId().toString(),
                Map.of(),
                Map.of("name", saved.getName(), "format", saved.getTargetFormat().name(), "active", saved.isActive()),
                Map.of("actor", actor != null ? actor : "admin")
        );

        return mapEndpointToDto(saved);
    }

    @Transactional
    public void deleteEndpoint(String slug, UUID endpointId, String actor) {
        Organization org = resolveOrganization(slug);
        TenantSiemEndpoint endpoint = endpointRepository.findByIdAndOrganizationId(endpointId, org.getId())
                .orElseThrow(() -> new NoSuchElementException("SIEM endpoint tidak ditemukan."));

        endpointRepository.delete(endpoint);
        auditLoggingService.logEvent(
                org.getSlug(),
                "SECURITY_SIEM_ENDPOINT_DELETED",
                "SIEM_ENDPOINT",
                endpointId.toString(),
                Map.of("name", endpoint.getName()),
                Map.of(),
                Map.of("actor", actor != null ? actor : "admin")
        );
    }

    @Transactional
    public SiemEndpointDto rollSecret(String slug, UUID endpointId, String actor) {
        Organization org = resolveOrganization(slug);
        TenantSiemEndpoint endpoint = endpointRepository.findByIdAndOrganizationId(endpointId, org.getId())
                .orElseThrow(() -> new NoSuchElementException("SIEM endpoint tidak ditemukan."));

        String newSecret = "whsec_siem_" + encryptionUtil.generateSecureToken(24);
        endpoint.setSigningSecretEncrypted(encryptionUtil.encrypt(newSecret));
        endpoint.setSigningSecretPrefix(buildSecretPrefix(newSecret));

        TenantSiemEndpoint saved = endpointRepository.save(endpoint);
        auditLoggingService.logEvent(
                org.getSlug(),
                "SECURITY_SIEM_SECRET_ROLLED",
                "SIEM_ENDPOINT",
                saved.getId().toString(),
                Map.of(),
                Map.of("prefix", saved.getSigningSecretPrefix()),
                Map.of("actor", actor != null ? actor : "admin")
        );

        SiemEndpointDto dto = mapEndpointToDto(saved);
        dto.setPlainTextSecret(newSecret); // Show-Once
        return dto;
    }

    @Transactional
    public SiemEndpointDto reEnableEndpoint(String slug, UUID endpointId, String actor) {
        Organization org = resolveOrganization(slug);
        TenantSiemEndpoint endpoint = endpointRepository.findByIdAndOrganizationId(endpointId, org.getId())
                .orElseThrow(() -> new NoSuchElementException("SIEM endpoint tidak ditemukan."));

        endpoint.setActive(true);
        endpoint.setConsecutiveFailures(0);
        endpoint.setAutoDisabledAt(null);
        endpoint.setAutoDisabledReason(null);

        TenantSiemEndpoint saved = endpointRepository.save(endpoint);
        auditLoggingService.logEvent(
                org.getSlug(),
                "SECURITY_SIEM_ENDPOINT_REENABLED",
                "SIEM_ENDPOINT",
                saved.getId().toString(),
                Map.of(),
                Map.of("active", true),
                Map.of("actor", actor != null ? actor : "admin")
        );

        return mapEndpointToDto(saved);
    }

    @Transactional
    public SiemTestResultDto sendTestEvent(String slug, UUID endpointId, String actor) {
        Organization org = resolveOrganization(slug);
        TenantSiemEndpoint endpoint = endpointRepository.findByIdAndOrganizationId(endpointId, org.getId())
                .orElseThrow(() -> new NoSuchElementException("SIEM endpoint tidak ditemukan."));

        securityValidator.validateUrl(endpoint.getTargetUrl());

        Instant now = Instant.now();
        String eventId = "evt_test_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        SiemPayloadFormatter.SiemEventEnvelope envelope = new SiemPayloadFormatter.SiemEventEnvelope(
                eventId,
                now.toString(),
                now.getEpochSecond(),
                org.getSlug(),
                org.getName(),
                "SECURITY_SIEM_TEST_PING",
                "SECURITY",
                "INFO",
                actor != null ? actor : "admin",
                "admin",
                "127.0.0.1",
                "SIEM_ENDPOINT",
                endpoint.getId().toString(),
                Map.of("source", "manual_test_ping", "format", endpoint.getTargetFormat().name())
        );

        String formattedPayload = payloadFormatter.format(endpoint.getTargetFormat(), envelope);

        TenantSiemDelivery delivery = TenantSiemDelivery.builder()
                .endpoint(endpoint)
                .organization(org)
                .eventId(eventId)
                .eventAction("SECURITY_SIEM_TEST_PING")
                .eventCategory("SECURITY")
                .eventSeverity("INFO")
                .payloadJson(formattedPayload)
                .deliveryStatus("PENDING")
                .attemptCount(1)
                .maxAttempts(1)
                .createdAt(OffsetDateTime.now(ZoneOffset.UTC))
                .build();
        delivery = deliveryRepository.save(delivery);

        SSRFSafeHttpClient.HttpResponse httpResp = dispatchHttp(endpoint, delivery);
        boolean success = httpResp.isSuccess();

        delivery.setHttpStatusCode(httpResp.getStatusCode());
        delivery.setLatencyMs(httpResp.getLatencyMs());
        delivery.setResponseSnippet(truncate(httpResp.getBody(), 1000));
        delivery.setErrorMessage(truncate(httpResp.getErrorMessage(), 500));
        delivery.setDeliveredAt(OffsetDateTime.now(ZoneOffset.UTC));
        delivery.setDeliveryStatus(success ? "DELIVERED" : "FAILED_DLQ");
        delivery.setNextRetryAt(null);
        delivery = deliveryRepository.save(delivery);

        recordEndpointHealthOutcome(endpoint, success, httpResp.getStatusCode(), httpResp.getErrorMessage());

        return SiemTestResultDto.builder()
                .success(success)
                .deliveryId(delivery.getId())
                .httpStatus(httpResp.getStatusCode())
                .latencyMs(httpResp.getLatencyMs())
                .eventAction("SECURITY_SIEM_TEST_PING")
                .targetUrl(endpoint.getTargetUrl())
                .payloadPreview(formattedPayload)
                .responseSnippet(truncate(httpResp.getBody(), 600))
                .errorMessage(httpResp.getErrorMessage())
                .build();
    }

    @Transactional(readOnly = true)
    public List<SiemDeliveryDto> listDeliveries(String slug, UUID endpointId, int limit) {
        Organization org = resolveOrganization(slug);
        endpointRepository.findByIdAndOrganizationId(endpointId, org.getId())
                .orElseThrow(() -> new NoSuchElementException("SIEM endpoint tidak ditemukan."));

        int cappedLimit = Math.max(1, Math.min(limit, 100));
        return deliveryRepository.findByEndpointIdAndOrganizationIdOrderByCreatedAtDesc(
                        endpointId, org.getId(), PageRequest.of(0, cappedLimit))
                .stream()
                .map(this::mapDeliveryToDto)
                .toList();
    }

    @Transactional
    public SiemDeliveryDto replayDelivery(String slug, UUID endpointId, UUID deliveryId, String actor) {
        Organization org = resolveOrganization(slug);
        TenantSiemEndpoint endpoint = endpointRepository.findByIdAndOrganizationId(endpointId, org.getId())
                .orElseThrow(() -> new NoSuchElementException("SIEM endpoint tidak ditemukan."));

        TenantSiemDelivery delivery = deliveryRepository.findByIdAndEndpointIdAndOrganizationId(
                        deliveryId, endpointId, org.getId())
                .orElseThrow(() -> new NoSuchElementException("Log pengiriman SIEM tidak ditemukan."));

        securityValidator.validateUrl(endpoint.getTargetUrl());

        delivery.setAttemptCount(delivery.getAttemptCount() + 1);
        SSRFSafeHttpClient.HttpResponse httpResp = dispatchHttp(endpoint, delivery);
        boolean success = httpResp.isSuccess();

        delivery.setHttpStatusCode(httpResp.getStatusCode());
        delivery.setLatencyMs(httpResp.getLatencyMs());
        delivery.setResponseSnippet(truncate(httpResp.getBody(), 1000));
        delivery.setErrorMessage(truncate(httpResp.getErrorMessage(), 500));
        delivery.setDeliveredAt(OffsetDateTime.now(ZoneOffset.UTC));
        delivery.setDeliveryStatus(success ? "DELIVERED" : "FAILED_DLQ");
        delivery.setNextRetryAt(null);
        delivery = deliveryRepository.save(delivery);

        recordEndpointHealthOutcome(endpoint, success, httpResp.getStatusCode(), httpResp.getErrorMessage());

        auditLoggingService.logEvent(
                org.getSlug(),
                "SECURITY_SIEM_DELIVERY_REPLAYED",
                "SIEM_DELIVERY",
                delivery.getId().toString(),
                Map.of(),
                Map.of("success", success, "httpStatus", httpResp.getStatusCode()),
                Map.of("actor", actor != null ? actor : "admin")
        );

        return mapDeliveryToDto(delivery);
    }

    // -------------------------------------------------------------------------
    // Control Plane Overview
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<SystemSiemOverviewDto> getSystemOverview() {
        return endpointRepository.findAllWithOrganizationOrderByCreatedAtDesc()
                .stream()
                .map(ep -> {
                    long dlqCount = deliveryRepository.countByEndpointIdAndDeliveryStatus(ep.getId(), "FAILED_DLQ");
                    return SystemSiemOverviewDto.builder()
                            .endpointId(ep.getId())
                            .organizationId(ep.getOrganization().getId())
                            .organizationName(ep.getOrganization().getName())
                            .organizationSlug(ep.getOrganization().getSlug())
                            .endpointName(ep.getName())
                            .targetUrl(ep.getTargetUrl())
                            .targetFormat(ep.getTargetFormat())
                            .minSeverity(ep.getMinSeverity())
                            .isActive(ep.isActive())
                            .autoDisabled(!ep.isActive() && ep.getAutoDisabledAt() != null)
                            .consecutiveFailures(ep.getConsecutiveFailures())
                            .autoDisabledAt(ep.getAutoDisabledAt())
                            .autoDisabledReason(ep.getAutoDisabledReason())
                            .lastDeliveryAt(ep.getLastDeliveryAt())
                            .lastDeliveryStatus(ep.getLastDeliveryStatus())
                            .lastHttpStatus(ep.getLastHttpStatus())
                            .dlqCount(dlqCount)
                            .build();
                })
                .toList();
    }

    // -------------------------------------------------------------------------
    // Real-Time Event Ingestion & Dispatch (Internal + Gateway Bridge)
    // -------------------------------------------------------------------------

    @Async
    @EventListener
    @Transactional
    public void onSecurityAuditEvent(SecurityAuditEmittedEvent event) {
        if (event == null || event.tenantSlug() == null || event.action() == null) {
            return;
        }
        ingestAndDispatch(SiemIngestEventRequest.builder()
                .eventId("evt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16))
                .tenantSlug(event.tenantSlug())
                .action(event.action())
                .severity(event.severity())
                .actorId(event.actorId())
                .actorRole(event.actorRole())
                .actorIp(event.actorIp())
                .resourceType(event.resourceType())
                .resourceId(event.resourceId())
                .occurredAt(Instant.now().toString())
                .metadata(event.metadata())
                .build());
    }

    @Transactional
    public int ingestAndDispatch(SiemIngestEventRequest req) {
        if (req == null || req.getTenantSlug() == null || req.getAction() == null) {
            return 0;
        }
        String actionUpper = req.getAction().trim().toUpperCase(Locale.ROOT);
        // Loop guard: never stream SIEM management / auto-disable audit logs back into SIEM endpoints
        if ("system".equalsIgnoreCase(req.getTenantSlug().trim()) || actionUpper.startsWith("SECURITY_SIEM_")) {
            return 0;
        }

        Optional<Organization> orgOpt = organizationRepository.findBySlug(req.getTenantSlug().trim());
        if (orgOpt.isEmpty()) {
            return 0;
        }
        Organization org = orgOpt.get();

        // Enforce Enterprise entitlement (aligned with ADR-0015 / SCIM / SSO)
        try {
            if (!licenseManagementService.getEffectiveLicenseEntitlements(org.getId()).isSsoEnabled()) {
                return 0;
            }
        } catch (Exception e) {
            log.debug("License entitlement check skipped during SIEM ingest for {}: {}", org.getSlug(), e.getMessage());
            return 0;
        }

        List<TenantSiemEndpoint> activeEndpoints = endpointRepository.findByOrganizationIdAndIsActiveTrue(org.getId());
        if (activeEndpoints.isEmpty()) {
            return 0;
        }

        String category = classifyCategory(actionUpper);
        String severity = normalizeSeverity(req.getSeverity() != null ? req.getSeverity() : inferSeverity(actionUpper));
        Instant occurred = parseInstantOrNow(req.getOccurredAt());
        String eventId = (req.getEventId() != null && !req.getEventId().isBlank())
                ? req.getEventId().trim()
                : "evt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        int dispatched = 0;
        for (TenantSiemEndpoint endpoint : activeEndpoints) {
            if (!matchesEndpointFilter(endpoint, category, severity)) {
                continue;
            }

            SiemPayloadFormatter.SiemEventEnvelope envelope = new SiemPayloadFormatter.SiemEventEnvelope(
                    eventId,
                    occurred.toString(),
                    occurred.getEpochSecond(),
                    org.getSlug(),
                    org.getName(),
                    req.getAction(),
                    category,
                    severity,
                    req.getActorId(),
                    req.getActorRole(),
                    req.getActorIp(),
                    req.getResourceType(),
                    req.getResourceId(),
                    req.getMetadata()
            );

            String payloadJson = payloadFormatter.format(endpoint.getTargetFormat(), envelope);
            TenantSiemDelivery delivery = TenantSiemDelivery.builder()
                    .endpoint(endpoint)
                    .organization(org)
                    .eventId(eventId)
                    .eventAction(truncate(req.getAction(), 128))
                    .eventCategory(category)
                    .eventSeverity(severity)
                    .payloadJson(payloadJson)
                    .deliveryStatus("PENDING")
                    .attemptCount(0)
                    .maxAttempts(MAX_ATTEMPTS)
                    .createdAt(OffsetDateTime.now(ZoneOffset.UTC))
                    .build();
            delivery = deliveryRepository.save(delivery);
            executeDeliveryAttempt(delivery);
            dispatched++;
        }
        return dispatched;
    }

    @Transactional
    public void processDueRetries() {
        List<TenantSiemDelivery> due = deliveryRepository.findDueDeliveries(
                OffsetDateTime.now(ZoneOffset.UTC), PageRequest.of(0, 50));
        if (due.isEmpty()) {
            return;
        }
        log.info("🔁 Processing {} pending SIEM deliveries...", due.size());
        for (TenantSiemDelivery delivery : due) {
            executeDeliveryAttempt(delivery);
        }
    }

    @Transactional
    public void executeDeliveryAttempt(TenantSiemDelivery delivery) {
        TenantSiemEndpoint endpoint = delivery.getEndpoint();
        if (endpoint == null || !endpoint.isActive()) {
            delivery.setDeliveryStatus("FAILED_DLQ");
            delivery.setErrorMessage("Endpoint inactive or disabled.");
            delivery.setNextRetryAt(null);
            deliveryRepository.save(delivery);
            return;
        }

        int attempt = delivery.getAttemptCount() + 1;
        delivery.setAttemptCount(attempt);

        try {
            securityValidator.validateUrl(endpoint.getTargetUrl());
        } catch (Exception ssrfEx) {
            delivery.setDeliveryStatus("FAILED_DLQ");
            delivery.setErrorMessage(truncate("SSRF Blocked: " + ssrfEx.getMessage(), 500));
            delivery.setNextRetryAt(null);
            deliveryRepository.save(delivery);
            recordEndpointHealthOutcome(endpoint, false, 0, delivery.getErrorMessage());
            return;
        }

        SSRFSafeHttpClient.HttpResponse httpResp = dispatchHttp(endpoint, delivery);
        boolean success = httpResp.isSuccess();
        delivery.setHttpStatusCode(httpResp.getStatusCode());
        delivery.setLatencyMs(httpResp.getLatencyMs());
        delivery.setResponseSnippet(truncate(httpResp.getBody(), 1000));
        delivery.setErrorMessage(truncate(httpResp.getErrorMessage(), 500));
        delivery.setDeliveredAt(OffsetDateTime.now(ZoneOffset.UTC));

        if (success) {
            delivery.setDeliveryStatus("DELIVERED");
            delivery.setNextRetryAt(null);
        } else if (attempt >= delivery.getMaxAttempts()) {
            delivery.setDeliveryStatus("FAILED_DLQ");
            delivery.setNextRetryAt(null);
        } else {
            delivery.setDeliveryStatus("RETRYING");
            int delaySec = attempt < BACKOFF_SECONDS.length ? BACKOFF_SECONDS[attempt] : 1800;
            delivery.setNextRetryAt(OffsetDateTime.now(ZoneOffset.UTC).plusSeconds(delaySec));
        }

        deliveryRepository.save(delivery);
        recordEndpointHealthOutcome(endpoint, success, httpResp.getStatusCode(), httpResp.getErrorMessage());
    }

    // -------------------------------------------------------------------------
    // Internal Helpers: Signing, Circuit Breaker & Classification
    // -------------------------------------------------------------------------

    private SSRFSafeHttpClient.HttpResponse dispatchHttp(TenantSiemEndpoint endpoint, TenantSiemDelivery delivery) {
        String plainSecret = encryptionUtil.decrypt(endpoint.getSigningSecretEncrypted());
        String body = delivery.getPayloadJson() != null ? delivery.getPayloadJson() : "{}";
        long timestampEpoch = Instant.now().getEpochSecond();

        String v1Signature = encryptionUtil.computeHmacSha256(plainSecret, body);
        String v2Full = encryptionUtil.computeHmacSha256(plainSecret, timestampEpoch + "." + body);
        String v2Hex = v2Full.startsWith("sha256=") ? v2Full.substring(7) : v2Full;

        Map<String, String> headers = new LinkedHashMap<>();
        headers.put("User-Agent", "K2NET-SIEM-Streamer/1.0");
        headers.put("X-K2NET-Event", delivery.getEventAction());
        headers.put("X-K2NET-Delivery-ID", delivery.getId().toString());
        headers.put("X-K2NET-Timestamp", String.valueOf(timestampEpoch));
        headers.put("X-K2NET-Signature-256", v1Signature);
        headers.put("X-K2NET-Signature-V2", "t=" + timestampEpoch + ",v1=" + v2Hex);

        if (endpoint.getCustomAuthHeaderName() != null && !endpoint.getCustomAuthHeaderName().isBlank()
                && endpoint.getCustomAuthHeaderEncrypted() != null && !endpoint.getCustomAuthHeaderEncrypted().isBlank()) {
            try {
                String authVal = encryptionUtil.decrypt(endpoint.getCustomAuthHeaderEncrypted());
                if (authVal != null && !authVal.isBlank()) {
                    headers.put(endpoint.getCustomAuthHeaderName(), authVal);
                }
            } catch (Exception e) {
                log.warn("Failed to decrypt custom auth header for SIEM endpoint {}: {}", endpoint.getId(), e.getMessage());
            }
        }

        return ssrfSafeHttpClient.executePost(endpoint.getTargetUrl(), body, headers);
    }

    private void recordEndpointHealthOutcome(TenantSiemEndpoint endpoint, boolean success, int httpStatus, String errorMessage) {
        endpoint.setLastDeliveryAt(OffsetDateTime.now(ZoneOffset.UTC));
        endpoint.setLastDeliveryStatus(success ? "DELIVERED" : "FAILED");
        endpoint.setLastHttpStatus(httpStatus);

        if (success) {
            endpoint.setConsecutiveFailures(0);
            endpoint.setAutoDisabledAt(null);
            endpoint.setAutoDisabledReason(null);
            endpointRepository.save(endpoint);
            return;
        }

        int failures = endpoint.getConsecutiveFailures() + 1;
        endpoint.setConsecutiveFailures(failures);

        if (failures >= CIRCUIT_BREAKER_THRESHOLD && endpoint.isActive()) {
            endpoint.setActive(false);
            endpoint.setAutoDisabledAt(OffsetDateTime.now(ZoneOffset.UTC));
            String reason = "Auto-paused after " + failures + " consecutive delivery failures"
                    + (errorMessage != null && !errorMessage.isBlank() ? ": " + truncate(errorMessage, 240) : "");
            endpoint.setAutoDisabledReason(reason);
            endpointRepository.save(endpoint);

            notifyAdminsCircuitBreakerTripped(endpoint, reason);
            auditLoggingService.logEvent(
                    endpoint.getOrganization().getSlug(),
                    "SECURITY_SIEM_ENDPOINT_AUTO_DISABLED",
                    "SIEM_ENDPOINT",
                    endpoint.getId().toString(),
                    Map.of("isActive", true),
                    Map.of("isActive", false, "consecutiveFailures", failures),
                    Map.of("reason", reason)
            );
            return;
        }

        endpointRepository.save(endpoint);
    }

    private void notifyAdminsCircuitBreakerTripped(TenantSiemEndpoint endpoint, String reason) {
        try {
            UUID orgId = endpoint.getOrganization().getId();
            List<OrganizationMember> activeMembers = organizationMemberRepository.findByOrganizationIdAndStatus(orgId, "ACTIVE");
            Set<String> emails = new LinkedHashSet<>();
            for (OrganizationMember member : activeMembers) {
                String role = member.getRoleName() != null ? member.getRoleName().toLowerCase(Locale.ROOT) : "";
                if (ADMIN_ROLE_NAMES.contains(role) && member.getUser() != null
                        && member.getUser().getEmail() != null && !member.getUser().getEmail().isBlank()) {
                    emails.add(member.getUser().getEmail().trim());
                }
            }
            if (emails.isEmpty()) {
                return;
            }
            String subject = "[K2NET Security] SIEM Endpoint Auto-Paused: " + endpoint.getName();
            String body = "<p>SIEM streaming endpoint <strong>" + escapeHtml(endpoint.getName()) + "</strong>"
                    + " (<code>" + escapeHtml(endpoint.getTargetUrl()) + "</code>) for workspace <strong>"
                    + escapeHtml(endpoint.getOrganization().getName()) + "</strong> has been automatically paused "
                    + "after <strong>" + CIRCUIT_BREAKER_THRESHOLD + "</strong> consecutive delivery failures.</p>"
                    + "<p><strong>Reason:</strong> " + escapeHtml(reason) + "</p>"
                    + "<p>Please inspect your receiver health and click <em>Re-Enable</em> in Settings → Security.</p>";

            for (String email : emails) {
                emailService.sendEmail(email, subject, body);
            }
        } catch (Exception e) {
            log.warn("Failed to send circuit-breaker alert email for SIEM endpoint {}: {}", endpoint.getId(), e.getMessage());
        }
    }

    public static boolean isQualifyingSecurityAction(String action) {
        if (action == null || action.isBlank()) {
            return false;
        }
        String up = action.trim().toUpperCase(Locale.ROOT);
        if (up.startsWith("SECURITY_SIEM_")) {
            return false;
        }
        return up.startsWith("SECURITY_")
                || up.startsWith("SSO_")
                || up.startsWith("SCIM_")
                || up.startsWith("AUTH_")
                || up.startsWith("MFA_")
                || up.startsWith("PASSKEY_")
                || up.startsWith("ROLE_")
                || up.startsWith("PERMISSION_")
                || up.startsWith("IMPERSONATION");
    }

    static String classifyCategory(String actionUpper) {
        if (actionUpper.startsWith("SSO_")) return "SSO";
        if (actionUpper.startsWith("SCIM_")) return "SCIM";
        if (actionUpper.startsWith("AUTH_") || actionUpper.startsWith("MFA_") || actionUpper.startsWith("PASSKEY_")) return "AUTH";
        if (actionUpper.startsWith("ROLE_") || actionUpper.startsWith("PERMISSION_") || actionUpper.startsWith("IMPERSONATION")) return "ADMIN";
        return "SECURITY";
    }

    static String normalizeSeverity(String raw) {
        if (raw == null || raw.isBlank()) return "WARNING";
        String up = raw.trim().toUpperCase(Locale.ROOT);
        return switch (up) {
            case "CRITICAL", "EMERGENCY", "HIGH", "ERROR" -> "CRITICAL";
            case "INFO", "LOW" -> "INFO";
            default -> "WARNING";
        };
    }

    private String inferSeverity(String actionUpper) {
        if (actionUpper.contains("HIJACK") || actionUpper.contains("BREAK_GLASS")
                || actionUpper.contains("UNAUTHORIZED") || actionUpper.contains("EXPIRED")
                || actionUpper.contains("UNHEALTHY") || actionUpper.contains("DEPROVISIONED")
                || actionUpper.contains("PURGED")) {
            return "CRITICAL";
        }
        if (actionUpper.contains("DENIED") || actionUpper.contains("FAILED")
                || actionUpper.contains("ROTATED") || actionUpper.contains("EXPIRING")
                || actionUpper.contains("RESET") || actionUpper.contains("DELETED")) {
            return "WARNING";
        }
        return "INFO";
    }

    private boolean matchesEndpointFilter(TenantSiemEndpoint ep, String category, String severity) {
        if (severityRank(severity) < severityRank(ep.getMinSeverity())) {
            return false;
        }
        List<String> subscribed = parseCategories(ep.getEventCategories());
        return subscribed.isEmpty() || subscribed.contains(category);
    }

    private int severityRank(String severity) {
        return switch (normalizeSeverity(severity)) {
            case "CRITICAL" -> 3;
            case "WARNING" -> 2;
            default -> 1;
        };
    }

    private SiemEndpointDto mapEndpointToDto(TenantSiemEndpoint ep) {
        long dlqCount = deliveryRepository.countByEndpointIdAndDeliveryStatus(ep.getId(), "FAILED_DLQ");
        return SiemEndpointDto.builder()
                .id(ep.getId())
                .name(ep.getName())
                .targetUrl(ep.getTargetUrl())
                .targetFormat(ep.getTargetFormat())
                .signingSecretPrefix(ep.getSigningSecretPrefix())
                .customAuthHeaderName(ep.getCustomAuthHeaderName())
                .hasCustomAuthHeader(ep.getCustomAuthHeaderEncrypted() != null && !ep.getCustomAuthHeaderEncrypted().isBlank())
                .eventCategories(parseCategories(ep.getEventCategories()))
                .minSeverity(ep.getMinSeverity())
                .isActive(ep.isActive())
                .consecutiveFailures(ep.getConsecutiveFailures())
                .autoDisabledAt(ep.getAutoDisabledAt())
                .autoDisabledReason(ep.getAutoDisabledReason())
                .lastDeliveryAt(ep.getLastDeliveryAt())
                .lastDeliveryStatus(ep.getLastDeliveryStatus())
                .lastHttpStatus(ep.getLastHttpStatus())
                .dlqCount(dlqCount)
                .createdBy(ep.getCreatedBy())
                .createdAt(ep.getCreatedAt() != null ? ep.getCreatedAt().toString() : null)
                .build();
    }

    private SiemDeliveryDto mapDeliveryToDto(TenantSiemDelivery d) {
        return SiemDeliveryDto.builder()
                .id(d.getId())
                .endpointId(d.getEndpoint() != null ? d.getEndpoint().getId() : null)
                .eventId(d.getEventId())
                .eventAction(d.getEventAction())
                .eventCategory(d.getEventCategory())
                .eventSeverity(d.getEventSeverity())
                .payloadJson(d.getPayloadJson())
                .deliveryStatus(d.getDeliveryStatus())
                .attemptCount(d.getAttemptCount())
                .maxAttempts(d.getMaxAttempts())
                .nextRetryAt(d.getNextRetryAt())
                .httpStatusCode(d.getHttpStatusCode())
                .responseSnippet(d.getResponseSnippet())
                .errorMessage(d.getErrorMessage())
                .latencyMs(d.getLatencyMs())
                .deliveredAt(d.getDeliveredAt())
                .createdAt(d.getCreatedAt())
                .build();
    }

    private Organization resolveOrganization(String slug) {
        if (slug == null || slug.isBlank()) {
            throw new IllegalArgumentException("Slug organisasi wajib diisi.");
        }
        return organizationRepository.findBySlug(slug.trim())
                .orElseThrow(() -> new NoSuchElementException("Organisasi tidak ditemukan: " + slug));
    }

    private String serializeCategories(List<String> categories) {
        if (categories == null || categories.isEmpty()) {
            return String.join(",", DEFAULT_CATEGORIES);
        }
        List<String> clean = categories.stream()
                .filter(Objects::nonNull)
                .map(s -> s.trim().toUpperCase(Locale.ROOT))
                .filter(VALID_CATEGORIES::contains)
                .distinct()
                .toList();
        return clean.isEmpty() ? String.join(",", DEFAULT_CATEGORIES) : String.join(",", clean);
    }

    private List<String> parseCategories(String raw) {
        if (raw == null || raw.isBlank()) {
            return DEFAULT_CATEGORIES;
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    private String buildSecretPrefix(String plainSecret) {
        if (plainSecret == null || plainSecret.length() <= 16) {
            return "whsec_siem_••••";
        }
        return plainSecret.substring(0, 15) + "••••" + plainSecret.substring(plainSecret.length() - 4);
    }

    private String normalizeHeaderName(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String trimmed = raw.trim();
        if (!trimmed.matches("^[A-Za-z0-9-]+$")) {
            throw new IllegalArgumentException("Nama custom auth header tidak valid.");
        }
        return trimmed;
    }

    private Instant parseInstantOrNow(String occurredAt) {
        if (occurredAt == null || occurredAt.isBlank()) {
            return Instant.now();
        }
        try {
            return Instant.parse(occurredAt.trim());
        } catch (Exception ignored) {
            return Instant.now();
        }
    }

    private String truncate(String val, int maxLen) {
        if (val == null || val.length() <= maxLen) {
            return val;
        }
        return val.substring(0, maxLen) + "...";
    }

    private String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
