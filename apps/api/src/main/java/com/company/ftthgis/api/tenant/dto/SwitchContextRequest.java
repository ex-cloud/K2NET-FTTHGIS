package com.company.ftthgis.api.tenant.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record SwitchContextRequest(
    @NotNull(message = "Target organization ID is required")
    UUID targetOrganizationId
) {}

