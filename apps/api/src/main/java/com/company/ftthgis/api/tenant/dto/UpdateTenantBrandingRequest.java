package com.company.ftthgis.api.tenant.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTenantBrandingRequest {

    @Size(max = 255, message = "Domain cannot exceed 255 characters")
    private String customDomain;

    @Size(max = 128, message = "App title cannot exceed 128 characters")
    private String appTitle;

    @Size(max = 128, message = "Company name cannot exceed 128 characters")
    private String companyName;

    private String logoUrl;

    private String faviconUrl;

    @Size(max = 32, message = "Color code cannot exceed 32 characters")
    private String brandColorPrimary;

    @Size(max = 32, message = "Accent color code cannot exceed 32 characters")
    private String brandColorAccent;

    @Size(max = 255, message = "Footer text cannot exceed 255 characters")
    private String footerText;

    @Size(max = 255, message = "Support email cannot exceed 255 characters")
    private String supportEmail;

    @Size(max = 64, message = "Support phone cannot exceed 64 characters")
    private String supportPhone;
}
