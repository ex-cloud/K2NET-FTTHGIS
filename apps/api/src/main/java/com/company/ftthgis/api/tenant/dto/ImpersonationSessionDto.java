package com.company.ftthgis.api.tenant.dto;

import com.company.ftthgis.domain.tenant.entity.ImpersonationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImpersonationSessionDto {
    private UUID id;
    private UUID actorId;
    private String actorEmail;
    private String actorName;
    private UUID targetOrgId;
    private String targetOrgSlug;
    private String targetOrgName;
    private String targetOrgPlan;
    private String reason;
    private String ticketReference;
    private Instant stepUpVerifiedAt;
    private Instant startedAt;
    private Instant expiresAt;
    private Instant revokedAt;
    private ImpersonationStatus status;
    private Long durationSeconds;
    private Long remainingSeconds;
}
