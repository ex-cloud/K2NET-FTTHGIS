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

    @GetMapping("/{type}/{id}")
    public ResponseEntity<AssetDetailDto> getAssetDetail(
            @PathVariable String type,
            @PathVariable Long id) {

        log.info("Request detail for asset {} with id {}", type, id);

        AssetDetailDto.AssetDetailDtoBuilder builder = AssetDetailDto.builder()
                .id(id.toString())
                .type(type.toUpperCase());

        Map<String, Object> props = new HashMap<>();

        try {
            if ("ODC".equalsIgnoreCase(type)) {
                ODC odc = odcRepository.findById(id).orElseThrow();
                builder.code(odc.getCode()).status(odc.getStatus());
                props.put("Name", odc.getName());
                props.put("Capacity", odc.getCapacity());
                props.put("Used", odc.getUsedCapacity());
            } else if ("ODP".equalsIgnoreCase(type)) {
                ODP odp = odpRepository.findById(id).orElseThrow();
                builder.code(odp.getCode()).status(odp.getStatus());
                props.put("Total Ports", odp.getTotalPort());
                props.put("Used Ports", odp.getUsedPort());
                props.put("Signal (dB)", odp.getSignalDb());
                if (odp.getOdc() != null) {
                    props.put("Parent ODC", odp.getOdc().getCode());
                }
            } else if ("OLT".equalsIgnoreCase(type)) {
                OLT olt = oltRepository.findById(id).orElseThrow();
                builder.code(olt.getCode()).status(olt.getStatus());
                props.put("Name", olt.getName());
                props.put("Type", "Core Hub");
            } else if ("CUSTOMER".equalsIgnoreCase(type)) {
                Customer cust = customerRepository.findById(id).orElseThrow();
                builder.code(cust.getCode()).status(cust.getStatus());
                props.put("Name", cust.getName());
                props.put("Redaman (dB)", cust.getSignalDb());
                if (cust.getOdp() != null) {
                    props.put("Parent ODP", cust.getOdp().getCode());
                }
            } else if ("CABLE".equalsIgnoreCase(type)) {
                FiberCable cable = fiberCableRepository.findById(id).orElseThrow();
                builder.code(cable.getCode()).status(cable.getStatus());
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

    @GetMapping("/search")
    public ResponseEntity<List<AssetSearchResult>> search(@RequestParam String q) {
        log.info("Searching for assets with query: {}", q);
        List<AssetSearchResult> results = new ArrayList<>();

        // Search ODCs
        odcRepository.findAll().stream()
                .filter(o -> o.getCode().toLowerCase().contains(q.toLowerCase()))
                .limit(5)
                .forEach(o -> results.add(new AssetSearchResult(o.getId().toString(), o.getCode(), "ODC",
                        o.getGeom().getX(), o.getGeom().getY())));

        // Search ODPs
        odpRepository.findAll().stream()
                .filter(o -> o.getCode().toLowerCase().contains(q.toLowerCase()))
                .limit(5)
                .forEach(o -> results.add(new AssetSearchResult(o.getId().toString(), o.getCode(), "ODP",
                        o.getGeom().getX(), o.getGeom().getY())));

        // Search OLTs
        oltRepository.findAll().stream()
                .filter(o -> o.getCode().toLowerCase().contains(q.toLowerCase()))
                .limit(5)
                .forEach(o -> results.add(new AssetSearchResult(o.getId().toString(), o.getCode(), "OLT",
                        o.getGeom().getX(), o.getGeom().getY())));

        // Search Customers
        customerRepository.findAll().stream()
                .filter(o -> o.getCode().toLowerCase().contains(q.toLowerCase()))
                .limit(5)
                .forEach(o -> results.add(new AssetSearchResult(o.getId().toString(), o.getCode(), "CUSTOMER",
                        o.getGeom().getX(), o.getGeom().getY())));

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
    }
}
