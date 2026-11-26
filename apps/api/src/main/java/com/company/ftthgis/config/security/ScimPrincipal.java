package com.company.ftthgis.config.security;

import java.util.UUID;

/**
 * Authenticated SCIM 2.0 machine client principal bound strictly to a single tenant organization.
 */
public record ScimPrincipal(
        UUID tokenId,
        UUID organizationId,
        String organizationSlug,
        String tokenName
) {
}
