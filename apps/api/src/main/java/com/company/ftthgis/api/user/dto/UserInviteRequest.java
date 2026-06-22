package com.company.ftthgis.api.user.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class UserInviteRequest {
    private String fullName;
    private String email;
    private Long globalRoleId; // Maps to Organization Role
    private String creationMode; // "INVITE" (default) or "DIRECT"
    private String customPassword; // Used when creationMode is "DIRECT"
    private List<ProjectRoleAssignment> projectRoles; // Optional assignments

    @Data
    public static class ProjectRoleAssignment {
        private UUID projectId;
        private Long roleId;
    }
}
