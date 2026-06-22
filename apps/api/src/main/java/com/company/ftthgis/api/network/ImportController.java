package com.company.ftthgis.api.network;

import com.company.ftthgis.service.network.ImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/network/import")
@RequiredArgsConstructor
@Slf4j
public class ImportController {

    private final ImportService importService;

    @PostMapping("/{projectId}")
    public ResponseEntity<?> importGeoJson(
            @PathVariable UUID projectId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "dryRun", defaultValue = "false") boolean dryRun,
            @RequestParam(value = "resolutions", required = false) String resolutionsJson) {
        
        log.info("Import request received for project: {}, file: {}, size: {} bytes", 
                projectId, file.getOriginalFilename(), file.getSize());

        try {
            Map<String, Object> result = importService.processGeoJson(projectId, file, dryRun, resolutionsJson);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Failed to process GeoJSON import", e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Import failed",
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/{projectId}/analyze")
    public ResponseEntity<?> analyzeImport(
            @PathVariable UUID projectId,
            @RequestParam("file") MultipartFile file) {
        
        log.info("Analyzing import file: {} for project: {}", file.getOriginalFilename(), projectId);

        try {
            Map<String, Object> result = importService.analyzeImport(projectId, file.getInputStream());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Failed to analyze import", e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Analysis failed",
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/{projectId}/direct")
    public ResponseEntity<?> importGeoJsonDirect(
            @PathVariable UUID projectId,
            @RequestBody String geoJsonContent,
            @RequestParam(value = "dryRun", defaultValue = "false") boolean dryRun) {
        
        log.info("Direct QGIS sync request received for project: {}", projectId);

        try {
            java.io.InputStream stream = new java.io.ByteArrayInputStream(geoJsonContent.getBytes());
            Map<String, Object> result = importService.processGeoJsonFromStream(projectId, stream, dryRun, null);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Failed to process Direct GeoJSON sync", e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Sync failed",
                    "message", e.getMessage()
            ));
        }
    }
}
