package com.company.ftthgis.api.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO ringkasan pemindaian & pembersihan integritas IAM Keycloak <-> PostgreSQL (Fase 7.6 / ADR-0028).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IamIntegrityScanSummaryDto {
    private LocalDateTime scannedAt;
    private boolean dryRun;
    private boolean autoPurgeEnabled;
    private boolean circuitBreakerTriggered;
    private String circuitBreakerReason;
    private long gracePeriodHours;
    private int maxPurgePerRun;
    private List<String> scannedRealms;
    private int totalKeycloakUsers;
    private int totalDatabaseUsers;
    private int healthyCount;
    private int orphanEligibleCount;
    private int orphanGracePeriodCount;
    private int uuidDriftCount;
    private int protectedSkippedCount;
    private int purgedCount;
    private int failedPurgeCount;
    private List<IamIntegrityFindingDto> findings;
}
