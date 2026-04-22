package com.company.ftthgis.domain.network.service;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;

import com.company.ftthgis.domain.network.dto.ODPDto;
import com.company.ftthgis.domain.network.entity.ODC;
import com.company.ftthgis.domain.network.entity.ODP;
import com.company.ftthgis.domain.network.repository.ODCRepository;
import com.company.ftthgis.domain.network.repository.ODPRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional
public class ODPService {

    private final ODPRepository odpRepository;
    private final ODCRepository odcRepository;
    private final StatusPropagationService statusPropagationService;

    @Transactional(readOnly = true)
    public Page<ODPDto> getOdps(String search, String status, String name, String code, String odcCode, Pageable pageable) {
        Specification<ODP> spec = (root, query, cb) -> {
            var predicates = cb.conjunction();
            
            if (StringUtils.hasText(search)) {
                String likePattern = "%" + search.toLowerCase() + "%";
                predicates = cb.and(predicates, cb.or(
                        cb.like(cb.lower(root.get("code")), likePattern),
                        cb.like(cb.lower(root.get("status")), likePattern)
                ));
            }
            
            if (StringUtils.hasText(status)) {
                String likePattern = "%" + status.toUpperCase() + "%";
                predicates = cb.and(predicates, cb.like(cb.upper(root.get("status")), likePattern));
            }
            
            if (StringUtils.hasText(code)) {
                String likePattern = "%" + code.toLowerCase() + "%";
                predicates = cb.and(predicates, cb.like(cb.lower(root.get("code")), likePattern));
            }

            if (StringUtils.hasText(odcCode)) {
                String likePattern = "%" + odcCode.toLowerCase() + "%";
                predicates = cb.and(predicates, cb.or(
                        cb.like(cb.lower(root.get("odc").get("code")), likePattern),
                        cb.like(cb.lower(root.get("odc").get("name")), likePattern)
                ));
            }

            if (StringUtils.hasText(name)) {
                String likePattern = "%" + name.toLowerCase() + "%";
                // Assuming ODP might have a name field or use code as name for now
                predicates = cb.and(predicates, cb.like(cb.lower(root.get("code")), likePattern));
            }
            
            return predicates;
        };

        return odpRepository.findAll(spec, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public ODPDto getOdpByCode(String code) {
        return odpRepository.findByCode(code)
                .map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("ODP not found: " + code));
    }

    public ODPDto createOdp(ODPDto dto) {
        if (odpRepository.existsByCode(dto.getCode())) {
            throw new IllegalArgumentException("ODP Code already exists");
        }

        ODP odp = new ODP();
        updateEntityFromDto(odp, dto);
        odp = odpRepository.save(odp);
        return toDto(odp);
    }

    public ODPDto updateOdp(Long id, ODPDto dto) {
        ODP odp = odpRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ODP not found with ID: " + id));

        String oldStatus = odp.getStatus();
        String newStatus = dto.getStatus();

        updateEntityFromDto(odp, dto);
        odp = odpRepository.save(odp);

        if (newStatus != null && !newStatus.equals(oldStatus)) {
            statusPropagationService.handleOdpStatusChange(odp.getCode(), newStatus, dto.getLastNote());
        }

        return toDto(odp);
    }

    public String deleteOdp(Long id) {
        ODP odp = odpRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ODP not found"));
        String code = odp.getCode();
        odpRepository.delete(odp);
        return code;
    }

    private ODPDto toDto(ODP odp) {
        ODPDto dto = new ODPDto();
        dto.setId(odp.getId());
        dto.setNodeType("ODP");
        dto.setCode(odp.getCode());
        dto.setTotalPort(odp.getTotalPort());
        dto.setUsedPort(odp.getUsedPort());
        dto.setStatus(odp.getStatus());
        dto.setGeom(odp.getGeom());
        if (odp.getOdc() != null) {
            dto.setOdcId(odp.getOdc().getId());
            dto.setOdcName(odp.getOdc().getName());
            dto.setOdcCode(odp.getOdc().getCode());
        }
        dto.setLastNote(odp.getLastNote());
        if (odp.getGeom() != null) {
            dto.setLng(odp.getGeom().getX());
            dto.setLat(odp.getGeom().getY());
        }
        return dto;
    }

    private void updateEntityFromDto(ODP odp, ODPDto dto) {
        odp.setCode(dto.getCode());
        odp.setTotalPort(dto.getTotalPort());
        odp.setUsedPort(dto.getUsedPort());

        if (dto.getStatus() != null) {
            odp.setStatus(dto.getStatus());
        } else if (odp.getId() == null) {
            odp.setStatus("PLANNING");
        }

        if (dto.getLng() != null && dto.getLat() != null) {
            GeometryFactory geometryFactory = new GeometryFactory();
            Point point = geometryFactory.createPoint(new Coordinate(dto.getLng(), dto.getLat()));
            point.setSRID(4326);
            odp.setGeom(point);
        } else if (dto.getGeom() != null) {
            odp.setGeom(dto.getGeom());
        }

        if (dto.getOdcId() != null) {
            ODC odc = odcRepository.findById(dto.getOdcId())
                    .orElseThrow(() -> new EntityNotFoundException("ODC not found with ID: " + dto.getOdcId()));
            odp.setOdc(odc);
        } else {
            odp.setOdc(null);
        }

        if (StringUtils.hasText(dto.getLastNote())) {
            odp.setLastNote(dto.getLastNote());
        }
    }
}
