package com.company.ftthgis.config.tenant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

public class AuditContext {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ImpersonationInfo {
        private UUID sessionId;
        private UUID realActorId;
        private UUID targetTenantId;
        private String targetTenantSlug;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResourceSnapshot {
        private String resourceName;
        private String resourceId;
        private String projectName;
        private UUID projectId;
        private String tenantName;
        private String tenantSlug;
        private String scope;
    }

    private static final ThreadLocal<ImpersonationInfo> currentImpersonation = new ThreadLocal<>();
    private static final ThreadLocal<ResourceSnapshot> currentResource = new ThreadLocal<>();

    // ── Impersonation ────────────────────────────────────────────────────────
    public static void setImpersonation(UUID sessionId, UUID realActorId, UUID targetTenantId, String targetTenantSlug) {
        currentImpersonation.set(new ImpersonationInfo(sessionId, realActorId, targetTenantId, targetTenantSlug));
    }

    public static ImpersonationInfo getImpersonation() {
        return currentImpersonation.get();
    }

    public static boolean isImpersonating() {
        return currentImpersonation.get() != null;
    }

    // ── Resource Snapshot ───────────────────────────────────────────────────
    public static void setResource(String resourceName, String resourceId) {
        ResourceSnapshot current = currentResource.get();
        if (current == null) {
            current = new ResourceSnapshot();
            currentResource.set(current);
        }
        current.setResourceName(resourceName);
        current.setResourceId(resourceId);
    }

    public static void setProject(String projectName, UUID projectId) {
        ResourceSnapshot current = currentResource.get();
        if (current == null) {
            current = new ResourceSnapshot();
            currentResource.set(current);
        }
        current.setProjectName(projectName);
        current.setProjectId(projectId);
    }

    public static void setTenant(String tenantName, String tenantSlug) {
        ResourceSnapshot current = currentResource.get();
        if (current == null) {
            current = new ResourceSnapshot();
            currentResource.set(current);
        }
        current.setTenantName(tenantName);
        current.setTenantSlug(tenantSlug);
    }

    public static void setScope(String scope) {
        ResourceSnapshot current = currentResource.get();
        if (current == null) {
            current = new ResourceSnapshot();
            currentResource.set(current);
        }
        current.setScope(scope);
    }

    public static ResourceSnapshot getResource() {
        return currentResource.get();
    }

    public static void clear() {
        currentImpersonation.remove();
        currentResource.remove();
    }
}
