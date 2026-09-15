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
    private long totalRequests30d;
    private double deliverySuccessRatePercent;
    private int p95LatencyMs;
    private long totalThrottled429;
    private long activeTokensCount;
    private long activeEndpointsCount;
    private long pendingRetryCount;
    private long deadLetterCount;
    private List<DailyTrafficPoint> dailyTraffic;
    private Map<String, Long> statusDistribution;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyTrafficPoint {
        private String date; // e.g. "09-10"
        private long totalRequests;
        private long successfulRequests;
        private long failedRequests;
    }
}
