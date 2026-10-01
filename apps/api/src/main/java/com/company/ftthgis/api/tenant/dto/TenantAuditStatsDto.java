package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Data Transfer Object for Tenant Activity & Audit Analytics Summary.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantAuditStatsDto {
    private long totalEvents24h;
    private long totalEvents7d;
    private long totalWarnErrors24h;
    private Map<String, Long> eventsByCategory;
    private Map<String, Long> eventsByAction;
    private Map<String, Long> eventsBySeverity;
    private List<ActorActivityDto> topActors;
    private List<DailyActivityTrendDto> dailyTrend;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActorActivityDto {
        private String actorId;
        private String actorEmail;
        private long eventCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyActivityTrendDto {
        private String date; // YYYY-MM-DD
        private long count;
    }
}
