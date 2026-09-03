package com.company.ftthgis.domain.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImpersonationSessionCache implements Serializable {
    private UUID sessionId;
    private UUID actorId;
    private UUID targetTenantId;
    private String targetTenantSlug;
    private String targetTenantName;
    private String refreshToken;
    private String expiresAt;
}
