package com.company.ftthgis.api.tenant.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WebhookResponseDto {
    private UUID id;
    private String name;
    private String url;
    private String signingSecret;
    private List<String> events;
    private boolean isActive;
    private String headers;
    private int failureCount;
    private LocalDateTime lastDeliveryAt;
    private String lastDeliveryStatus;
    private LocalDateTime createdAt;
}
