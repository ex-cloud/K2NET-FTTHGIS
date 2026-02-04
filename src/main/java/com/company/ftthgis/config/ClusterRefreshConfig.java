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
            // Check if view exists first to avoid errors during initial startup
            jdbcTemplate.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_clustered_nodes");
            log.info("--- [SCHEDULE] Clustered view refreshed successfully ---");
        } catch (Exception e) {
            log.warn("--- [SCHEDULE] Could not refresh clustered view (not created yet or no concurrent index): {} ---",
                    e.getMessage());
            // Fallback to simple refresh if concurrent fails (e.g. if index is missing)
            try {
                jdbcTemplate.execute("REFRESH MATERIALIZED VIEW mv_clustered_nodes");
                log.info("--- [SCHEDULE] Clustered view refreshed (fallback mode) ---");
            } catch (Exception ex) {
                log.error("--- [SCHEDULE] Critical: Failed to refresh clustered view: {} ---", ex.getMessage());
            }
        }
    }
}
