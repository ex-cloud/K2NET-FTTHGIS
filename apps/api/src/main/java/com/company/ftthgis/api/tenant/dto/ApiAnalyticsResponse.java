package com.company.ftthgis.api.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiAnalyticsResponse {
    private long totalRequests24h;
    private long totalRequests30d;
    private double successRatePercent;
    private double deliverySuccessRatePercent;
    private int p95LatencyMs;
    private long errorCount24h;
    private double rateLimitQuotaUsedPercent;
    private long totalThrottled429;
    private long activeTokensCount;
    private long activeEndpointsCount;
    private long pendingRetryCount;
    private long deadLetterCount;
    private List<DailyVolumeStat> dailyTimeseries;
    private List<DailyTrafficPoint> dailyTraffic;
    private StatusCodeBreakdown statusBreakdown;
    private Map<String, Long> statusDistribution;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyVolumeStat {
        private String date; // e.g. "2026-09-15"
        private long requests;
        private long errors;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyTrafficPoint {
        private String date; // e.g. "2026-09-15"
        private long totalRequests;
        private long successfulRequests;
        private long failedRequests;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusCodeBreakdown {
        private long status2xx;
        private long status4xx;
        private long status5xx;
    }
}
