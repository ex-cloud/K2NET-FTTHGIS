package com.company.ftthgis.api.network;

import com.company.ftthgis.domain.network.dto.SplitterPortDto;
import com.company.ftthgis.domain.network.service.SplitterPortService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/network/nodes/{nodeId}/ports")
@RequiredArgsConstructor
public class SplitterPortController {

    private final SplitterPortService portService;

    @GetMapping
    public ResponseEntity<List<SplitterPortDto>> getPortsByNode(@PathVariable Long nodeId) {
        return ResponseEntity.ok(portService.getPortsByNodeId(nodeId));
    }

    @GetMapping("/summary")
    public ResponseEntity<SplitterPortService.PortSummary> getPortSummary(@PathVariable Long nodeId) {
        return ResponseEntity.ok(portService.getPortSummary(nodeId));
    }

    @PostMapping
    public ResponseEntity<SplitterPortDto> createPort(
            @PathVariable Long nodeId,
            @RequestBody SplitterPortDto dto) {
        return ResponseEntity.ok(portService.createPort(nodeId, dto));
    }

    @PutMapping("/{portId}")
    public ResponseEntity<SplitterPortDto> updatePort(
            @PathVariable Long nodeId,
            @PathVariable Long portId,
            @RequestBody SplitterPortDto dto) {
        return ResponseEntity.ok(portService.updatePort(portId, dto));
    }

    @DeleteMapping("/{portId}")
    public ResponseEntity<Void> deletePort(
            @PathVariable Long nodeId,
            @PathVariable Long portId) {
        portService.deletePort(portId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/generate")
    public ResponseEntity<List<SplitterPortDto>> generatePorts(
            @PathVariable Long nodeId,
            @RequestParam(defaultValue = "ODP") String nodeType,
            @RequestParam(defaultValue = "8") int count,
            @RequestParam(defaultValue = "true") boolean withUplink) {
        return ResponseEntity.ok(portService.generatePorts(nodeId, nodeType, count, withUplink));
    }
}
