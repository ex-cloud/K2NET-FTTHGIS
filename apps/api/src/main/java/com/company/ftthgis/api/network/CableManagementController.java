package com.company.ftthgis.api.network;

import com.company.ftthgis.config.security.SpatialSecurityEvaluator;
import com.company.ftthgis.domain.network.dto.FiberCableDto;
import com.company.ftthgis.domain.network.entity.AssetDeletionLog;
import com.company.ftthgis.domain.network.repository.AssetDeletionLogRepository;
import com.company.ftthgis.domain.network.service.FiberCableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/network/cables")
@RequiredArgsConstructor
public class CableManagementController {

    private final FiberCableService fiberCableService;
    private final AssetDeletionLogRepository deletionLogRepository;
    private final SpatialSecurityEvaluator spatialSecurityEvaluator;

    @GetMapping
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<Page<FiberCableDto>> getAll(Pageable pageable) {
        return ResponseEntity.ok(fiberCableService.getCables(pageable));
    }

    @GetMapping("/{code}")
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<FiberCableDto> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(fiberCableService.getCableByCode(code));
    }

    @PostMapping
    public ResponseEntity<FiberCableDto> create(@RequestBody FiberCableDto dto) {
        if (dto == null || dto.getProjectId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Project ID wajib diisi");
        }
        if (!spatialSecurityEvaluator.hasProjectPermission(dto.getProjectId(), "network.manage")) {
            throw new AccessDeniedException("Not authorized for target project");
        }
        return ResponseEntity.ok(fiberCableService.createCable(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@spatialSecurityEvaluator.canAccessCable(#id, 'network.manage')")
    public ResponseEntity<FiberCableDto> update(@PathVariable UUID id, @RequestBody FiberCableDto dto) {
        return ResponseEntity.ok(fiberCableService.updateCable(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@spatialSecurityEvaluator.canAccessCable(#id, 'network.manage')")
    public ResponseEntity<Void> delete(@PathVariable UUID id,
                                       @RequestParam(required = false, defaultValue = "No reason provided") String reason) {
        String deletedCode = fiberCableService.deleteCable(id);

        AssetDeletionLog log = new AssetDeletionLog();
        log.setAssetCode(deletedCode);
        log.setAssetType("CABLE");
        log.setReason(reason);
        deletionLogRepository.save(log);

        return ResponseEntity.noContent().build();
    }
}

