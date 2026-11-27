package com.company.ftthgis.api.security.dto;

import com.company.ftthgis.domain.tenant.entity.SiemTargetFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiemEndpointDto {
    private UUID id;
    private String name;
    private String targetUrl;
    private SiemTargetFormat targetFormat;
    private String signingSecretPrefix;
    private String plainTextSecret;
    private String customAuthHeaderName;
    private boolean hasCustomAuthHeader;
    private List<String> eventCategories;
    private String minSeverity;
    @JsonProperty("isActive")
    private boolean isActive;
    private int consecutiveFailures;
    private OffsetDateTime autoDisabledAt;
    private String autoDisabledReason;
    private OffsetDateTime lastDeliveryAt;
    private String lastDeliveryStatus;
    private Integer lastHttpStatus;
    private long dlqCount;
    private String createdBy;
    private String createdAt;
}
