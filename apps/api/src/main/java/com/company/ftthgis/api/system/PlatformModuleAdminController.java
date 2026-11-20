package com.company.ftthgis.api.system;

import com.company.ftthgis.api.system.dto.OrphanAuditResultDto;
import com.company.ftthgis.api.system.dto.PlatformModuleResponseDto;
import com.company.ftthgis.api.system.dto.UpdateModuleStatusRequest;
import com.company.ftthgis.service.PlatformModuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * <h1>PlatformModuleAdminController</h1>
 * <p>
 * Super Admin Control Plane API for Enterprise Module Registry & Feature Governance (ADR-0018).
 * Protected under Granular PBAC: {@code system.modules.read} & {@code system.modules.manage}.
 * </p>
 */
@RestController
@RequestMapping("/api/v1/system/modules")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PlatformModuleAdminController {

    private final PlatformModuleService moduleService;

    /**
     * Lists all platform modules across all scopes (SYSTEM & TENANT) with their permission counts.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('system.modules.read') or hasAuthority('system.modules.manage') or hasRole('super_admin')")
    public ResponseEntity<List<PlatformModuleResponseDto>> getAllModules(
            @RequestParam(name = "scope", required = false) String scope) {
        if (scope != null && !scope.isBlank() && !"ALL".equalsIgnoreCase(scope)) {
            return ResponseEntity.ok(moduleService.getModulesByScope(scope));
        }
        return ResponseEntity.ok(moduleService.getAllModules());
    }

    /**
     * Scans for orphan modules (modules without permissions or permissions without module registry).
     */
    @GetMapping("/audit-orphans")
    @PreAuthorize("hasAuthority('system.modules.read') or hasAuthority('system.modules.manage') or hasRole('super_admin')")
    public ResponseEntity<OrphanAuditResultDto> auditOrphanModules() {
        return ResponseEntity.ok(moduleService.auditOrphans());
    }

    /**
     * Retrieves detail of a single module by module key.
     */
    @GetMapping("/{moduleKey}")
    @PreAuthorize("hasAuthority('system.modules.read') or hasAuthority('system.modules.manage') or hasRole('super_admin')")
    public ResponseEntity<PlatformModuleResponseDto> getModuleByKey(@PathVariable String moduleKey) {
        return ResponseEntity.ok(moduleService.getModuleByKey(moduleKey));
    }

    /**
     * Live mutation of module status (ACTIVE, MAINTENANCE, DEPRECATED, is_enabled toggle).
     */
    @PutMapping("/{moduleKey}/status")
    @PreAuthorize("hasAuthority('system.modules.manage') or hasRole('super_admin')")
    public ResponseEntity<PlatformModuleResponseDto> updateModuleStatus(
            @PathVariable String moduleKey,
            @Valid @RequestBody UpdateModuleStatusRequest request) {
        return ResponseEntity.ok(moduleService.updateModuleStatus(moduleKey, request));
    }
}
