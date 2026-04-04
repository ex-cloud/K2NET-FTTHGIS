package com.company.ftthgis.api.network;

import com.company.ftthgis.domain.network.dto.FiberSpliceDto;
import com.company.ftthgis.domain.network.service.FiberSpliceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/network/splices")
@RequiredArgsConstructor
public class SpliceController {

    private final FiberSpliceService spliceService;

    @GetMapping
    public ResponseEntity<List<FiberSpliceDto>> getSplicesByNode(
            @RequestParam Long nodeId) {
        return ResponseEntity.ok(spliceService.getSplicesByNodeId(nodeId));
    }

    @GetMapping("/by-port/{portId}")
    public ResponseEntity<List<FiberSpliceDto>> getSplicesByPort(@PathVariable Long portId) {
        return ResponseEntity.ok(spliceService.getSplicesByPortId(portId));
    }

    @PostMapping
    public ResponseEntity<FiberSpliceDto> createSplice(@RequestBody FiberSpliceDto dto) {
        return ResponseEntity.ok(spliceService.createSplice(dto));
    }

    @DeleteMapping("/{spliceId}")
    public ResponseEntity<Void> deleteSplice(@PathVariable Long spliceId) {
        spliceService.deleteSplice(spliceId);
        return ResponseEntity.noContent().build();
    }
}
