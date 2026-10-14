package com.company.ftthgis.config.tenant;

import java.util.UUID;

public class OrganizationContext {
    private static final ThreadLocal<UUID> currentOrgId = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> filterBypassed = ThreadLocal.withInitial(() -> Boolean.FALSE);

    public static void setOrganizationId(UUID orgId) {
        currentOrgId.set(orgId);
    }

    public static UUID getOrganizationId() {
        return currentOrgId.get();
    }

    public static void setFilterBypassed(boolean bypass) {
        filterBypassed.set(bypass);
    }

    public static boolean isFilterBypassed() {
        return Boolean.TRUE.equals(filterBypassed.get());
    }

    public static void clear() {
        currentOrgId.remove();
        filterBypassed.remove();
    }
}
