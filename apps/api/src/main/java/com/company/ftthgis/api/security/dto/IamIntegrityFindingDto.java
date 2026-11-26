package com.company.ftthgis.api.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO temuan integritas akun antara Keycloak dan PostgreSQL users (Fase 7.6 / ADR-0028).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IamIntegrityFindingDto {
    private String keycloakUserId;
    private String realm;
    private String username;
    private String email;
    private boolean enabled;
    private LocalDateTime createdAt;
    private long ageHours;
    private String findingType; // ORPHAN_ELIGIBLE | ORPHAN_GRACE_PERIOD | UUID_DRIFT
    private boolean purgeable;
    private boolean hasActiveSessions;
    private String dbUserId;
    private String reason;
}
