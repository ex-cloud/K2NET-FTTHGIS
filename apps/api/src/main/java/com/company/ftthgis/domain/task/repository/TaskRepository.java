package com.company.ftthgis.domain.task.repository;

import com.company.ftthgis.domain.task.entity.Task;
import com.company.ftthgis.domain.task.entity.TaskPriority;
import com.company.ftthgis.domain.task.entity.TaskScope;
import com.company.ftthgis.domain.task.entity.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {

    /** All tasks for a tenant, paginated. Hibernate Filter handles org scoping. */
    Page<Task> findAll(Pageable pageable);

    /** Count tasks not in terminal states — for KPI summary card. */
    @Query("SELECT COUNT(t) FROM Task t WHERE t.status NOT IN :terminalStatuses")
    long countOpenTasks(@Param("terminalStatuses") List<TaskStatus> terminalStatuses);

    /** Count URGENT tasks not in terminal states — for KPI alert badge. */
    @Query("SELECT COUNT(t) FROM Task t WHERE t.priority = :priority AND t.status NOT IN :terminalStatuses")
    long countByPriorityAndStatusNotIn(
            @Param("priority") TaskPriority priority,
            @Param("terminalStatuses") List<TaskStatus> terminalStatuses
    );

    /** Count tasks resolved today — for KPI resolved counter. */
    @Query("SELECT COUNT(t) FROM Task t WHERE t.status = 'RESOLVED' AND t.resolvedAt >= :startOfDay")
    long countResolvedToday(@Param("startOfDay") LocalDateTime startOfDay);

    /** Count per-org and per-type for sequence generation (obsidianRef). */
    @Query("SELECT COUNT(t) FROM Task t WHERE t.organization.id = :orgId AND t.type = :type AND YEAR(t.createdAt) = :year AND MONTH(t.createdAt) = :month")
    long countTasksForMonth(
            @Param("orgId") UUID orgId,
            @Param("type") com.company.ftthgis.domain.task.entity.TaskType type,
            @Param("year") int year,
            @Param("month") int month
    );

    /** Fetch all tasks having non-null geometry for spatial map integration. */
    @Query("SELECT t FROM Task t WHERE t.locationGeom IS NOT NULL")
    List<Task> findAllWithLocation();

    // ── Scope-based queries (Phase 5: Portal Isolation) ──────────────────────

    /** Filter tasks by a single scope value — paginated. Hibernate Filter scopes by org if active. */
    Page<Task> findByScope(TaskScope scope, Pageable pageable);

    /** Filter tasks matching any of the given scopes — used by studio-admin combined view. */
    Page<Task> findByScopeIn(List<TaskScope> scopes, Pageable pageable);

    /** Find all sub-tasks belonging to a parent task. */
    List<Task> findByParentTaskId(UUID parentTaskId);
}

