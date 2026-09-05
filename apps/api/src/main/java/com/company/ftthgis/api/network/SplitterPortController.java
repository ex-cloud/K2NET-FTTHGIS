package com.company.ftthgis.api.network;

import com.company.ftthgis.domain.network.dto.SplitterPortDto;
import com.company.ftthgis.domain.network.service.SplitterPortService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/network/nodes/{nodeId}/ports")
@RequiredArgsConstructor
public class SplitterPortController {

    private final SplitterPortService portService;

    @GetMapping
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<List<SplitterPortDto>> getPortsByNode(@PathVariable UUID nodeId) {
        return ResponseEntity.ok(portService.getPortsByNodeId(nodeId));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<SplitterPortService.PortSummary> getPortSummary(@PathVariable UUID nodeId) {
        return ResponseEntity.ok(portService.getPortSummary(nodeId));
    }

    @PostMapping
    @PreAuthorize("@spatialSecurityEvaluator.canAccessNode(#nodeId, 'network.manage')")
    public ResponseEntity<SplitterPortDto> createPort(
            @PathVariable UUID nodeId,
            @RequestBody SplitterPortDto dto) {
        return ResponseEntity.ok(portService.createPort(nodeId, dto));
    }

    @PutMapping("/{portId}")
    @PreAuthorize("@spatialSecurityEvaluator.canAccessNode(#nodeId, 'network.manage')")
    public ResponseEntity<SplitterPortDto> updatePort(
            @PathVariable UUID nodeId,
            @PathVariable UUID portId,
            @RequestBody SplitterPortDto dto) {
        return ResponseEntity.ok(portService.updatePort(portId, dto));
    }

    @DeleteMapping("/{portId}")
    @PreAuthorize("@spatialSecurityEvaluator.canAccessNode(#nodeId, 'network.manage')")
    public ResponseEntity<Void> deletePort(
            @PathVariable UUID nodeId,
            @PathVariable UUID portId) {
        portService.deletePort(portId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/generate")
    @PreAuthorize("@spatialSecurityEvaluator.canAccessNode(#nodeId, 'network.manage')")
    public ResponseEntity<List<SplitterPortDto>> generatePorts(
            @PathVariable UUID nodeId,
            @RequestParam(defaultValue = "ODP") String nodeType,
            @RequestParam(defaultValue = "8") int count,
            @RequestParam(defaultValue = "true") boolean withUplink) {
        return ResponseEntity.ok(portService.generatePorts(nodeId, nodeType, count, withUplink));
    }
}
