package com.company.ftthgis.domain.task.dto;

import com.company.ftthgis.domain.task.entity.TaskPriority;
import com.company.ftthgis.domain.task.entity.TaskType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

public record CreateTaskRequest(

        @NotNull(message = "Task type wajib diisi")
        TaskType type,

        @NotBlank(message = "Judul task tidak boleh kosong")
        @Size(max = 500, message = "Judul maksimal 500 karakter")
        String title,

        String description,

        TaskPriority priority,

        String assigneeId,

        String referenceType,
        String referenceId,

        UUID parentTaskId,

        LocalDateTime dueDate,

        /** GeoJSON Point coordinates [lng, lat] — optional */
        Double[] coordinates
) {}
