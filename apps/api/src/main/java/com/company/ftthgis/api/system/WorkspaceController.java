package com.company.ftthgis.api.system;

import com.company.ftthgis.domain.task.dto.CreateCommentRequest;
import com.company.ftthgis.domain.task.dto.CreateTaskRequest;
import com.company.ftthgis.domain.task.dto.TaskSummaryDTO;
import com.company.ftthgis.domain.task.dto.UpdateTaskRequest;
import com.company.ftthgis.domain.task.dto.WorkspacePlansSummaryDTO;
import com.company.ftthgis.domain.task.entity.Task;
import com.company.ftthgis.domain.task.entity.TaskComment;
import com.company.ftthgis.domain.task.entity.TaskPriority;
import com.company.ftthgis.domain.task.entity.TaskScope;
import com.company.ftthgis.domain.task.entity.TaskStatus;
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
 * (gaya Notion + Linear) yang menaungi Plans, Ideas, Master Specs, dan Engineering Issues.
 * </p>
 *
 * <h3>Domain Isolation & Security</h3>
 * <ul>
 *   <li>Seluruh data terkunci otomatis pada {@code scope = PLATFORM_INTERNAL}.</li>
 *   <li>Dilindungi oleh permission granular {@code platform.workspace.*} dan {@code platform.issues.*}.</li>
 *   <li>Type Guard ketat mencegah eskalasi privilege antara Container (Plans/Projects) dan Unit Kerja (Issues/Tasks).</li>
 * </ul>
 *
 * @author FTTH GIS Core Team
 * @version 3.1.0
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/system/workspace")
@RequiredArgsConstructor
public class WorkspaceController {

    private static final String PLATFORM_ORG_SENTINEL_ID = "00000000-0000-0000-0000-000000000001";
    private static final List<String> VALID_WORKSPACE_CONTAINER_TYPES = List.of("IDEA", "PLAN", "PROJECT", "DOC");

    private final TaskService taskService;

    // =========================================================================
    // ── 1. PLANS, IDEAS & SPECS (/api/v1/system/workspace/plans) ─────────────
    // =========================================================================

