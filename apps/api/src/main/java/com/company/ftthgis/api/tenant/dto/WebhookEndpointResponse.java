package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebhookEndpointResponse {
    private UUID id;
    private String name;
    private String targetUrl;
    private String webhookSecretMasked;
    private boolean hasSecret;
    private boolean isActive;
    private Map<String, Boolean> subscribedEvents;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
