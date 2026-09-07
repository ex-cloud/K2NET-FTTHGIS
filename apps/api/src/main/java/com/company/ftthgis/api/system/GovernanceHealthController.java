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
@RequestMapping("/api/v1/security/governance-health")
@RequiredArgsConstructor
@Slf4j
public class GovernanceHealthController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping
    @PreAuthorize("hasAuthority('system.audit.view') or hasAuthority('system.security.manage') or hasRole('super_admin')")
    public ResponseEntity<GovernanceHealthReportDto> getGovernanceHealth() {
        try {
            // Ensure pg_trgm extension is active for similarity calculations
            try {
                jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm");
            } catch (Exception ex) {
                log.debug("pg_trgm extension check note: {}", ex.getMessage());
            }

            // 1. Orphaned Permissions (Defined in catalog but not assigned to any role)
            String sqlOrphaned = """
                SELECT p.id, p.code, p.module, p.scope, p.name
                FROM permissions p
                LEFT JOIN role_permissions rp ON rp.permission_id = p.id
                WHERE rp.permission_id IS NULL
                ORDER BY p.module, p.code
            """;
            List<OrphanedPermissionDto> orphanedPermissions = jdbcTemplate.query(sqlOrphaned, (rs, rowNum) ->
                new OrphanedPermissionDto(
                    rs.getLong("id"),
                    rs.getString("code"),
                    rs.getString("module"),
                    rs.getString("scope"),
                    rs.getString("name")
                )
            );

            // 2. Roles Without Permissions (Zero access granted)
            String sqlEmptyRoles = """
                SELECT r.id, r.name, r.scope, r.is_system_role, r.display_name
                FROM roles r
                LEFT JOIN role_permissions rp ON rp.role_id = r.id
                WHERE rp.role_id IS NULL
                ORDER BY r.scope, r.name
            """;
            List<EmptyRoleDto> rolesWithoutPermissions = jdbcTemplate.query(sqlEmptyRoles, (rs, rowNum) ->
                new EmptyRoleDto(
                    rs.getLong("id"),
                    rs.getString("name"),
                    rs.getString("scope"),
                    rs.getBoolean("is_system_role"),
                    rs.getString("display_name")
                )
            );

            // 3. Similar Role Names within the same scope (Potential concept duplication, score > 0.4)
            String sqlSimilar = """
                SELECT a.id AS role_a_id, a.name AS role_a, b.id AS role_b_id, b.name AS role_b,
                       ROUND(similarity(a.name, b.name)::numeric, 2) AS score
                FROM roles a, roles b
                WHERE a.id < b.id AND a.scope = b.scope AND similarity(a.name, b.name) > 0.4
                ORDER BY score DESC
            """;
            List<SimilarRolePairDto> similarRoleNamePairs = jdbcTemplate.query(sqlSimilar, (rs, rowNum) ->
                new SimilarRolePairDto(
                    rs.getLong("role_a_id"),
                    rs.getString("role_a"),
                    rs.getLong("role_b_id"),
                    rs.getString("role_b"),
                    rs.getDouble("score")
                )
            );

            int totalIssues = orphanedPermissions.size() + rolesWithoutPermissions.size() + similarRoleNamePairs.size();

            GovernanceHealthReportDto report = new GovernanceHealthReportDto(
                orphanedPermissions,
                rolesWithoutPermissions,
                similarRoleNamePairs,
                totalIssues,
                Instant.now().toString()
            );

            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Failed to calculate governance health report: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    public record GovernanceHealthReportDto(
        List<OrphanedPermissionDto> orphanedPermissions,
        List<EmptyRoleDto> rolesWithoutPermissions,
        List<SimilarRolePairDto> similarRoleNamePairs,
        int totalIssues,
        String checkedAt
    ) {}

    public record OrphanedPermissionDto(
        Long id,
        String code,
        String module,
        String scope,
        String name
    ) {}

    public record EmptyRoleDto(
        Long id,
        String name,
        String scope,
        boolean isSystemRole,
        String displayName
    ) {}

    public record SimilarRolePairDto(
        Long roleAId,
        String roleA,
        Long roleBId,
        String roleB,
        double score
    ) {}
}
