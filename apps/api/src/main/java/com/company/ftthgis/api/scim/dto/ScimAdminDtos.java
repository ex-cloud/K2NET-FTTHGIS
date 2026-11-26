package com.company.ftthgis.api.scim.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public final class ScimAdminDtos {

    private ScimAdminDtos() {
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScimSummaryResponse {
        private String organizationSlug;
        private String scimBaseUrl;
        private long activeTokensCount;
        private long scimManagedUsersCount;
        private long syncedGroupsCount;
        private List<ScimTokenDto> tokens;
        private List<ScimGroupMappingDto> groups;
        private List<ScimRoleOptionDto> availableRoles;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScimTokenDto {
        private UUID id;
        private String name;
        private String tokenPrefix;
        private String maskedToken;
        private boolean active;
        private OffsetDateTime expiresAt;
        private OffsetDateTime lastUsedAt;
        private String lastUsedIp;
        private OffsetDateTime revokedAt;
        private String revokedBy;
        private String createdAt;
        private String createdBy;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateScimTokenRequest {
        private String name;
        private Integer expirationDays;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateScimTokenResponse {
        private ScimTokenDto token;
        private String plainTextToken;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScimGroupMappingDto {
        private UUID id;
        private String displayName;
        private String externalId;
        private Long mappedRoleId;
        private String mappedRoleName;
        private String mappedRoleDisplayName;
        private long memberCount;
        private String updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateScimGroupRoleMappingRequest {
        private String roleName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScimRoleOptionDto {
        private Long id;
        private String name;
        private String displayName;
        private String code;
    }
}
