package com.company.ftthgis.api.tenant.dto;

import lombok.Builder;
import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record OrganizationMemberDto(
    UUID id,
    UUID userId,
    String email,
    String username,
    String fullName,
    String avatarUrl,
    UUID organizationId,
    String organizationName,
    String organizationSlug,
    String roleName,
    String status,
    boolean isDefault,
    LocalDateTime joinedAt,
    LocalDateTime createdAt
) {}

