package com.company.ftthgis.service;

import com.company.ftthgis.api.exception.QuotaExceededException;
import com.company.ftthgis.domain.network.dto.*;
import com.company.ftthgis.domain.network.entity.FiberCable;
import com.company.ftthgis.domain.network.entity.NetworkNode;
import com.company.ftthgis.domain.network.entity.ODP;
import com.company.ftthgis.domain.network.entity.ProjectZone;
import com.company.ftthgis.domain.network.entity.ZoneStage;
import com.company.ftthgis.domain.network.repository.CustomerRepository;
import com.company.ftthgis.domain.network.repository.FiberCableRepository;
import com.company.ftthgis.domain.network.repository.NetworkNodeRepository;
import com.company.ftthgis.domain.network.repository.ProjectZoneRepository;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectZoneServiceTest {

    @Mock
    private ProjectZoneRepository projectZoneRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private NetworkNodeRepository networkNodeRepository;

    @Mock
    private FiberCableRepository fiberCableRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private ProjectQuotaService projectQuotaService;

    @InjectMocks
    private ProjectZoneService projectZoneService;

    private Organization testOrg;
    private Project testProject;
    private GeometryFactory geometryFactory;

    @BeforeEach
    void setUp() {
        geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        testOrg = Organization.builder()
                .id(UUID.randomUUID())
                .name("PT Sukses Fiber")
                .slug("sukses-fiber")
                .build();

        testProject = Project.builder()
                .id(UUID.randomUUID())
                .name("FTTH Arcamanik")
                .code("PRJ-ARC")
                .organization(testOrg)
                .build();
    }

    private Polygon createTestPolygon() {
        Coordinate[] coords = new Coordinate[]{
                new Coordinate(107.61, -6.88),
                new Coordinate(107.62, -6.88),
                new Coordinate(107.62, -6.89),
                new Coordinate(107.61, -6.89),
                new Coordinate(107.61, -6.88)
        };
        return geometryFactory.createPolygon(coords);
    }

    @Test
    void createZoneShouldPersistZoneInPlanningStage() {
        CreateZoneRequest request = CreateZoneRequest.builder()
                .name("Klaster Barat")
                .code("ZN-BRT-01")
                .targetHomepass(300)
                .color("#10b981")
                .coordinates(List.of(
                        List.of(107.61, -6.88),
                        List.of(107.62, -6.88),
                        List.of(107.62, -6.89),
                        List.of(107.61, -6.89),
                        List.of(107.61, -6.88)
                ))
                .build();

        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        when(projectZoneRepository.existsByProjectIdAndCode(testProject.getId(), "ZN-BRT-01")).thenReturn(false);
        when(projectZoneRepository.save(any(ProjectZone.class))).thenAnswer(inv -> {
            ProjectZone z = inv.getArgument(0);
            z.setId(UUID.randomUUID());
            return z;
        });

        ProjectZoneDto result = projectZoneService.createZone(testProject.getId(), request);

        assertNotNull(result);
        assertEquals("Klaster Barat", result.getName());
        assertEquals("ZN-BRT-01", result.getCode());
        assertEquals(ZoneStage.PLANNING, result.getStage());
        assertEquals(300, result.getTargetHomepass());
        verify(projectZoneRepository).save(any(ProjectZone.class));
    }

    @Test
    void promoteToConstructionShouldAssertOdpQuota() {
        UUID zoneId = UUID.randomUUID();
        ProjectZone zone = ProjectZone.builder()
                .id(zoneId)
                .name("Klaster Barat")
                .code("ZN-01")
                .stage(ZoneStage.PLANNING)
                .project(testProject)
                .organization(testOrg)
                .boundaryGeom(createTestPolygon())
                .build();

        when(projectZoneRepository.findById(zoneId)).thenReturn(Optional.of(zone));
        when(projectZoneRepository.countOdpsByZoneId(zoneId)).thenReturn(24L);
        when(projectZoneRepository.save(any(ProjectZone.class))).thenAnswer(inv -> inv.getArgument(0));

        ProjectZoneDto promoted = projectZoneService.promoteStage(testProject.getId(), zoneId, ZoneStage.CONSTRUCTION);

        assertEquals(ZoneStage.CONSTRUCTION, promoted.getStage());
        assertNotNull(promoted.getPromotedToConstructionAt());
        verify(projectQuotaService).assertCanAllocateOdps(testOrg, 24);
        verify(projectZoneRepository).save(zone);
    }

    @Test
    void promoteToConstructionShouldThrowWhenQuotaExceeded() {
        UUID zoneId = UUID.randomUUID();
        ProjectZone zone = ProjectZone.builder()
                .id(zoneId)
                .name("Klaster Barat")
                .code("ZN-01")
                .stage(ZoneStage.PLANNING)
                .project(testProject)
                .organization(testOrg)
                .boundaryGeom(createTestPolygon())
                .build();

        when(projectZoneRepository.findById(zoneId)).thenReturn(Optional.of(zone));
        when(projectZoneRepository.countOdpsByZoneId(zoneId)).thenReturn(100L);
        doThrow(new QuotaExceededException("ODP_QUOTA_EXCEEDED", "Quota exceeded", 2600, 2500))
                .when(projectQuotaService).assertCanAllocateOdps(testOrg, 100);

        assertThrows(QuotaExceededException.class, () ->
                projectZoneService.promoteStage(testProject.getId(), zoneId, ZoneStage.CONSTRUCTION));

        verify(projectZoneRepository, never()).save(any());
    }

    @Test
    void demoteFromLiveShouldThrowWhenActiveCustomersExist() {
        UUID zoneId = UUID.randomUUID();
        ProjectZone zone = ProjectZone.builder()
                .id(zoneId)
                .name("Klaster Barat")
                .code("ZN-01")
                .stage(ZoneStage.LIVE)
                .project(testProject)
                .organization(testOrg)
                .boundaryGeom(createTestPolygon())
                .build();

        when(projectZoneRepository.findById(zoneId)).thenReturn(Optional.of(zone));
        when(customerRepository.countByZoneId(zoneId)).thenReturn(12L);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                projectZoneService.promoteStage(testProject.getId(), zoneId, ZoneStage.PLANNING));

        assertTrue(ex.getMessage().contains("12 active customer(s)"));
        verify(projectZoneRepository, never()).save(any());
    }

    @Test
    void demoteFromConstructionToPlanningShouldSucceedWithoutCustomerCheck() {
        UUID zoneId = UUID.randomUUID();
        ProjectZone zone = ProjectZone.builder()
                .id(zoneId)
                .name("Klaster Barat")
                .code("ZN-01")
                .stage(ZoneStage.CONSTRUCTION)
                .project(testProject)
                .organization(testOrg)
                .boundaryGeom(createTestPolygon())
                .build();

        when(projectZoneRepository.findById(zoneId)).thenReturn(Optional.of(zone));
        when(projectZoneRepository.save(any(ProjectZone.class))).thenAnswer(inv -> inv.getArgument(0));

        ProjectZoneDto demoted = projectZoneService.promoteStage(testProject.getId(), zoneId, ZoneStage.PLANNING);

        assertEquals(ZoneStage.PLANNING, demoted.getStage());
        verify(customerRepository, never()).countByZoneId(any());
        verify(projectZoneRepository).save(zone);
    }

    @Test
    void deleteZoneWithDetachDraftShouldSetNodesToPlanningStatus() {
        UUID zoneId = UUID.randomUUID();
        ProjectZone zone = ProjectZone.builder()
                .id(zoneId)
                .name("Klaster Draft")
                .stage(ZoneStage.PLANNING)
                .project(testProject)
                .organization(testOrg)
                .build();

        ODP odp = new ODP();
        odp.setId(UUID.randomUUID());
        odp.setZone(zone);
        odp.setStatus("ACTIVE");

        List<NetworkNode> nodes = new ArrayList<>(List.of(odp));
        List<FiberCable> cables = new ArrayList<>();

        when(projectZoneRepository.findById(zoneId)).thenReturn(Optional.of(zone));
        when(networkNodeRepository.findByZoneId(zoneId)).thenReturn(nodes);
        when(fiberCableRepository.findByZoneId(zoneId)).thenReturn(cables);

        projectZoneService.deleteZone(testProject.getId(), zoneId, ZoneDeleteStrategy.DETACH_DRAFT, null);

        assertNull(odp.getZone());
        assertEquals("PLANNING", odp.getStatus());
        assertNotNull(zone.getDeletedAt());
        verify(networkNodeRepository).saveAll(nodes);
        verify(projectZoneRepository).save(zone);
    }

    @Test
    void getZoneBoQShouldAggregateCablesAndPortsAccurately() {
        UUID zoneId = UUID.randomUUID();
        ProjectZone zone = ProjectZone.builder()
                .id(zoneId)
                .name("Klaster Arcamanik")
                .code("ZN-ARC-01")
                .stage(ZoneStage.CONSTRUCTION)
                .targetHomepass(250)
                .project(testProject)
                .build();

        FiberCable feeder = FiberCable.builder()
                .id(UUID.randomUUID())
                .fiberCount(24)
                .lengthMeters(1500.0)
                .build();

        FiberCable dist = FiberCable.builder()
                .id(UUID.randomUUID())
                .fiberCount(12)
                .lengthMeters(2500.0)
                .build();

        FiberCable drop = FiberCable.builder()
                .id(UUID.randomUUID())
                .fiberCount(2)
                .lengthMeters(800.0)
                .build();

        when(projectZoneRepository.findById(zoneId)).thenReturn(Optional.of(zone));
        when(fiberCableRepository.findByZoneId(zoneId)).thenReturn(List.of(feeder, dist, drop));
        when(projectZoneRepository.countOdcsByZoneId(zoneId)).thenReturn(2L);
        when(projectZoneRepository.countOdpsByZoneId(zoneId)).thenReturn(16L);
        when(customerRepository.countByZoneId(zoneId)).thenReturn(48L);

        ZoneBoQDto boq = projectZoneService.getZoneBoQ(testProject.getId(), zoneId);

        assertEquals(1500.0, boq.getTotalFeederCableMeters());
        assertEquals(2500.0, boq.getTotalDistributionCableMeters());
        assertEquals(800.0, boq.getTotalDropCableMeters());
        assertEquals(4800.0, boq.getTotalCableMeters());
        assertEquals(4.8, boq.getTotalCableKm());
        assertEquals(2, boq.getTotalOdcCount());
        assertEquals(16, boq.getTotalOdpCount());
        assertEquals(256, boq.getTotalSplitterPorts()); // 16 ODPs * 16 ports
        assertEquals(48, boq.getTotalUsedPorts());
        assertEquals(250, boq.getTargetHomepass());
        assertEquals(102.4, boq.getHomepassCapacityRatioPercent());
    }

    @Test
    void deleteZoneWithCascadeDeleteAssetsShouldSoftDeleteNodesAndCables() {
        UUID zoneId = UUID.randomUUID();
        ProjectZone zone = ProjectZone.builder()
                .id(zoneId)
                .name("Klaster Hapus")
                .stage(ZoneStage.PLANNING)
                .project(testProject)
                .organization(testOrg)
                .build();

        ODP odp = new ODP();
        odp.setId(UUID.randomUUID());
        odp.setZone(zone);

        FiberCable cable = FiberCable.builder()
                .id(UUID.randomUUID())
                .zone(zone)
                .build();

        List<NetworkNode> nodes = new ArrayList<>(List.of(odp));
        List<FiberCable> cables = new ArrayList<>(List.of(cable));

        when(projectZoneRepository.findById(zoneId)).thenReturn(Optional.of(zone));
        when(networkNodeRepository.findByZoneId(zoneId)).thenReturn(nodes);
        when(fiberCableRepository.findByZoneId(zoneId)).thenReturn(cables);

        projectZoneService.deleteZone(testProject.getId(), zoneId, ZoneDeleteStrategy.CASCADE_DELETE_ASSETS, null);

        assertNotNull(odp.getDeletedAt());
        assertNotNull(cable.getDeletedAt());
        assertNotNull(zone.getDeletedAt());
        verify(networkNodeRepository).saveAll(nodes);
        verify(fiberCableRepository).saveAll(cables);
        verify(projectZoneRepository).save(zone);
    }

    @Test
    void deleteZoneWithReassignZoneShouldMoveAssetsToTargetZone() {
        UUID zoneId = UUID.randomUUID();
        UUID targetZoneId = UUID.randomUUID();

        ProjectZone zone = ProjectZone.builder()
                .id(zoneId)
                .name("Klaster Lama")
                .stage(ZoneStage.PLANNING)
                .project(testProject)
                .organization(testOrg)
                .build();

        ProjectZone targetZone = ProjectZone.builder()
                .id(targetZoneId)
                .name("Klaster Baru")
                .stage(ZoneStage.PLANNING)
                .project(testProject)
                .organization(testOrg)
                .build();

        ODP odp = new ODP();
        odp.setId(UUID.randomUUID());
        odp.setZone(zone);

        FiberCable cable = FiberCable.builder()
                .id(UUID.randomUUID())
                .zone(zone)
                .build();

        List<NetworkNode> nodes = new ArrayList<>(List.of(odp));
        List<FiberCable> cables = new ArrayList<>(List.of(cable));

        when(projectZoneRepository.findById(zoneId)).thenReturn(Optional.of(zone));
        when(projectZoneRepository.findById(targetZoneId)).thenReturn(Optional.of(targetZone));
        when(networkNodeRepository.findByZoneId(zoneId)).thenReturn(nodes);
        when(fiberCableRepository.findByZoneId(zoneId)).thenReturn(cables);

        projectZoneService.deleteZone(testProject.getId(), zoneId, ZoneDeleteStrategy.REASSIGN_ZONE, targetZoneId);

        assertEquals(targetZone, odp.getZone());
        assertEquals(targetZone, cable.getZone());
        assertNotNull(zone.getDeletedAt());
        verify(networkNodeRepository).saveAll(nodes);
        verify(fiberCableRepository).saveAll(cables);
        verify(projectZoneRepository).save(zone);
    }

    @Test
    void resyncZoneAssetsShouldAssignContainedNodesAndCables() {
        UUID zoneId = UUID.randomUUID();
        ProjectZone zone = ProjectZone.builder()
                .id(zoneId)
                .name("Klaster Arcamanik")
                .stage(ZoneStage.PLANNING)
                .project(testProject)
                .build();

        ODP odp = new ODP();
        odp.setId(UUID.randomUUID());

        FiberCable cable = FiberCable.builder()
                .id(UUID.randomUUID())
                .build();

        when(projectZoneRepository.findById(zoneId)).thenReturn(Optional.of(zone));
        when(networkNodeRepository.findNodesWithinZoneBoundary(testProject.getId(), zoneId)).thenReturn(List.of(odp));
        when(fiberCableRepository.findCablesWithinZoneBoundary(testProject.getId(), zoneId)).thenReturn(List.of(cable));

        int resynced = projectZoneService.resyncZoneAssets(testProject.getId(), zoneId);

        assertEquals(2, resynced);
        assertEquals(zone, odp.getZone());
        assertEquals(zone, cable.getZone());
        verify(networkNodeRepository).saveAll(anyList());
        verify(fiberCableRepository).saveAll(anyList());
    }

    @Test
    void createZoneShouldThrowOnDuplicateCode() {
        CreateZoneRequest request = CreateZoneRequest.builder()
                .name("Klaster Barat")
                .code("ZN-BRT-01")
                .build();

        when(projectRepository.findById(testProject.getId())).thenReturn(Optional.of(testProject));
        when(projectZoneRepository.existsByProjectIdAndCode(testProject.getId(), "ZN-BRT-01")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () ->
                projectZoneService.createZone(testProject.getId(), request));
    }

    @Test
    void updateZoneShouldModifyFieldsAndBoundary() {
        UUID zoneId = UUID.randomUUID();
        ProjectZone zone = ProjectZone.builder()
                .id(zoneId)
                .name("Klaster Lama")
                .code("ZN-01")
                .stage(ZoneStage.PLANNING)
                .targetHomepass(100)
                .color("#3b82f6")
                .project(testProject)
                .build();

        UpdateZoneRequest request = UpdateZoneRequest.builder()
                .name("Klaster Baru")
                .targetHomepass(250)
                .color("#10b981")
                .description("Updated description")
                .coordinates(List.of(
                        List.of(107.61, -6.88),
                        List.of(107.62, -6.88),
                        List.of(107.62, -6.89),
                        List.of(107.61, -6.89),
                        List.of(107.61, -6.88)
                ))
                .build();

        when(projectZoneRepository.findById(zoneId)).thenReturn(Optional.of(zone));
        when(projectZoneRepository.save(any(ProjectZone.class))).thenAnswer(inv -> inv.getArgument(0));

        ProjectZoneDto updated = projectZoneService.updateZone(testProject.getId(), zoneId, request);

        assertEquals("Klaster Baru", updated.getName());
        assertEquals(250, updated.getTargetHomepass());
        assertEquals("#10b981", updated.getColor());
        assertEquals("Updated description", updated.getDescription());
        assertNotNull(updated.getBoundaryGeoJson());
    }
}
