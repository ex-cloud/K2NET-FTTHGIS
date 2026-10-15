package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyDnsResponse {
    private boolean verified;
    private String domainStatus; // PENDING_DNS, ACTIVE, FAILED
    private String customDomain;
    private String message;
    private String cnameTarget;
    private String currentResolvedTarget;
}
