package com.company.ftthgis.service;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationAnalyticsService {

    private final JdbcTemplate jdbcTemplate;
    private final OrganizationRepository organizationRepository;

    public Map<String, Object> getOrganizationStats(String slug) {
        Organization org = organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
        
        UUID orgId = org.getId();
        log.info("📊 Fetching real stats for organization: {} ({})", org.getName(), orgId);

        Map<String, Object> stats = new HashMap<>();
        
        // Count Projects
        Integer projectCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM projects WHERE organization_id = ?", Integer.class, orgId);
        
        // Count ODCs (Nodes with type ODC in projects belonging to this org)
        Integer odcCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(n.*) FROM network_nodes n " +
                "JOIN projects p ON n.project_id = p.id " +
                "WHERE p.organization_id = ? AND n.type = 'ODC'", Integer.class, orgId);

        // Count ODPs
        Integer odpCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(n.*) FROM network_nodes n " +
                "JOIN projects p ON n.project_id = p.id " +
                "WHERE p.organization_id = ? AND n.type = 'ODP'", Integer.class, orgId);

        // Count Customers
        Integer customerCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(n.*) FROM network_nodes n " +
                "JOIN projects p ON n.project_id = p.id " +
                "WHERE p.organization_id = ? AND n.type = 'CUSTOMER'", Integer.class, orgId);

        // Calculate total cable length (in meters, assuming PostGIS)
        Double totalCableLength = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(ST_Length(geom::geography)), 0) FROM network_edges f " +
                "JOIN projects p ON f.project_id = p.id " +
                "WHERE p.organization_id = ?", Double.class, orgId);

        stats.put("projectCount", projectCount);
        stats.put("odcCount", odcCount);
        stats.put("odpCount", odpCount);
        stats.put("customerCount", customerCount);
        stats.put("totalCableLength", Math.round(totalCableLength != null ? totalCableLength : 0));
        stats.put("organizationName", org.getName());
        stats.put("organizationSlug", org.getSlug());

        return stats;
    }
}
