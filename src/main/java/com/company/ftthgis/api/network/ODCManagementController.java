package com.company.ftthgis.api.network;

import com.company.ftthgis.domain.network.dto.ODCDto;
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

    @GetMapping
    public ResponseEntity<Page<ODCDto>> getAll(
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return ResponseEntity.ok(odcService.getOdcs(search, pageable));
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
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        odcService.deleteOdc(id);
        return ResponseEntity.noContent().build();
    }
}
