package com.company.ftthgis.api.network;

import com.company.ftthgis.domain.network.dto.FiberSpliceDto;
import com.company.ftthgis.domain.network.service.FiberSpliceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/network/splices")
@RequiredArgsConstructor
public class SpliceController {

    private final FiberSpliceService spliceService;

    @GetMapping
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<List<FiberSpliceDto>> getSplicesByNode(
            @RequestParam UUID nodeId) {
        return ResponseEntity.ok(spliceService.getSplicesByNodeId(nodeId));
    }

    @GetMapping("/by-port/{portId}")
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<List<FiberSpliceDto>> getSplicesByPort(@PathVariable UUID portId) {
        return ResponseEntity.ok(spliceService.getSplicesByPortId(portId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('network.manage')")
    public ResponseEntity<FiberSpliceDto> createSplice(@RequestBody FiberSpliceDto dto) {
        return ResponseEntity.ok(spliceService.createSplice(dto));
    }

    @DeleteMapping("/{spliceId}")
    @PreAuthorize("hasAuthority('network.manage')")
    public ResponseEntity<Void> deleteSplice(@PathVariable UUID spliceId) {
        spliceService.deleteSplice(spliceId);
        return ResponseEntity.noContent().build();
    }
}
