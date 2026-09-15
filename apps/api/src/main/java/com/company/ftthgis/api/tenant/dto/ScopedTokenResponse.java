package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScopedTokenResponse {
    private UUID id;
    private String name;
    private String tokenPrefix;
    private String tokenLast4;
    private String maskedToken;
    private List<String> scopes;
    private LocalDateTime expiresAt;
    private LocalDateTime lastUsedAt;
    private boolean isRevoked;
    private LocalDateTime createdAt;
}
