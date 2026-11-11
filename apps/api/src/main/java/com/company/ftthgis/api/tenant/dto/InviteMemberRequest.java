package com.company.ftthgis.api.tenant.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record InviteMemberRequest(
    @NotBlank(message = "Email is required") 
    @Email(message = "Invalid email format") 
    String email,
    
    @JsonAlias({"role", "roleName"})
    String roleName,

    String fullName
) {
    public InviteMemberRequest(String email, String roleName) {
        this(email, roleName, null);
    }

    public String getEffectiveRoleName() {
        if (roleName != null && !roleName.isBlank()) {
            return roleName.trim();
        }
        return "viewer";
    }
}

