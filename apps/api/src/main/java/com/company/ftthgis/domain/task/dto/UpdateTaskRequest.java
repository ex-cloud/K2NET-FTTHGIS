package com.company.ftthgis.domain.task.dto;

import com.company.ftthgis.domain.task.entity.TaskPriority;
import com.company.ftthgis.domain.task.entity.TaskStatus;

import java.time.LocalDateTime;

/**
 * All fields optional — PATCH semantics.
 * Only non-null fields will be applied by TaskService.
 */
public record UpdateTaskRequest(
        String title,
        String description,
        TaskStatus status,
        TaskPriority priority,
        String assigneeId,
        String referenceType,
        String referenceId,
        LocalDateTime dueDate,
        Double[] coordinates
) {}
