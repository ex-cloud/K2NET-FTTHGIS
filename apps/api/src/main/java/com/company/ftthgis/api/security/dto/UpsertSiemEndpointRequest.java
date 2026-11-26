package com.company.ftthgis.api.security.dto;

import com.company.ftthgis.domain.tenant.entity.SiemTargetFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpsertSiemEndpointRequest {

    @NotBlank(message = "Endpoint name is required")
    @Size(max = 120, message = "Endpoint name max 120 characters")
    private String name;

    @NotBlank(message = "Target URL is required")
    @Size(max = 1024, message = "Target URL max 1024 characters")
    private String targetUrl;

    @NotNull(message = "Target format is required")
    @Builder.Default
    private SiemTargetFormat targetFormat = SiemTargetFormat.GENERIC_JSON;

    private List<String> eventCategories;

    @Pattern(regexp = "^(INFO|WARNING|CRITICAL)$", message = "minSeverity must be INFO, WARNING, or CRITICAL")
    @Builder.Default
    private String minSeverity = "WARNING";

    @Size(max = 64, message = "Custom auth header name max 64 characters")
    private String customAuthHeaderName;

    @Size(max = 2048, message = "Custom auth header value max 2048 characters")
    private String customAuthHeaderValue;

    private Boolean clearCustomAuthHeader;

    private Boolean isActive;
}
