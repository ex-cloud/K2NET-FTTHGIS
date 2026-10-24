package com.company.ftthgis.api.system;

import com.company.ftthgis.domain.task.dto.CreateCommentRequest;
import com.company.ftthgis.domain.task.dto.CreateTaskRequest;
import com.company.ftthgis.domain.task.dto.TaskSummaryDTO;
import com.company.ftthgis.domain.task.dto.UpdateTaskRequest;
import com.company.ftthgis.domain.task.entity.Task;
import com.company.ftthgis.domain.task.entity.TaskComment;
import com.company.ftthgis.domain.task.entity.TaskScope;
import com.company.ftthgis.domain.task.entity.TaskType;
import com.company.ftthgis.domain.task.service.TaskService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.util.UUID;

/**
 * <h1>WorkspaceController</h1>
 * <p>
 * REST Controller untuk Platform Workspace: Ruang kerja perencanaan internal tim platform
 * (gaya Notion + Linear) yang menaungi Projects & Specs serta Engineering Issues.
 * </p>
 *
 * <h3>Domain Isolation & Security</h3>
 * <ul>
 *   <li>Seluruh data terkunci otomatis pada {@code scope = PLATFORM_INTERNAL}.</li>
 *   <li>Dilindungi oleh permission granular {@code platform.projects.*} dan {@code platform.issues.*}.</li>
 * </ul>
 *
 * @author FTTH GIS Core Team
 * @version 3.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/system/workspace")
@RequiredArgsConstructor
public class WorkspaceController {

    private static final String PLATFORM_ORG_SENTINEL_ID = "00000000-0000-0000-0000-000000000001";
    private final TaskService taskService;

    // =========================================================================
    // ── 1. PROJECTS & SPECS (/api/v1/system/workspace/projects) ───────────────
    // =========================================================================

    /**
     * Mengambil daftar seluruh proyek internal platform (inisiatif & master specs).
     */
    @GetMapping("/projects")
    @PreAuthorize("hasAuthority('platform.projects.view') or hasAuthority('system.task.manage')")
    public ResponseEntity<Page<Task>> listProjects(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sort));
        return ResponseEntity.ok(taskService.findProjects(pageable));
    }

    /**
     * Membuat proyek internal baru.
     */
    @PostMapping("/projects")
    @PreAuthorize("hasAuthority('platform.projects.manage') or hasAuthority('system.task.manage')")
    public ResponseEntity<Task> createProject(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateTaskRequest request
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        // Paksa type PROJECT dan scope PLATFORM_INTERNAL
        CreateTaskRequest projectRequest = new CreateTaskRequest(
                TaskType.PROJECT,
                request.title(),
                request.description(),
                request.priority(),
                request.assigneeId(),
                request.referenceType(),
                request.referenceId(),
                request.parentTaskId(),
                request.obsidianRef(),
                request.dueDate(),
                request.coordinates(),
                TaskScope.PLATFORM_INTERNAL
        );
        Task created = taskService.create(projectRequest, jwt.getSubject(), UUID.fromString(PLATFORM_ORG_SENTINEL_ID), true);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Mengambil detail proyek spesifik berdasarkan ID.
     */
    @GetMapping("/projects/{projectId}")
    @PreAuthorize("hasAuthority('platform.projects.view') or hasAuthority('system.task.manage')")
    public ResponseEntity<Task> getProject(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID projectId
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        Task project = taskService.findById(projectId);
        if (project.getScope() != TaskScope.PLATFORM_INTERNAL || project.getType() != TaskType.PROJECT) {
            throw new EntityNotFoundException("Project tidak ditemukan: " + projectId);
        }
        return ResponseEntity.ok(project);
    }

    /**
     * Memperbarui informasi proyek atau spesifikasi TipTap Markdown.
     */
    @PutMapping("/projects/{projectId}")
    @PreAuthorize("hasAuthority('platform.projects.manage') or hasAuthority('system.task.manage')")
    public ResponseEntity<Task> updateProject(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID projectId,
            @RequestBody UpdateTaskRequest request
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        Task existing = taskService.findById(projectId);
        if (existing.getScope() != TaskScope.PLATFORM_INTERNAL || existing.getType() != TaskType.PROJECT) {
            throw new EntityNotFoundException("Project tidak ditemukan: " + projectId);
        }
        return ResponseEntity.ok(taskService.update(projectId, request));
    }

    /**
     * Menghapus lunak proyek.
     */
    @DeleteMapping("/projects/{projectId}")
    @PreAuthorize("hasAuthority('platform.projects.manage') or hasAuthority('system.task.manage')")
    public ResponseEntity<Void> deleteProject(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID projectId
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        Task existing = taskService.findById(projectId);
        if (existing.getScope() != TaskScope.PLATFORM_INTERNAL || existing.getType() != TaskType.PROJECT) {
            throw new EntityNotFoundException("Project tidak ditemukan: " + projectId);
        }
        taskService.delete(projectId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Mengambil seluruh issue anak (*child issues*) yang terikat ke proyek tertentu.
     */
    @GetMapping("/projects/{projectId}/issues")
    @PreAuthorize("hasAuthority('platform.issues.view') or hasAuthority('platform.projects.view') or hasAuthority('system.task.manage')")
    public ResponseEntity<List<Task>> listProjectChildIssues(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID projectId
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        return ResponseEntity.ok(taskService.findSubTasks(projectId));
    }

    /**
     * Membuat issue anak baru yang langsung ditautkan ke proyek tersebut.
     */
    @PostMapping("/projects/{projectId}/issues")
    @PreAuthorize("hasAuthority('platform.issues.manage') or hasAuthority('platform.projects.manage') or hasAuthority('system.task.manage')")
    public ResponseEntity<Task> createProjectChildIssue(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTaskRequest request
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        Task project = taskService.findById(projectId);
        if (project.getScope() != TaskScope.PLATFORM_INTERNAL || project.getType() != TaskType.PROJECT) {
            throw new EntityNotFoundException("Project tidak ditemukan: " + projectId);
        }

        CreateTaskRequest childRequest = new CreateTaskRequest(
                TaskType.TICKET,
                request.title(),
                request.description(),
                request.priority(),
                request.assigneeId(),
                "PROJECT",
                projectId.toString(),
                projectId,
                project.getObsidianRef(),
                request.dueDate(),
                request.coordinates(),
                TaskScope.PLATFORM_INTERNAL
        );
        Task created = taskService.create(childRequest, jwt.getSubject(), UUID.fromString(PLATFORM_ORG_SENTINEL_ID), true);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // =========================================================================
    // ── 2. ENGINEERING ISSUES (/api/v1/system/workspace/issues) ──────────────
    // =========================================================================

    /**
     * Menampilkan daftar seluruh issue engineering internal tim K2NET (Task, Bug, Chore).
     */
    @GetMapping("/issues")
    @PreAuthorize("hasAuthority('platform.issues.view') or hasAuthority('system.task.manage')")
    public ResponseEntity<Page<Task>> listIssues(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sort));
        return ResponseEntity.ok(taskService.findEngineeringIssues(pageable));
    }

    /**
     * Membuat issue engineering internal baru.
     */
    @PostMapping("/issues")
    @PreAuthorize("hasAuthority('platform.issues.manage') or hasAuthority('system.task.manage')")
    public ResponseEntity<Task> createIssue(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateTaskRequest request
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        CreateTaskRequest issueRequest = new CreateTaskRequest(
                request.type() != null ? request.type() : TaskType.TICKET,
                request.title(),
                request.description(),
                request.priority(),
                request.assigneeId(),
                request.referenceType(),
                request.referenceId(),
                request.parentTaskId(),
                request.obsidianRef(),
                request.dueDate(),
                request.coordinates(),
                TaskScope.PLATFORM_INTERNAL
        );
        Task created = taskService.create(issueRequest, jwt.getSubject(), UUID.fromString(PLATFORM_ORG_SENTINEL_ID), true);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Mengambil detail issue engineering tertentu.
     */
    @GetMapping("/issues/{issueId}")
    @PreAuthorize("hasAuthority('platform.issues.view') or hasAuthority('system.task.manage')")
    public ResponseEntity<Task> getIssue(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID issueId
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        Task issue = taskService.findById(issueId);
        if (issue.getScope() != TaskScope.PLATFORM_INTERNAL) {
            throw new EntityNotFoundException("Issue tidak ditemukan: " + issueId);
        }
        return ResponseEntity.ok(issue);
    }

    /**
     * Memperbarui issue engineering internal (status, prioritas, assignee, dll.).
     */
    @PutMapping("/issues/{issueId}")
    @PreAuthorize("hasAuthority('platform.issues.manage') or hasAuthority('system.task.manage')")
    public ResponseEntity<Task> updateIssue(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID issueId,
            @RequestBody UpdateTaskRequest request
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        Task existing = taskService.findById(issueId);
        if (existing.getScope() != TaskScope.PLATFORM_INTERNAL) {
            throw new EntityNotFoundException("Issue tidak ditemukan: " + issueId);
        }
        return ResponseEntity.ok(taskService.update(issueId, request));
    }

    /**
     * Menghapus issue engineering.
     */
    @DeleteMapping("/issues/{issueId}")
    @PreAuthorize("hasAuthority('platform.issues.manage') or hasAuthority('system.task.manage')")
    public ResponseEntity<Void> deleteIssue(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID issueId
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        Task existing = taskService.findById(issueId);
        if (existing.getScope() != TaskScope.PLATFORM_INTERNAL) {
            throw new EntityNotFoundException("Issue tidak ditemukan: " + issueId);
        }
        taskService.delete(issueId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Menambahkan komentar teknis pada issue engineering.
     */
    @PostMapping("/issues/{issueId}/comments")
    @PreAuthorize("hasAuthority('platform.issues.manage') or hasAuthority('system.task.manage')")
    public ResponseEntity<TaskComment> addIssueComment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID issueId,
            @Valid @RequestBody CreateCommentRequest request
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        Task existing = taskService.findById(issueId);
        if (existing.getScope() != TaskScope.PLATFORM_INTERNAL) {
            throw new EntityNotFoundException("Issue tidak ditemukan: " + issueId);
        }
        TaskComment comment = taskService.addComment(issueId, request, jwt.getSubject());
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    /**
     * Ringkasan KPI terisolasi khusus untuk backlog engineering internal.
     */
    @GetMapping("/issues/summary")
    @PreAuthorize("hasAuthority('platform.issues.view') or hasAuthority('system.task.manage')")
    public ResponseEntity<TaskSummaryDTO> getIssuesSummary(@AuthenticationPrincipal Jwt jwt) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        return ResponseEntity.ok(taskService.getSummary(TaskScope.PLATFORM_INTERNAL));
    }
}
