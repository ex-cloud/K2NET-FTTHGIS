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
public class ImpersonationExchangeResponse {
    private UUID sessionId;
    private String token;
    private UUID targetTenantId;
    private String targetTenantSlug;
    private String targetTenantName;
    private long expiresInSeconds;
    private Instant expiresAt;
}
