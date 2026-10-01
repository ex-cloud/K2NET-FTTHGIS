package com.company.ftthgis.service.network;

import com.company.ftthgis.api.network.dto.AssetDetailDto;
import com.company.ftthgis.api.network.dto.AssetSearchResult;
import com.company.ftthgis.api.network.dto.AuditHistoryDto;
import com.company.ftthgis.api.network.dto.BatchUpdateRequest;
import com.company.ftthgis.domain.network.entity.Customer;
import com.company.ftthgis.domain.network.entity.FiberCable;
import com.company.ftthgis.domain.network.entity.ODC;
import com.company.ftthgis.domain.network.entity.ODP;
import com.company.ftthgis.domain.network.entity.OLT;
import com.company.ftthgis.domain.network.repository.CustomerRepository;
import com.company.ftthgis.domain.network.repository.FiberCableRepository;
import com.company.ftthgis.domain.network.repository.NetworkNodeRepository;
import com.company.ftthgis.domain.network.repository.ODCRepository;
import com.company.ftthgis.domain.network.repository.ODPRepository;
import com.company.ftthgis.domain.network.repository.OLTRepository;
import com.company.ftthgis.domain.network.service.AuditHistoryService;
import com.company.ftthgis.domain.network.service.NetworkAssetService;
import com.company.ftthgis.domain.network.service.StatusCacheService;
import com.company.ftthgis.domain.network.service.StatusPropagationService;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.repository.ProjectMemberRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NetworkAssetServiceTest {

    @Mock
    private OLTRepository oltRepository;
    @Mock
    private ODCRepository odcRepository;
    @Mock
    private ODPRepository odpRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private FiberCableRepository fiberCableRepository;
    @Mock
    private StatusCacheService statusCacheService;
    @Mock
    private StatusPropagationService statusPropagationService;
    @Mock
    private NetworkNodeRepository networkNodeRepository;
    @Mock
    private AuditHistoryService auditHistoryService;
    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @InjectMocks
    private NetworkAssetService networkAssetService;

    private final GeometryFactory gf = new GeometryFactory();

    @BeforeEach
    void setUp() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "test-user", null, List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("simulateFailure dispatches correct propagation events")
    void testSimulateFailure() {
        Map<String, Object> oltRes = networkAssetService.simulateFailure("OLT-01", "OLT", "DOWN");
        assertTrue((Boolean) oltRes.get("success"));
        verify(statusPropagationService).handleOltStatusChange("OLT-01", "DOWN", "Manual Simulation Triggered");

        Map<String, Object> odcRes = networkAssetService.simulateFailure("ODC-01", "ODC", "FIBERCUT");
        assertTrue((Boolean) odcRes.get("success"));
        verify(statusPropagationService).simulateCableFailure("SIM-CABLE-ODC-ODC-01", "ODC-01", "FIBERCUT");

        Map<String, Object> odpRes = networkAssetService.simulateFailure("ODP-01", "ODP", "DEGRADED");
        assertTrue((Boolean) odpRes.get("success"));
        verify(statusPropagationService).handleOdpStatusChange("ODP-01", "DEGRADED", "Manual Status Simulation: DEGRADED");

        Map<String, Object> custRes = networkAssetService.simulateFailure("CUST-01", "CUSTOMER", "UP");
        assertTrue((Boolean) custRes.get("success"));
        verify(statusPropagationService).handleCustomerStatusChange("CUST-01", "UP", "Manual Customer Status Simulation");
    }

    @Test
    @DisplayName("batchUpdate successfully processes assets")
    void testBatchUpdate() {
        UUID odpId = UUID.randomUUID();
        ODP odp = new ODP();
        odp.setId(odpId);
        odp.setCode("ODP-01");
        when(odpRepository.findById(odpId)).thenReturn(Optional.of(odp));

        BatchUpdateRequest req = new BatchUpdateRequest();
        req.setType("ODP");
        req.setStatus("UP");
        req.setHealthStatus("HEALTHY");
        req.setReason("Routine maintenance");
        req.setNotes("Fixed power");
        req.setIds(List.of(odpId));

        Map<String, Object> res = networkAssetService.batchUpdate(req);
        assertTrue((Boolean) res.get("success"));
        assertEquals(1, res.get("count"));
        verify(statusPropagationService).handleOdpStatusChange(eq("ODP-01"), eq("UP"), contains("Routine maintenance | Note: Fixed power"));
        verify(statusPropagationService).handleOdpHealthStatusChange(eq("ODP-01"), eq("HEALTHY"), contains("Routine maintenance"));
    }

    @Test
    @DisplayName("batchDelete successfully deletes entities")
    void testBatchDelete() {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();

        Map<String, Object> res = networkAssetService.batchDelete("ODC", "Decommissioning", List.of(id1, id2));
        assertTrue((Boolean) res.get("success"));
        assertEquals(2, res.get("count"));
        verify(odcRepository).deleteById(id1);
        verify(odcRepository).deleteById(id2);
    }

    @Test
    @DisplayName("checkAssetCode returns correct availability status")
    void testCheckAssetCode() {
        when(networkNodeRepository.existsByCode("NODE-01")).thenReturn(true);
        when(networkNodeRepository.existsByCode("NODE-NEW")).thenReturn(false);

        Map<String, Object> existing = networkAssetService.checkAssetCode("NODE-01");
        assertEquals(true, existing.get("exists"));
        assertEquals(false, existing.get("available"));

        Map<String, Object> available = networkAssetService.checkAssetCode("NODE-NEW");
        assertEquals(false, available.get("exists"));
        assertEquals(true, available.get("available"));

        Map<String, Object> empty = networkAssetService.checkAssetCode("  ");
        assertEquals(false, empty.get("exists"));
        assertEquals("Code is required", empty.get("error"));
    }

    @Test
    @DisplayName("getAssetDetail by ID and Code returns full DTO")
    void testGetAssetDetail() {
        UUID odcId = UUID.randomUUID();
        ODC odc = new ODC();
        odc.setId(odcId);
        odc.setCode("ODC-TEST");
        odc.setName("Central ODC");
        odc.setStatus("UP");
        odc.setCapacity(288);
        odc.setUsedCapacity(144);
        Point p = gf.createPoint(new Coordinate(106.8456, -6.2088));
        odc.setGeom(p);

        when(odcRepository.findById(odcId)).thenReturn(Optional.of(odc));
        when(odcRepository.findByCode("ODC-TEST")).thenReturn(Optional.of(odc));
        when(statusCacheService.getStatus("ODC-TEST")).thenReturn("UP");

        Optional<AssetDetailDto> result = networkAssetService.getAssetDetail("ODC", odcId.toString());
        assertTrue(result.isPresent());
        AssetDetailDto dto = result.get();
        assertEquals("ODC-TEST", dto.getCode());
        assertEquals("Central ODC", dto.getName());
        assertEquals("ODC", dto.getType());
        assertEquals("UP", dto.getStatus());
        assertEquals(106.8456, dto.getLng());
        assertEquals(-6.2088, dto.getLat());
        assertEquals(288, dto.getAttributes().get("Capacity"));
    }

    @Test
    @DisplayName("runDiagnostics delegates to propagation service")
    void testRunDiagnostics() {
        when(statusPropagationService.calculateDiagnostics("ODP", "ODP-01"))
                .thenReturn(Map.of("status", "HEALTHY", "score", 100));

        Map<String, Object> res = networkAssetService.runDiagnostics("ODP", "ODP-01");
        assertEquals("HEALTHY", res.get("status"));
        assertEquals(100, res.get("score"));
    }

    @Test
    @DisplayName("getAssetHistory delegates to auditHistoryService")
    void testGetAssetHistory() {
        AuditHistoryDto item = new AuditHistoryDto();
        item.setRevisionNumber(1);
        item.setRevisionType("ADD");
        when(auditHistoryService.getHistory("ODC", "ODC-01")).thenReturn(List.of(item));

        List<AuditHistoryDto> history = networkAssetService.getAssetHistory("ODC", "ODC-01");
        assertEquals(1, history.size());
        assertEquals("ADD", history.get(0).getRevisionType());
    }

    @Test
    @DisplayName("search finds assets across repositories and applies org filter")
    void testSearch() {
        Organization org = new Organization();
        org.setId(UUID.randomUUID());
        org.setSlug("isp-alpha");
        org.setName("ISP Alpha");

        Project proj = new Project();
        proj.setId(UUID.randomUUID());
        proj.setName("Fiber Expansion");
        proj.setOrganization(org);

        ODC odc = new ODC();
        odc.setId(UUID.randomUUID());
        odc.setCode("ODC-ALPHA-01");
        odc.setStatus("UP");
        odc.setProject(proj);
        odc.setGeom(gf.createPoint(new Coordinate(106.8, -6.2)));

        when(odcRepository.findTop5ByCodeContainingIgnoreCaseOrNameContainingIgnoreCase("ALPHA", "ALPHA"))
                .thenReturn(List.of(odc));
        when(odpRepository.findTop5ByCodeContainingIgnoreCase("ALPHA")).thenReturn(List.of());
        when(oltRepository.findTop5ByCodeContainingIgnoreCaseOrNameContainingIgnoreCase("ALPHA", "ALPHA")).thenReturn(List.of());
        when(customerRepository.findTop5ByCodeContainingIgnoreCaseOrNameContainingIgnoreCase("ALPHA", "ALPHA")).thenReturn(List.of());

        List<AssetSearchResult> results = networkAssetService.search("ALPHA", "isp-alpha");
        assertEquals(1, results.size());
        assertEquals("ODC-ALPHA-01", results.get(0).getCode());
        assertEquals("ODC", results.get(0).getType());
        assertEquals("Fiber Expansion", results.get(0).getProjectName());
    }

    @Test
    @DisplayName("validateBatchAccess blocks users lacking project membership")
    void testValidateBatchAccessUnauthorized() {
        UUID userId = UUID.randomUUID();
        UsernamePasswordAuthenticationToken nonSuperUser = new UsernamePasswordAuthenticationToken(
                userId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_STAFF")));
        SecurityContextHolder.getContext().setAuthentication(nonSuperUser);

        UUID assetId = UUID.randomUUID();
        UUID projA = UUID.randomUUID();
        UUID projB = UUID.randomUUID();

        when(networkNodeRepository.findDistinctProjectIdsByIdIn(List.of(assetId))).thenReturn(Set.of(projA));
        when(fiberCableRepository.findDistinctProjectIdsByIdIn(List.of(assetId))).thenReturn(Set.of());
        when(projectMemberRepository.findProjectIdsByUserId(userId)).thenReturn(Set.of(projB)); // only has access to projB

        assertThrows(AccessDeniedException.class, () -> networkAssetService.validateBatchAccess(List.of(assetId)));
    }
}
