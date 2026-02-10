package com.company.ftthgis.api.network;

import com.company.ftthgis.api.network.dto.AssetDetailDto;
import com.company.ftthgis.domain.network.entity.Customer;
import com.company.ftthgis.domain.network.entity.FiberCable;
import com.company.ftthgis.domain.network.entity.ODC;
import com.company.ftthgis.domain.network.entity.ODP;
import com.company.ftthgis.domain.network.entity.OLT;
import com.company.ftthgis.domain.network.repository.*;
import com.company.ftthgis.domain.network.service.StatusCacheService;
import com.company.ftthgis.domain.network.service.StatusPropagationService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/network/assets")
@RequiredArgsConstructor
@Slf4j
public class NetworkAssetController {

    private final OLTRepository oltRepository;
    private final ODCRepository odcRepository;
    private final ODPRepository odpRepository;
    private final CustomerRepository customerRepository;
    private final FiberCableRepository fiberCableRepository;
    private final StatusCacheService statusCacheService;
    private final StatusPropagationService statusPropagationService;

    @PostMapping("/simulate-failure")
    public ResponseEntity<Map<String, Object>> simulateFailure(
            @RequestParam String targetCode,
            @RequestParam String targetType,
            @RequestParam String status) {

        log.info("🎮 Manual simulation triggered for {}: {}", targetCode, status);

        if ("OLT".equalsIgnoreCase(targetType)) {
            statusPropagationService.handleOltStatusChange(targetCode, status);
        } else if ("ODC".equalsIgnoreCase(targetType)) {
            // For ODC, if status is FIBERCUT, use the proper FIBERCUT handler
            if ("FIBERCUT".equalsIgnoreCase(status)) {
                statusPropagationService.simulateCableFailure("SIM-CABLE-ODC-" + targetCode, targetCode, "FIBERCUT");
            } else {
                statusPropagationService.simulateCableFailure("SIM-CABLE-01", targetCode, status);
            }
        } else if ("ODP".equalsIgnoreCase(targetType)) {
            // For ODP FIBERCUT simulation, we need special handling
            if ("FIBERCUT".equalsIgnoreCase(status)) {
                // Mark as FIBERCUT and propagate
                statusPropagationService.handleOdpStatusChange(targetCode, "FIBERCUT");
            } else {
                statusPropagationService.handleOdpStatusChange(targetCode, status);
            }
        } else if ("CUSTOMER".equalsIgnoreCase(targetType)) {
            statusPropagationService.handleCustomerStatusChange(targetCode, status);
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Simulation triggered for " + targetCode));
    }

    /**
     * Get detail by ID (Safer version to avoid 500 on string IDs)
     */
    @GetMapping("/{type}/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getAssetDetail(
            @PathVariable String type,
            @PathVariable String id) {

        log.info("Fetching detail lookup for {} : {}", type, id);

        // If ID is not a number, try to treat it as a code
        try {
            Long numericId = Long.parseLong(id);
            String code = null;
            if ("ODC".equalsIgnoreCase(type)) {
                code = odcRepository.findById(numericId).map(ODC::getCode).orElse(null);
            } else if ("ODP".equalsIgnoreCase(type)) {
                code = odpRepository.findById(numericId).map(ODP::getCode).orElse(null);
            } else if ("OLT".equalsIgnoreCase(type)) {
                code = oltRepository.findById(numericId).map(OLT::getCode).orElse(null);
            } else if ("CUSTOMER".equalsIgnoreCase(type)) {
                code = customerRepository.findById(numericId).map(Customer::getCode).orElse(null);
            } else if ("CABLE".equalsIgnoreCase(type)) {
                code = fiberCableRepository.findById(numericId).map(FiberCable::getCode).orElse(null);
            }

            if (code != null) {
                return getAssetDetailByCode(type, code);
            }
        } catch (NumberFormatException e) {
            log.warn("ID {} is not numeric, attempting fallback to code lookup", id);
            return getAssetDetailByCode(type, id);
        }

        return ResponseEntity.notFound().build();
    }

    @GetMapping("/by-code/{type}/{code}")
    @Transactional(readOnly = true)
    public ResponseEntity<AssetDetailDto> getAssetDetailByCode(
            @PathVariable String type,
            @PathVariable String code) {

        log.info("Fetching detail for {} with code: {}", type, code);
        try {
            AssetDetailDto dto = new AssetDetailDto();
            dto.setCode(code);
            dto.setType(type.toUpperCase());

            String status = statusCacheService.getStatus(code);
            List<String> labels = new java.util.ArrayList<>();
            if (status != null) {
                if ("FIBERCUT".equalsIgnoreCase(status)) {
                    labels.add("DOWN");
                    labels.add("FIBERCUT");
                } else {
                    labels.add(status);
                }
            }
            dto.setLabels(labels);

            if ("ODC".equalsIgnoreCase(type)) {
                odcRepository.findByCode(code).ifPresent(o -> {
                    dto.setName(o.getName());
                    dto.setId(o.getId().toString());
                    String finalStatus = status != null ? status : o.getStatus();
                    dto.setStatus(finalStatus);
                    if (labels.isEmpty())
                        labels.add(finalStatus);
                    Map<String, Object> attrs = new HashMap<>();
                    attrs.put("Capacity", o.getCapacity());
                    attrs.put("Used", o.getUsedCapacity());
                    dto.setAttributes(attrs);
                });
            } else if ("ODP".equalsIgnoreCase(type)) {
                odpRepository.findByCode(code).ifPresent(o -> {
                    dto.setName(o.getCode());
                    dto.setId(o.getId().toString());
                    String finalStatus = status != null ? status : o.getStatus();
                    dto.setStatus(finalStatus);
                    if (labels.isEmpty())
                        labels.add(finalStatus);
                    Map<String, Object> attrs = new HashMap<>();
                    attrs.put("Total Ports", o.getTotalPort());
                    attrs.put("Used Ports", o.getUsedPort());
                    if (o.getOdc() != null)
                        attrs.put("Parent ODC", o.getOdc().getCode());
                    dto.setAttributes(attrs);
                });
            } else if ("OLT".equalsIgnoreCase(type)) {
                oltRepository.findByCode(code).ifPresent(o -> {
                    dto.setName(o.getName());
                    dto.setId(o.getId().toString());
                    String finalStatus = status != null ? status : o.getStatus();
                    dto.setStatus(finalStatus);
                    if (labels.isEmpty())
                        labels.add(finalStatus);
                    Map<String, Object> attrs = new HashMap<>();
                    attrs.put("IP Address", o.getIpAddress());
                    dto.setAttributes(attrs);
                });
            } else if ("CUSTOMER".equalsIgnoreCase(type)) {
                customerRepository.findByCode(code).ifPresent(o -> {
                    dto.setName(o.getName());
                    dto.setId(o.getId().toString());
                    String finalStatus = status != null ? status : o.getStatus();
                    dto.setStatus(finalStatus);
                    if (labels.isEmpty())
                        labels.add(finalStatus);
                    Map<String, Object> attrs = new HashMap<>();
                    attrs.put("Address", o.getAddress());
                    if (o.getOdp() != null)
                        attrs.put("Connected ODP", o.getOdp().getCode());
                    dto.setAttributes(attrs);
                });
            } else if ("CABLE".equalsIgnoreCase(type)) {
                fiberCableRepository.findByCode(code).ifPresent(o -> {
                    dto.setId(o.getId().toString());
                    String finalStatus = status != null ? status : o.getStatus();
                    dto.setStatus(finalStatus);
                    if (labels.isEmpty())
                        labels.add(finalStatus);
                    Map<String, Object> attrs = new HashMap<>();
                    attrs.put("Fiber Count", o.getFiberCount());
                    attrs.put("Length (m)",
                            o.getLengthMeters() != null ? String.format("%.2f", o.getLengthMeters()) : "0");
                    dto.setAttributes(attrs);
                });
            }

            if (dto.getId() == null)
                return ResponseEntity.notFound().build();

            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            log.error("Error fetching detail for {} - {}", code, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/{type}/{code}/diagnostics")
    public ResponseEntity<Map<String, Object>> runDiagnostics(
            @PathVariable String type,
            @PathVariable String code) {

        log.info("🔍 Running diagnostics for {}: {}", type, code);
        try {
            Map<String, Object> result = statusPropagationService.calculateDiagnostics(type, code);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("CRITICAL: Diagnostics failed for {} - {}", code, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<AssetSearchResult>> search(@RequestParam String q) {
        List<AssetSearchResult> results = new ArrayList<>();
        String query = q.toLowerCase();

        odcRepository.findAll().stream()
                .filter(o -> o.getCode().toLowerCase().contains(query)
                        || (o.getName() != null && o.getName().toLowerCase().contains(query)))
                .limit(5)
                .forEach(o -> results.add(new AssetSearchResult(o.getId().toString(), o.getCode(), "ODC",
                        o.getGeom().getX(), o.getGeom().getY(),
                        Optional.ofNullable(statusCacheService.getStatus(o.getCode())).orElse(o.getStatus()))));

        odpRepository.findAll().stream()
                .filter(o -> o.getCode().toLowerCase().contains(query))
                .limit(5)
                .forEach(o -> results.add(new AssetSearchResult(o.getId().toString(), o.getCode(), "ODP",
                        o.getGeom().getX(), o.getGeom().getY(),
                        Optional.ofNullable(statusCacheService.getStatus(o.getCode())).orElse(o.getStatus()))));

        oltRepository.findAll().stream()
                .filter(o -> o.getCode().toLowerCase().contains(query)
                        || (o.getName() != null && o.getName().toLowerCase().contains(query)))
                .limit(5)
                .forEach(o -> results.add(new AssetSearchResult(o.getId().toString(), o.getCode(), "OLT",
                        o.getGeom().getX(), o.getGeom().getY(),
                        Optional.ofNullable(statusCacheService.getStatus(o.getCode())).orElse(o.getStatus()))));

        return ResponseEntity.ok(results);
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AssetSearchResult {
        private String id;
        private String code;
        private String type;
        private double lng;
        private double lat;
        private String status;
    }
}
