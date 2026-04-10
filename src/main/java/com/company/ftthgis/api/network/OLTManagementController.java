package com.company.ftthgis.api.network;

import com.company.ftthgis.domain.network.dto.OLTDto;
import com.company.ftthgis.domain.network.entity.AssetDeletionLog;
import com.company.ftthgis.domain.network.repository.AssetDeletionLogRepository;
import com.company.ftthgis.domain.network.service.OLTService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/network/olts")
@RequiredArgsConstructor
public class OLTManagementController {

    private final OLTService oltService;
    private final AssetDeletionLogRepository deletionLogRepository;

    @GetMapping
    public ResponseEntity<Page<OLTDto>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            Pageable pageable) {
        return ResponseEntity.ok(oltService.getOlts(search, status, name, code, pageable));
    }

    @GetMapping("/{code}")
    public ResponseEntity<OLTDto> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(oltService.getOltByCode(code));
    }

    @PostMapping
    public ResponseEntity<OLTDto> create(@RequestBody OLTDto dto) {
        return ResponseEntity.ok(oltService.createOlt(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OLTDto> update(@PathVariable Long id, @RequestBody OLTDto dto) {
        return ResponseEntity.ok(oltService.updateOlt(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @RequestParam(required = false, defaultValue = "No reason provided") String reason) {
        String deletedCode = oltService.deleteOlt(id);

        AssetDeletionLog log = new AssetDeletionLog();
        log.setAssetCode(deletedCode);
        log.setAssetType("OLT");
        log.setReason(reason);
        deletionLogRepository.save(log);

        return ResponseEntity.noContent().build();
    }
}
