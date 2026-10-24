package com.company.ftthgis.domain.task.dto;

import com.company.ftthgis.domain.task.entity.TaskPriority;

/**
 * <h1>EscalateTicketRequest</h1>
 * <p>
 * Permintaan eskalasi B2B Support Ticket (TENANT_TO_PLATFORM) menjadi
 * Engineering Issue internal (PLATFORM_INTERNAL).
 * Seluruh field bersifat opsional (default fallback ke nilai tiket asli).
 * </p>
 */
public record EscalateTicketRequest(
        String title,
        String description,
        TaskPriority priority,
        String assigneeId
) {}
