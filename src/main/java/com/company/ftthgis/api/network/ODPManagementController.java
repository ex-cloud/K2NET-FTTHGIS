package com.company.ftthgis.api.network;

import com.company.ftthgis.domain.network.dto.ODPDto;
import com.company.ftthgis.domain.network.entity.AssetDeletionLog;
import com.company.ftthgis.domain.network.repository.AssetDeletionLogRepository;
import com.company.ftthgis.domain.network.service.ODPService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/network/odps")
@RequiredArgsConstructor
public class ODPManagementController {

    private final ODPService odpService;
    private final AssetDeletionLogRepository deletionLogRepository;

    @GetMapping
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
    public ResponseEntity<ODPDto> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(odpService.getOdpByCode(code));
    }

    @PostMapping
    public ResponseEntity<ODPDto> create(@RequestBody ODPDto dto) {
        return ResponseEntity.ok(odpService.createOdp(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ODPDto> update(@PathVariable UUID id, @RequestBody ODPDto dto) {
        return ResponseEntity.ok(odpService.updateOdp(id, dto));
    }

    @DeleteMapping("/{id}")
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
