package com.company.ftthgis.service.tenant;

import com.company.ftthgis.api.tenant.dto.TenantAuditEventDto;
import com.company.ftthgis.api.tenant.dto.TenantAuditQueryCriteria;
import com.company.ftthgis.api.tenant.dto.TenantAuditStatsDto;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

/**
 * High-performance service for querying, aggregating, and exporting tenant audit logs
 * across Organization Scope (Layer 1) and Project Scope (Layer 2).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class TenantAuditService {

    private final JdbcTemplate jdbcTemplate;
    private final OrganizationRepository organizationRepository;
    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper;

    /**
     * Retrieves paginated audit logs for the entire organization.
     */
    public Page<TenantAuditEventDto> getOrganizationAuditEvents(String tenantSlug, TenantAuditQueryCriteria criteria) {
        Organization org = resolveOrganization(tenantSlug);
        return queryAuditEvents(org.getSlug(), criteria, false);
    }

    /**
     * Retrieves paginated audit logs scoped strictly to a specific project.
     */
    public Page<TenantAuditEventDto> getProjectAuditEvents(String tenantSlug, UUID projectId, TenantAuditQueryCriteria criteria) {
        Organization org = resolveOrganization(tenantSlug);
        Project project = validateProjectOwnership(org, projectId);

        criteria.setProjectId(project.getId().toString());
        return queryAuditEvents(org.getSlug(), criteria, true);
    }

    /**
     * Aggregates activity statistics (24h/7d) for an organization.
     */
    public TenantAuditStatsDto getOrganizationAuditStats(String tenantSlug) {
        Organization org = resolveOrganization(tenantSlug);
        return computeAuditStats(org.getSlug(), null);
    }

    /**
     * Aggregates activity statistics (24h/7d) for a specific project.
     */
    public TenantAuditStatsDto getProjectAuditStats(String tenantSlug, UUID projectId) {
        Organization org = resolveOrganization(tenantSlug);
        Project project = validateProjectOwnership(org, projectId);
        return computeAuditStats(org.getSlug(), project.getId().toString());
    }

    /**
     * Exports organization audit events as RFC-4180 compliant CSV stream.
     */
    public byte[] exportOrganizationAuditCsv(String tenantSlug, TenantAuditQueryCriteria criteria) {
        Organization org = resolveOrganization(tenantSlug);
        criteria.setPage(0);
        criteria.setSize(5000); // Export ceiling to prevent OOM
        Page<TenantAuditEventDto> page = queryAuditEvents(org.getSlug(), criteria, false);
        return generateCsv(page.getContent(), "Organization: " + org.getName());
    }

    /**
     * Exports project audit events as RFC-4180 compliant CSV stream.
     */
    public byte[] exportProjectAuditCsv(String tenantSlug, UUID projectId, TenantAuditQueryCriteria criteria) {
        Organization org = resolveOrganization(tenantSlug);
        Project project = validateProjectOwnership(org, projectId);
        criteria.setProjectId(project.getId().toString());
        criteria.setPage(0);
        criteria.setSize(5000);
        Page<TenantAuditEventDto> page = queryAuditEvents(org.getSlug(), criteria, true);
        return generateCsv(page.getContent(), "Project: " + project.getName() + " (" + org.getName() + ")");
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Query Execution & Filtering
    // ─────────────────────────────────────────────────────────────────────────────

    private Page<TenantAuditEventDto> queryAuditEvents(String tenantSlug, TenantAuditQueryCriteria criteria, boolean projectScopedOnly) {
        StringBuilder whereClause = new StringBuilder("WHERE tenant_slug = ? ");
        List<Object> params = new ArrayList<>();
        params.add(tenantSlug);

        if (projectScopedOnly && criteria.getProjectId() != null && !criteria.getProjectId().isBlank()) {
            whereClause.append("AND (metadata->>'projectId') = ? ");
            params.add(criteria.getProjectId().trim());
        } else if (!projectScopedOnly && criteria.getProjectId() != null && !criteria.getProjectId().isBlank()) {
            whereClause.append("AND (metadata->>'projectId') = ? ");
            params.add(criteria.getProjectId().trim());
        }

        if (criteria.getScope() != null && !criteria.getScope().isBlank()) {
            whereClause.append("AND (metadata->>'scope') = ? ");
            params.add(criteria.getScope().trim().toUpperCase(Locale.ROOT));
        }

        if (criteria.getCategory() != null && !criteria.getCategory().isBlank()) {
            whereClause.append("AND (metadata->>'category') = ? ");
            params.add(criteria.getCategory().trim().toUpperCase(Locale.ROOT));
        }

        if (criteria.getSeverity() != null && !criteria.getSeverity().isBlank()) {
            whereClause.append("AND (metadata->>'severity') = ? ");
            params.add(criteria.getSeverity().trim().toUpperCase(Locale.ROOT));
        }

        if (criteria.getAction() != null && !criteria.getAction().isBlank()) {
            whereClause.append("AND action = ? ");
            params.add(criteria.getAction().trim());
        }

        if (criteria.getResourceType() != null && !criteria.getResourceType().isBlank()) {
            whereClause.append("AND resource_type = ? ");
            params.add(criteria.getResourceType().trim());
        }

        if (criteria.getActorId() != null && !criteria.getActorId().isBlank()) {
            whereClause.append("AND actor_id = ? ");
            params.add(criteria.getActorId().trim());
        }

        if (criteria.getStartDate() != null) {
            whereClause.append("AND occurred_at >= ? ");
            params.add(Timestamp.valueOf(criteria.getStartDate()));
        }

        if (criteria.getEndDate() != null) {
            whereClause.append("AND occurred_at <= ? ");
            params.add(Timestamp.valueOf(criteria.getEndDate()));
        }

        if (criteria.getSearch() != null && !criteria.getSearch().trim().isEmpty()) {
            String pattern = "%" + criteria.getSearch().trim().toLowerCase(Locale.ROOT) + "%";
            whereClause.append("AND (LOWER(action) LIKE ? OR LOWER(resource_type) LIKE ? OR LOWER(actor_id) LIKE ? OR LOWER(COALESCE(metadata->>'actorEmail', '')) LIKE ? OR metadata::text ILIKE ?) ");
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
        }

        // 1. Total Count Query
        String countSql = "SELECT COUNT(*) FROM audit_events " + whereClause;
        Long totalElements = jdbcTemplate.queryForObject(countSql, Long.class, params.toArray());
        long total = totalElements != null ? totalElements : 0L;

        // 2. Paginated Data Query
        int page = Math.max(0, criteria.getPage());
        int size = criteria.getSize() > 0 ? criteria.getSize() : 50;
        int offset = page * size;
        String sortDir = "ASC".equalsIgnoreCase(criteria.getSortDirection()) ? "ASC" : "DESC";

        String dataSql = "SELECT id, tenant_slug, actor_id, actor_role, actor_ip, action, resource_type, resource_id, " +
                "       old_value::text as old_value_json, new_value::text as new_value_json, metadata::text as metadata_json, occurred_at " +
                "FROM audit_events " +
                whereClause +
                "ORDER BY occurred_at " + sortDir + " " +
                "LIMIT ? OFFSET ?";

        List<Object> dataParams = new ArrayList<>(params);
        dataParams.add(size);
        dataParams.add(offset);

        List<TenantAuditEventDto> events = jdbcTemplate.query(dataSql, (rs, rowNum) -> mapRowToDto(rs), dataParams.toArray());

        Pageable pageable = PageRequest.of(page, size);
        return new PageImpl<>(events, pageable, total);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Statistics Aggregation
    // ─────────────────────────────────────────────────────────────────────────────

    private TenantAuditStatsDto computeAuditStats(String tenantSlug, String projectId) {
        StringBuilder filterBuilder = new StringBuilder("WHERE tenant_slug = ? ");
        List<Object> baseParams = new ArrayList<>();
        baseParams.add(tenantSlug);

        if (projectId != null && !projectId.isBlank()) {
            filterBuilder.append("AND (metadata->>'projectId') = ? ");
            baseParams.add(projectId);
        }

        String baseFilter = filterBuilder.toString();

        // 1. Total Events 24h
        String total24hSql = "SELECT COUNT(*) FROM audit_events " + baseFilter + " AND occurred_at >= NOW() - INTERVAL '24 hours'";
        Long total24h = jdbcTemplate.queryForObject(total24hSql, Long.class, baseParams.toArray());

        // 2. Total Events 7d
        String total7dSql = "SELECT COUNT(*) FROM audit_events " + baseFilter + " AND occurred_at >= NOW() - INTERVAL '7 days'";
        Long total7d = jdbcTemplate.queryForObject(total7dSql, Long.class, baseParams.toArray());

        // 3. Warn/Errors 24h
        String warnErrorsSql = "SELECT COUNT(*) FROM audit_events " + baseFilter +
                " AND occurred_at >= NOW() - INTERVAL '24 hours' AND (metadata->>'severity' IN ('WARN', 'ERROR', 'CRITICAL'))";
        Long totalWarnErrors = jdbcTemplate.queryForObject(warnErrorsSql, Long.class, baseParams.toArray());

        // 4. Breakdown by Category (24h)
        String categorySql = "SELECT COALESCE(metadata->>'category', 'GENERAL') as cat, COUNT(*) as cnt " +
                "FROM audit_events " + baseFilter + " AND occurred_at >= NOW() - INTERVAL '24 hours' " +
                "GROUP BY cat ORDER BY cnt DESC";
        Map<String, Long> categoryMap = new LinkedHashMap<>();
        jdbcTemplate.query(categorySql, rs -> {
            categoryMap.put(rs.getString("cat"), rs.getLong("cnt"));
        }, baseParams.toArray());

        // 5. Breakdown by Action (24h)
        String actionSql = "SELECT action, COUNT(*) as cnt " +
                "FROM audit_events " + baseFilter + " AND occurred_at >= NOW() - INTERVAL '24 hours' " +
                "GROUP BY action ORDER BY cnt DESC LIMIT 10";
        Map<String, Long> actionMap = new LinkedHashMap<>();
        jdbcTemplate.query(actionSql, rs -> {
            actionMap.put(rs.getString("action"), rs.getLong("cnt"));
        }, baseParams.toArray());

        // 6. Breakdown by Severity (24h)
        String severitySql = "SELECT COALESCE(metadata->>'severity', 'INFO') as sev, COUNT(*) as cnt " +
                "FROM audit_events " + baseFilter + " AND occurred_at >= NOW() - INTERVAL '24 hours' " +
                "GROUP BY sev";
        Map<String, Long> severityMap = new LinkedHashMap<>();
        jdbcTemplate.query(severitySql, rs -> {
            severityMap.put(rs.getString("sev"), rs.getLong("cnt"));
        }, baseParams.toArray());

        // 7. Top 5 Active Actors (24h)
        String topActorsSql = "SELECT actor_id, COALESCE(metadata->>'actorEmail', actor_id) as email, COUNT(*) as cnt " +
                "FROM audit_events " + baseFilter + " AND occurred_at >= NOW() - INTERVAL '24 hours' " +
                "GROUP BY actor_id, email ORDER BY cnt DESC LIMIT 5";
        List<TenantAuditStatsDto.ActorActivityDto> topActors = jdbcTemplate.query(
                topActorsSql,
                (rs, rowNum) -> TenantAuditStatsDto.ActorActivityDto.builder()
                        .actorId(rs.getString("actor_id"))
                        .actorEmail(rs.getString("email"))
                        .eventCount(rs.getLong("cnt"))
                        .build(),
                baseParams.toArray()
        );

        // 8. Daily Trend (7 Days)
        String trendSql = "SELECT TO_CHAR(occurred_at, 'YYYY-MM-DD') as day, COUNT(*) as cnt " +
                "FROM audit_events " + baseFilter + " AND occurred_at >= NOW() - INTERVAL '7 days' " +
                "GROUP BY day ORDER BY day ASC";
        List<TenantAuditStatsDto.DailyActivityTrendDto> dailyTrend = jdbcTemplate.query(
                trendSql,
                (rs, rowNum) -> TenantAuditStatsDto.DailyActivityTrendDto.builder()
                        .date(rs.getString("day"))
                        .count(rs.getLong("cnt"))
                        .build(),
                baseParams.toArray()
        );

        return TenantAuditStatsDto.builder()
                .totalEvents24h(total24h != null ? total24h : 0L)
                .totalEvents7d(total7d != null ? total7d : 0L)
                .totalWarnErrors24h(totalWarnErrors != null ? totalWarnErrors : 0L)
                .eventsByCategory(categoryMap)
                .eventsByAction(actionMap)
                .eventsBySeverity(severityMap)
                .topActors(topActors)
                .dailyTrend(dailyTrend)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // CSV Export Generator
    // ─────────────────────────────────────────────────────────────────────────────

    private byte[] generateCsv(List<TenantAuditEventDto> events, String scopeTitle) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(baos, true, StandardCharsets.UTF_8)) {
            // Write UTF-8 BOM for Excel compatibility
            baos.write(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF});

            // Header line
            writer.println("Occurred At,Event ID,Actor ID,Actor Email,Role,IP Address,Action,Resource Type,Resource ID,Scope,Category,Severity,Project ID,Project Name,Metadata Summary");

            for (TenantAuditEventDto ev : events) {
                writer.println(String.format(
                        "\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"",
                        ev.getOccurredAt() != null ? ev.getOccurredAt().toString() : "",
                        escapeCsv(ev.getId()),
                        escapeCsv(ev.getActorId()),
                        escapeCsv(ev.getActorEmail()),
                        escapeCsv(ev.getActorRole()),
                        escapeCsv(ev.getActorIp()),
                        escapeCsv(ev.getAction()),
                        escapeCsv(ev.getResourceType()),
                        escapeCsv(ev.getResourceId()),
                        escapeCsv(ev.getScope()),
                        escapeCsv(ev.getCategory()),
                        escapeCsv(ev.getSeverity()),
                        escapeCsv(ev.getProjectId()),
                        escapeCsv(ev.getProjectName()),
                        escapeCsv(ev.getMetadata() != null ? ev.getMetadata().toString() : "")
                ));
            }
            writer.flush();
        } catch (Exception e) {
            log.error("Failed to generate audit CSV export for {}: {}", scopeTitle, e.getMessage(), e);
            throw new RuntimeException("Failed to generate audit CSV export", e);
        }
        return baos.toByteArray();
    }

    private String escapeCsv(String input) {
        if (input == null) return "";
        return input.replace("\"", "\"\"").replace("\n", " ").replace("\r", "");
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Helpers & Row Mapper
    // ─────────────────────────────────────────────────────────────────────────────

    private TenantAuditEventDto mapRowToDto(ResultSet rs) throws SQLException {
        String metadataJson = rs.getString("metadata_json");
        Map<String, Object> metadata = parseJsonMap(metadataJson);

        String oldValueJson = rs.getString("old_value_json");
        Map<String, Object> oldValue = parseJsonMap(oldValueJson);

        String newValueJson = rs.getString("new_value_json");
        Map<String, Object> newValue = parseJsonMap(newValueJson);

        Timestamp occurredAtTs = rs.getTimestamp("occurred_at");
        LocalDateTime occurredAt = occurredAtTs != null ? occurredAtTs.toLocalDateTime() : null;

        String actorEmail = null;
        String scope = "ORGANIZATION";
        String category = "GENERAL";
        String severity = "INFO";
        String projectId = null;
        String projectName = null;

        if (metadata != null) {
            if (metadata.get("actorEmail") != null) {
                actorEmail = String.valueOf(metadata.get("actorEmail"));
            }
            if (metadata.get("scope") != null) {
                scope = String.valueOf(metadata.get("scope"));
            }
            if (metadata.get("category") != null) {
                category = String.valueOf(metadata.get("category"));
            }
            if (metadata.get("severity") != null) {
                severity = String.valueOf(metadata.get("severity"));
            }
            if (metadata.get("projectId") != null) {
                projectId = String.valueOf(metadata.get("projectId"));
            }
            if (metadata.get("projectName") != null) {
                projectName = String.valueOf(metadata.get("projectName"));
            }
        }

        return TenantAuditEventDto.builder()
                .id(rs.getString("id"))
                .tenantSlug(rs.getString("tenant_slug"))
                .actorId(rs.getString("actor_id"))
                .actorEmail(actorEmail != null ? actorEmail : rs.getString("actor_id"))
                .actorRole(rs.getString("actor_role") != null ? rs.getString("actor_role") : "USER")
                .actorIp(rs.getString("actor_ip") != null ? rs.getString("actor_ip") : "127.0.0.1")
                .action(rs.getString("action"))
                .resourceType(rs.getString("resource_type"))
                .resourceId(rs.getString("resource_id"))
                .scope(scope)
                .category(category)
                .severity(severity)
                .projectId(projectId)
                .projectName(projectName)
                .oldValue(oldValue)
                .newValue(newValue)
                .metadata(metadata)
                .occurredAt(occurredAt)
                .build();
    }

    private Map<String, Object> parseJsonMap(String json) {
        if (json == null || json.isBlank() || json.equals("{}")) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    private Organization resolveOrganization(String tenantSlug) {
        return organizationRepository.findBySlug(tenantSlug)
                .orElseThrow(() -> new EntityNotFoundException("Organization tidak ditemukan: " + tenantSlug));
    }

    private Project validateProjectOwnership(Organization org, UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project tidak ditemukan: " + projectId));

        if (project.getOrganization() == null || !project.getOrganization().getId().equals(org.getId())) {
            throw new AccessDeniedException("Project tidak berada dalam organisasi tenant " + org.getSlug());
        }
        return project;
    }
}
