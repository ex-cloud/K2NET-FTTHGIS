package com.company.ftthgis.api.system;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/system/trash")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('system.trash.manage')")
public class TrashController {

    private final JdbcTemplate jdbcTemplate;
    private final com.company.ftthgis.service.OrganizationService organizationService;

    public record TrashItemResponse(
            String id,
            String name,
            String type, // ORGANIZATION, PROJECT, TASK, NETWORK_NODE, NETWORK_EDGE
            String identifier,
            String originName,
            String deletedAt,
            String deletedBy,
            int daysRemaining,
            Map<String, Object> details
    ) {}

    public record TrashStats(
            long total,
            long organizations,
            long projects,
            long tasks,
            long networkAssets
    ) {}

    public record TrashListResponse(
            List<TrashItemResponse> items,
            TrashStats stats
    ) {}

    public record TrashActionRequest(
            String type,
            String id
    ) {}

    @GetMapping
    public ResponseEntity<TrashListResponse> listTrashItems(
            @RequestParam(required = false, defaultValue = "all") String category,
            @RequestParam(required = false) String query
    ) {
        List<TrashItemResponse> items = new ArrayList<>();
        long countOrgs = 0, countProjects = 0, countTasks = 0, countAssets = 0;

        Instant now = Instant.now();
        String searchPattern = (query != null && !query.trim().isEmpty()) ? "%" + query.trim().toLowerCase() + "%" : null;

        // 1. Organizations
        if ("all".equalsIgnoreCase(category) || "organizations".equalsIgnoreCase(category)) {
            try {
                String sql = "SELECT id, name, slug, deleted_at, deleted_by FROM organizations WHERE deleted_at IS NOT NULL";
                if (searchPattern != null) {
                    sql += " AND (LOWER(name) LIKE ? OR LOWER(slug) LIKE ?)";
                }
                sql += " ORDER BY deleted_at DESC LIMIT 100";

                List<Map<String, Object>> rows = searchPattern != null
                        ? jdbcTemplate.queryForList(sql, searchPattern, searchPattern)
                        : jdbcTemplate.queryForList(sql);

                for (Map<String, Object> r : rows) {
                    Timestamp delTs = (Timestamp) r.get("deleted_at");
                    int daysRemaining = computeDaysRemaining(delTs, now);
                    items.add(new TrashItemResponse(
                            r.get("id").toString(),
                            (String) r.get("name"),
                            "ORGANIZATION",
                            (String) r.get("slug"),
                            "Root System",
                            delTs != null ? delTs.toInstant().toString() : "—",
                            r.get("deleted_by") != null ? (String) r.get("deleted_by") : "Admin",
                            daysRemaining,
                            Map.of("slug", r.get("slug") != null ? r.get("slug") : "")
                    ));
                }
            } catch (Exception e) {
                log.warn("[Trash] Failed to query deleted organizations: {}", e.getMessage());
            }
        }

        // 2. Projects
        if ("all".equalsIgnoreCase(category) || "projects".equalsIgnoreCase(category)) {
            try {
                String sql = """
                    SELECT p.id, p.name, p.code, p.deleted_at, p.deleted_by, o.name AS org_name
                    FROM projects p
                    LEFT JOIN organizations o ON p.organization_id = o.id
                    WHERE p.deleted_at IS NOT NULL
                """;
                if (searchPattern != null) {
                    sql += " AND (LOWER(p.name) LIKE ? OR LOWER(p.code) LIKE ?)";
                }
                sql += " ORDER BY p.deleted_at DESC LIMIT 100";

                List<Map<String, Object>> rows = searchPattern != null
                        ? jdbcTemplate.queryForList(sql, searchPattern, searchPattern)
                        : jdbcTemplate.queryForList(sql);

                for (Map<String, Object> r : rows) {
                    Timestamp delTs = (Timestamp) r.get("deleted_at");
                    int daysRemaining = computeDaysRemaining(delTs, now);
                    items.add(new TrashItemResponse(
                            r.get("id").toString(),
                            (String) r.get("name"),
                            "PROJECT",
                            (String) r.get("code"),
                            r.get("org_name") != null ? (String) r.get("org_name") : "Tenant",
                            delTs != null ? delTs.toInstant().toString() : "—",
                            r.get("deleted_by") != null ? (String) r.get("deleted_by") : "System",
                            daysRemaining,
                            Map.of("code", r.get("code") != null ? r.get("code") : "")
                    ));
                }
            } catch (Exception e) {
                log.warn("[Trash] Failed to query deleted projects: {}", e.getMessage());
            }
        }

        // 3. Tasks
        if ("all".equalsIgnoreCase(category) || "tasks".equalsIgnoreCase(category)) {
            try {
                String sql = """
                    SELECT t.id, t.title, t.priority, t.status, t.deleted_at, t.deleted_by, o.name AS org_name
                    FROM tasks t
                    LEFT JOIN organizations o ON t.organization_id = o.id
                    WHERE t.deleted_at IS NOT NULL
                """;
                if (searchPattern != null) {
                    sql += " AND (LOWER(t.title) LIKE ?)";
                }
                sql += " ORDER BY t.deleted_at DESC LIMIT 100";

                List<Map<String, Object>> rows = searchPattern != null
                        ? jdbcTemplate.queryForList(sql, searchPattern)
                        : jdbcTemplate.queryForList(sql);

                for (Map<String, Object> r : rows) {
                    Timestamp delTs = (Timestamp) r.get("deleted_at");
                    int daysRemaining = computeDaysRemaining(delTs, now);
                    items.add(new TrashItemResponse(
                            r.get("id").toString(),
                            (String) r.get("title"),
                            "TASK",
                            (String) r.get("status"),
                            r.get("org_name") != null ? (String) r.get("org_name") : "Tenant",
                            delTs != null ? delTs.toInstant().toString() : "—",
                            r.get("deleted_by") != null ? (String) r.get("deleted_by") : "User",
                            daysRemaining,
                            Map.of("status", r.get("status") != null ? r.get("status") : "",
                                   "priority", r.get("priority") != null ? r.get("priority") : "")
                    ));
                }
            } catch (Exception e) {
                log.warn("[Trash] Failed to query deleted tasks: {}", e.getMessage());
            }
        }

        // 4. Network Assets (Nodes & Edges)
        if ("all".equalsIgnoreCase(category) || "assets".equalsIgnoreCase(category)) {
            try {
                String sql = """
                    SELECT n.id, n.code, n.node_type, n.deleted_at, n.deleted_by, o.name AS org_name
                    FROM network_nodes n
                    LEFT JOIN organizations o ON n.organization_id = o.id
                    WHERE n.deleted_at IS NOT NULL
                """;
                if (searchPattern != null) {
                    sql += " AND (LOWER(n.code) LIKE ? OR LOWER(n.node_type) LIKE ?)";
                }
                sql += " ORDER BY n.deleted_at DESC LIMIT 50";

                List<Map<String, Object>> rows = searchPattern != null
                        ? jdbcTemplate.queryForList(sql, searchPattern, searchPattern)
                        : jdbcTemplate.queryForList(sql);

                for (Map<String, Object> r : rows) {
                    Timestamp delTs = (Timestamp) r.get("deleted_at");
                    int daysRemaining = computeDaysRemaining(delTs, now);
                    items.add(new TrashItemResponse(
                            r.get("id").toString(),
                            "Node " + r.get("code"),
                            "NETWORK_NODE",
                            (String) r.get("code"),
                            r.get("org_name") != null ? (String) r.get("org_name") : "Tenant",
                            delTs != null ? delTs.toInstant().toString() : "—",
                            r.get("deleted_by") != null ? (String) r.get("deleted_by") : "GIS Eng",
                            daysRemaining,
                            Map.of("nodeType", r.get("node_type") != null ? r.get("node_type") : "")
                    ));
                }
            } catch (Exception e) {
                log.warn("[Trash] Failed to query deleted network nodes: {}", e.getMessage());
            }
        }

        // Compute total stats
        try {
            countOrgs = queryCount("SELECT COUNT(*) FROM organizations WHERE deleted_at IS NOT NULL");
            countProjects = queryCount("SELECT COUNT(*) FROM projects WHERE deleted_at IS NOT NULL");
            countTasks = queryCount("SELECT COUNT(*) FROM tasks WHERE deleted_at IS NOT NULL");
            countAssets = queryCount("SELECT COUNT(*) FROM network_nodes WHERE deleted_at IS NOT NULL");
        } catch (Exception ignored) {}

        TrashStats stats = new TrashStats(
                countOrgs + countProjects + countTasks + countAssets,
                countOrgs,
                countProjects,
                countTasks,
                countAssets
        );

        return ResponseEntity.ok(new TrashListResponse(items, stats));
    }

