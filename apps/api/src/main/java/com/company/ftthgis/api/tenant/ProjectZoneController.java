package com.company.ftthgis.api.tenant;

import com.company.ftthgis.config.logging.AuditRequired;
import com.company.ftthgis.domain.network.dto.*;
import com.company.ftthgis.service.ProjectZoneService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/zones")
@RequiredArgsConstructor
public class ProjectZoneController {

    private final ProjectZoneService projectZoneService;

    @GetMapping
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('zones.view')")
    public ResponseEntity<List<ProjectZoneDto>> getZones(@PathVariable UUID projectId) {
        return ResponseEntity.ok(projectZoneService.getZonesByProject(projectId));
    }

    @GetMapping("/{zoneId}")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('zones.view')")
    public ResponseEntity<ProjectZoneDto> getZoneById(
            @PathVariable UUID projectId,
            @PathVariable UUID zoneId) {
        return ResponseEntity.ok(projectZoneService.getZoneById(projectId, zoneId));
    }

    @PostMapping
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('zones.create')")
    @AuditRequired(
            action = "ZONE_CREATED",
            scope = "PROJECT_WORKSPACE",
            resourceType = "ZONE",
            projectIdExpression = "#projectId.toString()"
    )
    public ResponseEntity<ProjectZoneDto> createZone(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateZoneRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectZoneService.createZone(projectId, request));
    }

    @PutMapping("/{zoneId}")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('zones.edit')")
    @AuditRequired(
            action = "ZONE_UPDATED",
            scope = "PROJECT_WORKSPACE",
            resourceType = "ZONE",
            resourceIdExpression = "#zoneId.toString()",
            projectIdExpression = "#projectId.toString()"
    )
    public ResponseEntity<ProjectZoneDto> updateZone(
            @PathVariable UUID projectId,
            @PathVariable UUID zoneId,
            @Valid @RequestBody UpdateZoneRequest request) {
        return ResponseEntity.ok(projectZoneService.updateZone(projectId, zoneId, request));
    }

    @PostMapping("/{zoneId}/promote")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('zones.promote')")
    @AuditRequired(
            action = "ZONE_STAGE_CHANGED",
            scope = "PROJECT_WORKSPACE",
            resourceType = "ZONE",
            resourceIdExpression = "#zoneId.toString()",
            projectIdExpression = "#projectId.toString()"
    )
    public ResponseEntity<ProjectZoneDto> promoteStage(
            @PathVariable UUID projectId,
            @PathVariable UUID zoneId,
            @Valid @RequestBody PromoteZoneRequest request) {
        return ResponseEntity.ok(projectZoneService.promoteStage(projectId, zoneId, request.getTargetStage()));
    }

    @DeleteMapping("/{zoneId}")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('zones.delete')")
    @AuditRequired(
            action = "ZONE_DELETED",
            scope = "PROJECT_WORKSPACE",
            resourceType = "ZONE",
            resourceIdExpression = "#zoneId.toString()",
            projectIdExpression = "#projectId.toString()"
    )
    public ResponseEntity<Map<String, Object>> deleteZone(
            @PathVariable UUID projectId,
            @PathVariable UUID zoneId,
            @RequestParam(required = false, defaultValue = "DETACH_DRAFT") ZoneDeleteStrategy strategy,
            @RequestParam(required = false) UUID targetReassignZoneId) {
        projectZoneService.deleteZone(projectId, zoneId, strategy, targetReassignZoneId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Project zone deleted successfully",
                "strategy", strategy.name()
        ));
    }

    @PostMapping("/{zoneId}/resync-assets")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('zones.edit')")
    @AuditRequired(
            action = "ZONE_ASSETS_RESYNCED",
            scope = "NETWORK_GIS",
            resourceType = "ZONE",
            resourceIdExpression = "#zoneId.toString()",
            projectIdExpression = "#projectId.toString()"
    )
    public ResponseEntity<Map<String, Object>> resyncAssets(
            @PathVariable UUID projectId,
            @PathVariable UUID zoneId) {
        int count = projectZoneService.resyncZoneAssets(projectId, zoneId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "resyncedAssetsCount", count
        ));
    }

    @GetMapping("/{zoneId}/boq")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('zones.view')")
    public ResponseEntity<ZoneBoQDto> getZoneBoQ(
            @PathVariable UUID projectId,
            @PathVariable UUID zoneId) {
        return ResponseEntity.ok(projectZoneService.getZoneBoQ(projectId, zoneId));
    }
}
