package com.company.ftthgis.api.tenant.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScopedTokenCreateRequest {
    private String name;
    private List<String> scopes; // e.g. ["coverage:read", "odp:read"]
    
    @JsonProperty("expirationDays")
    @JsonAlias({"expiresInDays", "expiration_days", "expires_in_days"})
    private Integer expirationDays; // null = never, 30, 90, 365
}
