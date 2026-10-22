package com.company.ftthgis.api.system.dto;

import com.company.ftthgis.domain.tenant.entity.LicenseNotificationStage;
import com.company.ftthgis.domain.tenant.entity.LicenseStatus;
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
public class RenewalQueueItemDto {
    private UUID licenseId;
    private UUID organizationId;
    private String organizationName;
    private String organizationSlug;
    private String planName;
    private LicenseStatus status;
    private LocalDateTime validUntil;
    private long daysRemaining;
    private String dunningStage;
    private LicenseNotificationStage lastNotifiedStage;
    private LocalDateTime lastNotifiedAt;
    private String billingContactEmail;
    private String billingContactPhone;
    private long outstandingInvoicesCount;
}
