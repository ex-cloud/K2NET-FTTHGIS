package com.company.ftthgis.api.tenant.dto;

import lombok.Builder;
import java.util.UUID;

@Builder
public record SwitchContextResponse(
    UUID organizationId,
    String organizationName,
    String organizationSlug,
    String canonicalDomain,
    String roleName,
    String redirectUrl
) {}

