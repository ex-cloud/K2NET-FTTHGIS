package com.company.ftthgis.api.tenant.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.UUID;

public record InviteMemberRequest(
    @NotBlank(message = "Email is required") 
    @Email(message = "Invalid email format") 
    String email,
    
    @JsonAlias({"role", "roleName"})
    String roleName,

    String fullName,

    String phone,

    String jobTitle,

    @JsonAlias({"roleId", "globalRoleId"})
    Long globalRoleId,

    String creationMode,

    String customPassword,

    UUID projectId,

    List<ProjectRoleAssignment> projectRoles
) {
    public record ProjectRoleAssignment(UUID projectId, Long roleId) {}

    public InviteMemberRequest(String email, String roleName) {
        this(email, roleName, null, null, null, null, "INVITE", null, null, null);
    }

    public InviteMemberRequest(String email, String roleName, String fullName) {
        this(email, roleName, fullName, null, null, null, "INVITE", null, null, null);
    }

    public String getEffectiveRoleName() {
        if (roleName != null && !roleName.isBlank()) {
            return roleName.trim();
        }
        return "viewer";
    }
}

