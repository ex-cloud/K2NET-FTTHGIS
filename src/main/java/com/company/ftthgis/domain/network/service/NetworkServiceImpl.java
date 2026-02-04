package com.company.ftthgis.domain.network.service;

import com.company.ftthgis.domain.network.dto.FiberCableMapDto;
import com.company.ftthgis.domain.network.dto.ODCDto;
import com.company.ftthgis.domain.network.entity.ODC;
import com.company.ftthgis.domain.network.repository.FiberCableRepository;
import com.company.ftthgis.domain.network.repository.ODCRepository;
import com.company.ftthgis.domain.network.repository.projection.FiberCableProjection;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.geolatte.geom.jts.JTS;
import org.locationtech.jts.geom.LineString;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NetworkServiceImpl implements NetworkService {

    private final ODCRepository odcRepository;
    private final FiberCableRepository fiberCableRepository;

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
    public List<FiberCableMapDto> tracePath(int startNode, int endNode) {
        List<FiberCableProjection> projections = fiberCableRepository.findShortestPath(startNode, endNode);
        return mapProjectionsToDtos(projections);
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
}
