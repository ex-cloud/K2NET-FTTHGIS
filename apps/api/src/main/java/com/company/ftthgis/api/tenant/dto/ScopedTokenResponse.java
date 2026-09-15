package com.company.ftthgis.api.tenant.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JsonProperty("isRevoked")
    private boolean isRevoked;

    private LocalDateTime createdAt;

    @JsonProperty("revoked")
    public boolean getRevoked() {
        return isRevoked;
    }
}

