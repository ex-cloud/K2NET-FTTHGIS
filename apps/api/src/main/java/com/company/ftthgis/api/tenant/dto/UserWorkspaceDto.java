package com.company.ftthgis.api.tenant.dto;

import lombok.Builder;
import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record UserWorkspaceDto(
    UUID organizationId,
    String organizationName,
    String organizationSlug,
    String canonicalDomain,
    String roleName,
    String status,
    boolean isDefault,
    boolean isActiveContext,
    LocalDateTime joinedAt
) {}

