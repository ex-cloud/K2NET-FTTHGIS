package com.company.ftthgis.api.file;

import org.junit.jupiter.api.Test;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class FileControllerSecurityTest {

    @Test
    void uploadEndpointRequiresAuthentication() throws NoSuchMethodException {
        Method method = FileController.class.getDeclaredMethod("uploadFile", org.springframework.web.multipart.MultipartFile.class, String.class, String.class);
        PreAuthorize annotation = AnnotationUtils.findAnnotation(method, PreAuthorize.class);
        assertNotNull(annotation, "Upload endpoint should be protected with @PreAuthorize");
    }
}
