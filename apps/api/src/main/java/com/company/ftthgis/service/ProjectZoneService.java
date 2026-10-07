package com.company.ftthgis.service;

import com.company.ftthgis.api.exception.QuotaExceededException;
import com.company.ftthgis.config.tenant.AuditContext;
import com.company.ftthgis.domain.network.dto.*;
import com.company.ftthgis.domain.network.entity.FiberCable;
import com.company.ftthgis.domain.network.entity.NetworkNode;
import com.company.ftthgis.domain.network.entity.ProjectZone;
import com.company.ftthgis.domain.network.entity.ZoneStage;
import com.company.ftthgis.domain.network.repository.CustomerRepository;
import com.company.ftthgis.domain.network.repository.FiberCableRepository;
import com.company.ftthgis.domain.network.repository.NetworkNodeRepository;
import com.company.ftthgis.domain.network.repository.ProjectZoneRepository;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectZoneService {

    private final ProjectZoneRepository projectZoneRepository;
    private final ProjectRepository projectRepository;
    private final NetworkNodeRepository networkNodeRepository;
    private final FiberCableRepository fiberCableRepository;
    private final CustomerRepository customerRepository;
    private final ProjectQuotaService projectQuotaService;

    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    @Transactional(readOnly = true)
    public List<ProjectZoneDto> getZonesByProject(UUID projectId) {
        Project project = getProjectOrThrow(projectId);
        List<ProjectZone> zones = projectZoneRepository.findByProjectIdAndDeletedAtIsNull(project.getId());
        return zones.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectZoneDto getZoneById(UUID projectId, UUID zoneId) {
        ProjectZone zone = getZoneOrThrow(projectId, zoneId);
        return mapToDto(zone);
    }

    @Transactional
    public ProjectZoneDto createZone(UUID projectId, CreateZoneRequest request) {
        Project project = getProjectOrThrow(projectId);

        if (projectZoneRepository.existsByProjectIdAndCode(projectId, request.getCode().trim())) {
            throw new IllegalArgumentException("Zone code '" + request.getCode() + "' already exists in this project.");
        }

        Polygon polygon = buildPolygon(request.getCoordinates());

        ProjectZone zone = ProjectZone.builder()
                .organization(project.getOrganization())
                .project(project)
                .name(request.getName().trim())
                .code(request.getCode().trim().toUpperCase())
                .stage(ZoneStage.PLANNING)
                .boundaryGeom(polygon)
                .targetHomepass(request.getTargetHomepass() != null ? request.getTargetHomepass() : 0)
                .description(request.getDescription())
                .color(request.getColor() != null ? request.getColor() : "#3b82f6")
                .build();

        ProjectZone saved = projectZoneRepository.save(zone);
        log.info("🗺️ Created new ProjectZone: {} (Code: {}, Stage: PLANNING) in project {}",
                saved.getName(), saved.getCode(), project.getName());

        AuditContext.setProject(project.getName(), project.getId());
        if (project.getOrganization() != null) {
            AuditContext.setTenant(project.getOrganization().getSlug(), project.getOrganization().getName());
        }

        return mapToDto(saved);
    }

    @Transactional
    public ProjectZoneDto updateZone(UUID projectId, UUID zoneId, UpdateZoneRequest request) {
        ProjectZone zone = getZoneOrThrow(projectId, zoneId);

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            zone.setName(request.getName().trim());
        }
        if (request.getTargetHomepass() != null) {
            zone.setTargetHomepass(request.getTargetHomepass());
        }
        if (request.getDescription() != null) {
            zone.setDescription(request.getDescription());
        }
        if (request.getColor() != null && !request.getColor().trim().isEmpty()) {
            zone.setColor(request.getColor().trim());
        }
        if (request.getCoordinates() != null && !request.getCoordinates().isEmpty()) {
            zone.setBoundaryGeom(buildPolygon(request.getCoordinates()));
        }

        ProjectZone updated = projectZoneRepository.save(zone);
        log.info("✏️ Updated ProjectZone: {} (ID: {}) in project {}", updated.getName(), updated.getId(), projectId);
        return mapToDto(updated);
    }

    @Transactional
    public ProjectZoneDto promoteStage(UUID projectId, UUID zoneId, ZoneStage targetStage) {
        ProjectZone zone = getZoneOrThrow(projectId, zoneId);
        ZoneStage currentStage = zone.getStage();

        if (currentStage == targetStage) {
            return mapToDto(zone);
        }

        Project project = zone.getProject();
        log.info("🔄 Changing zone stage: {} from {} -> {} in project {}",
                zone.getName(), currentStage, targetStage, project.getName());

        // 1. Promosi ke CONSTRUCTION atau LIVE dari PLANNING
        if (currentStage == ZoneStage.PLANNING && (targetStage == ZoneStage.CONSTRUCTION || targetStage == ZoneStage.LIVE)) {
            long odpCountInZone = projectZoneRepository.countOdpsByZoneId(zoneId);
            if (odpCountInZone > 0) {
                projectQuotaService.assertCanAllocateOdps(project.getOrganization(), (int) odpCountInZone);
            }

            if (targetStage == ZoneStage.CONSTRUCTION && zone.getPromotedToConstructionAt() == null) {
                zone.setPromotedToConstructionAt(LocalDateTime.now());
            } else if (targetStage == ZoneStage.LIVE && zone.getPromotedToLiveAt() == null) {
                zone.setPromotedToLiveAt(LocalDateTime.now());
            }
        }
        // 2. Promosi dari CONSTRUCTION ke LIVE
        else if (currentStage == ZoneStage.CONSTRUCTION && targetStage == ZoneStage.LIVE) {
            if (zone.getPromotedToLiveAt() == null) {
                zone.setPromotedToLiveAt(LocalDateTime.now());
            }
        }
        // 3. Demosi dari LIVE (Proteksi Pelanggan Aktif)
        else if (currentStage == ZoneStage.LIVE && (targetStage == ZoneStage.PLANNING || targetStage == ZoneStage.CONSTRUCTION)) {
            long activeCustomers = customerRepository.countByZoneId(zoneId);
            if (activeCustomers > 0) {
                log.warn("🚫 Cannot demote zone {} from LIVE: {} active customer(s) connected", zone.getName(), activeCustomers);
                throw new IllegalStateException("Cannot demote zone '" + zone.getName() + "' from LIVE stage because it currently serves "
                        + activeCustomers + " active customer(s). Disconnect or migrate all subscribers before demoting this zone.");
            }
        }
        // 4. Demosi dari CONSTRUCTION ke PLANNING (Kuota ODP otomatis dilepaskan)
        else if (currentStage == ZoneStage.CONSTRUCTION && targetStage == ZoneStage.PLANNING) {
            log.info("♻️ Zone {} demoted from CONSTRUCTION to PLANNING. ODP quota released.", zone.getName());
        }

        zone.setStage(targetStage);
        ProjectZone saved = projectZoneRepository.save(zone);

        AuditContext.setProject(project.getName(), project.getId());
        if (project.getOrganization() != null) {
            AuditContext.setTenant(project.getOrganization().getSlug(), project.getOrganization().getName());
        }

        return mapToDto(saved);
    }

    @Transactional
    public void deleteZone(UUID projectId, UUID zoneId, ZoneDeleteStrategy strategy, UUID targetReassignZoneId) {
        ProjectZone zone = getZoneOrThrow(projectId, zoneId);
        ZoneDeleteStrategy selectedStrategy = strategy != null ? strategy : ZoneDeleteStrategy.DETACH_DRAFT;

        log.info("🗑️ Deleting ProjectZone: {} (ID: {}) with strategy: {}", zone.getName(), zoneId, selectedStrategy);

        List<NetworkNode> nodesInZone = networkNodeRepository.findByZoneId(zoneId);
        List<FiberCable> cablesInZone = fiberCableRepository.findByZoneId(zoneId);

        switch (selectedStrategy) {
            case CASCADE_DELETE_ASSETS -> {
                for (NetworkNode node : nodesInZone) {
                    node.setDeletedAt(LocalDateTime.now());
                }
                networkNodeRepository.saveAll(nodesInZone);

                for (FiberCable cable : cablesInZone) {
                    cable.setDeletedAt(LocalDateTime.now());
                }
                fiberCableRepository.saveAll(cablesInZone);
            }
            case REASSIGN_ZONE -> {
                if (targetReassignZoneId == null) {
                    throw new IllegalArgumentException("Target reassign zone ID is required for REASSIGN_ZONE strategy.");
                }
                ProjectZone targetZone = getZoneOrThrow(projectId, targetReassignZoneId);
                for (NetworkNode node : nodesInZone) {
                    node.setZone(targetZone);
                }
                networkNodeRepository.saveAll(nodesInZone);

                for (FiberCable cable : cablesInZone) {
                    cable.setZone(targetZone);
                }
                fiberCableRepository.saveAll(cablesInZone);
            }
            case DETACH_DRAFT -> {
                // Anti-Quota Spike: Unlink zone, and set node status to PLANNING so it never triggers billable quota
                for (NetworkNode node : nodesInZone) {
                    node.setZone(null);
                    if (zone.getStage() == ZoneStage.PLANNING) {
                        node.setStatus("PLANNING");
                    }
                }
                networkNodeRepository.saveAll(nodesInZone);

                for (FiberCable cable : cablesInZone) {
                    cable.setZone(null);
                }
                fiberCableRepository.saveAll(cablesInZone);
            }
        }

        zone.setDeletedAt(LocalDateTime.now());
        projectZoneRepository.save(zone);

        AuditContext.setProject(zone.getProject().getName(), zone.getProject().getId());
        if (zone.getOrganization() != null) {
            AuditContext.setTenant(zone.getOrganization().getSlug(), zone.getOrganization().getName());
        }
    }

    @Transactional
    public int resyncZoneAssets(UUID projectId, UUID zoneId) {
        ProjectZone zone = getZoneOrThrow(projectId, zoneId);

        List<NetworkNode> nodesInside = networkNodeRepository.findNodesWithinZoneBoundary(projectId, zoneId);
        for (NetworkNode node : nodesInside) {
            node.setZone(zone);
        }
        networkNodeRepository.saveAll(nodesInside);

        List<FiberCable> cablesInside = fiberCableRepository.findCablesWithinZoneBoundary(projectId, zoneId);
        for (FiberCable cable : cablesInside) {
            cable.setZone(zone);
        }
        fiberCableRepository.saveAll(cablesInside);

        log.info("📐 Resynced boundary for zone {}: {} nodes and {} cables assigned.",
                zone.getName(), nodesInside.size(), cablesInside.size());
        return nodesInside.size() + cablesInside.size();
    }

    @Transactional(readOnly = true)
    public ZoneBoQDto getZoneBoQ(UUID projectId, UUID zoneId) {
        ProjectZone zone = getZoneOrThrow(projectId, zoneId);

        List<FiberCable> cables = fiberCableRepository.findByZoneId(zoneId);
        double feederLength = 0.0;
        double distributionLength = 0.0;
        double dropLength = 0.0;

        for (FiberCable cable : cables) {
            double len = cable.getLengthMeters() != null ? cable.getLengthMeters() : 0.0;
            int fibers = cable.getFiberCount() != null ? cable.getFiberCount() : 12;
            if (fibers >= 24) {
                feederLength += len;
            } else if (fibers >= 8) {
                distributionLength += len;
            } else {
                dropLength += len;
            }
        }

        double totalCableM = feederLength + distributionLength + dropLength;
        double totalCableKm = totalCableM / 1000.0;

        long odcCount = projectZoneRepository.countOdcsByZoneId(zoneId);
        long odpCount = projectZoneRepository.countOdpsByZoneId(zoneId);
        long totalSplitterPorts = odpCount * 16L; // Standard 1:16 ratio per ODP box
        long totalUsedPorts = customerRepository.countByZoneId(zoneId);
        int targetHomepass = zone.getTargetHomepass() != null ? zone.getTargetHomepass() : 0;

        double capacityRatio = targetHomepass > 0 ? (totalSplitterPorts / (double) targetHomepass) * 100.0 : 0.0;

        return ZoneBoQDto.builder()
                .zoneId(zone.getId())
                .zoneName(zone.getName())
                .zoneCode(zone.getCode())
                .stage(zone.getStage())
                .totalFeederCableMeters(feederLength)
                .totalDistributionCableMeters(distributionLength)
                .totalDropCableMeters(dropLength)
                .totalCableMeters(totalCableM)
                .totalCableKm(totalCableKm)
                .totalOdcCount(odcCount)
                .totalOdpCount(odpCount)
                .totalSplitterPorts(totalSplitterPorts)
                .totalUsedPorts(totalUsedPorts)
                .targetHomepass(targetHomepass)
                .homepassCapacityRatioPercent(Math.round(capacityRatio * 10.0) / 10.0)
                .estimatedPoleCount(Math.round(totalCableM / 50.0)) // Estimated 1 pole per 50 meters
                .build();
    }

    private ProjectZoneDto mapToDto(ProjectZone zone) {
        long odpCount = projectZoneRepository.countOdpsByZoneId(zone.getId());
        long odcCount = projectZoneRepository.countOdcsByZoneId(zone.getId());
        long cableCount = projectZoneRepository.countCablesByZoneId(zone.getId());
        Double totalLength = fiberCableRepository.sumLengthByZoneId(zone.getId());

        String geoJson = null;
        if (zone.getBoundaryGeom() != null) {
            geoJson = convertPolygonToCoordinatesJson(zone.getBoundaryGeom());
        }

        return ProjectZoneDto.builder()
                .id(zone.getId())
                .projectId(zone.getProject() != null ? zone.getProject().getId() : null)
                .name(zone.getName())
                .code(zone.getCode())
                .stage(zone.getStage())
                .targetHomepass(zone.getTargetHomepass())
                .description(zone.getDescription())
                .color(zone.getColor())
                .boundaryGeoJson(geoJson)
                .odpCount(odpCount)
                .odcCount(odcCount)
                .cableCount(cableCount)
                .totalCableLengthMeters(totalLength != null ? totalLength : 0.0)
                .promotedToConstructionAt(zone.getPromotedToConstructionAt())
                .promotedToLiveAt(zone.getPromotedToLiveAt())
                .createdAt(zone.getCreatedAt())
                .updatedAt(zone.getUpdatedAt())
                .build();
    }

    private Polygon buildPolygon(List<List<Double>> rawCoords) {
        if (rawCoords == null || rawCoords.size() < 3) {
            throw new IllegalArgumentException("Polygon requires at least 3 coordinates.");
        }

        List<Coordinate> coordinates = new ArrayList<>();
        for (List<Double> pt : rawCoords) {
            if (pt.size() >= 2) {
                coordinates.add(new Coordinate(pt.get(0), pt.get(1)));
            }
        }

        // Ensure closed ring
        if (!coordinates.get(0).equals2D(coordinates.get(coordinates.size() - 1))) {
            coordinates.add(new Coordinate(coordinates.get(0).x, coordinates.get(0).y));
        }

        if (coordinates.size() < 4) {
            throw new IllegalArgumentException("Polygon linear ring requires at least 4 coordinates (including closed point).");
        }

        LinearRing ring = GEOMETRY_FACTORY.createLinearRing(coordinates.toArray(new Coordinate[0]));
        return GEOMETRY_FACTORY.createPolygon(ring);
    }

    private String convertPolygonToCoordinatesJson(Polygon polygon) {
        StringBuilder sb = new StringBuilder("[");
        Coordinate[] coords = polygon.getCoordinates();
        for (int i = 0; i < coords.length; i++) {
            if (i > 0) sb.append(",");
            sb.append("[").append(coords[i].x).append(",").append(coords[i].y).append("]");
        }
        sb.append("]");
        return sb.toString();
    }

    private Project getProjectOrThrow(UUID projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found with ID: " + projectId));
    }

    private ProjectZone getZoneOrThrow(UUID projectId, UUID zoneId) {
        ProjectZone zone = projectZoneRepository.findById(zoneId)
                .orElseThrow(() -> new IllegalArgumentException("ProjectZone not found with ID: " + zoneId));
        if (zone.getProject() == null || !zone.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Zone " + zoneId + " does not belong to project " + projectId);
        }
        return zone;
    }
}
