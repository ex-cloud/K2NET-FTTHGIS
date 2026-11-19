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
    String phone,
    String jobTitle,
    String avatarUrl,
    UUID organizationId,
    String organizationName,
    String organizationSlug,
    Long roleId,
    String roleName,
    String roleDisplayName,
    String roleCode,
    String status,
    Boolean emailVerified,
    boolean mfaEnabled,
    LocalDateTime lastLoginAt,
    String lastLoginIp,
    boolean isDefault,
    LocalDateTime joinedAt,
    LocalDateTime createdAt
) {}

