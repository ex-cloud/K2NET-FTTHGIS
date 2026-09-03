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

    private static final ThreadLocal<ImpersonationInfo> currentImpersonation = new ThreadLocal<>();

    public static void setImpersonation(UUID sessionId, UUID realActorId, UUID targetTenantId, String targetTenantSlug) {
        currentImpersonation.set(new ImpersonationInfo(sessionId, realActorId, targetTenantId, targetTenantSlug));
    }

    public static ImpersonationInfo getImpersonation() {
        return currentImpersonation.get();
    }

    public static boolean isImpersonating() {
        return currentImpersonation.get() != null;
    }

    public static void clear() {
        currentImpersonation.remove();
    }
}