    /**
     * Mengambil daftar rencana/inisiatif internal platform dengan filter dinamis.
     * Jalur kanonikal: /plans (dengan alias backward-compatible: /projects).
     */
    @GetMapping({"/plans", "/projects"})
    @PreAuthorize("hasAuthority('platform.workspace.view') or hasAuthority('system.task.manage')")
    public ResponseEntity<Page<Task>> listPlans(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String view,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        String safeSort = sanitizeSortProperty(sort);
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, safeSort));
        return ResponseEntity.ok(taskService.findWorkspacePlans(search, status, priority, type, view, pageable));
    }

    /**
     * Membuat rencana/dokumen wadah internal baru (Idea, Plan, Project, Doc).
     */
    @PostMapping({"/plans", "/projects"})
    @PreAuthorize("hasAuthority('platform.workspace.manage') or hasAuthority('system.task.manage')")
    public ResponseEntity<Task> createPlan(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateTaskRequest request
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);

        // Normalisasi subtipe Notion: IDEA, PLAN, PROJECT, DOC (default: PLAN)
        String refType = (request.referenceType() != null && !request.referenceType().isBlank())
                ? request.referenceType().trim().toUpperCase()
                : "PLAN";
        if (!VALID_WORKSPACE_CONTAINER_TYPES.contains(refType)) {
            refType = "PLAN";
        }

        CreateTaskRequest planRequest = new CreateTaskRequest(
                TaskType.PROJECT,
                request.title(),
                request.description(),
                request.priority() != null ? request.priority() : TaskPriority.NORMAL,
                request.assigneeId(),
                refType,
                request.referenceId(),
                request.parentTaskId(),
                request.obsidianRef(),
                request.dueDate(),
                request.coordinates(),
                TaskScope.PLATFORM_INTERNAL
        );

        Task created = taskService.create(planRequest, jwt.getSubject(), UUID.fromString(PLATFORM_ORG_SENTINEL_ID), true);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Mengambil detail rencana/dokumen spesifik berdasarkan ID.
     */
    @GetMapping({"/plans/{planId}", "/projects/{planId}"})
    @PreAuthorize("hasAuthority('platform.workspace.view') or hasAuthority('system.task.manage')")
    public ResponseEntity<Task> getPlan(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID planId
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        Task plan = taskService.findById(planId);
        if (plan.getScope() != TaskScope.PLATFORM_INTERNAL || plan.getType() != TaskType.PROJECT) {
            throw new EntityNotFoundException("Plan/Project tidak ditemukan: " + planId);
        }
        return ResponseEntity.ok(plan);
    }

    /**
     * Memperbarui informasi rencana/spesifikasi TipTap Markdown.
     */
    @PutMapping({"/plans/{planId}", "/projects/{planId}"})
    @PreAuthorize("hasAuthority('platform.workspace.manage') or hasAuthority('system.task.manage')")
    public ResponseEntity<Task> updatePlan(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID planId,
            @Valid @RequestBody UpdateTaskRequest request
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        Task existing = taskService.findById(planId);
        if (existing.getScope() != TaskScope.PLATFORM_INTERNAL || existing.getType() != TaskType.PROJECT) {
            throw new EntityNotFoundException("Plan/Project tidak ditemukan: " + planId);
        }
        return ResponseEntity.ok(taskService.update(planId, request));
    }

    /**
     * Menghapus lunak dokumen rencana/proyek.
     */
    @DeleteMapping({"/plans/{planId}", "/projects/{planId}"})
    @PreAuthorize("hasAuthority('platform.workspace.manage') or hasAuthority('system.task.manage')")
    public ResponseEntity<Void> deletePlan(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID planId
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        Task existing = taskService.findById(planId);
        if (existing.getScope() != TaskScope.PLATFORM_INTERNAL || existing.getType() != TaskType.PROJECT) {
            throw new EntityNotFoundException("Plan/Project tidak ditemukan: " + planId);
        }
        taskService.delete(planId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Mengambil seluruh issue anak (*child issues*) yang terikat ke rencana/proyek tertentu.
     * Memvalidasi kepemilikan parent sebelum data dikembalikan.
     */
    @GetMapping({"/plans/{planId}/issues", "/projects/{planId}/issues"})
    @PreAuthorize("hasAuthority('platform.issues.view') or hasAuthority('platform.workspace.view') or hasAuthority('system.task.manage')")
    public ResponseEntity<List<Task>> listPlanChildIssues(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID planId
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        Task parent = taskService.findById(planId);
        if (parent.getScope() != TaskScope.PLATFORM_INTERNAL || parent.getType() != TaskType.PROJECT) {
            throw new EntityNotFoundException("Plan/Project tidak ditemukan: " + planId);
        }
        return ResponseEntity.ok(taskService.findSubTasks(planId));
    }

    /**
     * Membuat issue anak baru yang langsung ditautkan ke rencana/proyek tersebut.
     */
    @PostMapping({"/plans/{planId}/issues", "/projects/{planId}/issues"})
    @PreAuthorize("hasAuthority('platform.issues.manage') or hasAuthority('platform.workspace.manage') or hasAuthority('system.task.manage')")
    public ResponseEntity<Task> createPlanChildIssue(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID planId,
            @Valid @RequestBody CreateTaskRequest request
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        Task parent = taskService.findById(planId);
        if (parent.getScope() != TaskScope.PLATFORM_INTERNAL || parent.getType() != TaskType.PROJECT) {
            throw new EntityNotFoundException("Plan/Project tidak ditemukan: " + planId);
        }

        CreateTaskRequest childRequest = new CreateTaskRequest(
                TaskType.TICKET,
                request.title(),
                request.description(),
                request.priority() != null ? request.priority() : TaskPriority.NORMAL,
                request.assigneeId(),
                "PROJECT",
                planId.toString(),
                planId,
                parent.getObsidianRef(),
                request.dueDate(),
                request.coordinates(),
                TaskScope.PLATFORM_INTERNAL
        );
        Task created = taskService.create(childRequest, jwt.getSubject(), UUID.fromString(PLATFORM_ORG_SENTINEL_ID), true);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Menambahkan komentar/catatan diskusi pada dokumen rencana/spesifikasi.
     */
    @PostMapping({"/plans/{planId}/comments", "/projects/{planId}/comments"})
    @PreAuthorize("hasAuthority('platform.workspace.manage') or hasAuthority('system.task.manage')")
    public ResponseEntity<TaskComment> addPlanComment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID planId,
            @Valid @RequestBody CreateCommentRequest request
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        Task existing = taskService.findById(planId);
        if (existing.getScope() != TaskScope.PLATFORM_INTERNAL || existing.getType() != TaskType.PROJECT) {
            throw new EntityNotFoundException("Plan/Project tidak ditemukan: " + planId);
        }
        TaskComment comment = taskService.addComment(planId, request, jwt.getSubject());
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    /**
     * Ringkasan KPI terisolasi khusus untuk halaman Plans, Ideas & Specs.
     */
    @GetMapping({"/plans/summary", "/projects/summary"})
    @PreAuthorize("hasAuthority('platform.workspace.view') or hasAuthority('system.task.manage')")
    public ResponseEntity<WorkspacePlansSummaryDTO> getPlansSummary(@AuthenticationPrincipal Jwt jwt) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        return ResponseEntity.ok(taskService.getWorkspacePlansSummary());
    }

    // =========================================================================
    // ── 2. ENGINEERING ISSUES (/api/v1/system/workspace/issues) ──────────────
    // =========================================================================

    /**
     * Menampilkan daftar issue engineering internal tim K2NET (Task, Bug, Chore) dengan filter dinamis.
     */
    @GetMapping("/issues")
    @PreAuthorize("hasAuthority('platform.issues.view') or hasAuthority('system.task.manage')")
    public ResponseEntity<Page<Task>> listIssues(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) String view,
            @RequestParam(required = false) String assigneeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        String safeSort = sanitizeSortProperty(sort);
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, safeSort));
        return ResponseEntity.ok(taskService.findWorkspaceIssues(search, status, priority, view, assigneeId, pageable));
    }

    /**
     * Membuat issue engineering internal baru.
     * Tipe dipaksa TICKET untuk mencegah bypass permission platform.workspace.manage.
     */
    @PostMapping("/issues")
    @PreAuthorize("hasAuthority('platform.issues.manage') or hasAuthority('system.task.manage')")
    public ResponseEntity<Task> createIssue(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateTaskRequest request
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        CreateTaskRequest issueRequest = new CreateTaskRequest(
                TaskType.TICKET, // Selalu TICKET untuk unit kerja issue
                request.title(),
                request.description(),
                request.priority() != null ? request.priority() : TaskPriority.NORMAL,
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
     * Type Guard: menolak jika item adalah container PROJECT.
     */
    @GetMapping("/issues/{issueId}")
    @PreAuthorize("hasAuthority('platform.issues.view') or hasAuthority('system.task.manage')")
    public ResponseEntity<Task> getIssue(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID issueId
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        Task issue = taskService.findById(issueId);
        if (issue.getScope() != TaskScope.PLATFORM_INTERNAL || issue.getType() == TaskType.PROJECT) {
            throw new EntityNotFoundException("Issue tidak ditemukan: " + issueId);
        }
        return ResponseEntity.ok(issue);
    }

    /**
     * Memperbarui issue engineering internal (status, prioritas, assignee, dll.).
     * Type Guard: menolak jika item adalah container PROJECT.
     */
    @PutMapping("/issues/{issueId}")
    @PreAuthorize("hasAuthority('platform.issues.manage') or hasAuthority('system.task.manage')")
    public ResponseEntity<Task> updateIssue(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID issueId,
            @Valid @RequestBody UpdateTaskRequest request
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        Task existing = taskService.findById(issueId);
        if (existing.getScope() != TaskScope.PLATFORM_INTERNAL || existing.getType() == TaskType.PROJECT) {
            throw new EntityNotFoundException("Issue tidak ditemukan: " + issueId);
        }
        return ResponseEntity.ok(taskService.update(issueId, request));
    }

    /**
     * Menghapus issue engineering.
     * Type Guard: menolak jika item adalah container PROJECT.
     */
    @DeleteMapping("/issues/{issueId}")
    @PreAuthorize("hasAuthority('platform.issues.manage') or hasAuthority('system.task.manage')")
    public ResponseEntity<Void> deleteIssue(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID issueId
    ) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        Task existing = taskService.findById(issueId);
        if (existing.getScope() != TaskScope.PLATFORM_INTERNAL || existing.getType() == TaskType.PROJECT) {
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
        if (existing.getScope() != TaskScope.PLATFORM_INTERNAL || existing.getType() == TaskType.PROJECT) {
            throw new EntityNotFoundException("Issue tidak ditemukan: " + issueId);
        }
        TaskComment comment = taskService.addComment(issueId, request, jwt.getSubject());
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    /**
     * Ringkasan KPI terisolasi khusus untuk backlog engineering internal (murni mengecualikan tipe PROJECT).
     */
    @GetMapping("/issues/summary")
    @PreAuthorize("hasAuthority('platform.issues.view') or hasAuthority('system.task.manage')")
    public ResponseEntity<TaskSummaryDTO> getIssuesSummary(@AuthenticationPrincipal Jwt jwt) {
        taskService.enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        return ResponseEntity.ok(taskService.getEngineeringIssuesSummary());
    }

    // =========================================================================
    // ── Helper Sanitizer ─────────────────────────────────────────────────────
    // =========================================================================

    /**
     * Sanitasi nama property sort untuk mencegah PropertyReferenceException (HTTP 500)
     * saat frontend mengirimkan format snake_case.
     */
    private String sanitizeSortProperty(String sort) {
        if (sort == null || sort.isBlank()) return "createdAt";
        return switch (sort.toLowerCase().trim()) {
            case "due_date", "duedate" -> "dueDate";
            case "created_at", "createdat" -> "createdAt";
            case "updated_at", "updatedat" -> "updatedAt";
            case "priority" -> "priority";
            case "status" -> "status";
            case "title" -> "title";
            case "obsidian_ref", "obsidianref" -> "obsidianRef";
            default -> "createdAt";
        };
    }
}
