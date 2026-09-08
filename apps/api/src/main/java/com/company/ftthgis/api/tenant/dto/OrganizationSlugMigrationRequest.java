package com.company.ftthgis.api.tenant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationSlugMigrationRequest {

    @NotBlank(message = "Target slug is required")
    @Size(min = 3, max = 40, message = "Slug must be between 3 and 40 characters")
    @Pattern(regexp = "^[a-z0-9]([a-z0-9-]*[a-z0-9])?$", message = "Slug must consist of lowercase alphanumeric characters and single hyphens")
    private String targetSlug;
}
