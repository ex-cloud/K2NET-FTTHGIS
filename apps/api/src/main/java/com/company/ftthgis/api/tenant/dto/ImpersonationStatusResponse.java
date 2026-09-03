package com.company.ftthgis.api.tenant.dto;

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
public class ImpersonationStatusResponse {
    private boolean active;
    private UUID sessionId;
    private UUID targetTenantId;
    private String targetTenantName;
    private String targetTenantSlug;
    private long remainingSeconds;
    private Instant expiresAt;
}
