package com.company.ftthgis.api.tenant;

import com.company.ftthgis.api.system.dto.PlatformModuleResponseDto;
import com.company.ftthgis.service.PlatformModuleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * <h1>PlatformModulePublicController</h1>
 * <p>
 * Read-only discovery API for active modules available to tenant portals and frontend components (ADR-0018).
 * Enables Hybrid Dynamic Auto-Discovery in {@code @k2net/ui}.
 * </p>
 */
@RestController
@RequestMapping("/api/v1/modules")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PlatformModulePublicController {

    private final PlatformModuleService moduleService;

    /**
     * Retrieves active enabled modules (e.g. scope=tenant).
     */
    @GetMapping
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('dashboard.view') or hasAuthority('system.modules.read')")
    public ResponseEntity<List<PlatformModuleResponseDto>> getPublicModules(
            @RequestParam(name = "scope", required = false, defaultValue = "ALL") String scope) {
        return ResponseEntity.ok(moduleService.getPublicModules(scope));
    }

    /**
     * Retrieves detail of an active module by key.
     */
    @GetMapping("/{moduleKey}")
    @PreAuthorize("@tenantSecurity.hasEffectivePermission('dashboard.view') or hasAuthority('system.modules.read')")
    public ResponseEntity<PlatformModuleResponseDto> getPublicModuleDetail(@PathVariable String moduleKey) {
        return ResponseEntity.ok(moduleService.getModuleByKey(moduleKey));
    }
}
