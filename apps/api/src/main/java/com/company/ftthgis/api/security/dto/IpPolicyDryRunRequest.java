package com.company.ftthgis.api.security.dto;

import java.util.List;

public record IpPolicyDryRunRequest(
    String ipAllowlistCidrs,
    List<String> allowedCountries,
    String ipPolicyMode,
    String testIp,
    String testCountry
) {}
