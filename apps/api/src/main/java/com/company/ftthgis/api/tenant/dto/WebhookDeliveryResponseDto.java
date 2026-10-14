package com.company.ftthgis.api.tenant.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WebhookDeliveryResponseDto {
    private UUID id;
    private UUID webhookId;
    private String eventType;
    private String payload;
    private Integer responseStatusCode;
    private String responseBody;
    private Long executionDurationMs;
    private String status;
    private String errorMessage;
    private int attemptNumber;
    private LocalDateTime deliveredAt;
}
