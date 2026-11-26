package com.company.ftthgis.config.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * SpEL security helper verifying that the SCIM bearer token matches the {orgSlug} path parameter.
 */
@Component("scimSecurity")
public class ScimSecurity {

    public boolean matchesTenant(String orgSlug) {
        if (orgSlug == null || orgSlug.isBlank()) {
            return false;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        if (auth.getPrincipal() instanceof ScimPrincipal principal) {
            return principal.organizationSlug() != null
                    && principal.organizationSlug().equalsIgnoreCase(orgSlug.trim());
        }
        return false;
    }
}
