package com.company.ftthgis.api.rbac;

import com.company.ftthgis.api.file.FileController;
import com.company.ftthgis.api.network.NetworkAssetController;
import com.company.ftthgis.api.tenant.ProjectController;
import com.company.ftthgis.api.user.UserController;
import com.company.ftthgis.domain.analytics.controller.AnalyticsController;
import org.junit.jupiter.api.Test;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class RbacSecurityAnnotationTest {

    @Test
    void analyticsEndpointHasPreAuthorizeGuard() throws NoSuchMethodException {
        Method method = AnalyticsController.class.getDeclaredMethod("getDashboardStats", UUID.class);
        PreAuthorize auth = AnnotationUtils.findAnnotation(method, PreAuthorize.class);
        assertNotNull(auth, "Analytics endpoint must have @PreAuthorize guard");
    }

    @Test
    void fileUploadEndpointHasPreAuthorizeGuard() throws NoSuchMethodException {
        Method method = FileController.class.getDeclaredMethod("uploadFile", org.springframework.web.multipart.MultipartFile.class, String.class, String.class);
        PreAuthorize auth = AnnotationUtils.findAnnotation(method, PreAuthorize.class);
        assertNotNull(auth, "File upload endpoint must have @PreAuthorize guard");
    }

    @Test
    void fileControllerHasClassLevelPreAuthorize() {
        PreAuthorize auth = AnnotationUtils.findAnnotation(FileController.class, PreAuthorize.class);
        assertNotNull(auth, "FileController must have class-level @PreAuthorize guard");
    }

    @Test
    void userListEndpointHasPreAuthorizeGuard() throws NoSuchMethodException {
        Method method = UserController.class.getDeclaredMethod("index", org.springframework.data.domain.Pageable.class, String.class, String.class, String.class, String.class);
        PreAuthorize auth = AnnotationUtils.findAnnotation(method, PreAuthorize.class);
        assertNotNull(auth, "User list endpoint must have @PreAuthorize guard");
    }

    @Test
    void networkAssetDeleteEndpointHasPreAuthorizeGuard() throws NoSuchMethodException {
        Method method = NetworkAssetController.class.getDeclaredMethod("batchDelete", String.class, String.class, java.util.List.class);
        PreAuthorize auth = AnnotationUtils.findAnnotation(method, PreAuthorize.class);
        assertNotNull(auth, "Network batch delete endpoint must have @PreAuthorize guard");
    }
}
