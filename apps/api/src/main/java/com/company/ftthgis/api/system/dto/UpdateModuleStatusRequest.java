package com.company.ftthgis.api.system.dto;

import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateModuleStatusRequest {

    @Pattern(regexp = "ACTIVE|IN_DEVELOPMENT|MAINTENANCE|DEPRECATED|DISABLED", message = "Status must be ACTIVE, IN_DEVELOPMENT, MAINTENANCE, DEPRECATED, or DISABLED")
    private String status;

    private Boolean isEnabled;

    @Pattern(regexp = "FREE|STARTER|PRO|ENTERPRISE", message = "minPlanTier must be FREE, STARTER, PRO, or ENTERPRISE")
    private String minPlanTier;

    private String serviceTarget;
}
