package com.company.ftthgis.api.tenant.dto;

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
public class DeadLetterLogResponse {
    private UUID id;
    private String event;
    private String targetUrl;
    private Integer status;
    private Integer latencyMs;
    private String deliveryStatus; // RETRYING, FAILED_DLQ
    private Integer retryCount;
    private Integer maxRetries;
    private LocalDateTime nextRetryAt;
    private LocalDateTime lastAttemptAt;
    private String requestPayload;
    private String responseBody;
    private String errorMessage;
    private LocalDateTime createdAt;
}
