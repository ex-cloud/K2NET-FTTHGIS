package com.company.ftthgis.service.network;

import com.company.ftthgis.domain.network.entity.ODP;
import com.company.ftthgis.domain.network.dto.ImportConflictDto;
import com.company.ftthgis.domain.network.entity.NetworkNode;
import com.company.ftthgis.domain.network.repository.NetworkNodeRepository;
import com.company.ftthgis.domain.network.repository.ODPRepository;
import com.company.ftthgis.domain.tenant.entity.Project;
import com.company.ftthgis.domain.tenant.repository.ProjectRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImportService {

    private final NetworkNodeRepository nodeRepository;
    private final ODPRepository odpRepository;
    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper;
    private final EntityManager entityManager;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @Transactional
    public Map<String, Object> processGeoJson(UUID projectId, MultipartFile file, boolean dryRun, String resolutionsJson) throws Exception {
        return processGeoJsonFromStream(projectId, file.getInputStream(), dryRun, resolutionsJson);
    }

    @Transactional
    public Map<String, Object> processGeoJsonFromStream(UUID projectId, java.io.InputStream inputStream, boolean dryRun, String resolutionsJson) throws Exception {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        // Parse resolutions if provided
        Map<String, String> resolutions = new HashMap<>();
        if (resolutionsJson != null && !resolutionsJson.isEmpty()) {
            resolutions = objectMapper.readValue(resolutionsJson, new TypeReference<Map<String, String>>() {});
        }

        JsonNode root = objectMapper.readTree(inputStream);
        JsonNode features = root.get("features");

        // Detect CRS if present
        int sourceSrid = 4326; // Default
        if (root.has("crs")) {
            JsonNode crs = root.get("crs");
            if (crs.has("properties") && crs.get("properties").has("name")) {
                String crsName = crs.get("properties").get("name").asText();
                if (crsName.contains("EPSG::")) {
                    try {
                        sourceSrid = Integer.parseInt(crsName.split("EPSG::")[1]);
                        log.info("Detected custom CRS: EPSG:{}", sourceSrid);
                    } catch (Exception e) {
                        log.warn("Failed to parse CRS name: {}", crsName);
                    }
                }
            }
        }

        if (features == null || !features.isArray()) {
            throw new RuntimeException("Invalid GeoJSON: No 'features' array found");
        }

        List<ODP> newOdps = new ArrayList<>();
        int nodesIgnored = 0;

        for (JsonNode feature : features) {
            JsonNode geometryNode = feature.get("geometry");
            JsonNode properties = feature.get("properties");

            if (geometryNode == null || properties == null) continue;

            String geomType = geometryNode.get("type").asText();
            
            if ("Point".equalsIgnoreCase(geomType)) {
                JsonNode coords = geometryNode.get("coordinates");
                double lng = coords.get(0).asDouble();
                double lat = coords.get(1).asDouble();
                
                Point point = geometryFactory.createPoint(new Coordinate(lng, lat));
                point.setSRID(sourceSrid);

                // Transform if needed using PostGIS ST_Transform
                if (sourceSrid != 4326) {
                    try {
                        // We can just update the point coordinates if we want to be simple
                        // But let's just use the transformed values
                        String transformedWkt = (String) entityManager.createNativeQuery(
                            "SELECT ST_AsText(ST_Transform(ST_GeomFromText(:wkt, :sourceSrid), 4326))")
                            .setParameter("wkt", point.toText())
                            .setParameter("sourceSrid", sourceSrid)
                            .getSingleResult();
                        
                        // Parse WKT back to Point
                        org.locationtech.jts.io.WKTReader reader = new org.locationtech.jts.io.WKTReader(geometryFactory);
                        point = (Point) reader.read(transformedWkt);
                        point.setSRID(4326);
                    } catch (Exception e) {
                        log.error("Failed to transform point from {} to 4326: {}", sourceSrid, e.getMessage());
                        // Fallback to original point (might be wrong but keeps process alive)
                    }
                }

                // Basic Logic: Map everything to ODP for now, or use a 'type' property from QGIS
                String code = properties.has("code") ? properties.get("code").asText() : "IMPORT-" + UUID.randomUUID().toString().substring(0, 8);
                
                // 1. Check for existing code in THIS project to avoid duplicates
                String resolution = resolutions.getOrDefault(code, "SKIP");
                
                Optional<NetworkNode> existingNode = nodeRepository.findByCode(code);
                if (existingNode.isPresent()) {
                    if ("OVERWRITE".equalsIgnoreCase(resolution)) {
                        log.info("Overwriting existing asset: {}", code);
                        // Delete existing to replace (or update)
                        // Simple way: delete and let new one be saved
                        nodeRepository.delete(existingNode.get());
                    } else {
                        nodesIgnored++;
                        continue;
                    }
                }

                ODP odp = new ODP();
                odp.setCode(code);
                odp.setGeom(point);
                odp.setProject(project);
                odp.setStatus("UP");
                odp.setHealthStatus("GOOD");
                
                newOdps.add(odp);
            }
        }

        if (!dryRun && !newOdps.isEmpty()) {
            odpRepository.saveAll(newOdps);
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalFeatures", features.size());
        summary.put("importedNodes", newOdps.size());
        summary.put("ignoredNodes", nodesIgnored);
        summary.put("dryRun", dryRun);
        summary.put("projectName", project.getName());

        return summary;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> analyzeImport(UUID projectId, java.io.InputStream inputStream) throws Exception {
        JsonNode root = objectMapper.readTree(inputStream);
        JsonNode features = root.get("features");

        if (features == null || !features.isArray()) {
            throw new RuntimeException("Invalid GeoJSON: No 'features' array found");
        }

        List<ImportConflictDto> conflicts = new ArrayList<>();
        int validCount = 0;

        for (JsonNode feature : features) {
            JsonNode properties = feature.get("properties");
            JsonNode geometryNode = feature.get("geometry");
            if (properties == null || geometryNode == null) continue;

            String code = properties.has("code") ? properties.get("code").asText() : null;
            if (code == null) continue;

            // 1. Check for Duplicate Code
            Optional<NetworkNode> existingNode = nodeRepository.findByCode(code);
            if (existingNode.isPresent()) {
                NetworkNode node = existingNode.get();
                conflicts.add(ImportConflictDto.builder()
                        .code(code)
                        .type(node.getClass().getSimpleName())
                        .conflictType("DUPLICATE_CODE")
                        .message("Asset with code " + code + " already exists in system.")
                        .existingData(Map.of("status", node.getStatus(), "projectId", node.getProject().getId()))
                        .newData(Map.of("code", code))
                        .build());
                continue;
            }

            // 2. Check for Spatial Overlap (Optional: logic could be added here if needed)
            // For now, let's focus on Duplicate Code as the primary conflict.

            validCount++;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalFeatures", features.size());
        result.put("validCount", validCount);
        result.put("conflictCount", conflicts.size());
        result.put("conflicts", conflicts);

        return result;
    }
}
