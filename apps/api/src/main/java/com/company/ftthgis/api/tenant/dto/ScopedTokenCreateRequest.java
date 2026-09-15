package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScopedTokenCreateRequest {
    private String name;
    private List<String> scopes; // e.g. ["coverage:read", "odp:read"]
    private Integer expirationDays; // null = never, 30, 90, 365
}
