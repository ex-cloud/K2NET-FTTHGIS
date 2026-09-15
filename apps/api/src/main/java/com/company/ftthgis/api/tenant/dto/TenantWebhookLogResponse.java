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
public class TenantWebhookLogResponse {
    private UUID id;
    private String event;
    private String targetUrl;
    private Integer status;
    private Integer latencyMs;
    private String responseBody;
    private String errorMessage;
    private LocalDateTime createdAt;
}
