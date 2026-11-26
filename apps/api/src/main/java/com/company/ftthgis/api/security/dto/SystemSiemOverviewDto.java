package com.company.ftthgis.api.security.dto;

import com.company.ftthgis.domain.tenant.entity.SiemTargetFormat;
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
public class SystemSiemOverviewDto {
    private UUID endpointId;
    private UUID organizationId;
    private String organizationName;
    private String organizationSlug;
    private String endpointName;
    private String targetUrl;
    private SiemTargetFormat targetFormat;
    private String minSeverity;
    private boolean isActive;
    private boolean autoDisabled;
    private int consecutiveFailures;
    private OffsetDateTime autoDisabledAt;
    private String autoDisabledReason;
    private OffsetDateTime lastDeliveryAt;
    private String lastDeliveryStatus;
    private Integer lastHttpStatus;
    private long dlqCount;
}
