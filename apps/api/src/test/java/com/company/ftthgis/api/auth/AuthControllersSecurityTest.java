package com.company.ftthgis.api.auth;

import com.company.ftthgis.controller.auth.AuthController;
import org.junit.jupiter.api.Test;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class AuthControllersSecurityTest {

    @Test
    void authPasswordVerificationEndpointRequiresAuthentication() throws NoSuchMethodException {
        Method method = AuthController.class.getDeclaredMethod("verifyPassword", org.springframework.security.oauth2.jwt.Jwt.class, java.util.Map.class);
        PreAuthorize annotation = AnnotationUtils.findAnnotation(method, PreAuthorize.class);
        assertNotNull(annotation, "Password verification endpoint should require authentication");
    }

    @Test
    void oauthGateControllerHasExplicitSecurityMetadata() throws NoSuchMethodException {
        Method checkMethod = OAuthGateController.class.getDeclaredMethod("checkAndGate", String.class, java.util.Map.class);
        Method suspensionMethod = OAuthGateController.class.getDeclaredMethod("checkSuspension", String.class, String.class, String.class, jakarta.servlet.http.HttpServletRequest.class);

        assertNotNull(AnnotationUtils.findAnnotation(checkMethod, PreAuthorize.class));
        assertNotNull(AnnotationUtils.findAnnotation(suspensionMethod, PreAuthorize.class));
    }
}
