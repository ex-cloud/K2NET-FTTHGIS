package com.company.ftthgis.domain.task.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record TaskCommentDTO(
        UUID id,
        UUID taskId,
        String authorId,
        String content,
        LocalDateTime createdAt,
        String createdBy
) {}
