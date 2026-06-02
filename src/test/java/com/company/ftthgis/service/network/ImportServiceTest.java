package com.company.ftthgis.service.network;

import com.company.ftthgis.domain.network.dto.ImportConflictDto;
import com.company.ftthgis.domain.network.entity.NetworkNode;
import com.company.ftthgis.domain.network.entity.ODP;
import com.company.ftthgis.domain.network.repository.NetworkNodeRepository;
import com.company.ftthgis.domain.network.repository.ODPRepository;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ImportServiceTest {

    @Mock
    private NetworkNodeRepository nodeRepository;

    @Mock
    private ODPRepository odpRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private EntityManager entityManager;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private ImportService importService;

    private UUID projectId;
    private Project project;

    @BeforeEach
    public void setUp() {
        projectId = UUID.randomUUID();
        project = Project.builder()
                .id(projectId)
                .name("Test Project")
                .code("PRJ-001")
                .build();
    }

    private String getSimpleGeoJson(String code) {
        return "{\n" +
                "  \"type\": \"FeatureCollection\",\n" +
                "  \"features\": [\n" +
                "    {\n" +
                "      \"type\": \"Feature\",\n" +
                "      \"geometry\": {\n" +
                "        \"type\": \"Point\",\n" +
                "        \"coordinates\": [107.6191, -6.9175]\n" +
                "      },\n" +
                "      \"properties\": {\n" +
                "        \"code\": \"" + code + "\"\n" +
                "      }\n" +
                "    }\n" +
                "  ]\n" +
                "}";
    }

    private String getGeoJsonWithCrs(String code, String crsName) {
        return "{\n" +
                "  \"type\": \"FeatureCollection\",\n" +
                "  \"crs\": {\n" +
                "    \"type\": \"name\",\n" +
                "    \"properties\": {\n" +
                "      \"name\": \"" + crsName + "\"\n" +
                "    }\n" +
                "  },\n" +
                "  \"features\": [\n" +
                "    {\n" +
                "      \"type\": \"Feature\",\n" +
                "      \"geometry\": {\n" +
                "        \"type\": \"Point\",\n" +
                "        \"coordinates\": [107.6191, -6.9175]\n" +
                "      },\n" +
                "      \"properties\": {\n" +
                "        \"code\": \"" + code + "\"\n" +
                "      }\n" +
                "    }\n" +
                "  ]\n" +
                "}";
    }

    @Test
    public void testProcessGeoJson_Success() throws Exception {
        // Arrange
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(nodeRepository.findByCode("ODP-001")).thenReturn(Optional.empty());

        String geoJson = getSimpleGeoJson("ODP-001");
        InputStream is = new ByteArrayInputStream(geoJson.getBytes(StandardCharsets.UTF_8));

        // Act
        Map<String, Object> result = importService.processGeoJsonFromStream(projectId, is, false, null);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.get("totalFeatures"));
        assertEquals(1, result.get("importedNodes"));
        assertEquals(0, result.get("ignoredNodes"));
        assertEquals("Test Project", result.get("projectName"));
        assertFalse((Boolean) result.get("dryRun"));

        ArgumentCaptor<List<ODP>> captor = ArgumentCaptor.forClass(List.class);
        verify(odpRepository, times(1)).saveAll(captor.capture());
        
        List<ODP> savedOdps = captor.getValue();
        assertEquals(1, savedOdps.size());
        ODP savedOdp = savedOdps.get(0);
        assertEquals("ODP-001", savedOdp.getCode());
        assertEquals(project, savedOdp.getProject());
        assertEquals("UP", savedOdp.getStatus());
        assertEquals("GOOD", savedOdp.getHealthStatus());
        assertEquals(4326, savedOdp.getGeom().getSRID());
        assertEquals(107.6191, savedOdp.getGeom().getX());
        assertEquals(-6.9175, savedOdp.getGeom().getY());
    }

    @Test
    public void testProcessGeoJson_DryRun() throws Exception {
        // Arrange
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(nodeRepository.findByCode("ODP-001")).thenReturn(Optional.empty());

        String geoJson = getSimpleGeoJson("ODP-001");
        InputStream is = new ByteArrayInputStream(geoJson.getBytes(StandardCharsets.UTF_8));

        // Act
        Map<String, Object> result = importService.processGeoJsonFromStream(projectId, is, true, null);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.get("totalFeatures"));
        assertEquals(1, result.get("importedNodes"));
        assertEquals(0, result.get("ignoredNodes"));
        assertTrue((Boolean) result.get("dryRun"));

        verify(odpRepository, never()).saveAll(any());
    }

    @Test
    public void testProcessGeoJson_CrsTransformation() throws Exception {
        // Arrange
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(nodeRepository.findByCode("ODP-001")).thenReturn(Optional.empty());

        // Mock native query for CRS ST_Transform
        Query mockQuery = mock(Query.class);
        when(entityManager.createNativeQuery(anyString())).thenReturn(mockQuery);
        when(mockQuery.setParameter(anyString(), any())).thenReturn(mockQuery);
        when(mockQuery.getSingleResult()).thenReturn("POINT(108.2001 -7.1234)");

        String geoJson = getGeoJsonWithCrs("ODP-001", "urn:ogc:def:crs:EPSG::3857");
        InputStream is = new ByteArrayInputStream(geoJson.getBytes(StandardCharsets.UTF_8));

        // Act
        Map<String, Object> result = importService.processGeoJsonFromStream(projectId, is, false, null);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.get("importedNodes"));
        
        verify(entityManager, times(1)).createNativeQuery(anyString());
        
        ArgumentCaptor<List<ODP>> captor = ArgumentCaptor.forClass(List.class);
        verify(odpRepository, times(1)).saveAll(captor.capture());
        
        List<ODP> savedOdps = captor.getValue();
        assertEquals(1, savedOdps.size());
        ODP savedOdp = savedOdps.get(0);
        assertEquals(108.2001, savedOdp.getGeom().getX());
        assertEquals(-7.1234, savedOdp.getGeom().getY());
        assertEquals(4326, savedOdp.getGeom().getSRID());
    }

    @Test
    public void testProcessGeoJson_ConflictSkipByDefault() throws Exception {
        // Arrange
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        
        NetworkNode existingNode = mock(NetworkNode.class);
        when(nodeRepository.findByCode("ODP-001")).thenReturn(Optional.of(existingNode));

        String geoJson = getSimpleGeoJson("ODP-001");
        InputStream is = new ByteArrayInputStream(geoJson.getBytes(StandardCharsets.UTF_8));

        // Act
        Map<String, Object> result = importService.processGeoJsonFromStream(projectId, is, false, "");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.get("totalFeatures"));
        assertEquals(0, result.get("importedNodes"));
        assertEquals(1, result.get("ignoredNodes"));

        verify(nodeRepository, never()).delete(any());
        verify(odpRepository, never()).saveAll(any());
    }

    @Test
    public void testProcessGeoJson_ConflictOverwrite() throws Exception {
        // Arrange
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        
        NetworkNode existingNode = mock(NetworkNode.class);
        when(nodeRepository.findByCode("ODP-001")).thenReturn(Optional.of(existingNode));

        String geoJson = getSimpleGeoJson("ODP-001");
        InputStream is = new ByteArrayInputStream(geoJson.getBytes(StandardCharsets.UTF_8));
        String resolutionsJson = "{\"ODP-001\": \"OVERWRITE\"}";

        // Act
        Map<String, Object> result = importService.processGeoJsonFromStream(projectId, is, false, resolutionsJson);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.get("totalFeatures"));
        assertEquals(1, result.get("importedNodes"));
        assertEquals(0, result.get("ignoredNodes"));

        verify(nodeRepository, times(1)).delete(existingNode);
        verify(odpRepository, times(1)).saveAll(any());
    }

    @Test
    public void testAnalyzeImport_NoConflicts() throws Exception {
        // Arrange
        when(nodeRepository.findByCode("ODP-001")).thenReturn(Optional.empty());

        String geoJson = getSimpleGeoJson("ODP-001");
        InputStream is = new ByteArrayInputStream(geoJson.getBytes(StandardCharsets.UTF_8));

        // Act
        Map<String, Object> result = importService.analyzeImport(projectId, is);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.get("totalFeatures"));
        assertEquals(1, result.get("validCount"));
        assertEquals(0, result.get("conflictCount"));
        assertTrue(((List<?>) result.get("conflicts")).isEmpty());
    }

    @Test
    public void testAnalyzeImport_WithConflict() throws Exception {
        // Arrange
        ODP existingOdp = ODP.builder()
                .code("ODP-001")
                .status("UP")
                .project(project)
                .build();
        
        when(nodeRepository.findByCode("ODP-001")).thenReturn(Optional.of(existingOdp));

        String geoJson = getSimpleGeoJson("ODP-001");
        InputStream is = new ByteArrayInputStream(geoJson.getBytes(StandardCharsets.UTF_8));

        // Act
        Map<String, Object> result = importService.analyzeImport(projectId, is);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.get("totalFeatures"));
        assertEquals(0, result.get("validCount"));
        assertEquals(1, result.get("conflictCount"));
        
        List<ImportConflictDto> conflicts = (List<ImportConflictDto>) result.get("conflicts");
        assertEquals(1, conflicts.size());
        ImportConflictDto conflict = conflicts.get(0);
        assertEquals("ODP-001", conflict.getCode());
        assertEquals("ODP", conflict.getType());
        assertEquals("DUPLICATE_CODE", conflict.getConflictType());
        assertEquals("UP", conflict.getExistingData().get("status"));
        assertEquals(projectId, conflict.getExistingData().get("projectId"));
    }
}
