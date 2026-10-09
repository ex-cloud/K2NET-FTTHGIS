package com.company.ftthgis.api.tenant.dto;

import com.company.ftthgis.domain.tenant.entity.LicenseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO respon detail informasi lisensi tenant untuk konsumsi antarmuka frontend (Admin & Tenant).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LicenseResponseDto {

    private UUID id;
    private UUID organizationId;
    private String organizationSlug;
    private String organizationName;
    private String planName;

    private String licenseKey;
    private String maskedLicenseKey;

    private LicenseStatus status;
    private String activationType;

    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private LocalDateTime gracePeriodUntil;

    private long daysRemaining;
    private long graceDaysRemaining;

    private String machineFingerprint;
    private String issuedBy;
    private String notes;

    private LicenseEntitlementsDto entitlements;
    private LocalDateTime createdAt;
}
