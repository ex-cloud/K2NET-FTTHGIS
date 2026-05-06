package com.company.ftthgis.domain.network.service;

import com.company.ftthgis.domain.network.dto.FiberCableMapDto;
import com.company.ftthgis.domain.network.dto.ODCDto;
import com.company.ftthgis.domain.network.entity.ODC;
import com.company.ftthgis.domain.network.entity.ODP;
import com.company.ftthgis.domain.network.event.MapEventPublisher;
import com.company.ftthgis.domain.network.repository.CustomerRepository;
import com.company.ftthgis.domain.network.repository.FiberCableRepository;
import com.company.ftthgis.domain.network.repository.ODPRepository;
import com.company.ftthgis.domain.network.repository.ODCRepository;
import com.company.ftthgis.domain.network.repository.OLTRepository;
import com.company.ftthgis.domain.network.repository.projection.FiberCableProjection;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.geolatte.geom.jts.JTS;
import org.locationtech.jts.geom.LineString;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NetworkServiceImpl implements NetworkService {

    private final ODCRepository odcRepository;
    private final ODPRepository odpRepository;
    private final OLTRepository oltRepository;
    private final CustomerRepository customerRepository;
    private final FiberCableRepository fiberCableRepository;
    private final StatusCacheService statusCacheService;
    private final MapEventPublisher mapEventPublisher;

    @Override
    @Transactional
    public ODCDto createODC(ODCDto dto) {
        ODC odc = new ODC();
        odc.setCode(dto.getCode());
        odc.setName(dto.getName());
        odc.setGeom(dto.getGeom());
        odc.setCapacity(dto.getCapacity());
        odc.setUsedCapacity(0);
        odc.setStatus(dto.getStatus());

        ODC saved = odcRepository.save(odc);
        dto.setId(saved.getId());
        return dto;
    }

    @Override
    public List<FiberCableMapDto> getCablesInBbox(double xmin, double ymin, double xmax, double ymax, int zoom) {
        List<FiberCableProjection> projections = fiberCableRepository.findByBoundingBox(xmin, ymin, xmax, ymax);
        return mapProjectionsToDtos(projections);
    }

    @Override
    public List<FiberCableMapDto> tracePath(UUID startNodeId, UUID endNodeId) {
        List<FiberCableProjection> projections = fiberCableRepository.findShortestPath(startNodeId, endNodeId);
        return mapProjectionsToDtos(projections);
    }

    @Override
    public List<FiberCableMapDto> traceUpstream(UUID nodeId) {
        // Try to find the root OLT by traversing parents
        UUID rootOltId = findRootOltId(nodeId);
        if (rootOltId != null) {
            return tracePath(nodeId, rootOltId);
        }
        return List.of();
    }

    private UUID findRootOltId(UUID nodeId) {
        // 1. Check if it's already an OLT
        if (oltRepository.existsById(nodeId)) return nodeId;

        // 2. Check if ODP
        var odpOpt = odpRepository.findById(nodeId);
        if (odpOpt.isPresent()) {
            ODP odp = odpOpt.get();
            if (odp.getOdc() != null) {
                return findRootOltId(odp.getOdc().getId());
            }
        }

        // 3. Check if ODC
        var odcOpt = odcRepository.findById(nodeId);
        if (odcOpt.isPresent()) {
            ODC odc = odcOpt.get();
            if (odc.getOlt() != null) {
                return odc.getOlt().getId();
            }
        }

        return null;
    }

    private List<FiberCableMapDto> mapProjectionsToDtos(List<FiberCableProjection> projections) {
        return projections.stream().map(p -> {
            try {
                FiberCableMapDto dto = new FiberCableMapDto();
                dto.setId(p.getId());
                dto.setCode(p.getCode());

                Object geom = p.getGeometry();
                if (geom != null) {
                    if (geom instanceof org.geolatte.geom.Geometry<?> g) {
                        org.locationtech.jts.geom.Geometry jtsGeom = JTS.to(g);
                        if (jtsGeom instanceof LineString ls) {
                            dto.setGeometry(ls);
                        } else {
                            log.warn("Expected LineString but got {} for code {}", jtsGeom.getGeometryType(),
                                    p.getCode());
                        }
                    } else if (geom instanceof LineString ls) {
                        dto.setGeometry(ls);
                    } else {
                        log.warn("Unknown geometry type {} for code {}", geom.getClass().getName(), p.getCode());
                    }
                }

                dto.setStatus(p.getStatus());
                return dto;
            } catch (Exception e) {
                log.error("Error mapping cable {}: {}", p.getCode(), e.getMessage());
                return null;
            }
        })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateAssetStatus(String code, String type, String status) {
        UUID projectId = null;

        // 1. Update DB (Persistent)
        if ("ODP".equalsIgnoreCase(type)) {
            var assetOpt = odpRepository.findByCode(code);
            if (assetOpt.isPresent()) {
                var asset = assetOpt.get();
                asset.setStatus(status);
                odpRepository.save(asset);
                projectId = asset.getProject() != null ? asset.getProject().getId() : null;
            }
        } else if ("ODC".equalsIgnoreCase(type)) {
            var assetOpt = odcRepository.findByCode(code);
            if (assetOpt.isPresent()) {
                var asset = assetOpt.get();
                asset.setStatus(status);
                odcRepository.save(asset);
                projectId = asset.getProject() != null ? asset.getProject().getId() : null;
            }
        } else if ("OLT".equalsIgnoreCase(type)) {
            var assetOpt = oltRepository.findByCode(code);
            if (assetOpt.isPresent()) {
                var asset = assetOpt.get();
                asset.setStatus(status);
                oltRepository.save(asset);
                projectId = asset.getProject() != null ? asset.getProject().getId() : null;
            }
        } else if ("CABLE".equalsIgnoreCase(type)) {
            var assetOpt = fiberCableRepository.findByCode(code);
            if (assetOpt.isPresent()) {
                var asset = assetOpt.get();
                asset.setStatus(status);
                fiberCableRepository.save(asset);
                projectId = asset.getProject() != null ? asset.getProject().getId() : null;
            }
        } else if ("CUSTOMER".equalsIgnoreCase(type)) {
            var assetOpt = customerRepository.findByCode(code);
            if (assetOpt.isPresent()) {
                var asset = assetOpt.get();
                asset.setStatus(status);
                customerRepository.save(asset);
                projectId = asset.getProject() != null ? asset.getProject().getId() : null;
            }
        }

        // 2. Update Cache (Fast Path)
        statusCacheService.setStatus(code, status);

        // 3. Notify Map (Real-time Broadcast)
        if (projectId != null) {
            mapEventPublisher.publishStatusChange(code, status, type, projectId);
        } else {
            log.warn("Could not determine projectId for asset {} of type {}. Event not published.", code, type);
        }
    }
}
