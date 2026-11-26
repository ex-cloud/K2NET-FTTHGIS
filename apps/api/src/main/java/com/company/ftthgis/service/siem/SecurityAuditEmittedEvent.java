package com.company.ftthgis.service.siem;

import java.util.Map;

/**
 * Spring ApplicationEvent published asynchronously whenever a security-relevant audit event
 * is recorded in Spring Boot, enabling zero-coupling fan-out to Enterprise SIEM streams.
 */
public record SecurityAuditEmittedEvent(
        String tenantSlug,
        String action,
        String severity,
        String actorId,
        String actorRole,
        String actorIp,
        String resourceType,
        String resourceId,
        Map<String, Object> metadata
) {
}
