package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationResolveResponse {
    private String realmKey;
    private String organizationName;
    private String slug;
    private String targetSlug;
    private boolean isAlias;
    private String planTier;
    private String status;
    private String logoUrl;
}
