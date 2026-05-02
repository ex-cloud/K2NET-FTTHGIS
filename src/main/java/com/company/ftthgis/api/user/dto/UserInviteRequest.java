package com.company.ftthgis.api.user.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class UserInviteRequest {
    private String fullName;
    private String email;
    private Long globalRoleId; // Maps to Organization Role
    private List<ProjectRoleAssignment> projectRoles; // Optional assignments

    @Data
    public static class ProjectRoleAssignment {
        private UUID projectId;
        private Long roleId;
    }
}
