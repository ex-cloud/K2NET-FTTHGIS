package com.company.ftthgis.api.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IpPolicyDryRunResponse {
    private boolean allowed;
    private boolean wouldBlockInEnforce;
    private String mode;
    private String reason;
    private String evaluatedIp;
    private String evaluatedCountry;
    private List<String> normalizedCidrs;
    private List<String> normalizedCountries;
    private String callerIp;
    private String callerCountry;
}
