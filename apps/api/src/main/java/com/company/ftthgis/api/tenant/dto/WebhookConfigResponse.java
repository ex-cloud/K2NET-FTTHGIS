package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebhookConfigResponse {
    private String webhookUrl;
    private String webhookSecretMasked;
    private boolean hasSecret;
    private boolean isActive;
    private Map<String, Boolean> subscribedEvents;
    private LocalDateTime updatedAt;
}
