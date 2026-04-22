package com.company.ftthgis.domain.tenant.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataMigrationService {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("📢 [AUTO-MAINTENANCE] Investigating database project IDs...");
        try {
            // Diagnostic: Show sample IDs
            List<Map<String, Object>> samples = jdbcTemplate.queryForList(
                "SELECT DISTINCT project_id FROM network_nodes LIMIT 10");
            log.info("🔍 Current Project IDs in DB: {}", samples);
            
            migrateLegacyData("ftth-gis-1");
        } catch (Exception e) {
            log.error("⚠️ Maintenance check failed: {}", e.getMessage());
        }
    }

    @Transactional
    public String migrateLegacyData(String targetProjectId) {
        log.info("🚀 Aligning data to project: {}", targetProjectId);
        
        try {
            // 1. Convert any mismatched IDs to the current target
            int allUpdated = jdbcTemplate.update(
                "UPDATE network_nodes SET project_id = ? WHERE project_id IS NULL OR project_id != ?", 
                targetProjectId, targetProjectId);
            
            jdbcTemplate.update(
                "UPDATE network_edges SET project_id = ? WHERE project_id IS NULL OR project_id != ?", 
                targetProjectId, targetProjectId);

            jdbcTemplate.update(
                "UPDATE network_event_history SET project_id = ? WHERE project_id IS NULL OR project_id != ?", 
                targetProjectId, targetProjectId);

            log.info("✅ Total assets aligned to {}: {} nodes.", targetProjectId, allUpdated);
                
            return "Success";
                
        } catch (Exception e) {
            log.error("❌ SQL Alignment failed!", e);
            throw new RuntimeException("Alignment failed: " + e.getMessage());
        }
    }
}
