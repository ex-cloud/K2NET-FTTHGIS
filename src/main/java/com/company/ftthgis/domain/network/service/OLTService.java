package com.company.ftthgis.domain.network.service;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;

import com.company.ftthgis.domain.network.dto.OLTDto;
import com.company.ftthgis.domain.network.entity.OLT;
import com.company.ftthgis.domain.network.mapper.NetworkMapper;
import com.company.ftthgis.domain.network.repository.OLTRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OLTService {

    private final OLTRepository oltRepository;
    private final NetworkMapper networkMapper;
    private final StatusPropagationService statusPropagationService;

    @Transactional(readOnly = true)
    public Page<OLTDto> getOlts(String search, String status, String name, String code, Pageable pageable) {
        log.info("Fetching OLT list with search: {}, status: {}, name: {}, code: {}", search, status, name, code);
        
        org.springframework.data.jpa.domain.Specification<OLT> spec = (root, query, cb) -> {
            var predicates = cb.conjunction();
            
            if (org.springframework.util.StringUtils.hasText(search)) {
                String likePattern = "%" + search.toLowerCase() + "%";
                predicates = cb.and(predicates, cb.or(
                        cb.like(cb.lower(root.get("code")), likePattern),
                        cb.like(cb.lower(root.get("name")), likePattern),
                        cb.like(cb.lower(root.get("ipAddress")), likePattern)
                ));
            }
            
            if (org.springframework.util.StringUtils.hasText(status)) {
                String likePattern = "%" + status.toUpperCase() + "%";
                predicates = cb.and(predicates, cb.like(cb.upper(root.get("status")), likePattern));
            }
            
            if (org.springframework.util.StringUtils.hasText(code)) {
                String likePattern = "%" + code.toLowerCase() + "%";
                predicates = cb.and(predicates, cb.like(cb.lower(root.get("code")), likePattern));
            }

            if (org.springframework.util.StringUtils.hasText(name)) {
                String likePattern = "%" + name.toLowerCase() + "%";
                predicates = cb.and(predicates, cb.like(cb.lower(root.get("name")), likePattern));
            }
            
            return predicates;
        };

        return oltRepository.findAll(spec, pageable)
                .map(networkMapper::toOLTDto);
    }

    @Transactional(readOnly = true)
    public OLTDto getOltByCode(String code) {
        return oltRepository.findByCode(code)
                .map(networkMapper::toOLTDto)
                .orElseThrow(() -> new RuntimeException("OLT not found with code: " + code));
    }

    @Transactional
    public OLTDto createOlt(OLTDto dto) {
        if (oltRepository.existsByCode(dto.getCode())) {
            throw new RuntimeException("OLT with code " + dto.getCode() + " already exists");
        }
        OLT olt = new OLT();
        updateEntityFromDto(olt, dto);
        return networkMapper.toOLTDto(oltRepository.save(olt));
    }

    @Transactional
    public OLTDto updateOlt(Long id, OLTDto dto) {
        OLT olt = oltRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("OLT not found with id: " + id));

        String oldStatus = olt.getStatus();
        String newStatus = dto.getStatus();
        String oldHealth = olt.getHealthStatus();
        String newHealth = dto.getHealthStatus();

        updateEntityFromDto(olt, dto);
        olt = oltRepository.save(olt);

        if (newStatus != null && !newStatus.equals(oldStatus)) {
            statusPropagationService.handleOltStatusChange(olt.getCode(), newStatus, dto.getLastNote());
        }

        if (newHealth != null && !newHealth.equals(oldHealth)) {
            statusPropagationService.handleOltHealthStatusChange(olt.getCode(), newHealth, dto.getLastNote());
        }

        return networkMapper.toOLTDto(olt);
    }

    @Transactional
    public String deleteOlt(Long id) {
        OLT olt = oltRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("OLT not found with ID: " + id));
        String code = olt.getCode();
        oltRepository.delete(olt);
        return code;
    }

    private void updateEntityFromDto(OLT olt, OLTDto dto) {
        olt.setCode(dto.getCode());
        olt.setName(dto.getName());
        olt.setIpAddress(dto.getIpAddress());
        olt.setSnmpCommunity(dto.getSnmpCommunity());
        if (dto.getStatus() != null) {
            olt.setStatus(dto.getStatus());
        } else if (olt.getId() == null) {
            olt.setStatus("PLANNING");
        }

        if (dto.getHealthStatus() != null) {
            olt.setHealthStatus(dto.getHealthStatus());
        } else if (olt.getId() == null) {
            olt.setHealthStatus("UP");
        }
        if (dto.getLng() != null && dto.getLat() != null) {
            GeometryFactory geometryFactory = new GeometryFactory();
            Point point = geometryFactory.createPoint(new Coordinate(dto.getLng(), dto.getLat()));
            point.setSRID(4326);
            olt.setGeom(point);
        } else if (dto.getGeom() != null) {
            olt.setGeom(dto.getGeom());
        }
        if (org.springframework.util.StringUtils.hasText(dto.getLastNote())) {
            olt.setLastNote(dto.getLastNote());
        }
        if (org.springframework.util.StringUtils.hasText(dto.getAddress())) {
            olt.setAddress(dto.getAddress());
        }
    }
}
