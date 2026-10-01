package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.tenant.dto.TenantAuditEventDto;
import com.company.ftthgis.api.tenant.dto.TenantAuditQueryCriteria;
import com.company.ftthgis.api.tenant.dto.TenantAuditStatsDto;
import com.company.ftthgis.service.tenant.TenantAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * REST Controller for Tenant Dual-Layer Audit Trail:
 * - Layer 1: Organization Scope Layout (/settings/audit-logs, /team/activity)
 * - Layer 2: Project Scope Layout (/project/:projectId/settings/audit-logs, /project/:projectId/overview)
 */
@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class TenantAuditController {

    private final TenantAuditService tenantAuditService;

    // ─────────────────────────────────────────────────────────────────────────────
    // Layer 1: Organization Scope Endpoints
    // ─────────────────────────────────────────────────────────────────────────────

    @GetMapping("/{slug}/audit-events")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('organization.audit.view') or @tenantSecurity.isOwner(#slug) or hasAuthority('system.audit.view')")
    public ResponseEntity<Page<TenantAuditEventDto>> getOrganizationAuditEvents(
            @PathVariable String slug,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String actorId,
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        TenantAuditQueryCriteria criteria = TenantAuditQueryCriteria.builder()
                .search(search)
                .action(action)
                .resourceType(resourceType)
                .actorId(actorId)
                .scope(scope)
                .category(category)
                .severity(severity)
                .projectId(projectId)
                .startDate(startDate)
                .endDate(endDate)
                .page(page)
                .size(size)
                .sortDirection(sortDirection)
                .build();

        return ResponseEntity.ok(tenantAuditService.getOrganizationAuditEvents(slug, criteria));
    }

    @GetMapping("/{slug}/audit-events/stats")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('organization.audit.view') or @tenantSecurity.isOwner(#slug) or hasAuthority('system.audit.view')")
    public ResponseEntity<TenantAuditStatsDto> getOrganizationAuditStats(@PathVariable String slug) {
        return ResponseEntity.ok(tenantAuditService.getOrganizationAuditStats(slug));
    }

    @GetMapping("/{slug}/audit-events/export")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('organization.audit.export') or @tenantSecurity.hasEffectivePermission('organization.audit.view') or @tenantSecurity.isOwner(#slug) or hasAuthority('system.audit.export')")
    public ResponseEntity<byte[]> exportOrganizationAuditCsv(
            @PathVariable String slug,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String actorId,
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        TenantAuditQueryCriteria criteria = TenantAuditQueryCriteria.builder()
                .search(search)
                .action(action)
                .resourceType(resourceType)
                .actorId(actorId)
                .scope(scope)
                .category(category)
                .severity(severity)
                .startDate(startDate)
                .endDate(endDate)
                .build();

        byte[] csvData = tenantAuditService.exportOrganizationAuditCsv(slug, criteria);
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = "audit_org_" + slug + "_" + timestamp + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Layer 2: Project Scope Endpoints
    // ─────────────────────────────────────────────────────────────────────────────

    @GetMapping("/{slug}/projects/{projectId}/audit-events")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('project.audit.view') or @tenantSecurity.hasEffectivePermission('network.view') or @tenantSecurity.isOwner(#slug) or hasAuthority('system.audit.view')")
    public ResponseEntity<Page<TenantAuditEventDto>> getProjectAuditEvents(
            @PathVariable String slug,
            @PathVariable UUID projectId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String actorId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        TenantAuditQueryCriteria criteria = TenantAuditQueryCriteria.builder()
                .search(search)
                .action(action)
                .resourceType(resourceType)
                .actorId(actorId)
                .category(category)
                .severity(severity)
                .startDate(startDate)
                .endDate(endDate)
                .page(page)
                .size(size)
                .sortDirection(sortDirection)
                .build();

        return ResponseEntity.ok(tenantAuditService.getProjectAuditEvents(slug, projectId, criteria));
    }

    @GetMapping("/{slug}/projects/{projectId}/audit-events/stats")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('project.audit.view') or @tenantSecurity.hasEffectivePermission('network.view') or @tenantSecurity.isOwner(#slug) or hasAuthority('system.audit.view')")
    public ResponseEntity<TenantAuditStatsDto> getProjectAuditStats(
            @PathVariable String slug,
            @PathVariable UUID projectId
    ) {
        return ResponseEntity.ok(tenantAuditService.getProjectAuditStats(slug, projectId));
    }

    @GetMapping("/{slug}/projects/{projectId}/audit-events/export")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('project.audit.export') or @tenantSecurity.hasEffectivePermission('project.audit.view') or @tenantSecurity.isOwner(#slug) or hasAuthority('system.audit.export')")
    public ResponseEntity<byte[]> exportProjectAuditCsv(
            @PathVariable String slug,
            @PathVariable UUID projectId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String actorId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        TenantAuditQueryCriteria criteria = TenantAuditQueryCriteria.builder()
                .search(search)
                .action(action)
                .resourceType(resourceType)
                .actorId(actorId)
                .category(category)
                .severity(severity)
                .startDate(startDate)
                .endDate(endDate)
                .build();

        byte[] csvData = tenantAuditService.exportProjectAuditCsv(slug, projectId, criteria);
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = "audit_project_" + projectId + "_" + timestamp + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }
}
