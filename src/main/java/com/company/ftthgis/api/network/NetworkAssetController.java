package com.company.ftthgis.api.network;

import com.company.ftthgis.api.network.dto.AssetDetailDto;
import com.company.ftthgis.domain.network.entity.Customer;
import com.company.ftthgis.domain.network.entity.FiberCable;
import com.company.ftthgis.domain.network.entity.ODC;
import com.company.ftthgis.domain.network.entity.ODP;
import com.company.ftthgis.domain.network.entity.OLT;
import com.company.ftthgis.domain.network.repository.CustomerRepository;
import com.company.ftthgis.domain.network.repository.FiberCableRepository;
import com.company.ftthgis.domain.network.repository.ODCRepository;
import com.company.ftthgis.domain.network.repository.ODPRepository;
import com.company.ftthgis.domain.network.repository.OLTRepository;
import com.company.ftthgis.domain.network.service.StatusCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/network/assets")
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class NetworkAssetController {

    private final OLTRepository oltRepository;
    private final ODCRepository odcRepository;
    private final ODPRepository odpRepository;
    private final CustomerRepository customerRepository;
    private final FiberCableRepository fiberCableRepository;
    private final StatusCacheService statusCacheService;

    @GetMapping("/{type}/{id}")
    public ResponseEntity<AssetDetailDto> getAssetDetail(
            @PathVariable String type,
            @PathVariable Long id) {

        log.info("Request detail for asset type [{}] with id [{}]", type, id);
        log.info("Type class: {}, Id class: {}", type.getClass().getName(), id.getClass().getName());

        AssetDetailDto.AssetDetailDtoBuilder builder = AssetDetailDto.builder()
                .id(id.toString())
                .type(type.toUpperCase());

        Map<String, Object> props = new HashMap<>();

        try {
            if ("ODC".equalsIgnoreCase(type)) {
                ODC odc = odcRepository.findById(id).orElseThrow(() -> {
                    log.error("ODC not found with ID: {}", id);
                    return new java.util.NoSuchElementException("ODC not found");
                });
                log.info("Found ODC: {}", odc.getCode());
                String status = statusCacheService.getStatus(odc.getCode());
                builder.code(odc.getCode())
                        .status(status != null ? status : odc.getStatus())
                        .lastMaintenance(odc.getLastMaintenance() != null ? odc.getLastMaintenance().toString() : null);
                props.put("Name", odc.getName());
                props.put("Capacity", odc.getCapacity());
                props.put("Used", odc.getUsedCapacity());
            } else if ("ODP".equalsIgnoreCase(type)) {
                ODP odp = odpRepository.findById(id).orElseThrow(() -> {
                    log.error("ODP not found with ID: {}", id);
                    return new java.util.NoSuchElementException("ODP not found");
                });
                log.info("Found ODP: {}", odp.getCode());
                String status = statusCacheService.getStatus(odp.getCode());
                builder.code(odp.getCode())
                        .status(status != null ? status : odp.getStatus())
                        .lastMaintenance(odp.getLastMaintenance() != null ? odp.getLastMaintenance().toString() : null);
                props.put("Total Ports", odp.getTotalPort());
                props.put("Used Ports", odp.getUsedPort());
                props.put("Signal (dB)", odp.getSignalDb());
                if (odp.getOdc() != null) {
                    props.put("Parent ODC", odp.getOdc().getCode());
                }
            } else if ("OLT".equalsIgnoreCase(type)) {
                OLT olt = oltRepository.findById(id).orElseThrow(() -> {
                    log.error("OLT not found with ID: {}", id);
                    return new java.util.NoSuchElementException("OLT not found");
                });
                log.info("Found OLT: {}", olt.getCode());
                String status = statusCacheService.getStatus(olt.getCode());
                builder.code(olt.getCode())
                        .status(status != null ? status : olt.getStatus())
                        .lastMaintenance(olt.getLastMaintenance() != null ? olt.getLastMaintenance().toString() : null);
                props.put("Name", olt.getName());
                props.put("Type", "Core Hub");
            } else if ("CUSTOMER".equalsIgnoreCase(type)) {
                Customer cust = customerRepository.findById(id).orElseThrow();
                String status = statusCacheService.getStatus(cust.getCode());
                builder.code(cust.getCode())
                        .status(status != null ? status : cust.getStatus())
                        .lastMaintenance(
                                cust.getLastMaintenance() != null ? cust.getLastMaintenance().toString() : null);
                props.put("Name", cust.getName());
                props.put("Redaman (dB)", cust.getSignalDb());
                if (cust.getOdp() != null) {
                    props.put("Parent ODP", cust.getOdp().getCode());
                }
            } else if ("CABLE".equalsIgnoreCase(type)) {
                FiberCable cable = fiberCableRepository.findById(id).orElseThrow();
                String status = statusCacheService.getStatus(cable.getCode());
                builder.code(cable.getCode())
                        .status(status != null ? status : cable.getStatus())
                        .lastMaintenance(
                                cable.getLastMaintenance() != null ? cable.getLastMaintenance().toString() : null);
                props.put("Fiber Count", cable.getFiberCount());
                props.put("Length", String.format("%.2f m", cable.getLengthMeters()));
            }
        } catch (Exception e) {
            log.error("Error fetching asset details", e);
            throw e;
        }

        builder.properties(props);
        return ResponseEntity.ok(builder.build());
    }

    @GetMapping("/{type}/code/{code}")
    public ResponseEntity<AssetDetailDto> getAssetDetailByCode(
            @PathVariable String type,
            @PathVariable String code) {

        log.info("Request detail for asset type [{}] with code [{}]", type, code);

        Long id = null;
        try {
            if ("ODC".equalsIgnoreCase(type)) {
                id = odcRepository.findByCode(code).map(ODC::getId).orElse(null);
            } else if ("ODP".equalsIgnoreCase(type)) {
                id = odpRepository.findByCode(code).map(ODP::getId).orElse(null);
            } else if ("OLT".equalsIgnoreCase(type)) {
                id = oltRepository.findByCode(code).map(OLT::getId).orElse(null);
            } else if ("CUSTOMER".equalsIgnoreCase(type)) {
                id = customerRepository.findByCode(code).map(Customer::getId).orElse(null);
            } else if ("CABLE".equalsIgnoreCase(type)) {
                id = fiberCableRepository.findByCode(code).map(FiberCable::getId).orElse(null);
            }
        } catch (Exception e) {
            log.error("Error looking up asset ID by code", e);
        }

        if (id == null) {
            log.error("{} not found with code: {}", type, code);
            return ResponseEntity.notFound().build();
        }

        return getAssetDetail(type, id);
    }

    @GetMapping("/search")
    public ResponseEntity<List<AssetSearchResult>> search(@RequestParam String q) {
        log.info("Searching for assets with query: {}", q);
        List<AssetSearchResult> results = new ArrayList<>();

        // Search ODCs
        odcRepository.findAll().stream()
                .filter(o -> o.getCode().toLowerCase().contains(q.toLowerCase()))
                .limit(5)
                .forEach(o -> results.add(new AssetSearchResult(o.getId().toString(), o.getCode(), "ODC",
                        o.getGeom().getX(), o.getGeom().getY(), o.getStatus())));

        // Search ODPs
        odpRepository.findAll().stream()
                .filter(o -> o.getCode().toLowerCase().contains(q.toLowerCase()))
                .limit(5)
                .forEach(o -> results.add(new AssetSearchResult(o.getId().toString(), o.getCode(), "ODP",
                        o.getGeom().getX(), o.getGeom().getY(), o.getStatus())));

        // Search OLTs
        oltRepository.findAll().stream()
                .filter(o -> o.getCode().toLowerCase().contains(q.toLowerCase()))
                .limit(5)
                .forEach(o -> results.add(new AssetSearchResult(o.getId().toString(), o.getCode(), "OLT",
                        o.getGeom().getX(), o.getGeom().getY(), o.getStatus())));

        // Search Customers
        customerRepository.findAll().stream()
                .filter(o -> o.getCode().toLowerCase().contains(q.toLowerCase()))
                .limit(5)
                .forEach(o -> results.add(new AssetSearchResult(o.getId().toString(), o.getCode(), "CUSTOMER",
                        o.getGeom().getX(), o.getGeom().getY(), o.getStatus())));

        return ResponseEntity.ok(results);
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class AssetSearchResult {
        private String id;
        private String code;
        private String type;
        private double lng;
        private double lat;
        private String status;
    }
}
