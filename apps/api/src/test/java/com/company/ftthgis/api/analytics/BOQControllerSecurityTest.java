package com.company.ftthgis.api.analytics;

import com.company.ftthgis.domain.analytics.controller.AnalyticsController;
import org.junit.jupiter.api.Test;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class BOQControllerSecurityTest {

    @Test
    void boqEndpointRequiresAuthorization() throws NoSuchMethodException {
        Method method = BOQController.class.getDeclaredMethod("getProjectBOQ", UUID.class);
        PreAuthorize annotation = AnnotationUtils.findAnnotation(method, PreAuthorize.class);

        assertNotNull(annotation, "BOQ endpoint should be protected with @PreAuthorize");
    }

    @Test
    void analyticsEndpointsRequireAuthorization() throws NoSuchMethodException {
        Method summaryMethod = AnalyticsController.class.getDeclaredMethod("getDashboardStats", UUID.class);
        Method historyMethod = AnalyticsController.class.getDeclaredMethod("getSnapshotHistory", java.time.LocalDateTime.class, java.time.LocalDateTime.class, UUID.class);
        Method eventsMethod = AnalyticsController.class.getDeclaredMethod("getEventHistory", java.time.LocalDateTime.class, java.time.LocalDateTime.class, UUID.class);

        assertNotNull(AnnotationUtils.findAnnotation(summaryMethod, PreAuthorize.class));
        assertNotNull(AnnotationUtils.findAnnotation(historyMethod, PreAuthorize.class));
        assertNotNull(AnnotationUtils.findAnnotation(eventsMethod, PreAuthorize.class));
    }
}
