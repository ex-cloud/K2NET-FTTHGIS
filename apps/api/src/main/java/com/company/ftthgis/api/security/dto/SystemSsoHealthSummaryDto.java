package com.company.ftthgis.api.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO ringkasan status kesehatan IdP & masa berlaku sertifikat SSO lintas tenant
 * untuk dashboard Control Plane (/security/auth).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSsoHealthSummaryDto {
    private UUID configId;
    private UUID organizationId;
    private String organizationSlug;
    private String organizationName;
    private String providerType;
    private String displayName;
    private String status;
    private boolean enforceSso;
    private String healthStatus;
    private LocalDateTime lastHealthCheckAt;
    private Integer lastHealthLatencyMs;
    private Integer consecutiveProbeFailures;
    private String lastHealthError;
    private LocalDateTime tlsCertExpiresAt;
    private Long tlsCertDaysRemaining;
    private LocalDateTime samlCertExpiresAt;
    private Long samlCertDaysRemaining;
    private LocalDateTime secondarySamlCertExpiresAt;
    private Long secondarySamlCertDaysRemaining;
    private boolean samlOverlapActive;
    private LocalDateTime clientSecretExpiresAt;
    private Long clientSecretDaysRemaining;
    private String lastAlertStage;
    private LocalDateTime lastAlertSentAt;
}
