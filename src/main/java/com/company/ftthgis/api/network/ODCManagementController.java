package com.company.ftthgis.api.network;

import com.company.ftthgis.domain.network.dto.ODCDto;
import com.company.ftthgis.domain.network.entity.AssetDeletionLog;
import com.company.ftthgis.domain.network.repository.AssetDeletionLogRepository;
import com.company.ftthgis.domain.network.service.ODCService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/network/odcs")
@RequiredArgsConstructor
public class ODCManagementController {

    private final ODCService odcService;
    private final AssetDeletionLogRepository deletionLogRepository;

    @GetMapping
    public ResponseEntity<Page<ODCDto>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String oltCode,
            Pageable pageable) {
        return ResponseEntity.ok(odcService.getOdcs(search, status, name, code, oltCode, pageable));
    }

    @GetMapping("/{code}")
    public ResponseEntity<ODCDto> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(odcService.getOdcByCode(code));
    }

    @PostMapping
    public ResponseEntity<ODCDto> create(@RequestBody ODCDto dto) {
        return ResponseEntity.ok(odcService.createOdc(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ODCDto> update(@PathVariable Long id, @RequestBody ODCDto dto) {
        return ResponseEntity.ok(odcService.updateOdc(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @RequestParam(required = false, defaultValue = "No reason provided") String reason) {
        String deletedCode = odcService.deleteOdc(id);

        AssetDeletionLog log = new AssetDeletionLog();
        log.setAssetCode(deletedCode);
        log.setAssetType("ODC");
        log.setReason(reason);
        deletionLogRepository.save(log);

        return ResponseEntity.noContent().build();
    }
}
