package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantBrandingDto {
    private UUID id;
    private UUID organizationId;
    private String organizationSlug;
    private String customDomain;
    private String domainStatus; // PENDING_DNS, ACTIVE, FAILED
    private String cnameTarget;
    private String verificationToken;
    private LocalDateTime verifiedAt;
    private String sslStatus; // PENDING, ISSUED, FAILED
    private LocalDateTime sslIssuedAt;
    private String appTitle;
    private String companyName;
    private String logoUrl;
    private String faviconUrl;
    private String brandColorPrimary;
    private String brandColorAccent;
    private String footerText;
    private String supportEmail;
    private String supportPhone;

    @com.fasterxml.jackson.annotation.JsonProperty("isWhitelabelAllowed")
    private boolean isWhitelabelAllowed;

    @com.fasterxml.jackson.annotation.JsonProperty("isWhitelabelAllowed")
    public boolean isWhitelabelAllowed() {
        return isWhitelabelAllowed;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("whitelabelAllowed")
    public boolean getWhitelabelAllowed() {
        return isWhitelabelAllowed;
    }

    private String dnsInstructions;
}
