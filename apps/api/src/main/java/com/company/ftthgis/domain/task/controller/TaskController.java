package com.company.ftthgis.domain.task.controller;

import com.company.ftthgis.domain.task.dto.*;
import com.company.ftthgis.domain.task.entity.Task;
import com.company.ftthgis.domain.task.entity.TaskComment;
import com.company.ftthgis.domain.task.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for Task Management endpoints.
 *
 * <h3>Authorization</h3>
 * <ul>
 *   <li>All read and write endpoints require {@code isAuthenticated()} (Keycloak JWT)</li>
 *   <li>DELETE is restricted to {@code ROLE_SUPER_ADMIN} only</li>
 * </ul>
 *
 * <h3>Multi-tenancy</h3>
 * The controller activates the Hibernate organization filter for non-super-admin
 * callers before delegating to TaskService, ensuring data isolation per tenant.
 */
@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    // ─── List tasks (paginated) ─────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<Task>> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction
    ) {
        applyTenantFilter(jwt);
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sort));
        return ResponseEntity.ok(taskService.findAll(pageable));
    }

    @GetMapping("/geojson")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getGeoJson(@AuthenticationPrincipal Jwt jwt) {
        applyTenantFilter(jwt);
        java.util.List<Task> tasks = taskService.findAllWithLocation();

        java.util.List<Map<String, Object>> features = tasks.stream().map(task -> {
            Map<String, Object> feature = new java.util.HashMap<>();
            feature.put("type", "Feature");
            feature.put("geometry", task.getLocationGeom());

            Map<String, Object> props = new java.util.HashMap<>();
            props.put("id", task.getId());
            props.put("type", task.getType());
            props.put("status", task.getStatus());
            props.put("priority", task.getPriority());
            props.put("title", task.getTitle());
            props.put("description", task.getDescription());
            props.put("assigneeId", task.getAssigneeId());
            props.put("referenceType", task.getReferenceType());
            props.put("referenceId", task.getReferenceId());
            props.put("obsidianRef", task.getObsidianRef());
            props.put("dueDate", task.getDueDate());
            feature.put("properties", props);

            return feature;
        }).collect(java.util.stream.Collectors.toList());

        Map<String, Object> geoJson = new java.util.HashMap<>();
        geoJson.put("type", "FeatureCollection");
        geoJson.put("features", features);

        return ResponseEntity.ok(geoJson);
    }

    // ─── Get single task ────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Task> getById(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id
    ) {
        applyTenantFilter(jwt);
        return ResponseEntity.ok(taskService.findById(id));
    }

    // ─── Overview KPI summary ───────────────────────────────────────────────────

    @GetMapping("/summary")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TaskSummaryDTO> summary(@AuthenticationPrincipal Jwt jwt) {
        applyTenantFilter(jwt);
        return ResponseEntity.ok(taskService.getSummary());
    }

    // ─── Create task ────────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Task> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateTaskRequest request
    ) {
        String reporterId = jwt.getSubject();
        UUID orgId = extractOrgId(jwt);
        applyTenantFilter(jwt);
        Task created = taskService.create(request, reporterId, orgId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ─── Update task ────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Task> update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @RequestBody UpdateTaskRequest request
    ) {
        applyTenantFilter(jwt);
        return ResponseEntity.ok(taskService.update(id, request));
    }

    // ─── Assign task ────────────────────────────────────────────────────────────

    @PutMapping("/{id}/assign")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Task> assign(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @RequestParam String assigneeId
    ) {
        applyTenantFilter(jwt);
        return ResponseEntity.ok(taskService.assignTask(id, assigneeId));
    }

    // ─── Resolve task ───────────────────────────────────────────────────────────

    @PutMapping("/{id}/resolve")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Task> resolve(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id
    ) {
        applyTenantFilter(jwt);
        return ResponseEntity.ok(taskService.resolveTask(id));
    }

    // ─── Delete task (Super Admin only) ────────────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_SUPER_ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id
    ) {
        taskService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Add comment ────────────────────────────────────────────────────────────

    @PostMapping("/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TaskComment> addComment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody CreateCommentRequest request
    ) {
        applyTenantFilter(jwt);
        String authorId = jwt.getSubject();
        TaskComment comment = taskService.addComment(id, request, authorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    // ─── Private helpers ────────────────────────────────────────────────────────

    /**
     * Enable or disable the Hibernate tenant filter based on the caller's JWT roles.
     * Super Admin: filter disabled (sees all tenants).
     * Everyone else: filter enabled with their organization ID.
     */
    private void applyTenantFilter(Jwt jwt) {
        List<String> roles = jwt.getClaimAsStringList("roles");
        boolean isSuperAdmin = roles != null && (
                roles.contains("super_admin") || roles.contains("ROLE_SUPER_ADMIN")
        );

        if (isSuperAdmin) {
            taskService.disableOrgFilter();
        } else {
            String orgId = jwt.getClaim("organization_id");
            if (orgId != null) {
                taskService.enableOrgFilter(orgId);
            }
        }
    }

    /**
     * Extract organization UUID from JWT claims.
     * Kong injects this from the Keycloak token payload.
     */
    private UUID extractOrgId(Jwt jwt) {
        String orgId = jwt.getClaim("organization_id");
        if (orgId == null) {
            List<String> roles = jwt.getClaimAsStringList("roles");
            boolean isSuperAdmin = roles != null && (
                    roles.contains("super_admin") || roles.contains("ROLE_SUPER_ADMIN")
            );
            if (isSuperAdmin) {
                // Default fallback to Main Organization for Super Admin platform actions
                return UUID.fromString("00000000-0000-0000-0000-000000000001");
            }
            throw new IllegalStateException("organization_id tidak ditemukan di JWT");
        }
        return UUID.fromString(orgId);
    }
}
