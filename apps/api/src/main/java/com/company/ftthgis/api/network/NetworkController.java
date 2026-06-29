package com.company.ftthgis.api.network;

import com.company.ftthgis.domain.network.dto.FiberCableMapDto;
import com.company.ftthgis.domain.network.dto.ODCDto;
import com.company.ftthgis.domain.network.service.NetworkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/network")
@RequiredArgsConstructor
public class NetworkController {

    private final NetworkService networkService;

    @PostMapping("/odc")
    @PreAuthorize("hasAuthority('network.manage')")
    public ResponseEntity<ODCDto> createODC(@RequestBody ODCDto dto) {
        return ResponseEntity.ok(networkService.createODC(dto));
    }

    @GetMapping("/map/cables")
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<List<FiberCableMapDto>> getMapCables(
            @RequestParam double xmin,
            @RequestParam double ymin,
            @RequestParam double xmax,
            @RequestParam double ymax,
            @RequestParam(defaultValue = "10") int zoom) {
        return ResponseEntity.ok(networkService.getCablesInBbox(xmin, ymin, xmax, ymax, zoom));
    }

    @GetMapping("/trace-path")
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<List<FiberCableMapDto>> tracePath(
            @RequestParam UUID startNodeId,
            @RequestParam UUID endNodeId) {
        return ResponseEntity.ok(networkService.tracePath(startNodeId, endNodeId));
    }
    @GetMapping("/trace-upstream")
    @PreAuthorize("hasAuthority('network.view')")
    public ResponseEntity<List<FiberCableMapDto>> traceUpstream(
            @RequestParam UUID nodeId) {
        return ResponseEntity.ok(networkService.traceUpstream(nodeId));
    }
}
