package com.company.ftthgis.domain.task.service;

import com.company.ftthgis.config.logging.AuditRequired;
import com.company.ftthgis.domain.task.dto.*;
import com.company.ftthgis.domain.task.entity.*;
import com.company.ftthgis.domain.task.repository.TaskCommentRepository;
import com.company.ftthgis.domain.task.repository.TaskRepository;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Core domain service for Task Management.
 *
 * <h3>Multi-tenancy</h3>
 * <ul>
 *   <li>Non-super-admin: Hibernate {@code organizationFilter} is enabled with the
 *       caller's {@code organizationId} extracted from the JWT, scoping all queries
 *       to that tenant's data only.</li>
 *   <li>Super Admin: filter is NOT enabled — all tasks across all tenants are visible.</li>
 * </ul>
 *
 * <h3>Audit Logging</h3>
 * All mutating methods are annotated with {@code @AuditRequired} (logGroup=OPERATIONS).
 * The {@code AuditAspect} intercepts after successful method execution and forwards
 * a structured event to {@code gateway-audit:5009} asynchronously.
 * A failure in the aspect NEVER rolls back the database transaction.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaskService {

    private static final GeometryFactory GEO = new GeometryFactory(new PrecisionModel(), 4326);
    private static final List<TaskStatus> TERMINAL_STATUSES = List.of(TaskStatus.RESOLVED, TaskStatus.CLOSED);
    private static final DateTimeFormatter OBS_MONTH_FMT = DateTimeFormatter.ofPattern("MM");

    private final TaskRepository taskRepository;
    private final TaskCommentRepository commentRepository;
    private final OrganizationRepository organizationRepository;
    private final EntityManager entityManager;

    // ─── Read operations ────────────────────────────────────────────────────────

    /**
     * List all tasks with pagination.
     * Hibernate Filter is activated by the caller before invoking this method
     * (handled in {@link TaskController}).
     */
    public Page<Task> findAll(Pageable pageable) {
        return taskRepository.findAll(pageable);
    }

    public Task findById(UUID id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Task tidak ditemukan: " + id));
    }

    /**
     * Summary statistics for the Overview KPI card.
     * Hibernate Filter (if active) automatically scopes to the current tenant.
     */
    public TaskSummaryDTO getSummary() {
        long totalOpen = taskRepository.countOpenTasks(TERMINAL_STATUSES);
        long urgentCount = taskRepository.countByPriorityAndStatusNotIn(TaskPriority.URGENT, TERMINAL_STATUSES);
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long resolvedToday = taskRepository.countResolvedToday(startOfDay);
        return new TaskSummaryDTO(totalOpen, urgentCount, resolvedToday);
    }

    // ─── Mutating operations ────────────────────────────────────────────────────

    @Transactional
    @AuditRequired(
            action = "TASK_CREATED",
            resourceType = "TASK",
            logGroup = "OPERATIONS",
            resourceIdExpression = "#result.id.toString()"
    )
    public Task create(CreateTaskRequest request, String reporterId, UUID organizationId) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Organization tidak ditemukan: " + organizationId));

        Task task = Task.builder()
                .type(request.type())
                .status(TaskStatus.TODO)
                .priority(request.priority() != null ? request.priority() : TaskPriority.NORMAL)
                .title(request.title())
                .description(request.description())
                .reporterId(reporterId)
                .assigneeId(request.assigneeId())
                .organization(org)
                .referenceType(request.referenceType())
                .referenceId(request.referenceId())
                .parentTaskId(request.parentTaskId())
                .dueDate(request.dueDate())
                .locationGeom(toPoint(request.coordinates()))
                .build();

        // Auto-generate Obsidian vault reference for PROJECT tasks
        if (request.type() == TaskType.PROJECT) {
            task.setObsidianRef(generateObsidianRef("PRJ", organizationId));
        }

        Task saved = taskRepository.save(task);
        log.info("[TaskService] Created {} task id={} orgId={}", request.type(), saved.getId(), organizationId);

        // TODO Phase 3: publish to Redis "obsidian:sync" queue for gateway-task worker
        // redisTemplate.opsForList().leftPush("obsidian:sync", buildSyncPayload(saved));

        return saved;
    }

    @Transactional
    @AuditRequired(
            action = "TASK_STATUS_CHANGED",
            resourceType = "TASK",
            logGroup = "OPERATIONS",
            resourceIdExpression = "#id.toString()"
    )
    public Task update(UUID id, UpdateTaskRequest request) {
        Task task = findById(id);

        if (request.title() != null) task.setTitle(request.title());
        if (request.description() != null) task.setDescription(request.description());
        if (request.priority() != null) task.setPriority(request.priority());
        if (request.assigneeId() != null) task.setAssigneeId(request.assigneeId());
        if (request.referenceType() != null) task.setReferenceType(request.referenceType());
        if (request.referenceId() != null) task.setReferenceId(request.referenceId());
        if (request.dueDate() != null) task.setDueDate(request.dueDate());
        if (request.coordinates() != null) task.setLocationGeom(toPoint(request.coordinates()));

        // Auto-set resolvedAt timestamp when status transitions to RESOLVED
        if (request.status() != null) {
            task.setStatus(request.status());
            if (request.status() == TaskStatus.RESOLVED && task.getResolvedAt() == null) {
                task.setResolvedAt(LocalDateTime.now());
            }
        }

        return taskRepository.save(task);
    }

    @Transactional
    @AuditRequired(
            action = "TASK_ASSIGNED",
            resourceType = "TASK",
            logGroup = "OPERATIONS",
            resourceIdExpression = "#id.toString()"
    )
    public Task assignTask(UUID id, String assigneeId) {
        Task task = findById(id);
        task.setAssigneeId(assigneeId);
        return taskRepository.save(task);
    }

    @Transactional
    @AuditRequired(
            action = "TASK_RESOLVED",
            resourceType = "TASK",
            logGroup = "OPERATIONS",
            resourceIdExpression = "#id.toString()"
    )
    public Task resolveTask(UUID id) {
        Task task = findById(id);
        task.setStatus(TaskStatus.RESOLVED);
        task.setResolvedAt(LocalDateTime.now());
        return taskRepository.save(task);
    }

    @Transactional
    @AuditRequired(
            action = "TASK_DELETED",
            resourceType = "TASK",
            logGroup = "OPERATIONS",
            severity = "WARN",
            resourceIdExpression = "#id.toString()"
    )
    public void delete(UUID id) {
        Task task = findById(id);
        taskRepository.delete(task);
        log.warn("[TaskService] Deleted task id={}", id);
    }

    @Transactional
    @AuditRequired(
            action = "TASK_COMMENT_ADDED",
            resourceType = "TASK_COMMENT",
            logGroup = "OPERATIONS",
            resourceIdExpression = "#taskId.toString()"
    )
    public TaskComment addComment(UUID taskId, CreateCommentRequest request, String authorId) {
        Task task = findById(taskId);
        TaskComment comment = TaskComment.builder()
                .task(task)
                .authorId(authorId)
                .content(request.content())
                .build();
        return commentRepository.save(comment);
    }

    // ─── Hibernate Filter management ────────────────────────────────────────────

    /**
     * Enable the Hibernate organization filter.
     * Must be called before any query for non-super-admin users.
     */
    public void enableOrgFilter(String organizationId) {
        Session session = entityManager.unwrap(Session.class);
        Filter filter = session.enableFilter("organizationFilter");
        filter.setParameter("organizationId", organizationId);
    }

    /**
     * Disable the Hibernate organization filter.
     * Used for Super Admin to view all tenants' tasks.
     */
    public void disableOrgFilter() {
        Session session = entityManager.unwrap(Session.class);
        session.disableFilter("organizationFilter");
    }

    // ─── Private helpers ────────────────────────────────────────────────────────

    /**
     * Build a PostGIS Point from optional [lng, lat] coordinates array.
     * Returns null if coordinates are not provided.
     */
    private org.locationtech.jts.geom.Point toPoint(Double[] coordinates) {
        if (coordinates == null || coordinates.length < 2) return null;
        return GEO.createPoint(new Coordinate(coordinates[0], coordinates[1]));
    }

    /**
     * Generate Obsidian vault reference in format: {@code PREFIX-YYYY-MM-NNN}.
     * e.g. {@code PRJ-2026-08-001}
     */
    private String generateObsidianRef(String prefix, UUID orgId) {
        int year = LocalDate.now().getYear();
        int month = LocalDate.now().getMonthValue();
        long seq = taskRepository.countProjectsForMonth(orgId, year, month) + 1;
        return String.format("%s-%d-%s-%03d", prefix, year, OBS_MONTH_FMT.format(LocalDate.now()), seq);
    }
}
