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
public class ImpersonationSessionResponse {
    private UUID sessionId;
    private String exchangeCode;
    private UUID targetTenantId;
    private String targetTenantSlug;
    private String targetTenantName;
    private Instant expiresAt;
}
