package com.company.ftthgis.domain.task.entity;

import com.company.ftthgis.domain.tenant.entity.OrganizationAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.envers.Audited;
import org.hibernate.envers.NotAudited;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Unified task entity for both Ticketing (TICKET) and Project Management (PROJECT).
 *
 * <p>Tenant isolation is provided automatically by {@link OrganizationAwareEntity}
 * via Hibernate Filter on {@code organization_id}.
 *
 * <p>Portal visibility is controlled by {@link TaskScope}:
 * <ul>
 *   <li>{@code PLATFORM_INTERNAL} — studio-admin only (K2NET engineering)</li>
 *   <li>{@code TENANT_TO_PLATFORM} — B2B inbox at studio-admin, outbox at studio-tenant</li>
 *   <li>{@code TENANT_INTERNAL} — studio-tenant only, per-tenant isolated</li>
 * </ul>
 *
 * <p>Audit trail is handled automatically by Hibernate Envers ({@code tasks_aud} table).
 */
@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@Audited
public class Task extends OrganizationAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    // ── Classification ────────────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private TaskType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private TaskStatus status = TaskStatus.TODO;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 10)
    @Builder.Default
    private TaskPriority priority = TaskPriority.NORMAL;

    /**
     * Portal visibility scope — see {@link TaskScope} for documentation.
     * Defaults to {@code PLATFORM_INTERNAL} so that tasks created via studio-admin
     * by Super Admin are invisible to tenant portals unless explicitly set otherwise.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "scope", nullable = false, length = 30,
            columnDefinition = "task_scope_enum")
    @Builder.Default
    private TaskScope scope = TaskScope.PLATFORM_INTERNAL;

    // ── Content ───────────────────────────────────────────────────────────────

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // ── Keycloak User References ──────────────────────────────────────────────

    /** UUID of the Keycloak user who created/reported this task. */
    @Column(name = "reporter_id", nullable = false, length = 255)
    private String reporterId;

    /** UUID of the Keycloak user responsible for resolving this task. Nullable. */
    @Column(name = "assignee_id", length = 255)
    private String assigneeId;

    // ── GIS Reference ─────────────────────────────────────────────────────────

    /** Type of the spatial element linked to this task. E.g. 'ODP', 'ODC', 'FIBER_CABLE'. */
    @Column(name = "reference_type", length = 50)
    private String referenceType;

    /** ID of the spatial element. E.g. 'ODP-BDG-012'. */
    @Column(name = "reference_id", length = 255)
    private String referenceId;

    /**
     * Optional pin location for this task on the map.
     * Stored as PostGIS {@code geometry(Point, 4326)} — SRID 4326 (WGS84).
     * Consistent with {@code Project.boundaryGeom} using {@code hibernate-spatial}.
     */
    @Column(name = "location_geom", columnDefinition = "geometry(Point, 4326)")
    private Point locationGeom;

    // ── Task Hierarchy ────────────────────────────────────────────────────────

    /** Optional parent task UUID for sub-task relationships. */
    @Column(name = "parent_task_id")
    private UUID parentTaskId;

    // ── SLA & Scheduling ─────────────────────────────────────────────────────

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    // ── Obsidian Vault Reference ──────────────────────────────────────────────

    /**
     * Auto-generated reference for Obsidian Vault sync.
     * Format: {@code PRJ-YYYY-MM-NNN} for PROJECT, {@code TKT-YYYY-MM-NNN} for TICKET.
     * Populated by {@code TaskService} only for PROJECT type and HIGH/URGENT tickets.
     */
    @Column(name = "obsidian_ref", length = 255)
    private String obsidianRef;

    // ── Comments (Not audited separately — tracked via task_comments table) ───

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true,
               fetch = FetchType.LAZY)
    @NotAudited
    private List<TaskComment> comments;
}
