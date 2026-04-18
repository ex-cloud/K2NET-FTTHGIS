package com.company.ftthgis.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class ClusterRefreshConfig {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Refreshes the clustered materialized view every 10 minutes.
     * CONCURRENTLY allows the view to be updated without locking it for reads.
     */
    @Scheduled(fixedRate = 600000)
    public void refreshClusteredView() {
        log.info("--- [SCHEDULE] Refreshing clustered materialized view ---");
        try {
            // Check if view and unique index exist to support CONCURRENTLY
            Integer indexCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM pg_indexes WHERE tablename = 'mv_clustered_nodes'", Integer.class);
            
            if (indexCount != null && indexCount > 0) {
                jdbcTemplate.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_clustered_nodes");
                log.info("--- [SCHEDULE] Clustered view refreshed CONCURRENTLY ---");
            } else {
                log.info("--- [SCHEDULE] Unique index missing, using non-concurrent refresh ---");
                jdbcTemplate.execute("REFRESH MATERIALIZED VIEW mv_clustered_nodes");
                log.info("--- [SCHEDULE] Clustered view refreshed (standard) ---");
            }
        } catch (Exception e) {
            log.warn("--- [SCHEDULE] Could not refresh clustered view: {} ---", e.getMessage());
            // Last fallback
            try {
                jdbcTemplate.execute("REFRESH MATERIALIZED VIEW mv_clustered_nodes");
            } catch (Exception ex) {
                log.error("--- [SCHEDULE] Critical failure: {}", ex.getMessage());
            }
        }
    }
}
