package com.company.ftthgis.api.controller;

import com.company.ftthgis.api.analytics.BOQController;
import com.company.ftthgis.api.file.FileController;
import com.company.ftthgis.api.system.GithubWebhookController;
import com.company.ftthgis.api.tenant.OrganizationAnalyticsController;
import com.company.ftthgis.api.user.UserController;
import com.company.ftthgis.domain.analytics.controller.AnalyticsController;
import org.junit.jupiter.api.Test;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class ControllerSecurityCoverageTest {

    @Test
    void coreControllersExposeAuthorizationAnnotations() throws NoSuchMethodException {
        assertNotNull(AnnotationUtils.findAnnotation(FileController.class, PreAuthorize.class));

        Method uploadMethod = FileController.class.getDeclaredMethod("uploadFile", org.springframework.web.multipart.MultipartFile.class, String.class, String.class);
        assertNotNull(AnnotationUtils.findAnnotation(uploadMethod, PreAuthorize.class));

        Method boqMethod = BOQController.class.getDeclaredMethod("getProjectBOQ", java.util.UUID.class);
        assertNotNull(AnnotationUtils.findAnnotation(boqMethod, PreAuthorize.class));

        Method analyticsMethod = AnalyticsController.class.getDeclaredMethod("getDashboardStats", java.util.UUID.class);
        assertNotNull(AnnotationUtils.findAnnotation(analyticsMethod, PreAuthorize.class));

        Method orgAnalyticsMethod = OrganizationAnalyticsController.class.getDeclaredMethod("getSummary", String.class);
        assertNotNull(AnnotationUtils.findAnnotation(orgAnalyticsMethod, PreAuthorize.class));

        Method userIndexMethod = UserController.class.getDeclaredMethod("index", org.springframework.data.domain.Pageable.class, String.class, String.class, String.class, String.class);
        assertNotNull(AnnotationUtils.findAnnotation(userIndexMethod, PreAuthorize.class));

        Method webhookMethod = GithubWebhookController.class.getDeclaredMethod("handleWebhook", String.class, String.class, byte[].class);
        assertNotNull(AnnotationUtils.findAnnotation(webhookMethod, PreAuthorize.class));
    }
}
