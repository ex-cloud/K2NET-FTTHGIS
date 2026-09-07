package com.company.ftthgis.api.system;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/security/spatial-governance")
@RequiredArgsConstructor
@Slf4j
public class SpatialGovernanceController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping
    @PreAuthorize("hasAuthority('system.audit.view') or hasAuthority('system.security.manage') or hasRole('super_admin')")
    public ResponseEntity<SpatialGovernanceReportDto> getSpatialGovernanceReport() {
        try {
            Long projectsWithAbac = jdbcTemplate.queryForObject(
                "SELECT COUNT(DISTINCT project_id) FROM project_members", Long.class
            );

            Long totalAssignments = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM project_members", Long.class
            );

            Long nullNodes = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM network_nodes WHERE project_id IS NULL", Long.class
            );

            Long nullEdges = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM network_edges WHERE project_id IS NULL", Long.class
            );

            String sqlProjects = """
                SELECT o.name AS organization, pr.name AS project, COUNT(pm.id) AS member_count
                FROM projects pr
                JOIN organizations o ON o.id = pr.organization_id
                LEFT JOIN project_members pm ON pm.project_id = pr.id
                GROUP BY o.name, pr.name
                ORDER BY o.name, pr.name
            """;

            List<ProjectMemberSummaryDto> projectSummaries = jdbcTemplate.query(sqlProjects, (rs, rowNum) ->
                new ProjectMemberSummaryDto(
                    rs.getString("organization"),
                    rs.getString("project"),
                    rs.getLong("member_count")
                )
            );

            SpatialGovernanceReportDto report = new SpatialGovernanceReportDto(
                projectsWithAbac != null ? projectsWithAbac : 0L,
                totalAssignments != null ? totalAssignments : 0L,
                nullNodes != null ? nullNodes : 0L,
                nullEdges != null ? nullEdges : 0L,
                (nullNodes != null && nullNodes == 0) && (nullEdges != null && nullEdges == 0),
                projectSummaries,
                Instant.now().toString()
            );

            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Failed to generate spatial governance report: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    public record SpatialGovernanceReportDto(
        long projectsWithAbacCount,
        long totalMemberAssignments,
        long legacyNullProjectNodes,
        long legacyNullProjectEdges,
        boolean legacyDataClean,
        List<ProjectMemberSummaryDto> projectSummaries,
        String checkedAt
    ) {}

    public record ProjectMemberSummaryDto(
        String organization,
        String project,
        long memberCount
    ) {}
}
