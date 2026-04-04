package com.company.ftthgis.api.network;

import com.company.ftthgis.domain.network.dto.FiberCoreDto;
import com.company.ftthgis.domain.network.service.FiberCoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/network/cables/{cableId}/cores")
@RequiredArgsConstructor
public class FiberCoreController {

    private final FiberCoreService coreService;

    @GetMapping
    public ResponseEntity<List<FiberCoreDto>> getCoresByCable(@PathVariable Long cableId) {
        return ResponseEntity.ok(coreService.getCoresByCableId(cableId));
    }

    @GetMapping("/summary")
    public ResponseEntity<FiberCoreService.CoreSummary> getCoreSummary(@PathVariable Long cableId) {
        return ResponseEntity.ok(coreService.getCoreSummary(cableId));
    }

    @PutMapping("/{coreId}")
    public ResponseEntity<FiberCoreDto> updateCore(
            @PathVariable Long cableId,
            @PathVariable Long coreId,
            @RequestBody FiberCoreDto dto) {
        return ResponseEntity.ok(coreService.updateCore(coreId, dto));
    }

    @PostMapping("/generate")
    public ResponseEntity<List<FiberCoreDto>> generateCores(@PathVariable Long cableId) {
        return ResponseEntity.ok(coreService.generateCores(cableId));
    }
}
