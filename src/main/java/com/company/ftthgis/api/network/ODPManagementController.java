package com.company.ftthgis.api.network;

import com.company.ftthgis.domain.network.dto.ODPDto;
import com.company.ftthgis.domain.network.service.ODPService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/network/odps")
@RequiredArgsConstructor
public class ODPManagementController {

    private final ODPService odpService;

    @GetMapping
    public ResponseEntity<Page<ODPDto>> getAll(
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return ResponseEntity.ok(odpService.getOdps(search, pageable));
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
    public ResponseEntity<ODPDto> update(@PathVariable Long id, @RequestBody ODPDto dto) {
        return ResponseEntity.ok(odpService.updateOdp(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        odpService.deleteOdp(id);
        return ResponseEntity.noContent().build();
    }
}
