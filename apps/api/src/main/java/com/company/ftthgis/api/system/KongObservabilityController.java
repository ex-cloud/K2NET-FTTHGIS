package com.company.ftthgis.api.system;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * KongObservabilityController
 *
 * Provides Kong traffic history aggregated from the audit_events table.
 * The Kong http-log plugin pushes every inbound request to gateway-audit,
 * which stores them in audit_events. We group by hour to produce a time-series
 * suitable for the API Gateway dashboard area chart.
 */
@RestController
@RequestMapping("/api/v1/system/kong")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("isAuthenticated()")
public class KongObservabilityController {

    private final JdbcTemplate jdbcTemplate;

    private static final DateTimeFormatter HOUR_FORMATTER =
            DateTimeFormatter.ofPattern("HH:mm");

    /**
     * Returns hourly request counts for the last N hours from audit_events.
     * Splits totals into "api" (backend service) and "gateways" (Go microservices).
     *
     * @param hours number of hours to look back (default: 12)
     */
    @GetMapping("/traffic-history")
    public ResponseEntity<List<Map<String, Object>>> getTrafficHistory(
            @RequestParam(value = "hours", defaultValue = "12") int hours
    ) {
        List<Map<String, Object>> result = new ArrayList<>();
        try {
            String sql =
                    "SELECT " +
                    "    DATE_TRUNC('hour', occurred_at) AS hour_bucket, " +
                    "    COUNT(*) FILTER (WHERE resource_type = 'EDGE_API' " +
                    "        AND action NOT LIKE '%/api/v1/notify%' " +
                    "        AND action NOT LIKE '%/api/v1/geocode%' " +
                    "        AND action NOT LIKE '%/api/v1/storage%' " +
                    "        AND action NOT LIKE '%/api/v1/audit%' " +
                    "        AND action NOT LIKE '%/api/v1/wa%' " +
                    "        AND action NOT LIKE '%/api/v1/olt%' " +
                    "        AND action NOT LIKE '%/api/v1/export%' " +
                    "        AND action NOT LIKE '%/api/v1/scheduler%') AS api_count, " +
                    "    COUNT(*) FILTER (WHERE resource_type = 'EDGE_API' " +
                    "        AND (action LIKE '%/api/v1/notify%' " +
                    "          OR action LIKE '%/api/v1/geocode%' " +
                    "          OR action LIKE '%/api/v1/storage%' " +
                    "          OR action LIKE '%/api/v1/audit%' " +
                    "          OR action LIKE '%/api/v1/wa%' " +
                    "          OR action LIKE '%/api/v1/olt%' " +
                    "          OR action LIKE '%/api/v1/export%' " +
                    "          OR action LIKE '%/api/v1/scheduler%')) AS gateways_count " +
                    "FROM audit_events " +
                    "WHERE occurred_at >= NOW() - CAST(? AS INTERVAL) " +
                    "GROUP BY hour_bucket " +
                    "ORDER BY hour_bucket ASC";

            String intervalParam = hours + " hours";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, intervalParam);

            // Build a complete timeline — fill gaps with zero
            LocalDateTime now = LocalDateTime.now().withMinute(0).withSecond(0).withNano(0);
            Map<String, long[]> buckets = new LinkedHashMap<>();
            for (int i = hours - 1; i >= 0; i--) {
                LocalDateTime bucket = now.minusHours(i);
                String label = bucket.format(HOUR_FORMATTER);
                buckets.put(label, new long[]{0L, 0L});
            }

            for (Map<String, Object> row : rows) {
                Object bucketObj = row.get("hour_bucket");
                if (bucketObj instanceof java.sql.Timestamp ts) {
                    String label = ts.toLocalDateTime().format(HOUR_FORMATTER);
                    long apiCnt = ((Number) row.getOrDefault("api_count", 0)).longValue();
                    long gwCnt = ((Number) row.getOrDefault("gateways_count", 0)).longValue();
                    if (buckets.containsKey(label)) {
                        buckets.put(label, new long[]{apiCnt, gwCnt});
                    }
                }
            }

            for (Map.Entry<String, long[]> entry : buckets.entrySet()) {
                Map<String, Object> point = new LinkedHashMap<>();
                point.put("hour", entry.getKey());
                point.put("api", entry.getValue()[0]);
                point.put("gateways", entry.getValue()[1]);
                result.add(point);
            }

        } catch (Exception ex) {
            log.warn("[KongObservability] Failed to query traffic history: {}", ex.getMessage());
            // Return empty list — frontend falls back to synthetic distribution
        }
        return ResponseEntity.ok(result);
    }
}
