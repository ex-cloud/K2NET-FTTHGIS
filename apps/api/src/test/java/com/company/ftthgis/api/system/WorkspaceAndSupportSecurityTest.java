package com.company.ftthgis.api.system;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WorkspaceAndSupportSecurityTest {

    @Test
    @DisplayName("🛡️ WorkspaceController: All endpoints must be secured with platform.* or system.task.manage")
    void testWorkspaceControllerSecurityAnnotations() {
        for (Method method : WorkspaceController.class.getDeclaredMethods()) {
            if (java.lang.reflect.Modifier.isPublic(method.getModifiers())) {
                PreAuthorize preAuth = AnnotationUtils.findAnnotation(method, PreAuthorize.class);
                assertNotNull(preAuth, "Public endpoint " + method.getName() + " in WorkspaceController must have @PreAuthorize");
                assertTrue(
                        preAuth.value().contains("platform.projects") ||
                        preAuth.value().contains("platform.issues") ||
                        preAuth.value().contains("system.task.manage"),
                        "Method " + method.getName() + " has invalid PreAuthorize: " + preAuth.value()
                );
            }
        }
    }

    @Test
    @DisplayName("🛡️ SupportTicketController: All endpoints must be secured with support.tickets.* or system.task.manage")
    void testSupportTicketControllerSecurityAnnotations() {
        for (Method method : SupportTicketController.class.getDeclaredMethods()) {
            if (java.lang.reflect.Modifier.isPublic(method.getModifiers())) {
                PreAuthorize preAuth = AnnotationUtils.findAnnotation(method, PreAuthorize.class);
                assertNotNull(preAuth, "Public endpoint " + method.getName() + " in SupportTicketController must have @PreAuthorize");
                assertTrue(
                        preAuth.value().contains("support.tickets") ||
                        preAuth.value().contains("system.task.manage"),
                        "Method " + method.getName() + " has invalid PreAuthorize: " + preAuth.value()
                );
            }
        }
    }
}
