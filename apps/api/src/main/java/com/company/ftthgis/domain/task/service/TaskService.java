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
import org.springframework.data.redis.core.RedisTemplate;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.domain.task.event.TaskCreatedEvent;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;


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

    public static final String PLATFORM_ORG_SENTINEL_ID = "00000000-0000-0000-0000-000000000001";
    private static final GeometryFactory GEO = new GeometryFactory(new PrecisionModel(), 4326);
    private static final List<TaskStatus> TERMINAL_STATUSES = List.of(TaskStatus.RESOLVED, TaskStatus.CLOSED);
    private static final DateTimeFormatter OBS_MONTH_FMT = DateTimeFormatter.ofPattern("MM");

    private final TaskRepository taskRepository;
    private final TaskCommentRepository commentRepository;
    private final OrganizationRepository organizationRepository;
    private final EntityManager entityManager;
    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ApplicationEventPublisher eventPublisher;

    // ─── Read operations ────────────────────────────────────────────────────────

    /**
     * List all tasks with pagination.
     * Hibernate Filter is activated by the caller before invoking this method
     * (handled in {@link TaskController}).
     */
    public Page<Task> findAll(Pageable pageable) {
        return taskRepository.findAll(pageable);
    }

    /**
     * List tasks filtered by scope — used by studio-admin portal.
     * @param scope the TaskScope to filter on
     * @param pageable pagination parameters
     */
    public Page<Task> findByScope(TaskScope scope, Pageable pageable) {
        return taskRepository.findByScope(scope, pageable);
    }

    /**
     * List tasks matching either of two scopes — used to show studio-admin all relevant tasks
     * (PLATFORM_INTERNAL + TENANT_TO_PLATFORM combined view).
     */
    public Page<Task> findByScopeIn(List<TaskScope> scopes, Pageable pageable) {
        return taskRepository.findByScopeIn(scopes, pageable);
    }

    /**
     * Cross-tenant support bridge: Fetch B2B support tickets across all tenants.
     * Strictly restricted to TENANT_TO_PLATFORM scope for platform support administrators.
     */
    public Page<Task> findCrossTenantSupportTickets(Pageable pageable) {
        disableOrgFilter();
        return taskRepository.findByScope(TaskScope.TENANT_TO_PLATFORM, pageable);
    }

    /** Fetch all tasks with points for spatial map integration. */
    public List<Task> findAllWithLocation() {
        return taskRepository.findAllWithLocation();
    }

    public Task findById(UUID id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Task tidak ditemukan: " + id));
    }

    /**
     * Unfiltered findById for platform administrator cross-tenant support evaluation.
     * Must be verified by caller to ensure tenant_internal tasks are never leaked.
     */
    public Task findByIdUnfiltered(UUID id) {
        disableOrgFilter();
        return taskRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Task tidak ditemukan: " + id));
    }

    /**
     * Summary statistics for the Overview KPI card (global or tenant-scoped).
     */
    public TaskSummaryDTO getSummary() {
        return getSummary(null);
    }

    /**
     * Scope-isolated summary statistics for KPI cards.
     * @param scope Optional scope filter (PLATFORM_INTERNAL, TENANT_TO_PLATFORM, etc.)
     */
    public TaskSummaryDTO getSummary(TaskScope scope) {
        if (scope == null) {
            long totalOpen = taskRepository.countOpenTasks(TERMINAL_STATUSES);
            long urgentCount = taskRepository.countByPriorityAndStatusNotIn(TaskPriority.URGENT, TERMINAL_STATUSES);
            LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
            long resolvedToday = taskRepository.countResolvedToday(startOfDay);
            return new TaskSummaryDTO(totalOpen, urgentCount, resolvedToday);
        }
        long totalOpen = taskRepository.countOpenTasksByScope(scope, TERMINAL_STATUSES);
        long urgentCount = taskRepository.countByScopeAndPriorityAndStatusNotIn(scope, TaskPriority.URGENT, TERMINAL_STATUSES);
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long resolvedToday = taskRepository.countResolvedTodayByScope(scope, startOfDay);
        return new TaskSummaryDTO(totalOpen, urgentCount, resolvedToday);
    }

    /**
     * Cross-tenant KPI summary for B2B tenant support tickets.
     * Scoped exclusively to TENANT_TO_PLATFORM across all tenants.
     */
    public TaskSummaryDTO getSupportTicketsSummary() {
        disableOrgFilter();
        long totalOpen = taskRepository.countOpenTasksByScope(TaskScope.TENANT_TO_PLATFORM, TERMINAL_STATUSES);
        long urgentCount = taskRepository.countByScopeAndPriorityAndStatusNotIn(TaskScope.TENANT_TO_PLATFORM, TaskPriority.URGENT, TERMINAL_STATUSES);
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long resolvedToday = taskRepository.countResolvedTodayByScope(TaskScope.TENANT_TO_PLATFORM, startOfDay);
        return new TaskSummaryDTO(totalOpen, urgentCount, resolvedToday);
    }

    // ─── Mutating operations ────────────────────────────────────────────────────

    @Transactional
    @AuditRequired(
            action = "TASK_CREATED",
            resourceType = "TASK",
            logGroup = "OPERATIONS",
            category = "TASK",
            resourceIdExpression = "#result != null && #result.obsidianRef != null && !#result.obsidianRef.isBlank() ? #result.obsidianRef : (#result != null && #result.id != null ? #result.id.toString() : '')"
    )
    public Task create(CreateTaskRequest request, String reporterId, UUID organizationId, boolean isSuperAdmin) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Organization tidak ditemukan: " + organizationId));

        // ── Air-Gap Guard: Super Admin cannot create TENANT_INTERNAL tasks ──────
        // Only a genuine tenant caller (with a real organization_id JWT claim) may do so.
        TaskScope resolvedScope = resolveScope(request.scope(), isSuperAdmin);

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
                .scope(resolvedScope)
                .build();

        // Auto-generate or assign Obsidian reference
        if (request.obsidianRef() != null && !request.obsidianRef().isBlank()) {
            task.setObsidianRef(request.obsidianRef().trim());
        } else if (request.parentTaskId() != null) {
            taskRepository.findById(request.parentTaskId()).ifPresent(parent -> {
                if (parent.getObsidianRef() != null) {
                    task.setObsidianRef(parent.getObsidianRef());
                }
            });
        }
        if (task.getObsidianRef() == null || task.getObsidianRef().isBlank()) {
            task.setObsidianRef(generateReferenceCode(task.getType(), task.getScope(), organizationId));
        }

        Task saved = taskRepository.save(task);
        log.info("[TaskService] Created {} task id={} orgId={} scope={}",
                request.type(), saved.getId(), organizationId, resolvedScope);

        // Publish to Redis "obsidian:sync" queue for gateway-task worker
        publishSyncEvent(saved);

        // Publish event for SSE notification pipeline
        eventPublisher.publishEvent(new TaskCreatedEvent(this, saved));

        return saved;
    }

    @Transactional
    @AuditRequired(
            action = "TASK_STATUS_CHANGED",
            resourceType = "TASK",
            logGroup = "OPERATIONS",
            category = "TASK",
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

        Task saved = taskRepository.save(task);
        publishSyncEvent(saved);
        return saved;
    }

    @Transactional
    @AuditRequired(
            action = "TASK_ASSIGNED",
            resourceType = "TASK",
            logGroup = "OPERATIONS",
            category = "TASK",
            resourceIdExpression = "#id.toString()"
    )
    public Task assignTask(UUID id, String assigneeId) {
        Task task = findById(id);
        task.setAssigneeId(assigneeId);
        Task saved = taskRepository.save(task);
        publishSyncEvent(saved);
        return saved;
    }

    @Transactional
    @AuditRequired(
            action = "TASK_RESOLVED",
            resourceType = "TASK",
            logGroup = "OPERATIONS",
            category = "TASK",
            resourceIdExpression = "#id.toString()"
    )
    public Task resolveTask(UUID id) {
        Task task = findById(id);
        task.setStatus(TaskStatus.RESOLVED);
        task.setResolvedAt(LocalDateTime.now());
        Task saved = taskRepository.save(task);
        publishSyncEvent(saved);
        return saved;
    }

    @Transactional
    @AuditRequired(
            action = "TASK_DELETED",
            resourceType = "TASK",
            logGroup = "OPERATIONS",
            severity = "WARN",
            category = "TASK",
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
            category = "TASK",
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

    @Transactional(readOnly = true)
    public List<Task> findSubTasks(UUID parentTaskId) {
        return taskRepository.findByParentTaskId(parentTaskId);
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
     * Generate canonical reference codes:
     * - Projects: {@code PRJ-YYYY-MM-NNN} (e.g. PRJ-2026-10-001)
     * - B2B Tenant Support Tickets: {@code TKT-YYYY-NNNN} (e.g. TKT-2026-0001)
     * - Platform Engineering Issues: {@code ISS-YYYY-NNNN} (e.g. ISS-2026-0001)
     */
    public String generateReferenceCode(TaskType type, TaskScope scope, UUID orgId) {
        int year = LocalDate.now().getYear();
        if (type == TaskType.PROJECT) {
            int month = LocalDate.now().getMonthValue();
            long seq = taskRepository.countTasksForMonth(orgId, TaskType.PROJECT, year, month) + 1;
            return String.format("PRJ-%d-%s-%03d", year, OBS_MONTH_FMT.format(LocalDate.now()), seq);
        } else if (scope == TaskScope.TENANT_TO_PLATFORM) {
            long seq = taskRepository.countTasksForYear(TaskScope.TENANT_TO_PLATFORM, year) + 1;
            return String.format("TKT-%d-%04d", year, seq);
        } else {
            long seq = taskRepository.countTasksForYear(TaskScope.PLATFORM_INTERNAL, year) + 1;
            return String.format("ISS-%d-%04d", year, seq);
        }
    }

    /** List internal platform workspace projects (filtered by type=PROJECT, scope=PLATFORM_INTERNAL). */
    public Page<Task> findProjects(Pageable pageable) {
        return taskRepository.findByScopeAndType(TaskScope.PLATFORM_INTERNAL, TaskType.PROJECT, pageable);
    }

    /** List internal platform engineering issues (filtered by type!=PROJECT, scope=PLATFORM_INTERNAL). */
    public Page<Task> findEngineeringIssues(Pageable pageable) {
        return taskRepository.findByScopeAndTypeNot(TaskScope.PLATFORM_INTERNAL, TaskType.PROJECT, pageable);
    }

    /**
     * Escalates a B2B tenant support ticket into an internal platform engineering issue.
     * The issue is created in scope PLATFORM_INTERNAL, attached to sentinel platform org,
     * referencing the support ticket, without leaking tenant internal secrets.
     */
    @Transactional
    @AuditRequired(
            action = "TICKET_ESCALATED_TO_ISSUE",
            resourceType = "TASK",
            logGroup = "OPERATIONS",
            category = "SUPPORT",
            resourceIdExpression = "#ticketId.toString()"
    )
    public Task escalateTicketToIssue(
            UUID ticketId,
            String title,
            String description,
            TaskPriority priority,
            String assigneeId,
            String reporterId
    ) {
        disableOrgFilter();
        Task ticket = taskRepository.findById(ticketId)
                .orElseThrow(() -> new EntityNotFoundException("Support Ticket tidak ditemukan: " + ticketId));

        if (ticket.getScope() != TaskScope.TENANT_TO_PLATFORM) {
            throw new IllegalArgumentException("Hanya B2B Support Ticket (TENANT_TO_PLATFORM) yang dapat dieskalasikan ke Engineering Issue.");
        }

        String issueTitle = (title != null && !title.isBlank())
                ? title
                : String.format("[Escalated from %s] %s", ticket.getObsidianRef(), ticket.getTitle());

        String issueDescription = (description != null && !description.isBlank())
                ? description
                : String.format("Dieskalasikan dari B2B Support Ticket: %s\nTenant: %s\n\nDeskripsi Asli:\n%s",
                ticket.getObsidianRef(),
                ticket.getOrganization() != null ? ticket.getOrganization().getName() : "-",
                ticket.getDescription());

        TaskPriority issuePriority = priority != null ? priority : ticket.getPriority();

        CreateTaskRequest issueRequest = new CreateTaskRequest(
                TaskType.TICKET,
                issueTitle,
                issueDescription,
                issuePriority,
                assigneeId,
                "TICKET",
                ticket.getObsidianRef() != null ? ticket.getObsidianRef() : ticket.getId().toString(),
                null,
                null,
                null,
                null,
                TaskScope.PLATFORM_INTERNAL
        );

        enableOrgFilter(PLATFORM_ORG_SENTINEL_ID);
        Task createdIssue = create(issueRequest, reporterId, UUID.fromString(PLATFORM_ORG_SENTINEL_ID), true);

        // Tambahkan komentar jejak eskalasi pada Support Ticket
        disableOrgFilter();
        CreateCommentRequest commentReq = new CreateCommentRequest(
                String.format("Tiket ini telah dieskalasikan menjadi Engineering Issue internal: **%s** (%s)",
                        createdIssue.getObsidianRef(), createdIssue.getTitle())
        );
        addComment(ticketId, commentReq, reporterId);

        log.info("[TaskService] Escalated ticket {} ({}) to engineering issue {} ({})",
                ticket.getId(), ticket.getObsidianRef(), createdIssue.getId(), createdIssue.getObsidianRef());

        return createdIssue;
    }

    /**
     * Menghitung metrik SLA untuk antrean Support Ticket (TENANT_TO_PLATFORM).
     */
    public SupportSlaMetricsDTO getSupportSlaMetrics() {
        disableOrgFilter();
        long total = taskRepository.countByScope(TaskScope.TENANT_TO_PLATFORM);
        long open = taskRepository.countOpenTasksByScope(TaskScope.TENANT_TO_PLATFORM, TERMINAL_STATUSES);
        long urgent = taskRepository.countByScopeAndPriorityAndStatusNotIn(
                TaskScope.TENANT_TO_PLATFORM, TaskPriority.URGENT, TERMINAL_STATUSES);
        long resolved = taskRepository.countByScopeAndStatusIn(
                TaskScope.TENANT_TO_PLATFORM, TERMINAL_STATUSES);

        double complianceRate = total > 0
                ? Math.round(((double) (total - urgent) / total * 100.0) * 10.0) / 10.0
                : 100.0;
        double avgResolutionHours = 4.5; // Baseline metric

        return new SupportSlaMetricsDTO(total, open, resolved, urgent, complianceRate, avgResolutionHours);
    }

    /**
     * Publish task synchronization event to Redis "obsidian:sync" queue.
     * Applicable to PROJECT type tasks or HIGH/URGENT ticketing tasks.
     */
    private void publishSyncEvent(Task task) {
        if (task.getType() == TaskType.PROJECT ||
            task.getPriority() == TaskPriority.HIGH ||
            task.getPriority() == TaskPriority.URGENT) {
            try {
                Map<String, Object> payload = buildSyncPayload(task);
                redisTemplate.opsForList().leftPush("obsidian:sync", payload);
                log.info("[TaskService] Published sync event for task id={} ref={}", task.getId(), task.getObsidianRef());
            } catch (Exception e) {
                log.error("[TaskService] Failed to publish sync event for task id={}", task.getId(), e);
            }
        }
    }

    /**
     * Construct a detailed map payload for the Obsidian Sync Worker.
     */
    /**
     * Resolve the effective scope for a new task.
     * Enforces the Air-Gap rule: Super Admin CANNOT create TENANT_INTERNAL tasks.
     */
    private TaskScope resolveScope(TaskScope requested, boolean isSuperAdmin) {
        if (isSuperAdmin) {
            if (requested == TaskScope.TENANT_INTERNAL) {
                throw new AccessDeniedException(
                        "Super Admin tidak diperkenankan membuat task dengan scope TENANT_INTERNAL. " +
                        "Gunakan scope PLATFORM_INTERNAL atau TENANT_TO_PLATFORM.");
            }
            // Default to PLATFORM_INTERNAL if not specified
            return requested != null ? requested : TaskScope.PLATFORM_INTERNAL;
        }
        // Tenant callers: default to TENANT_INTERNAL
        return requested != null ? requested : TaskScope.TENANT_INTERNAL;
    }

    private Map<String, Object> buildSyncPayload(Task task) {
        Map<String, Object> payload = new HashMap<>();

        payload.put("taskId", task.getObsidianRef() != null ? task.getObsidianRef() : task.getId().toString());
        payload.put("taskType", task.getType().name());
        payload.put("status", task.getStatus().name());
        payload.put("priority", task.getPriority().name());
        // Scope determines the Obsidian vault folder destination in gateway-task worker
        payload.put("scope", task.getScope() != null ? task.getScope().name() : TaskScope.PLATFORM_INTERNAL.name());

        Organization org = task.getOrganization();
        String tenantName = "K2NET Platform";
        String tenantSlug = "system";
        if (task.getScope() == TaskScope.TENANT_INTERNAL || task.getScope() == TaskScope.TENANT_TO_PLATFORM) {
            if (org != null) {
                tenantName = org.getName() != null ? org.getName() : "";
                tenantSlug = (org.getSlug() != null && !org.getSlug().isBlank() && !"default".equalsIgnoreCase(org.getSlug()))
                        ? org.getSlug() : "system";
            }
        }
        payload.put("tenantName", tenantName);
        payload.put("tenantSlug", tenantSlug);

        String reporterName = "Belum diketahui";
        if (task.getReporterId() != null) {
            try {
                UUID reporterUuid = UUID.fromString(task.getReporterId());
                reporterName = userRepository.findById(reporterUuid)
                        .map(u -> u.getFullName() != null ? u.getFullName() + " (" + u.getUsername() + ")" : u.getUsername())
                        .orElse(task.getReporterId());
            } catch (Exception e) {
                reporterName = task.getReporterId();
            }
        }
        payload.put("reporterName", reporterName);

        String assigneeName = "Belum ditugaskan";
        if (task.getAssigneeId() != null) {
            try {
                UUID assigneeUuid = UUID.fromString(task.getAssigneeId());
                assigneeName = userRepository.findById(assigneeUuid)
                        .map(u -> u.getFullName() != null ? u.getFullName() + " (" + u.getUsername() + ")" : u.getUsername())
                        .orElse(task.getAssigneeId());
            } catch (Exception e) {
                assigneeName = task.getAssigneeId();
            }
        }
        payload.put("assigneeName", assigneeName);

        payload.put("referenceType", task.getReferenceType() != null ? task.getReferenceType() : "");
        payload.put("referenceId", task.getReferenceId() != null ? task.getReferenceId() : "");
        payload.put("dueDate", task.getDueDate() != null ? task.getDueDate().toLocalDate().toString() : "");
        payload.put("createdAt", task.getCreatedAt() != null ? task.getCreatedAt().toString() : LocalDateTime.now().toString());
        payload.put("title", task.getTitle());
        payload.put("description", task.getDescription() != null ? task.getDescription() : "");
        payload.put("obsidianRef", task.getObsidianRef() != null ? task.getObsidianRef() : "");

        return payload;
    }
}
