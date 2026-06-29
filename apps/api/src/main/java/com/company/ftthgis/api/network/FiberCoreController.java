package com.company.ftthgis.api.network;

import com.company.ftthgis.domain.network.dto.FiberCoreDto;
import com.company.ftthgis.domain.network.service.FiberCoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/network/cables/{cableId}/cores")
@RequiredArgsConstructor
public class FiberCoreController {

    private final FiberCoreService coreService;

    @GetMapping
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<List<FiberCoreDto>> getCoresByCable(@PathVariable UUID cableId) {
        return ResponseEntity.ok(coreService.getCoresByCableId(cableId));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<FiberCoreService.CoreSummary> getCoreSummary(@PathVariable UUID cableId) {
        return ResponseEntity.ok(coreService.getCoreSummary(cableId));
    }

    @PutMapping("/{coreId}")
    @PreAuthorize("hasAuthority('network.manage')")
    public ResponseEntity<FiberCoreDto> updateCore(
            @PathVariable UUID cableId,
            @PathVariable UUID coreId,
            @RequestBody FiberCoreDto dto) {
        return ResponseEntity.ok(coreService.updateCore(coreId, dto));
    }

    @PostMapping("/generate")
    @PreAuthorize("hasAuthority('network.manage')")
    public ResponseEntity<List<FiberCoreDto>> generateCores(@PathVariable UUID cableId) {
        return ResponseEntity.ok(coreService.generateCores(cableId));
    }
}
