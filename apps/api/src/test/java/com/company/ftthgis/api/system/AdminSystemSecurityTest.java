package com.company.ftthgis.api.system;

import org.junit.jupiter.api.Test;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class AdminSystemSecurityTest {

    @Test
    void githubWebhookEndpointIsExplicitlyAllowed() throws NoSuchMethodException {
        Method method = GithubWebhookController.class.getDeclaredMethod("handleWebhook", String.class, String.class, byte[].class);
        PreAuthorize annotation = AnnotationUtils.findAnnotation(method, PreAuthorize.class);
        assertNotNull(annotation, "GitHub webhook endpoint should declare explicit authorization metadata");
    }

    @Test
    void systemSettingsControllerIsProtectedAtClassLevel() {
        PreAuthorize annotation = AnnotationUtils.findAnnotation(SystemSettingController.class, PreAuthorize.class);
        assertNotNull(annotation, "System settings controller should be protected at class level");
    }
}
