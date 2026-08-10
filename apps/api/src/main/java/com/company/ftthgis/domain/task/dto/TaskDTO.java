package com.company.ftthgis.domain.task.dto;

import com.company.ftthgis.domain.task.entity.TaskPriority;
import com.company.ftthgis.domain.task.entity.TaskScope;
import com.company.ftthgis.domain.task.entity.TaskStatus;
import com.company.ftthgis.domain.task.entity.TaskType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record TaskDTO(
        UUID id,
        TaskType type,
        TaskStatus status,
        TaskPriority priority,
        TaskScope scope,
        String title,
        String description,
        String reporterId,
        String assigneeId,
        UUID organizationId,
        String referenceType,
        String referenceId,
        UUID parentTaskId,
        LocalDateTime dueDate,
        LocalDateTime resolvedAt,
        String obsidianRef,
        List<TaskCommentDTO> comments,
        LocalDateTime createdAt,
        String createdBy,
        LocalDateTime updatedAt,
        String updatedBy
) {}
