package com.company.ftthgis.api.network;

import com.company.ftthgis.domain.network.dto.FiberCableDto;
import com.company.ftthgis.domain.network.entity.AssetDeletionLog;
import com.company.ftthgis.domain.network.repository.AssetDeletionLogRepository;
import com.company.ftthgis.domain.network.service.FiberCableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/network/cables")
@RequiredArgsConstructor
public class CableManagementController {

    private final FiberCableService fiberCableService;
    private final AssetDeletionLogRepository deletionLogRepository;

    @GetMapping
    public ResponseEntity<Page<FiberCableDto>> getAll(Pageable pageable) {
        return ResponseEntity.ok(fiberCableService.getCables(pageable));
    }

    @GetMapping("/{code}")
    public ResponseEntity<FiberCableDto> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(fiberCableService.getCableByCode(code));
    }

    @PostMapping
    public ResponseEntity<FiberCableDto> create(@RequestBody FiberCableDto dto) {
        return ResponseEntity.ok(fiberCableService.createCable(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FiberCableDto> update(@PathVariable Long id, @RequestBody FiberCableDto dto) {
        return ResponseEntity.ok(fiberCableService.updateCable(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
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
