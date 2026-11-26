package com.company.ftthgis.api.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiemDeliveryDto {
    private UUID id;
    private UUID endpointId;
    private String eventId;
    private String eventAction;
    private String eventCategory;
    private String eventSeverity;
    private String payloadJson;
    private String deliveryStatus;
    private int attemptCount;
    private int maxAttempts;
    private OffsetDateTime nextRetryAt;
    private Integer httpStatusCode;
    private String responseSnippet;
    private String errorMessage;
    private Integer latencyMs;
    private OffsetDateTime deliveredAt;
    private OffsetDateTime createdAt;
}
