package com.company.ftthgis.api.network;

import com.company.ftthgis.api.network.dto.NetworkStatsDto;
import com.company.ftthgis.domain.network.repository.ODCRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/network/analytics")
@RequiredArgsConstructor
@Slf4j
public class NetworkAnalyticsController {

        private final ODCRepository odcRepository;
        private final JdbcTemplate jdbcTemplate;

        @GetMapping("/stats")
        @org.springframework.cache.annotation.Cacheable(value = "dashboard_stats", key = "'network_analytics_' + (T(com.company.ftthgis.config.tenant.TenantContext).getTenantId() ?: 'global')")
        public ResponseEntity<NetworkStatsDto> getStats() {
                log.info("Requesting real-time network statistics...");

                try {
                        String tenantId = com.company.ftthgis.config.tenant.TenantContext.getTenantId();
                        boolean hasTenant = tenantId != null && !tenantId.isEmpty();
                        String projectFilterStr = hasTenant ? " WHERE project_id = ?" : "";
                        String projectFilterAndStr = hasTenant ? " AND project_id = ?" : "";
                        Object[] args = hasTenant ? new Object[] { tenantId } : new Object[] {};

                        Long odcCountObj = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM network_nodes WHERE node_type = 'ODC'" + projectFilterAndStr, Long.class, args);
                        Long odpCountObj = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM network_nodes WHERE node_type = 'ODP'" + projectFilterAndStr, Long.class, args);
                        Long customerCountObj = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM network_nodes WHERE node_type = 'CUSTOMER'" + projectFilterAndStr, Long.class, args);

                        long odcCount = odcCountObj != null ? odcCountObj : 0L;
                        long odpCount = odpCountObj != null ? odpCountObj : 0L;
                        long customerCount = customerCountObj != null ? customerCountObj : 0L;

                        // Calculate total cable length in KM from PostGIS
                        Double totalLengthMeters = jdbcTemplate.queryForObject(
                                        "SELECT SUM(length_meters) FROM network_edges" + projectFilterStr, Double.class,
                                        args);
                        double lengthKm = totalLengthMeters != null ? totalLengthMeters / 1000.0 : 0.0;

                        // 1. Capacity Monitoring (Top 3 ODCs by usage percentage)
                        List<NetworkStatsDto.CapacityItem> capacities = odcRepository.findAll().stream()
                                        .filter(o -> !hasTenant || (o.getProject() != null
                                                        && java.util.Objects.equals(tenantId, o.getProject().getId().toString())))
                                        .map(o -> {
                                                double p = o.getCapacity() > 0
                                                                ? (double) o.getUsedCapacity() / o.getCapacity() * 100
                                                                : 0;
                                                return NetworkStatsDto.CapacityItem.builder()
                                                                .label(o.getCode())
                                                                .percentage(Math.round(p * 10.0) / 10.0)
                                                                .color(p > 75 ? "emerald" : (p > 45 ? "sky" : "slate"))
                                                                .build();
                                        })
                                        .sorted((a, b) -> Double.compare(b.getPercentage(), a.getPercentage()))
                                        .limit(3)
                                        .collect(Collectors.toList());

                        // 2. Active Maintenance Monitoring (Nodes with status non-ACTIVE)
                        String mainQuery = "SELECT n.id, n.node_type, n.status, n.code " +
                                        "FROM network_nodes n " +
                                        "WHERE n.status IN ('BROKEN', 'MAINTENANCE', 'UNDER_REPAIR')"
                                        + projectFilterAndStr + " LIMIT 5";

                        List<NetworkStatsDto.MaintenanceItem> maintenances = jdbcTemplate.query(
                                        mainQuery,
                                        (rs, rowNum) -> NetworkStatsDto.MaintenanceItem.builder()
                                                        .id(rs.getString("id"))
                                                        .code(rs.getString("code") != null ? rs.getString("code")
                                                                        : rs.getString("node_type") + "-"
                                                                                        + rs.getString("id"))
                                                        .type(rs.getString("node_type"))
                                                        .description(rs.getString("status").equalsIgnoreCase("BROKEN")
                                                                        ? "Critical Repair"
                                                                        : "Routine Service")
                                                        .severity(rs.getString("status").equalsIgnoreCase("BROKEN")
                                                                        ? "critical"
                                                                        : "warning")
                                                        .build(),
                                        args);

                        NetworkStatsDto stats = NetworkStatsDto.builder()
                                        .totalOdc(odcCount)
                                        .totalOdp(odpCount)
                                        .totalNodes(odcCount + odpCount + customerCount)
                                        .totalCableLengthKm(lengthKm)
                                        .totalUsers(customerCount) // Showing customers as users for network stats
                                        .growthPercentage(0.0) 
                                        .activeMaintenanceCount(maintenances.size())
                                        .topCapacities(capacities)
                                        .activeMaintenances(maintenances)
                                        .build();

                        return ResponseEntity.ok(stats);
                } catch (Exception e) {
                        log.error("Failed to generate network analytics stats", e);
                        throw e;
                }
        }
}
