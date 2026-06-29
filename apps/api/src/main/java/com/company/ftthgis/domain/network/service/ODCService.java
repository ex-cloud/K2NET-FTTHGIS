package com.company.ftthgis.domain.network.service;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import java.util.UUID;

import com.company.ftthgis.config.tenant.OrganizationContext;
import com.company.ftthgis.config.tenant.TenantContext;
import com.company.ftthgis.domain.network.dto.ODCDto;
import com.company.ftthgis.domain.network.entity.ODC;
import com.company.ftthgis.domain.network.entity.OLT;
import com.company.ftthgis.domain.network.repository.NetworkNodeRepository;
import com.company.ftthgis.domain.network.repository.ODCRepository;
import com.company.ftthgis.domain.network.repository.OLTRepository;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.entity.SubscriptionPlan;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ODCService {

    private final ODCRepository odcRepository;
    private final OLTRepository oltRepository;
    private final StatusPropagationService statusPropagationService;
    private final NetworkNodeRepository networkNodeRepository;
    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;

    @Transactional(readOnly = true)
    public Page<ODCDto> getOdcs(String search, String status, String name, String code, String oltCode, Pageable pageable) {
         Specification<ODC> spec = (root, query, cb) -> {
            var predicates = cb.conjunction();
            
            if (StringUtils.hasText(search)) {
                String likePattern = "%" + search.toLowerCase() + "%";
                predicates = cb.and(predicates, cb.or(
                        cb.like(cb.lower(root.get("code")), likePattern),
                        cb.like(cb.lower(root.get("name")), likePattern)
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

            if (StringUtils.hasText(oltCode)) {
                String likePattern = "%" + oltCode.toLowerCase() + "%";
                predicates = cb.and(predicates, cb.or(
                        cb.like(cb.lower(root.get("olt").get("code")), likePattern),
                        cb.like(cb.lower(root.get("olt").get("name")), likePattern)
                ));
            }

            if (StringUtils.hasText(name)) {
                String likePattern = "%" + name.toLowerCase() + "%";
                predicates = cb.and(predicates, cb.like(cb.lower(root.get("name")), likePattern));
            }
            
            return predicates;
        };

        return odcRepository.findAll(spec, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public ODCDto getOdcByCode(String code) {
        return odcRepository.findByCode(code)
                .map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("ODC not found: " + code));
    }

    public ODCDto createOdc(ODCDto dto) {
        if (odcRepository.existsByCode(dto.getCode())) {
            throw new IllegalArgumentException("ODC Code already exists");
        }

        // --- ABAC: Quota Check ---
        UUID orgId = OrganizationContext.getOrganizationId();
        if (orgId != null) {
            organizationRepository.findById(orgId).ifPresent(org -> {
                SubscriptionPlan plan = org.getSubscriptionPlan();
                if (plan != null && plan.getMaxOdcs() != null) {
                    String projectIdStr = TenantContext.getTenantId();
                    UUID projectId = projectIdStr != null ? UUID.fromString(projectIdStr) : null;
                    long currentCount = projectId != null
                            ? networkNodeRepository.countByTypeAndProjectId("ODC", projectId)
                            : 0;
                    if (currentCount >= plan.getMaxOdcs()) {
                        throw new RuntimeException(String.format(
                                "Quota exceeded: Your plan allows a maximum of %d ODCs. Current count: %d.",
                                plan.getMaxOdcs(), currentCount));
                    }
                    log.debug("✅ ODC quota OK: {}/{}", currentCount, plan.getMaxOdcs());
                }
            });
        }

        // --- ABAC: Geofencing Check ---
        String projectIdStr = TenantContext.getTenantId();
        if (projectIdStr != null && dto.getLng() != null && dto.getLat() != null) {
            UUID projectId = UUID.fromString(projectIdStr);
            projectRepository.findById(projectId).ifPresent(project -> {
                if (project.getBoundaryGeom() != null) {
                    GeometryFactory gf = new GeometryFactory();
                    Point point = gf.createPoint(new Coordinate(dto.getLng(), dto.getLat()));
                    point.setSRID(4326);
                    if (!project.getBoundaryGeom().contains(point)) {
                        throw new RuntimeException(
                                "Geofencing violation: ODC coordinates are outside the project's boundary area.");
                    }
                    log.debug("✅ ODC geofencing OK for project: {}", projectId);
                }
            });
        }

        ODC odc = new ODC();
        updateEntityFromDto(odc, dto);
        odc = odcRepository.save(odc);
        return toDto(odc);
    }

    public ODCDto updateOdc(UUID id, ODCDto dto) {
        ODC odc = odcRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ODC not found with ID: " + id));

        String oldStatus = odc.getStatus();
        String newStatus = dto.getStatus();
        String oldHealth = odc.getHealthStatus();
        String newHealth = dto.getHealthStatus();

        updateEntityFromDto(odc, dto);
        odc = odcRepository.save(odc);

        // If status changed, trigger propagation and audit
        if (newStatus != null && !newStatus.equals(oldStatus)) {
            statusPropagationService.handleOdcStatusChange(odc.getCode(), newStatus, dto.getLastNote());
        }
        
        if (newHealth != null && !newHealth.equals(oldHealth)) {
            statusPropagationService.handleOdcHealthStatusChange(odc.getCode(), newHealth, dto.getLastNote());
        }

        return toDto(odc);
    }

    public String deleteOdc(UUID id) {
        ODC odc = odcRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ODC not found"));
        String code = odc.getCode();
        odcRepository.delete(odc);
        return code;
    }

    private ODCDto toDto(ODC odc) {
        ODCDto dto = new ODCDto();
        dto.setId(odc.getId());
        dto.setNodeType("ODC");
        dto.setCode(odc.getCode());
        dto.setName(odc.getName());
        dto.setCapacity(odc.getCapacity());
        dto.setUsedCapacity(odc.getUsedCapacity());
        dto.setStatus(odc.getStatus());
        dto.setHealthStatus(odc.getHealthStatus());
        dto.setGeom(odc.getGeom());
        if (odc.getOlt() != null) {
            dto.setOltId(odc.getOlt().getId());
            dto.setOltName(odc.getOlt().getName());
            dto.setOltCode(odc.getOlt().getCode());
        }
        dto.setLastNote(odc.getLastNote());
        dto.setAddress(odc.getAddress());
        if (odc.getGeom() != null) {
            dto.setLng(odc.getGeom().getX());
            dto.setLat(odc.getGeom().getY());
        }
        return dto;
    }

    private void updateEntityFromDto(ODC odc, ODCDto dto) {
        odc.setCode(dto.getCode());
        odc.setName(dto.getName());
        odc.setCapacity(dto.getCapacity());
        if (dto.getStatus() != null) {
            odc.setStatus(dto.getStatus());
        } else if (odc.getId() == null) {
            odc.setStatus("PLANNING");
        }

        if (dto.getHealthStatus() != null) {
            odc.setHealthStatus(dto.getHealthStatus());
        } else if (odc.getId() == null) {
            odc.setHealthStatus("UP");
        }

        if (dto.getLng() != null && dto.getLat() != null) {
            GeometryFactory geometryFactory = new GeometryFactory();
            Point point = geometryFactory.createPoint(new Coordinate(dto.getLng(), dto.getLat()));
            point.setSRID(4326);
            odc.setGeom(point);
        } else if (dto.getGeom() != null) {
            odc.setGeom(dto.getGeom());
        }

        if (dto.getOltId() != null) {
            OLT olt = oltRepository.findById(dto.getOltId())
                    .orElseThrow(() -> new EntityNotFoundException("OLT not found with ID: " + dto.getOltId()));
            odc.setOlt(olt);
        } else {
            odc.setOlt(null);
        }

        if (StringUtils.hasText(dto.getLastNote())) {
            odc.setLastNote(dto.getLastNote());
        }
        if (StringUtils.hasText(dto.getAddress())) {
            odc.setAddress(dto.getAddress());
        }
    }
}
