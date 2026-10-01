package com.company.ftthgis.service.system;

import com.company.ftthgis.api.system.dto.TrashDto.*;
import com.company.ftthgis.service.OrganizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * <h1>TrashService</h1>
 * <p>
 * Domain Service tingkat platform untuk mengelola siklus hidup data Recycle Bin,
 * penghitungan masa tenggang retensi 30 hari, pemulihan data (restore), serta
 * pemusnahan permanen (nuclear cascade purge) lintas 5 entitas domain:
 * Organizations, Projects, Tasks, Network Nodes, dan Network Edges.
 * </p>
 *
 * @author FTTH GIS Core Team
 * @version 2.6.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TrashService {

    private final JdbcTemplate jdbcTemplate;
    private final OrganizationService organizationService;

    /**
     * Mengambil daftar item recycle bin beserta ringkasan statistik aggregasi.
     *
     * @param category Kategori filter (all, organizations, projects, tasks, assets)
     * @param query Kata kunci pencarian nama atau kode
     * @return {@link TrashListResponse} berisi list item dan ringkasan kuantitatif
     */
    @Transactional(readOnly = true)
    public TrashListResponse listTrashItems(String category, String query) {
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
                log.warn("[TrashService] Gagal memuat daftar organisasi terhapus: {}", e.getMessage());
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
                log.warn("[TrashService] Gagal memuat daftar project terhapus: {}", e.getMessage());
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
                log.warn("[TrashService] Gagal memuat daftar task terhapus: {}", e.getMessage());
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
                log.warn("[TrashService] Gagal memuat daftar network nodes terhapus: {}", e.getMessage());
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

        return new TrashListResponse(items, stats);
    }

    /**
     * Memulihkan item dari recycle bin ke status aktif.
     *
     * @param type Tipe entitas (ORGANIZATION, PROJECT, TASK, NETWORK_NODE, dll.)
     * @param id Identifier UUID entitas
     * @return Status pemulihan berhasil
     */
    @Transactional
    public boolean restoreItem(String type, String id) {
        if (type == null || id == null) {
            throw new IllegalArgumentException("Type and ID must not be null");
        }

        if ("ORGANIZATION".equalsIgnoreCase(type)) {
            organizationService.restoreOrganization(id);
            log.info("[TrashService] Restored organization and re-enabled Keycloak realm for id {}", id);
            return true;
        }

        String table = resolveTable(type);
        if (table == null) {
            throw new IllegalArgumentException("Invalid entity type: " + type);
        }

        int updated = jdbcTemplate.update(
                "UPDATE " + table + " SET deleted_at = NULL, deleted_by = NULL WHERE id = CAST(? AS uuid)",
                id
        );

        if (updated > 0) {
            log.info("[TrashService] Restored {} with id {}", type, id);
            return true;
        }
        return false;
    }

    /**
     * Memusnahkan item recycle bin secara permanen (Permanent Nuclear Purge).
     *
     * @param type Tipe entitas
     * @param id Identifier UUID entitas
     * @return Status penghapusan permanen berhasil
     */
    @Transactional
    public boolean permanentDelete(String type, String id) {
        if (type == null || id == null) {
            throw new IllegalArgumentException("Type and ID must not be null");
        }

        if ("ORGANIZATION".equalsIgnoreCase(type)) {
            organizationService.deleteOrganization(id, "nuclear", "Recycle Bin Permanent Nuclear Wipe");
            log.info("[TrashService] Nuclear deleted organization and destroyed Keycloak realm for id {}", id);
            return true;
        }

        String table = resolveTable(type);
        if (table == null) {
            throw new IllegalArgumentException("Invalid entity type: " + type);
        }

        int deleted = jdbcTemplate.update(
                "DELETE FROM " + table + " WHERE id = CAST(? AS uuid) AND deleted_at IS NOT NULL",
                id
        );

        if (deleted > 0) {
            log.info("[TrashService] Permanently deleted {} with id {}", type, id);
            return true;
        }
        return false;
    }

    /**
     * Mengosongkan seluruh item dalam Recycle Bin berdasarkan kategori tertentu.
     *
     * @param category Kategori entitas (all, tasks, assets, projects, organizations)
     * @return Jumlah total baris entitas yang dimusnahkan secara permanen
     */
    @Transactional
    public int emptyTrash(String category) {
        int totalDeleted = 0;
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

        log.info("[TrashService] Emptied trash for category {}. Total purged: {}", category, totalDeleted);
        return totalDeleted;
    }

    public String resolveTable(String type) {
        if (type == null) return null;
        return switch (type.toUpperCase()) {
            case "ORGANIZATION" -> "organizations";
            case "PROJECT" -> "projects";
            case "TASK" -> "tasks";
            case "NETWORK_NODE", "NODE" -> "network_nodes";
            case "NETWORK_EDGE", "EDGE" -> "network_edges";
            default -> null;
        };
    }

    public int computeDaysRemaining(Timestamp deletedAt, Instant now) {
        if (deletedAt == null) return 30;
        long daysPassed = Duration.between(deletedAt.toInstant(), now).toDays();
        return (int) Math.max(0, 30 - daysPassed);
    }

    public long queryCount(String sql) {
        Long val = jdbcTemplate.queryForObject(sql, Long.class);
        return val != null ? val : 0;
    }
}
