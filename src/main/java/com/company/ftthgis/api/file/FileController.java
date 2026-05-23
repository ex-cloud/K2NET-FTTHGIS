package com.company.ftthgis.api.file;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/files")
@Slf4j
@CrossOrigin(origins = "*")
public class FileController {

    private final String uploadDir = "./uploads";

    public FileController() {
        // Create directory if it doesn't exist
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            log.error("Could not create upload directory", e);
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "tenant", required = false) String tenant,
            @RequestParam(value = "folder", required = false, defaultValue = "asset") String folder) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        try {
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            
            String fileName = UUID.randomUUID().toString() + extension;
            
            Path path;
            String fileUrl;
            if (tenant != null && !tenant.trim().isEmpty()) {
                // Sanitize tenant and folder names to prevent directory traversal
                String safeTenant = tenant.replaceAll("[^a-zA-Z0-9-]", "");
                String safeFolder = folder.replaceAll("[^a-zA-Z0-9-]", "");
                
                path = Paths.get(uploadDir).resolve(safeTenant).resolve(safeFolder).resolve(fileName);
                fileUrl = "/uploads/" + safeTenant + "/" + safeFolder + "/" + fileName;
            } else {
                path = Paths.get(uploadDir).resolve(fileName);
                fileUrl = "/uploads/" + fileName;
            }
            
            // Create directory if it doesn't exist
            Files.createDirectories(path.getParent());
            
            Files.copy(file.getInputStream(), path);
            
            log.info("File uploaded successfully: {} -> {}", originalFilename, fileUrl);
            
            return ResponseEntity.ok(Map.of(
                "url", fileUrl,
                "name", originalFilename,
                "size", file.getSize()
            ));
        } catch (IOException e) {
            log.error("Failed to upload file", e);
            return ResponseEntity.status(500).body("Could not upload file: " + e.getMessage());
        }
    }
}
