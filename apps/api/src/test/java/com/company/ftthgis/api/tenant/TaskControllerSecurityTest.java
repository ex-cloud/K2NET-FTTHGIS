package com.company.ftthgis.api.tenant;

import com.company.ftthgis.domain.task.controller.TaskController;
import com.company.ftthgis.domain.task.dto.CreateCommentRequest;
import com.company.ftthgis.domain.task.dto.CreateTaskRequest;
import com.company.ftthgis.domain.task.dto.UpdateTaskRequest;
import com.company.ftthgis.domain.task.service.TaskService;
import org.junit.jupiter.api.Test;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.jwt.Jwt;

import java.lang.reflect.Method;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class TaskControllerSecurityTest {

    @Test
    void listEndpointIsProtected() throws NoSuchMethodException {
        // list() now accepts: Jwt, int page, int size, String sort, Sort.Direction, String scope
        Method method = TaskController.class.getDeclaredMethod(
                "list",
                Jwt.class,
                int.class,
                int.class,
                String.class,
                org.springframework.data.domain.Sort.Direction.class,
                String.class  // scope filter added in Phase 5
        );
        PreAuthorize annotation = AnnotationUtils.findAnnotation(method, PreAuthorize.class);
        assertNotNull(annotation, "List endpoint should require authorization");
        assertEquals("isAuthenticated()", annotation.value());
    }

    @Test
    void createEndpointIsProtected() throws NoSuchMethodException {
        Method method = TaskController.class.getDeclaredMethod("create", Jwt.class, CreateTaskRequest.class);
        PreAuthorize annotation = AnnotationUtils.findAnnotation(method, PreAuthorize.class);
        assertNotNull(annotation, "Create endpoint should require authorization");
        assertEquals("isAuthenticated()", annotation.value());
    }

    @Test
    void deleteEndpointIsProtected() throws NoSuchMethodException {
        Method method = TaskController.class.getDeclaredMethod("delete", Jwt.class, UUID.class);
        PreAuthorize annotation = AnnotationUtils.findAnnotation(method, PreAuthorize.class);
        assertNotNull(annotation, "Delete endpoint should require authorization");
        assertEquals("isAuthenticated()", annotation.value());
    }

    @Test
    void addCommentEndpointIsProtected() throws NoSuchMethodException {
        Method method = TaskController.class.getDeclaredMethod("addComment", Jwt.class, UUID.class, CreateCommentRequest.class);
        PreAuthorize annotation = AnnotationUtils.findAnnotation(method, PreAuthorize.class);
        assertNotNull(annotation, "Add comment endpoint should require authorization");
        assertEquals("isAuthenticated()", annotation.value());
    }

    @Test
    void geojsonEndpointIsProtected() throws NoSuchMethodException {
        Method method = TaskController.class.getDeclaredMethod("getGeoJson", Jwt.class);
        PreAuthorize annotation = AnnotationUtils.findAnnotation(method, PreAuthorize.class);
        assertNotNull(annotation, "GeoJSON endpoint should require authorization");
        assertEquals("isAuthenticated()", annotation.value());
    }
}
