package com.company.ftthgis.api.network;

import com.company.ftthgis.config.security.SpatialSecurityEvaluator;
import com.company.ftthgis.domain.network.dto.ODPDto;
import com.company.ftthgis.domain.network.entity.AssetDeletionLog;
import com.company.ftthgis.domain.network.repository.AssetDeletionLogRepository;
import com.company.ftthgis.domain.network.service.ODPService;
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
@RequestMapping("/api/v1/network/odps")
@RequiredArgsConstructor
public class ODPManagementController {

    private final ODPService odpService;
    private final AssetDeletionLogRepository deletionLogRepository;
    private final SpatialSecurityEvaluator spatialSecurityEvaluator;

    @GetMapping
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<Page<ODPDto>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String odcCode,
            Pageable pageable) {
        return ResponseEntity.ok(odpService.getOdps(search, status, name, code, odcCode, pageable));
    }

    @GetMapping("/{code}")
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<ODPDto> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(odpService.getOdpByCode(code));
    }

    @PostMapping
    public ResponseEntity<ODPDto> create(@RequestBody ODPDto dto) {
        if (dto == null || dto.getProjectId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Project ID wajib diisi");
        }
        if (!spatialSecurityEvaluator.hasProjectPermission(dto.getProjectId(), "network.manage")) {
            throw new AccessDeniedException("Not authorized for target project");
        }
        return ResponseEntity.ok(odpService.createOdp(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@spatialSecurityEvaluator.canAccessNode(#id, 'network.manage')")
    public ResponseEntity<ODPDto> update(@PathVariable UUID id, @RequestBody ODPDto dto) {
        return ResponseEntity.ok(odpService.updateOdp(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@spatialSecurityEvaluator.canAccessNode(#id, 'network.manage')")
    public ResponseEntity<Void> delete(@PathVariable UUID id,
                                       @RequestParam(required = false, defaultValue = "No reason provided") String reason) {
        String deletedCode = odpService.deleteOdp(id);

        AssetDeletionLog log = new AssetDeletionLog();
        log.setAssetCode(deletedCode);
        log.setAssetType("ODP");
        log.setReason(reason);
        deletionLogRepository.save(log);

        return ResponseEntity.noContent().build();
    }
}

