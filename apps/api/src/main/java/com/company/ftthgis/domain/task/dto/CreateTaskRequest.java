package com.company.ftthgis.domain.task.dto;

import com.company.ftthgis.domain.task.entity.TaskPriority;
import com.company.ftthgis.domain.task.entity.TaskScope;
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

        String obsidianRef,

        LocalDateTime dueDate,

        /** GeoJSON Point coordinates [lng, lat] — optional, only for TENANT scope tasks */
        Double[] coordinates,

        /**
         * Portal visibility scope. If null, the backend defaults to PLATFORM_INTERNAL
         * for Super Admin callers and TENANT_INTERNAL for tenant callers.
         * studio-admin should always send PLATFORM_INTERNAL explicitly.
         * TENANT_INTERNAL cannot be set by Super Admin callers (403 enforced in service).
         */
        TaskScope scope
) {}
