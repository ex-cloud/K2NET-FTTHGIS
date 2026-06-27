package com.company.ftthgis.config.tenant;

import java.util.UUID;

public class OrganizationContext {
    private static final ThreadLocal<UUID> currentOrgId = new ThreadLocal<>();

    public static void setOrganizationId(UUID orgId) {
        currentOrgId.set(orgId);
    }

    public static UUID getOrganizationId() {
        return currentOrgId.get();
    }

    public static void clear() {
        currentOrgId.remove();
    }
}
