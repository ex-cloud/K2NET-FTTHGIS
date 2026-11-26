package com.company.ftthgis.domain.tenant.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenant_siem_deliveries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantSiemDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "endpoint_id", nullable = false)
    private TenantSiemEndpoint endpoint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(name = "event_id", nullable = false, length = 128)
    private String eventId;

    @Column(name = "event_action", nullable = false, length = 128)
    private String eventAction;

    @Column(name = "event_category", nullable = false, length = 32)
    private String eventCategory;

    @Column(name = "event_severity", nullable = false, length = 16)
    private String eventSeverity;

    @Column(name = "payload_json", nullable = false, columnDefinition = "TEXT")
    private String payloadJson;

    @Column(name = "delivery_status", nullable = false, length = 24)
    @Builder.Default
    private String deliveryStatus = "PENDING";

    @Column(name = "attempt_count", nullable = false)
    @Builder.Default
    private int attemptCount = 0;

    @Column(name = "max_attempts", nullable = false)
    @Builder.Default
    private int maxAttempts = 5;

    @Column(name = "next_retry_at")
    private OffsetDateTime nextRetryAt;

    @Column(name = "http_status_code")
    private Integer httpStatusCode;

    @Column(name = "response_snippet", columnDefinition = "TEXT")
    private String responseSnippet;

    @Column(name = "error_message", length = 512)
    private String errorMessage;

    @Column(name = "latency_ms")
    private Integer latencyMs;

    @Column(name = "delivered_at")
    private OffsetDateTime deliveredAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
