package com.company.ftthgis.api.tenant.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationCreateRequest {
    // Organization Profile
    private String name;
    private String slug;
    private String description;
    private String address;
    private String website;
    private String plan;

    // LDAP Configuration (Optional)
    private boolean ldapEnabled;
    private String ldapUrl;
    private String ldapBaseDn;
    private String ldapBindDn;
    private String ldapBindPassword;

    // Admin Account Provisioning
    private String adminEmail;
    private String adminUsername;
    private String picName;
    private String picJobTitle;
    private String adminPhone;
    private String picPhone;
    private String timezone;

    public String getEffectivePhone() {
        if (adminPhone != null && !adminPhone.isBlank()) {
            return adminPhone.trim();
        }
        if (picPhone != null && !picPhone.isBlank()) {
            return picPhone.trim();
        }
        return null;
    }

    public String getEffectiveJobTitle() {
        if (picJobTitle != null && !picJobTitle.isBlank()) {
            return picJobTitle.trim();
        }
        return "NOC Lead / Technical Manager";
    }
}
