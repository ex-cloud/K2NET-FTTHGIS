package com.company.ftthgis.api.system.dto;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

/**
 * <h1>TrashDto</h1>
 * <p>
 * DTO Container untuk data Recycle Bin tingkat platform, status retensi 30 hari,
 * dan statistik aggregasi entitas yang terhapus (soft-deleted).
 * </p>
 *
 * @author FTTH GIS Core Team
 * @version 2.6.0
 */
public class TrashDto {

    public record TrashItemResponse(
            String id,
            String name,
            String type, // ORGANIZATION, PROJECT, TASK, NETWORK_NODE, NETWORK_EDGE
            String identifier,
            String originName,
            String deletedAt,
            String deletedBy,
            int daysRemaining,
            Map<String, Object> details
    ) implements Serializable {}

    public record TrashStats(
            long total,
            long organizations,
            long projects,
            long tasks,
            long networkAssets
    ) implements Serializable {}

    public record TrashListResponse(
            List<TrashItemResponse> items,
            TrashStats stats
    ) implements Serializable {}

    public record TrashActionRequest(
            String type,
            String id
    ) implements Serializable {}

    public record TrashActionResult(
            boolean success,
            String message,
            Integer purgedCount
    ) implements Serializable {}
}
