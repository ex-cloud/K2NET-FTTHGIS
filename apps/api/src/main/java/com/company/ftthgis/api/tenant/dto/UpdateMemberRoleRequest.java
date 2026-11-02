package com.company.ftthgis.api.tenant.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateMemberRoleRequest(
    @NotBlank(message = "Role name is required")
    String roleName
) {}

