package com.company.ftthgis.service.system;

import com.company.ftthgis.service.AuditLoggingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Periodically scans PostgreSQL pg_stat_statements for slow queries (>200ms)
 * and forwards structured database telemetry events to the gateway-audit service.
 * Uses query hash deduplication to avoid repetitive audit flood for identical query signatures.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseSlowQueryAuditPoller {

    private final JdbcTemplate jdbcTemplate;
    private final AuditLoggingService auditLoggingService;

    // Track last seen total execution count per query ID to emit only on new slow executions
    private final Map<Long, Long> queryLastCallCount = new ConcurrentHashMap<>();

    @Scheduled(fixedDelay = 60000, initialDelay = 30000)
    public void pollSlowQueries() {
        try {
            String checkQuery = "SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'";
            List<Integer> extensionExists = jdbcTemplate.query(checkQuery, (rs, rowNum) -> rs.getInt(1));
            if (extensionExists.isEmpty()) {
                return;
            }

            // Query slow queries exceeding 200ms mean execution time
            String sql = "SELECT q.queryid, q.query, q.calls, q.total_exec_time as total_time, " +
                    "q.mean_exec_time as mean_time, q.rows, COALESCE(r.rolname, 'postgres') as role " +
                    "FROM pg_stat_statements q " +
                    "LEFT JOIN pg_roles r ON q.userid = r.oid " +
                    "WHERE q.mean_exec_time >= 200.0 " +
                    "ORDER BY q.mean_exec_time DESC " +
                    "LIMIT 10";

            List<Map<String, Object>> slowQueries = jdbcTemplate.query(sql, (rs, rowNum) -> {
                Map<String, Object> map = new HashMap<>();
                map.put("queryid", rs.getLong("queryid"));
                map.put("query", rs.getString("query"));
                map.put("calls", rs.getLong("calls"));
                map.put("total_time", rs.getDouble("total_time"));
                map.put("mean_time", rs.getDouble("mean_time"));
                map.put("rows", rs.getLong("rows"));
                map.put("role", rs.getString("role"));
                return map;
            });

            for (Map<String, Object> q : slowQueries) {
                Long queryId = (Long) q.get("queryid");
                Long calls = (Long) q.get("calls");
                Long lastCalls = queryLastCallCount.get(queryId);

                // Emit only if this query has been executed since last check
                if (lastCalls == null || !lastCalls.equals(calls)) {
                    queryLastCallCount.put(queryId, calls);

                    String queryText = (String) q.get("query");
                    Double meanTime = (Double) q.get("mean_time");
                    Double totalTime = (Double) q.get("total_time");
                    String dbUser = (String) q.get("role");

                    Map<String, Object> metadata = new HashMap<>();
                    metadata.put("logGroup", "CORE");
                    metadata.put("serviceSource", "ftth-postgres");
                    metadata.put("scope", "SYSTEM_CORE");
                    metadata.put("severity", "WARN");
                    metadata.put("category", "DATABASE_OBSERVABILITY");
                    metadata.put("database_name", "ftth_gis");
                    metadata.put("database_user", dbUser);
                    metadata.put("query", queryText);
                    metadata.put("query_id", String.valueOf(queryId));
                    metadata.put("meanTimeMs", meanTime);
                    metadata.put("totalTimeMs", totalTime);
                    metadata.put("calls", calls);
                    metadata.put("status", 200);
                    metadata.put("method", "SQL");
                    metadata.put("pathname", "/db/slow-query/" + queryId);
                    metadata.put("userAgent", "PostgreSQL/17.0 Engine");
                    metadata.put("host", "ftth-postgres:5432");

                    auditLoggingService.logEvent(
                            "system",
                            "DATABASE_SLOW_QUERY",
                            "DATABASE_QUERY",
                            String.valueOf(queryId),
                            null,
                            null,
                            metadata
                    );
                }
            }
        } catch (Exception e) {
            log.debug("Database slow query polling skipped: {}", e.getMessage());
        }
    }
}