    @PostMapping("/restore")
    public ResponseEntity<?> restoreTrashItem(@RequestBody TrashActionRequest req) {
        if (req.type() == null || req.id() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "type and id are required"));
        }

        if ("ORGANIZATION".equalsIgnoreCase(req.type())) {
            try {
                organizationService.restoreOrganization(req.id());
                log.info("[Trash] Restored organization and re-enabled Keycloak realm for id {}", req.id());
                return ResponseEntity.ok(Map.of("success", true, "message", "Organization restored and Keycloak realm re-enabled"));
            } catch (Exception e) {
                log.error("[Trash] Failed to restore organization", e);
                return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
            }
        }

        String table = resolveTable(req.type());
        if (table == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid entity type: " + req.type()));
        }

        try {
            int updated = jdbcTemplate.update(
                    "UPDATE " + table + " SET deleted_at = NULL, deleted_by = NULL WHERE id = CAST(? AS uuid)",
                    req.id()
            );
            if (updated > 0) {
                log.info("[Trash] Restored {} with id {}", req.type(), req.id());
                return ResponseEntity.ok(Map.of("success", true, "message", "Item restored successfully"));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Item not found in trash"));
            }
        } catch (Exception e) {
            log.error("[Trash] Failed to restore item", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/permanent")
    public ResponseEntity<?> permanentDelete(@RequestBody TrashActionRequest req) {
        if (req.type() == null || req.id() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "type and id are required"));
        }

        if ("ORGANIZATION".equalsIgnoreCase(req.type())) {
            try {
                organizationService.deleteOrganization(req.id(), "nuclear", "Recycle Bin Permanent Nuclear Wipe");
                log.info("[Trash] Nuclear deleted organization and destroyed Keycloak realm for id {}", req.id());
                return ResponseEntity.ok(Map.of("success", true, "message", "Organization and Keycloak realm permanently destroyed"));
            } catch (Exception e) {
                log.error("[Trash] Failed to permanently delete organization", e);
                return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
            }
        }

        String table = resolveTable(req.type());
        if (table == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid entity type: " + req.type()));
        }

        try {
            int deleted = jdbcTemplate.update(
                    "DELETE FROM " + table + " WHERE id = CAST(? AS uuid) AND deleted_at IS NOT NULL",
                    req.id()
            );
            if (deleted > 0) {
                log.info("[Trash] Permanently deleted {} with id {}", req.type(), req.id());
                return ResponseEntity.ok(Map.of("success", true, "message", "Item permanently deleted"));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Item not found in trash"));
            }
        } catch (Exception e) {
            log.error("[Trash] Failed to permanently delete item", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/empty")
    public ResponseEntity<?> emptyTrash(@RequestParam(required = false, defaultValue = "all") String category) {
        int totalDeleted = 0;
        try {
            if ("all".equalsIgnoreCase(category) || "tasks".equalsIgnoreCase(category)) {
                totalDeleted += jdbcTemplate.update("DELETE FROM tasks WHERE deleted_at IS NOT NULL");
            }
            if ("all".equalsIgnoreCase(category) || "assets".equalsIgnoreCase(category)) {
                totalDeleted += jdbcTemplate.update("DELETE FROM network_nodes WHERE deleted_at IS NOT NULL");
            }
            if ("all".equalsIgnoreCase(category) || "projects".equalsIgnoreCase(category)) {
                totalDeleted += jdbcTemplate.update("DELETE FROM projects WHERE deleted_at IS NOT NULL");
            }
            if ("all".equalsIgnoreCase(category) || "organizations".equalsIgnoreCase(category)) {
                totalDeleted += jdbcTemplate.update("DELETE FROM organizations WHERE deleted_at IS NOT NULL");
            }

            log.info("[Trash] Emptied trash for category {}. Total purged: {}", category, totalDeleted);
            return ResponseEntity.ok(Map.of("success", true, "purgedCount", totalDeleted));
        } catch (Exception e) {
            log.error("[Trash] Failed to empty trash", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    private String resolveTable(String type) {
        return switch (type.toUpperCase()) {
            case "ORGANIZATION" -> "organizations";
            case "PROJECT" -> "projects";
            case "TASK" -> "tasks";
            case "NETWORK_NODE", "NODE" -> "network_nodes";
            case "NETWORK_EDGE", "EDGE" -> "network_edges";
            default -> null;
        };
    }

    private int computeDaysRemaining(Timestamp deletedAt, Instant now) {
        if (deletedAt == null) return 30;
        long daysPassed = Duration.between(deletedAt.toInstant(), now).toDays();
        return (int) Math.max(0, 30 - daysPassed);
    }

    private long queryCount(String sql) {
        Long val = jdbcTemplate.queryForObject(sql, Long.class);
        return val != null ? val : 0;
    }
}
