package com.company.ftthgis.api.network;

import com.company.ftthgis.domain.network.dto.OLTDto;
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

    @GetMapping
    public ResponseEntity<Page<OLTDto>> getAll(
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return ResponseEntity.ok(oltService.getOlts(search, pageable));
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
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        oltService.deleteOlt(id);
        return ResponseEntity.noContent().build();
    }
}
