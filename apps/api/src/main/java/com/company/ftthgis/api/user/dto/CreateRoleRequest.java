package com.company.ftthgis.api.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoleRequest {

    @NotBlank(message = "Role name is required")
    @Pattern(regexp = "^[a-zA-Z0-9_ -]{2,50}$", message = "Role name must be between 2 and 50 characters")
    private String name;

    private String displayName;

    private String description;

    @Pattern(regexp = "^(SYSTEM|TENANT)$", message = "Scope must be SYSTEM or TENANT")
    private String scope;

    private List<Long> permissionIds;
}

