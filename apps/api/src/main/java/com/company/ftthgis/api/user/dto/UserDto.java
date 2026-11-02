package com.company.ftthgis.api.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private UUID id;
    private String email;
    private String secondaryEmail;
    private String username;
    private String fullName;
    private String phone;
    private String jobTitle;
    private LocalDateTime lastLoginAt;
    private String lastLoginIp;
    private boolean mfaEnabled;
    private String timezone;
    private String locale;
    private String avatarUrl;
    private String status;
    private String roleName;
    private String roleDisplayName;
    private String organizationName;
    private UUID organizationId;
    private String organizationSlug;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ProjectRoleDto> projectRoles;
    private List<String> permissions;
    private List<UserMembershipDto> memberships;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserMembershipDto {
        private UUID organizationId;
        private String organizationName;
        private String organizationSlug;
        private String roleName;
        private String status;
        private boolean isDefault;
        private LocalDateTime joinedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectRoleDto {
        private UUID projectId;
        private String projectName;
        private String roleName;
        private String roleDisplayName;
    }
}
