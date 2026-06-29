package com.company.ftthgis.api.user;

import org.junit.jupiter.api.Test;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class UserRoleSecurityTest {

    @Test
    void userListingEndpointIsProtected() throws NoSuchMethodException {
        Method method = UserController.class.getDeclaredMethod("index", org.springframework.data.domain.Pageable.class, String.class, String.class, String.class, String.class);
        PreAuthorize annotation = AnnotationUtils.findAnnotation(method, PreAuthorize.class);
        assertNotNull(annotation, "User listing endpoint should require authorization");
    }

    @Test
    void statsEndpointIsProtected() throws NoSuchMethodException {
        Method method = UserController.class.getDeclaredMethod("getStats");
        PreAuthorize annotation = AnnotationUtils.findAnnotation(method, PreAuthorize.class);
        assertNotNull(annotation, "User stats endpoint should require authorization");
    }
}
