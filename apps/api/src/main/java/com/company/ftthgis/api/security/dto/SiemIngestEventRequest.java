package com.company.ftthgis.api.security.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiemIngestEventRequest {
    private String eventId;

    @NotBlank(message = "tenantSlug is required")
    private String tenantSlug;

    @NotBlank(message = "action is required")
    private String action;

    private String severity;
    private String actorId;
    private String actorRole;
    private String actorIp;
    private String resourceType;
    private String resourceId;
    private String occurredAt;
    private Map<String, Object> metadata;
}
